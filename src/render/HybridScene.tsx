import { makeScene2D, Img, Rect, Node, Path, Txt, Circle } from '@motion-canvas/2d';
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
import { getElementCanvasPosition } from './EnhancedUIElements';

// Import the storyboard data
// @ts-ignore - JSON import
import storyboardData from '../../output/storyboard.json';

/**
 * Hybrid Scene - Adobe After Effects Style
 * 
 * Starts with full screenshot, then transitions to extracted/animated elements
 * This gives the "real" look initially, then allows full programmatic control
 */
export default makeScene2D(function* (view) {
  const storyboard: Storyboard = StoryboardSchema.parse(storyboardData);

  // Create refs
  const screenshotLayer = createRef<Img>();
  const extractedElementsLayer = createRef<Node>();
  const cursorPointer = createRef<Path>();
  const cursorClickRipple = createRef<Circle>();
  const highlightBox = createRef<Rect>();
  const typingText = createRef<Txt>();

  let activeScene: SceneMap = storyboard.scenes[0];
  if (!activeScene) {
    throw new Error('No scenes found in storyboard');
  }

  const colorScheme = activeScene.colorScheme;
  const cursorColor = colorScheme.theme === 'dark' ? '#FFFFFF' : '#000000';
  const highlightColor = colorScheme.primary || '#4285f4';

  // Initialize view with HYBRID approach
  view.add(
    <>
      {/* LAYER 1: Original Screenshot (100% opacity initially) */}
      <Img 
        ref={screenshotLayer} 
        src={activeScene.imagePath}
        width={1920}
        height={1080}
        opacity={1}
        zIndex={0}
      />
      
      {/* LAYER 2: Extracted Elements (0% opacity initially) */}
      <Node ref={extractedElementsLayer} opacity={0} zIndex={1}>
        {/* Load extracted PNG/SVG assets here */}
        {activeScene.elements.map((element) => {
          const pos = getElementCanvasPosition(element);
          
          // Try PNG first, then SVG, then skip if neither exists
          const pngPath = `/assets/${element.id}.png`;
          const svgPath = `/assets/${element.id}.svg`;
          
          // Use SVG if available, fallback to PNG, or skip
          // Note: In production, check file existence server-side
          const assetPath = pngPath; // Will try to load, fails gracefully
          
          return (
            <Img
              key={element.id}
              src={assetPath}
              x={pos.x}
              y={pos.y}
              width={element.coordinates.width}
              height={element.coordinates.height}
              // Fail silently if image doesn't exist
              opacity={0}
            />
          );
        })}
      </Node>
      
      {/* Highlight box */}
      <Rect 
        ref={highlightBox}
        opacity={0}
        stroke={highlightColor}
        lineWidth={3}
        radius={4}
        lineDash={[8, 4]}
        fill={null}
        zIndex={50}
      />

      {/* Typing text */}
      <Txt
        ref={typingText}
        opacity={0}
        fontSize={16}
        fill={colorScheme.theme === 'dark' ? '#E8EAED' : '#202124'}
        fontFamily="'Segoe UI', Arial, sans-serif"
        zIndex={99}
      />

      {/* Click ripple */}
      <Circle
        ref={cursorClickRipple}
        size={40}
        fill={null}
        stroke={highlightColor}
        lineWidth={3}
        opacity={0}
        zIndex={101}
      />
      
      {/* Cursor */}
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

  // Helper functions
  const findElement = (elementId?: string): UIElement | undefined => {
    if (!elementId) return undefined;
    return activeScene.elements.find(e => e.id === elementId);
  };

  const getElementNode = (elementId?: string): Node | undefined => {
    if (!extractedElementsLayer()) return undefined;
    const children = extractedElementsLayer().children();
    return children.find(child => child.key === elementId) as Node;
  };

  // HYBRID MODE: Start with screenshot, optionally transition to extracted elements
  let useExtractedElements = false;

  // Play through actions
  for (const action of storyboard.actions) {
    const targetElement = findElement(action.targetElementId);
    const targetNode = getElementNode(action.targetElementId);

    switch (action.type) {
      case 'cursor_move': {
        if (!targetElement) {
          console.warn(`Element not found: ${action.targetElementId}`);
          break;
        }

        const { width, height } = targetElement.coordinates;
        const centerPos = getElementCanvasPosition(targetElement);
        const targetPos = new Vector2(centerPos.x, centerPos.y);

        // Show highlight
        highlightBox().position(targetPos);
        highlightBox().width(width);
        highlightBox().height(height);
        yield* highlightBox().opacity(0.6, 0.3, easeOutCubic);

        // Optional: Transition to extracted elements on first interaction
        if (!useExtractedElements && extractedElementsLayer().children().length > 0) {
          // Fade from screenshot to extracted elements
          yield* all(
            screenshotLayer().opacity(0, 1, easeInOutCubic),
            extractedElementsLayer().opacity(1, 1, easeInOutCubic)
          );
          useExtractedElements = true;
        }

        // Glow on target if using extracted elements
        if (useExtractedElements && targetNode) {
          yield* all(
            targetNode.shadowBlur(8, 0.3),
            targetNode.shadowColor(highlightColor, 0.3)
          );
        }

        // Move cursor
        yield* cursorPointer().position(targetPos, action.duration, easeInOutCubic);

        // Pulse highlight
        yield* all(
          highlightBox().opacity(0.8, 0.2, easeInOutCubic),
          highlightBox().opacity(0.4, 0.2, easeInOutCubic)
        );
        
        break;
      }

      case 'click': {
        if (!targetElement) break;

        const currentPos = cursorPointer().position();

        // Click animation
        yield* all(
          cursorPointer().position(new Vector2(currentPos.x, currentPos.y + 3), 0.1, easeInCubic),
          cursorPointer().scale(0.95, 0.1, easeInCubic)
        );

        // Animate target if using extracted elements
        if (useExtractedElements && targetNode) {
          yield* all(
            targetNode.scale(0.95, 0.1, easeInCubic),
            targetNode.opacity(0.8, 0.1)
          );
        }

        // Ripple
        cursorClickRipple().position(currentPos);
        cursorClickRipple().size(new Vector2(40, 40));
        cursorClickRipple().opacity(1);
        
        yield* all(
          cursorClickRipple().size(new Vector2(80, 80), 0.4, easeOutCubic),
          cursorClickRipple().opacity(0, 0.4, easeOutCubic)
        );

        // Return to normal
        yield* all(
          cursorPointer().position(currentPos, 0.15, easeOutCubic),
          cursorPointer().scale(1, 0.15, easeOutCubic),
          targetNode ? targetNode.scale(1, 0.15, easeOutCubic) : waitFor(0),
          targetNode ? targetNode.opacity(1, 0.15) : waitFor(0)
        );

        // Fade highlight
        yield* all(
          highlightBox().opacity(0, 0.3, easeInCubic),
          targetNode ? targetNode.shadowBlur(0, 0.3) : waitFor(0)
        );
        
        break;
      }

      case 'type': {
        if (!action.payload || !targetElement) break;

        const inputPos = getElementCanvasPosition(targetElement);
        const { height } = targetElement.coordinates;

        // Position text INSIDE input
        const textXPos = inputPos.x - (targetElement.coordinates.width / 2) + 12;
        typingText().position(new Vector2(textXPos, inputPos.y));
        typingText().fontSize(Math.min(16, height * 0.5));
        typingText().textAlign('left');
        typingText().opacity(1);
        typingText().text('');

        // Glow on input if using extracted elements
        if (useExtractedElements && targetNode) {
          yield* all(
            targetNode.shadowBlur(12, 0.3),
            targetNode.shadowColor(highlightColor, 0.3)
          );
        }

        // Type character by character
        const text = action.payload;
        const baseDelay = action.duration / text.length;

        for (let i = 0; i < text.length; i++) {
          const charDelay = baseDelay * (0.8 + Math.random() * 0.4);
          typingText().text(text.substring(0, i + 1));
          
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

        // Remove glow
        if (useExtractedElements && targetNode) {
          yield* targetNode.shadowBlur(0, 0.4);
        }
        
        yield* waitFor(0.5);
        break;
      }

      case 'wait': {
        yield* waitFor(action.duration);
        break;
      }

      default:
        console.warn(`Unknown action type: ${action.type}`);
    }
  }

  // Hold final frame
  yield* highlightBox().opacity(0, 0.5);
  yield* waitFor(1);
});
