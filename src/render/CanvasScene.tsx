import { makeScene2D, Rect, Node, Path, Txt, Circle } from '@motion-canvas/2d';
import { 
  createRef, 
  all, 
  waitFor,
  Vector2, 
  easeInOutCubic,
  easeOutCubic,
  easeInCubic,
  linear,
} from '@motion-canvas/core';
import { StoryboardSchema, type Storyboard, type SceneMap, type UIElement } from '../core/schema';
import { createEnhancedUIElement, getElementCanvasPosition } from './EnhancedUIElements';

// Import the storyboard data
// @ts-ignore - JSON import
import storyboardData from '../../output/storyboard.json';

export default makeScene2D(function* (view) {
  // Validate the storyboard data
  const storyboard: Storyboard = StoryboardSchema.parse(storyboardData);

  // Create refs for interactive elements
  const cursorPointer = createRef<Path>();
  const cursorClickRipple = createRef<Circle>();
  const highlightBox = createRef<Rect>();
  const typingText = createRef<Txt>();
  const uiContainer = createRef<Node>();

  // Track the active scene
  let activeScene: SceneMap = storyboard.scenes[0];
  if (!activeScene) {
    throw new Error('No scenes found in storyboard');
  }

  // Extract color scheme from the scene
  const colorScheme = activeScene.colorScheme;
  const cursorColor = colorScheme.theme === 'dark' ? '#FFFFFF' : '#000000';
  const highlightColor = colorScheme.primary || '#4285f4';

  // Initialize the view with the reconstructed UI
  view.add(
    <>
      {/* Background */}
      <Rect
        width={1920}
        height={1080}
        fill={colorScheme.background}
      />
      
      {/* UI Container - holds all reconstructed UI elements */}
      <Node ref={uiContainer}>
        {activeScene.elements.map((element) => {
          return createEnhancedUIElement({
            key: element.id,
            element: element,
            colorScheme: colorScheme,
          });
        })}
      </Node>
      
      {/* Highlight box for showing element bounds */}
      <Rect 
        ref={highlightBox}
        opacity={0}
        stroke={highlightColor}
        lineWidth={3}
        radius={4}
        lineDash={[8, 4]}
        fill={null}
      />

      {/* Typing text display - will be positioned INSIDE input fields */}
      <Txt
        ref={typingText}
        opacity={0}
        fontSize={16}
        fill={colorScheme.theme === 'dark' ? '#E8EAED' : '#202124'}
        fontFamily="'Segoe UI', Arial, sans-serif"
        zIndex={99}
      />

      {/* Click ripple effect */}
      <Circle
        ref={cursorClickRipple}
        size={40}
        fill={null}
        stroke={highlightColor}
        lineWidth={3}
        opacity={0}
        zIndex={101}
      />
      
      {/* Realistic cursor pointer */}
      <Path 
        ref={cursorPointer}
        data="M 0 0 L 0 20 L 5 16 L 8 24 L 10 23 L 7 15 L 13 15 Z"
        fill="#FFFFFF"
        stroke={cursorColor}
        lineWidth={1.5}
        lineJoin="round"
        shadowColor="rgba(0,0,0,0.5)"
        shadowBlur={4}
        shadowOffsetX={1}
        shadowOffsetY={1}
        zIndex={100}
        x={-960}
        y={-540}
      />
    </>
  );

  // Helper: Find element by ID in the current scene
  const findElement = (elementId?: string): UIElement | undefined => {
    if (!elementId) return undefined;
    return activeScene.elements.find(e => e.id === elementId);
  };

  // Helper: Get UI element node reference by ID
  const getElementNode = (elementId?: string): Node | undefined => {
    if (!uiContainer()) return undefined;
    const children = uiContainer().children();
    const element = findElement(elementId);
    if (!element) return undefined;
    
    return children.find(child => child.key === elementId) as Node;
  };

  // Play through all actions in sequence
  for (const action of storyboard.actions) {
    const targetElement = findElement(action.targetElementId);
    const targetNode = getElementNode(action.targetElementId);

    switch (action.type) {
      case 'cursor_move': {
        if (!targetElement) {
          console.warn(`Element not found: ${action.targetElementId}`);
          break;
        }

        const { x, y, width, height } = targetElement.coordinates;
        const centerPos = getElementCanvasPosition(targetElement);
        const targetPos = new Vector2(centerPos.x, centerPos.y);

        // Show highlight box around the target BEFORE moving
        highlightBox().position(targetPos);
        highlightBox().width(width);
        highlightBox().height(height);
        yield* highlightBox().opacity(0.6, 0.3, easeOutCubic);

        // Add glow to target element if available
        if (targetNode) {
          yield* all(
            targetNode.shadowBlur(8, 0.3),
            targetNode.shadowColor(highlightColor, 0.3)
          );
        }

        // Move cursor to the target element with smooth easing
        yield* cursorPointer().position(targetPos, action.duration, easeInOutCubic);

        // Subtle pulse on the highlight
        yield* all(
          highlightBox().opacity(0.8, 0.2, easeInOutCubic),
          highlightBox().opacity(0.4, 0.2, easeInOutCubic)
        );
        
        break;
      }

      case 'click': {
        if (!targetElement) {
          console.warn(`Element not found for click: ${action.targetElementId}`);
          break;
        }

        const currentPos = cursorPointer().position();

        // Click animation: move down slightly and show ripple
        yield* all(
          cursorPointer().position(new Vector2(currentPos.x, currentPos.y + 3), 0.1, easeInCubic),
          cursorPointer().scale(0.95, 0.1, easeInCubic)
        );

        // Animate the clicked element (scale down and back)
        if (targetNode) {
          yield* all(
            targetNode.scale(0.95, 0.1, easeInCubic),
            targetNode.opacity(0.8, 0.1)
          );
        }

        // Show click ripple effect
        cursorClickRipple().position(currentPos);
        cursorClickRipple().size(new Vector2(40, 40));
        cursorClickRipple().opacity(1);
        
        yield* all(
          cursorClickRipple().size(new Vector2(80, 80), 0.4, easeOutCubic),
          cursorClickRipple().opacity(0, 0.4, easeOutCubic)
        );

        // Return cursor and element to normal
        yield* all(
          cursorPointer().position(currentPos, 0.15, easeOutCubic),
          cursorPointer().scale(1, 0.15, easeOutCubic),
          targetNode ? targetNode.scale(1, 0.15, easeOutCubic) : waitFor(0),
          targetNode ? targetNode.opacity(1, 0.15) : waitFor(0)
        );

        // Fade out highlight and glow
        yield* all(
          highlightBox().opacity(0, 0.3, easeInCubic),
          targetNode ? targetNode.shadowBlur(0, 0.3) : waitFor(0)
        );
        
        break;
      }

      case 'type': {
        if (!action.payload) {
          console.warn('No payload for type action');
          break;
        }

        if (!targetElement) {
          console.warn(`Target element not found for typing: ${action.targetElementId}`);
          break;
        }

        // Get the center position of the input field
        const inputPos = getElementCanvasPosition(targetElement);
        const { height } = targetElement.coordinates;

        // Position typing text INSIDE the input field (left-aligned)
        // Offset from center to left edge, plus some padding
        const textXPos = inputPos.x - (targetElement.coordinates.width / 2) + 12;
        typingText().position(new Vector2(textXPos, inputPos.y));
        typingText().fontSize(Math.min(16, height * 0.5));
        typingText().textAlign('left');
        typingText().opacity(1);
        typingText().text('');

        // Add focus glow to input element
        if (targetNode) {
          yield* all(
            targetNode.shadowBlur(12, 0.3),
            targetNode.shadowColor(highlightColor, 0.3)
          );
        }

        // Simulate typing character by character with variable speed
        const text = action.payload;
        const baseDelay = action.duration / text.length;

        for (let i = 0; i < text.length; i++) {
          const charDelay = baseDelay * (0.8 + Math.random() * 0.4);
          typingText().text(text.substring(0, i + 1));
          
          // Subtle cursor bob while typing
          const currentPos = cursorPointer().position();
          if (i % 3 === 0) {
            yield* cursorPointer().position(
              new Vector2(currentPos.x, currentPos.y + 2), 
              charDelay / 2, 
              linear
            );
            yield* cursorPointer().position(
              currentPos, 
              charDelay / 2, 
              linear
            );
          } else {
            yield* waitFor(charDelay);
          }
        }

        // Keep the text visible but remove focus glow
        yield* all(
          targetNode ? targetNode.shadowBlur(0, 0.4) : waitFor(0)
        );
        
        // Wait a bit before fading out
        yield* waitFor(0.5);
        
        break;
      }

      case 'wait': {
        yield* waitFor(action.duration);
        break;
      }

      case 'switch_scene': {
        if (!action.payload) {
          console.warn('No payload (sceneId) for switch_scene action');
          break;
        }

        // Find the next scene
        const nextScene = storyboard.scenes.find(s => s.sceneId === action.payload);
        if (!nextScene) {
          console.warn(`Scene not found: ${action.payload}`);
          break;
        }

        // Fade out current scene
        yield* all(
          uiContainer().opacity(0, action.duration / 2, easeInCubic),
          cursorPointer().opacity(0, action.duration / 2),
          highlightBox().opacity(0, action.duration / 2)
        );

        // Clear and rebuild UI container with new scene
        uiContainer().removeChildren();
        activeScene = nextScene;
        
        const newColorScheme = activeScene.colorScheme;
        
        // Recreate UI elements for new scene
        activeScene.elements.forEach((element) => {
          const uiElement = createEnhancedUIElement({
            key: element.id,
            element: element,
            colorScheme: newColorScheme,
          });
          uiContainer().add(uiElement);
        });

        // Update colors
        const newCursorColor = newColorScheme.theme === 'dark' ? '#FFFFFF' : '#000000';
        const newHighlightColor = newColorScheme.primary || '#4285f4';
        
        cursorPointer().stroke(newCursorColor);
        highlightBox().stroke(newHighlightColor);
        cursorClickRipple().stroke(newHighlightColor);

        // Fade in new scene
        yield* all(
          uiContainer().opacity(1, action.duration / 2, easeOutCubic),
          cursorPointer().opacity(1, action.duration / 2)
        );
        break;
      }

      default:
        console.warn(`Unknown action type: ${action.type}`);
    }
  }

  // Fade out highlight and hold final frame
  yield* highlightBox().opacity(0, 0.5);
  yield* waitFor(1);
});
