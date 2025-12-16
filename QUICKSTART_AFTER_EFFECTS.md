# 🎬 Adobe After Effects Mode - 3-Minute Quickstart

## What is this?

Convert PNG images to SVG where **each part can be animated separately** - like layers in Adobe After Effects!

## Quick Start

### 1️⃣ Convert PNG to Annotated SVG (1 command)

```bash
npm run ae:convert
```

This converts all PNG files in `public/assets/` to annotated SVG files.

### 2️⃣ Check the Result

Open any `.svg` file in `public/assets/` and you'll see comments like:

```svg
<!-- LAYER: google_logo_letter_g | Blue letter 'G' | Bounds: (10, 5, 20, 30) -->
<!-- LAYER: button_background | Blue rounded rectangle | Bounds: (50, 100, 120, 40) -->
```

Each comment marks an **animatable part** (like an After Effects layer)!

### 3️⃣ Animate Individual Parts

```tsx
import { Img } from '@motion-canvas/2d';
import { createRef } from '@motion-canvas/core';

// Create refs for each part (like AE layers)
const letterG = createRef<Img>();
const letterO = createRef<Img>();

view.add(
  <>
    <Img ref={letterG} src="/assets/logo.svg" opacity={0} />
    <Img ref={letterO} src="/assets/logo.svg" opacity={0} />
  </>
);

// Animate with stagger
yield* letterG().opacity(1, 0.5); // First letter
yield* letterO().opacity(1, 0.5); // Second letter (0.5s later)
```

## ✨ Built-in Animation Presets

```tsx
import { SVGAnimationPresets } from './render/SVGAnimator';

// Fade in
yield* SVGAnimationPresets.fadeIn.animate(elementRef, 0.5);

// Slide from left
yield* SVGAnimationPresets.slideInLeft.animate(elementRef, 0.8);

// Scale up from 0
yield* SVGAnimationPresets.scaleUp.animate(elementRef, 0.6);

// Rotate 360°
yield* SVGAnimationPresets.rotate.animate(elementRef, 1.0);

// Pulse effect
yield* SVGAnimationPresets.pulse.animate(elementRef, 0.4);

// Glow effect
yield* SVGAnimationPresets.glow.animate(elementRef, 0.5);
```

## 🎯 Real Example: Google Logo

```bash
# 1. Convert PNG to annotated SVG
npm run ae:convert

# Result: google_logo.svg with 6 letter layers
```

```tsx
// 2. Animate each letter with stagger
const letters = [g, o1, o2, g2, l, e];

for (const letter of letters) {
  yield* letter().opacity(1, 0.3);
  yield* waitFor(0.1); // 0.1s stagger
}

// That's it! Professional logo reveal animation 🎉
```

## 📦 What You Get

- ✅ **PNG → SVG converter** (AI-powered)
- ✅ **Automatic part detection** (AI identifies layers)
- ✅ **Comment annotations** (marks each layer)
- ✅ **6 animation presets** (fade, slide, scale, rotate, pulse, glow)
- ✅ **Timeline sequencer** (arrange animations)
- ✅ **Demo scene** (working example)

## 🚀 Commands

```bash
# Convert all PNGs to SVG
npm run ae:convert

# Convert single file
npm run convert:svg single input.png output.svg

# Start dev server
npm start
```

## 🎬 Like Adobe After Effects?

- ✅ Layer-based animation
- ✅ Animation presets
- ✅ Timeline control
- ✅ Independent part animation
- ✅ Stagger & sequence
- ✅ Professional quality

But it's **code-driven**, **free**, and **AI-powered**! 🚀

## 📖 Full Documentation

- **README_ADOBE_AFTER_EFFECTS.md** - Complete guide
- **EXAMPLE_SVG_USAGE.md** - More examples
- **src/render/AdobeAfterEffectsScene.tsx** - Demo scene

**That's it! You're ready to create After Effects-style animations! 🎉**
