# Adobe After Effects-Style SVG Animation System

## 🎬 Overview

This system converts PNG images to annotated SVG files where each visual part can be animated independently, just like layers in Adobe After Effects.

## 🔧 How It Works

### 1. PNG → SVG Conversion

```bash
# Convert all PNG assets in a directory
npx tsx src/cli/convertToSvg.ts batch public/assets

# Convert a single PNG file
npx tsx src/cli/convertToSvg.ts single assets/google_logo.png
```

**What happens:**
- PNG image is vectorized (using potrace or AI)
- AI analyzes the image to identify distinct parts
- Comments are inserted into SVG marking each part
- Each part gets a unique ID for animation

### 2. Example Output

**Original PNG:** `google_logo.png`

**Generated SVG:** `google_logo.svg`

```svg
<svg viewBox="0 0 200 80" xmlns="http://www.w3.org/2000/svg">
  
  <!-- LAYER: google_logo_letter_g_blue | Blue letter 'G' in Google logo | Bounds: (10, 5, 20, 30) -->
  <path id="google_logo_letter_g_blue" d="M10,5 L30,5 L30,35 L10,35 Z" fill="#4285f4"/>
  
  <!-- LAYER: google_logo_letter_o_red | Red letter 'o' in Google logo | Bounds: (35, 5, 20, 30) -->
  <circle id="google_logo_letter_o_red" cx="45" cy="20" r="10" fill="#ea4335"/>
  
  <!-- LAYER: google_logo_letter_o_yellow | Yellow letter 'o' in Google logo | Bounds: (60, 5, 20, 30) -->
  <circle id="google_logo_letter_o_yellow" cx="70" cy="20" r="10" fill="#fbbc04"/>
  
  <!-- LAYER: google_logo_letter_g_blue2 | Blue letter 'g' in Google logo | Bounds: (85, 5, 20, 30) -->
  <path id="google_logo_letter_g_blue2" d="M85,5 L105,5 L105,35 L85,35 Z" fill="#4285f4"/>
  
  <!-- LAYER: google_logo_letter_l_green | Green letter 'l' in Google logo | Bounds: (110, 5, 15, 30) -->
  <rect id="google_logo_letter_l_green" x="110" y="5" width="15" height="30" fill="#34a853"/>
  
  <!-- LAYER: google_logo_letter_e_red | Red letter 'e' in Google logo | Bounds: (130, 5, 20, 30) -->
  <path id="google_logo_letter_e_red" d="M130,5 L150,5 L150,35 L130,35 Z" fill="#ea4335"/>
  
</svg>
```

## 🎨 Animation Examples

### Example 1: Fade In Each Letter (Staggered)

```tsx
import { Img } from '@motion-canvas/2d';
import { createRef, all } from '@motion-canvas/core';
import { SVGAnimationPresets } from './render/SVGAnimator';

export default makeScene2D(function* (view) {
  // Load the annotated SVG
  const gLetterRef = createRef<Img>();
  const oLetterRef = createRef<Img>();
  const oLetterRef2 = createRef<Img>();
  // ... more letters

  view.add(
    <>
      <Img ref={gLetterRef} src="/assets/google_logo.svg#google_logo_letter_g_blue" opacity={0} />
      <Img ref={oLetterRef} src="/assets/google_logo.svg#google_logo_letter_o_red" opacity={0} />
      <Img ref={oLetterRef2} src="/assets/google_logo.svg#google_logo_letter_o_yellow" opacity={0} />
      {/* ... more letters */}
    </>
  );

  // Animate each letter with 0.1s stagger
  yield* SVGAnimationPresets.fadeIn.animate(gLetterRef, 0.5);
  yield* SVGAnimationPresets.fadeIn.animate(oLetterRef, 0.5);
  yield* SVGAnimationPresets.fadeIn.animate(oLetterRef2, 0.5);
  // ... animate remaining letters
});
```

### Example 2: Button Hover Effect

```tsx
// Separate button parts: background, text, shadow
const buttonBgRef = createRef<Rect>();
const buttonTextRef = createRef<Txt>();

view.add(
  <>
    <Rect ref={buttonBgRef} fill="#4285f4" width={120} height={40} />
    <Txt ref={buttonTextRef} text="Click Me" fill="#fff" />
  </>
);

// Animate on hover
yield* all(
  buttonBgRef().scale(1.05, 0.2),
  buttonTextRef().scale(1.05, 0.2),
  buttonBgRef().shadowBlur(20, 0.2)
);
```

### Example 3: Google Logo Animation (After Effects Style)

```tsx
import { animateGoogleLogoSequence } from './render/SVGAnimator';

// Refs for all letters
const letterRefs = [gRef, oRef, o2Ref, g2Ref, lRef, eRef];

// Animate with stagger (like After Effects "Animate In" presets)
yield* animateGoogleLogoSequence(letterRefs, 0.1);
```

## 🎯 Benefits

### Like Adobe After Effects:
1. **Layer-based animation** - Each part is independent
2. **Comment annotations** - Easy to identify parts
3. **Reusable presets** - Fade in, slide, scale, etc.
4. **Timeline control** - Stagger, sequence, parallel animations
5. **Non-destructive** - Original PNG preserved

### Better than manual SVG:
- ✅ AI identifies parts automatically
- ✅ Consistent naming conventions
- ✅ Bounding boxes included
- ✅ Optimized and simplified
- ✅ Works with any PNG image

## 🚀 Advanced Usage

### Custom Animation Preset

```typescript
import { SVGAnimationPresets } from './render/SVGAnimator';

// Add your own preset
SVGAnimationPresets.myCustomEffect = {
  name: 'My Custom Effect',
  description: 'Does something cool',
  animate: function* (partRef, duration) {
    const node = partRef();
    yield* all(
      node.scale(1.5, duration / 2),
      node.rotation(360, duration),
      node.opacity(0.5, duration / 2)
    );
    yield* all(
      node.scale(1, duration / 2),
      node.opacity(1, duration / 2)
    );
  },
};
```

### Animation Sequencer (Timeline)

```typescript
import { SVGAnimationSequencer } from './render/SVGAnimator';

const sequencer = new SVGAnimationSequencer();

// Register parts
sequencer.registerPart('logo_letter_g', gLetterRef);
sequencer.registerPart('logo_letter_o', oLetterRef);

// Build timeline (like After Effects timeline)
sequencer.addAnimation('logo_letter_g', 'fadeIn', 0, 0.5);
sequencer.addAnimation('logo_letter_o', 'fadeIn', 0.1, 0.5);
sequencer.addAnimation('logo_letter_g', 'pulse', 1.0, 0.3);

// Play the sequence
yield* sequencer.play();
```

## 📝 SVG Comment Format

Comments follow this format:
```
<!-- LAYER: {id} | {description} | Bounds: ({x}, {y}, {width}, {height}) -->
```

Example:
```
<!-- LAYER: google_logo_letter_g | Blue letter 'G' in Google logo | Bounds: (10, 5, 20, 30) -->
```

This allows:
- Easy identification in code
- Automated parsing for animation
- Visual reference for bounds
- Semantic descriptions

## 🎬 Real-World Example

### Input: Google homepage screenshot
### Output: Animated breakdown

```bash
# 1. Extract assets from screenshot
npx tsx src/main.ts assets/google.png "Click search button"

# 2. Convert PNG assets to annotated SVG
npx tsx src/cli/convertToSvg.ts batch public/assets

# 3. Result: Annotated SVG files
public/assets/
  google_logo.svg         # With letter comments
  search_button.svg       # With background/text comments
  microphone_icon.svg     # With icon parts comments
```

### Animation in MotionCanvas:

```tsx
// Now each part can be animated independently!
yield* all(
  // Logo letters fade in sequentially
  animateGoogleLogoSequence(logoLetterRefs, 0.1),
  
  // Search button scales up
  searchButtonRef().scale(1.1, 0.3),
  
  // Microphone icon glows
  micIconRef().shadowBlur(20, 0.3)
);
```

## 🔥 Key Features

1. **Automatic Part Detection** - AI identifies all animatable parts
2. **Comment Annotations** - Each part is marked with descriptive comments
3. **After Effects Presets** - Built-in animation presets (fade, slide, scale, etc.)
4. **Timeline Sequencer** - Arrange animations like AE timeline
5. **Non-destructive** - Original PNG preserved alongside SVG
6. **Universal** - Works with ANY PNG image

## 💡 Tips

1. **Use high-res PNGs** - Better vectorization quality
2. **Simple graphics work best** - Complex photos may not vectorize well
3. **Check annotations** - AI may need guidance on complex parts
4. **Combine with PNG** - Use SVG for simple parts, PNG for complex (logos, photos)
5. **Test animations** - Preview before rendering final video

## 🎯 Next Steps

1. Convert your PNG assets: `npx tsx src/cli/convertToSvg.ts batch public/assets`
2. Check the generated SVG comments
3. Use the part IDs in your animations
4. Apply animation presets or create custom ones
5. Render your video!

**Welcome to Adobe After Effects-style animation on the web! 🎬**
