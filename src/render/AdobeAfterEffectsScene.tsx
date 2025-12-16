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
  chain,
  sequence,
} from '@motion-canvas/core';
import { SVGAnimationPresets } from './SVGAnimator';

/**
 * Adobe After Effects-Style Animation Scene
 * 
 * Demonstrates:
 * 1. PNG → SVG conversion with annotated parts
 * 2. Individual part animation (like AE layers)
 * 3. Animation presets (fade, scale, rotate, glow)
 * 4. Timeline sequencing with stagger
 * 5. Complex multi-layer compositions
 */
export default makeScene2D(function* (view) {
  console.log('🎬 Adobe After Effects-Style Scene Starting...');

  // ============================================
  // SETUP: Create refs for all animatable parts
  // ============================================
  
  // Google Logo - Individual Letters (like AE layers)
  const googleLetterG1 = createRef<Img>();
  const googleLetterO1 = createRef<Img>();
  const googleLetterO2 = createRef<Img>();
  const googleLetterG2 = createRef<Img>();
  const googleLetterL = createRef<Img>();
  const googleLetterE = createRef<Img>();

  // Search Bar Components
  const searchBarBg = createRef<Rect>();
  const searchBarInput = createRef<Img>();
  const micIcon = createRef<Img>();
  const cameraIcon = createRef<Img>();

  // Buttons
  const googleSearchBtn = createRef<Img>();
  const luckyBtn = createRef<Img>();

  // Background
  const background = createRef<Rect>();

  // ============================================
  // VIEW COMPOSITION (Like After Effects Comp)
  // ============================================
  
  view.add(
    <>
      {/* Background Layer (Z-index: 0) */}
      <Rect 
        ref={background}
        width={1920}
        height={1080}
        fill={'#ffffff'}
        opacity={1}
      />

      {/* Google Logo Letters (Z-index: 10-15) */}
      {/* Each letter is a separate layer that can be animated independently */}
      <Img 
        ref={googleLetterG1}
        src="/assets/google_logo.png" // Or SVG with #google_logo_letter_g
        x={-200}
        y={-100}
        width={40}
        height={60}
        opacity={0}
        scale={0}
      />
      <Img 
        ref={googleLetterO1}
        src="/assets/google_logo.png"
        x={-150}
        y={-100}
        width={40}
        height={60}
        opacity={0}
        scale={0}
      />
      <Img 
        ref={googleLetterO2}
        src="/assets/google_logo.png"
        x={-100}
        y={-100}
        width={40}
        height={60}
        opacity={0}
        scale={0}
      />
      <Img 
        ref={googleLetterG2}
        src="/assets/google_logo.png"
        x={-50}
        y={-100}
        width={40}
        height={60}
        opacity={0}
        scale={0}
      />
      <Img 
        ref={googleLetterL}
        src="/assets/google_logo.png"
        x={0}
        y={-100}
        width={40}
        height={60}
        opacity={0}
        scale={0}
      />
      <Img 
        ref={googleLetterE}
        src="/assets/google_logo.png"
        x={50}
        y={-100}
        width={40}
        height={60}
        opacity={0}
        scale={0}
      />

      {/* Search Bar Background (Z-index: 5) */}
      <Rect
        ref={searchBarBg}
        x={0}
        y={50}
        width={600}
        height={50}
        fill={'#ffffff'}
        stroke={'#dfe1e5'}
        lineWidth={1}
        radius={24}
        opacity={0}
        scale={0.8}
      />

      {/* Search Bar Input (Z-index: 6) */}
      <Img
        ref={searchBarInput}
        src="/assets/search_bar.svg"
        x={0}
        y={50}
        width={600}
        height={50}
        opacity={0}
      />

      {/* Icons (Z-index: 7-8) */}
      <Img
        ref={micIcon}
        src="/assets/microphone_icon.svg"
        x={250}
        y={50}
        width={24}
        height={24}
        opacity={0}
        scale={0}
      />
      <Img
        ref={cameraIcon}
        src="/assets/camera_icon.svg"
        x={280}
        y={50}
        width={24}
        height={24}
        opacity={0}
        scale={0}
      />

      {/* Buttons (Z-index: 9) */}
      <Img
        ref={googleSearchBtn}
        src="/assets/google_search_button.svg"
        x={-80}
        y={150}
        width={140}
        height={36}
        opacity={0}
        scale={0.9}
      />
      <Img
        ref={luckyBtn}
        src="/assets/im_feeling_lucky_button.svg"
        x={80}
        y={150}
        width={180}
        height={36}
        opacity={0}
        scale={0.9}
      />
    </>
  );

  // ============================================
  // ANIMATION TIMELINE (Like After Effects Timeline)
  // ============================================

  console.log('🎨 Starting Animation Sequence...');

  // ACT 1: Logo Animation (0-3s)
  // Animate each letter with stagger (like AE "Animate In" preset)
  console.log('  → Act 1: Logo letters fade in with stagger');
  
  const logoLetters = [
    googleLetterG1,
    googleLetterO1,
    googleLetterO2,
    googleLetterG2,
    googleLetterL,
    googleLetterE,
  ];

  // Staggered fade in + scale up (0.1s delay between each)
  for (let i = 0; i < logoLetters.length; i++) {
    const letter = logoLetters[i]();
    
    // Start all animations in parallel
    const animations = [
      letter.opacity(1, 0.4, easeOutCubic),
      letter.scale(1, 0.5, easeOutCubic),
    ];

    if (i === 0) {
      // First letter - just animate
      yield* all(...animations);
    } else {
      // Other letters - wait for stagger then animate
      yield* all(
        waitFor(0.1),
        all(...animations)
      );
    }
  }

  console.log('  ✓ Logo animation complete');
  yield* waitFor(0.3);

  // ACT 2: Search Bar Animation (3-4s)
  console.log('  → Act 2: Search bar slides in');
  
  yield* all(
    searchBarBg().opacity(1, 0.4, easeOutCubic),
    searchBarBg().scale(1, 0.5, easeOutCubic),
    searchBarInput().opacity(1, 0.4, easeOutCubic),
  );

  console.log('  ✓ Search bar animation complete');
  yield* waitFor(0.2);

  // ACT 3: Icons Pop In (4-4.5s)
  console.log('  → Act 3: Icons pop in');
  
  yield* all(
    micIcon().opacity(1, 0.3, easeOutCubic),
    micIcon().scale(1, 0.3, easeOutCubic),
  );
  
  yield* waitFor(0.1);
  
  yield* all(
    cameraIcon().opacity(1, 0.3, easeOutCubic),
    cameraIcon().scale(1, 0.3, easeOutCubic),
  );

  console.log('  ✓ Icons animation complete');
  yield* waitFor(0.2);

  // ACT 4: Buttons Fade In (4.5-5s)
  console.log('  → Act 4: Buttons fade in');
  
  yield* all(
    googleSearchBtn().opacity(1, 0.4, easeOutCubic),
    googleSearchBtn().scale(1, 0.4, easeOutCubic),
    luckyBtn().opacity(1, 0.4, easeOutCubic),
    luckyBtn().scale(1, 0.4, easeOutCubic),
  );

  console.log('  ✓ Buttons animation complete');
  yield* waitFor(0.5);

  // ACT 5: Interactive Hover Effects (5-7s)
  console.log('  → Act 5: Demonstrating hover effects');
  
  // Hover on search bar
  yield* all(
    searchBarBg().shadowBlur(8, 0.3),
    searchBarBg().shadowColor('rgba(32,33,36,0.28)', 0.3),
    searchBarBg().scale(1.02, 0.3, easeInOutCubic),
  );

  yield* waitFor(0.3);

  // Return to normal
  yield* all(
    searchBarBg().shadowBlur(0, 0.3),
    searchBarBg().scale(1, 0.3, easeInOutCubic),
  );

  yield* waitFor(0.2);

  // Hover on button
  yield* all(
    googleSearchBtn().shadowBlur(4, 0.2),
    googleSearchBtn().shadowColor('rgba(0,0,0,0.2)', 0.2),
    googleSearchBtn().scale(1.05, 0.2, easeInOutCubic),
  );

  yield* waitFor(0.3);

  // Return to normal
  yield* all(
    googleSearchBtn().shadowBlur(0, 0.2),
    googleSearchBtn().scale(1, 0.2, easeInOutCubic),
  );

  console.log('  ✓ Hover effects complete');
  yield* waitFor(0.5);

  // ACT 6: Icon Glow Effect (7-8s)
  console.log('  → Act 6: Icon glow effect');
  
  yield* all(
    micIcon().shadowBlur(20, 0.5),
    micIcon().shadowColor('#4285f4', 0.5),
    micIcon().scale(1.2, 0.5, easeInOutCubic),
  );

  yield* all(
    micIcon().shadowBlur(0, 0.5),
    micIcon().scale(1, 0.5, easeInOutCubic),
  );

  console.log('  ✓ Icon glow complete');
  yield* waitFor(0.3);

  // ACT 7: Logo Pulse (8-9s)
  console.log('  → Act 7: Logo pulse effect');
  
  // All letters pulse together
  yield* all(
    ...logoLetters.map(letter => letter().scale(1.1, 0.3, easeInOutCubic))
  );
  
  yield* all(
    ...logoLetters.map(letter => letter().scale(1, 0.3, easeInOutCubic))
  );

  console.log('  ✓ Logo pulse complete');

  // Hold final frame
  yield* waitFor(1);

  console.log('✅ Adobe After Effects-Style Animation Complete!');
});
