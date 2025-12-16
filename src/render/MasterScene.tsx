import { makeScene2D, Img, Rect, Node, Path, Txt } from '@motion-canvas/2d';
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

// Import the storyboard data (this should be generated before rendering)
// @ts-ignore - JSON import
import storyboardData from '../../output/storyboard.json';

export default makeScene2D(function* (view) {
  // Validate the storyboard data
  const storyboard: Storyboard = StoryboardSchema.parse(storyboardData);

  // Create refs for interactive elements
  const cursorPointer = createRef<Path>();
  const cursorClickRipple = createRef<Rect>();
  const currentImage = createRef<Img>();
  const highlightBox = createRef<Rect>();
  const typingText = createRef<Txt>();

  // Track the active scene
  let activeScene: SceneMap = storyboard.scenes[0];
  if (!activeScene) {
    throw new Error('No scenes found in storyboard');
  }

  // Extract color scheme from the scene
  const colorScheme = activeScene.colorScheme;
  const cursorColor = colorScheme.theme === 'dark' ? '#FFFFFF' : '#000000';
  const highlightColor = colorScheme.primary || '#4285f4';

  // Initialize the view with the first scene
  view.add(
    <>
      {/* Main screenshot image */}
      <Img 
        ref={currentImage} 
        src={activeScene.imagePath}
        width={1920}
        height={1080}
      />
      
      {/* Highlight box for showing element bounds */}
      <Rect 
        ref={highlightBox}
        opacity={0}
        stroke={highlightColor}
        lineWidth={3}
        radius={4}
        lineDash={[8, 4]}
      />

      {/* Typing text display */}
      <Txt
        ref={typingText}
        opacity={0}
        fontSize={32}
        fill={colorScheme.theme === 'dark' ? '#FFFFFF' : '#000000'}
        fontFamily="'Segoe UI', Arial, sans-serif"
        stroke={colorScheme.theme === 'dark' ? '#000000' : '#FFFFFF'}
        lineWidth={3}
        zIndex={99}
        shadowColor="rgba(0,0,0,0.3)"
        shadowBlur={4}
      />

      {/* Click ripple effect */}
      <Rect
        ref={cursorClickRipple}
        size={40}
        radius={20}
        fill="transparent"
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

  // Helper: Convert image coordinates to MotionCanvas coordinates
  // MotionCanvas uses center origin, so we need to offset by half the dimensions
  const toCanvasCoords = (x: number, y: number): Vector2 => {
    // Subtract half the canvas size to center the origin
    return new Vector2(x - 960, y - 540);
  };

  // Play through all actions in sequence
  for (const action of storyboard.actions) {
    const targetElement = findElement(action.targetElementId);

    switch (action.type) {
      case 'cursor_move': {
        if (!targetElement) {
          console.warn(`Element not found: ${action.targetElementId}`);
          break;
        }

        const { x, y, width, height } = targetElement.coordinates;
        const targetPos = toCanvasCoords(x, y);

        // Show highlight box around the target BEFORE moving
        highlightBox().position(targetPos);
        highlightBox().width(width);
        highlightBox().height(height);
        yield* highlightBox().opacity(0.6, 0.3, easeOutCubic);

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

        // Show click ripple effect
        cursorClickRipple().position(currentPos);
        cursorClickRipple().size(new Vector2(40, 40));
        cursorClickRipple().opacity(1);
        
        yield* all(
          cursorClickRipple().size(new Vector2(80, 80), 0.4, easeOutCubic),
          cursorClickRipple().opacity(0, 0.4, easeOutCubic)
        );

        // Return cursor to normal
        yield* all(
          cursorPointer().position(currentPos, 0.15, easeOutCubic),
          cursorPointer().scale(1, 0.15, easeOutCubic)
        );

        // Fade out highlight
        yield* highlightBox().opacity(0, 0.3, easeInCubic);
        
        break;
      }

      case 'type': {
        if (!action.payload) {
          console.warn('No payload for type action');
          break;
        }

        const currentPos = cursorPointer().position();

        // Position typing text near the input field
        typingText().position(new Vector2(currentPos.x, currentPos.y - 50));
        typingText().opacity(1);
        typingText().text('');

        // Simulate typing character by character with variable speed
        const text = action.payload;
        const baseDelay = action.duration / text.length;

        for (let i = 0; i < text.length; i++) {
          // Add some randomness to typing speed for realism
          const charDelay = baseDelay * (0.8 + Math.random() * 0.4);
          typingText().text(text.substring(0, i + 1));
          
          // Subtle cursor bob while typing
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

        // Fade out the typing text
        yield* typingText().opacity(0, 0.4, easeInCubic);
        
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
          currentImage().opacity(0, action.duration / 2, easeInCubic),
          cursorPointer().opacity(0, action.duration / 2),
          highlightBox().opacity(0, action.duration / 2)
        );

        // Switch to new scene and update color scheme
        activeScene = nextScene;
        currentImage().src(activeScene.imagePath);
        
        const newColorScheme = activeScene.colorScheme;
        const newCursorColor = newColorScheme.theme === 'dark' ? '#FFFFFF' : '#000000';
        const newHighlightColor = newColorScheme.primary || '#4285f4';
        
        cursorPointer().stroke(newCursorColor);
        highlightBox().stroke(newHighlightColor);
        cursorClickRipple().stroke(newHighlightColor);

        // Fade in new scene
        yield* all(
          currentImage().opacity(1, action.duration / 2, easeOutCubic),
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
