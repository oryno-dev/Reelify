# Canvas-Based UI Reconstruction

## 🎨 Two Rendering Modes

Your AaaS Local system now supports **two rendering approaches**:

### 1. Image Mode (MasterScene.tsx)
- ✅ Uses the original screenshot as a background image
- ✅ Simple and accurate to the original design
- ✅ Fast rendering
- ❌ Static image - cannot manipulate individual elements
- ❌ Limited programmability

### 2. Canvas Mode (CanvasScene.tsx) ⭐ NEW
- ✅ Reconstructs UI with individual canvas elements
- ✅ Fully programmable - each element is a separate node
- ✅ Dynamic manipulation (shadows, pop-ups, scaling, colors)
- ✅ Vector-based - infinite scaling
- ✅ Editable in real-time
- ⚠️ Approximates the original design based on AI detection

---

## 🚀 Why Canvas Mode?

Canvas mode gives you **full programmatic control** over every UI element:

### ✨ Dynamic Effects
```typescript
// Add glow to focused element
targetNode.shadowBlur(12, 0.3);
targetNode.shadowColor('#4285f4', 0.3);

// Scale element on click
targetNode.scale(0.95, 0.1);
targetNode.opacity(0.8, 0.1);

// Pop-up animation
targetNode.position(new Vector2(x, y - 20), 0.3, easeOutCubic);
targetNode.scale(1.1, 0.3);
```

### 🎭 Element Manipulation
- **Shadows**: Add focus glow, depth effects
- **Scaling**: Click feedback, hover effects
- **Opacity**: Fade in/out, disable states
- **Position**: Move, shake, bounce
- **Colors**: Highlight, dim, change themes
- **Pop-ups**: Tooltips, notifications

---

## 🏗️ Architecture

### Component Hierarchy
```
CanvasScene.tsx (Main Scene)
├── Background (Solid color from color scheme)
├── UIContainer (Node - holds all UI elements)
│   ├── UIButton (Rect + Txt)
│   ├── UIInput (Rect)
│   ├── UILink (Txt)
│   ├── UIIconElement (Circle)
│   └── UIText (Txt)
├── HighlightBox (Rect - animated border)
├── TypingText (Txt - character-by-character)
├── CursorClickRipple (Circle - expanding ripple)
└── CursorPointer (Path - realistic arrow)
```

### UI Element Types

#### Buttons
```typescript
<Rect
  fill={colorScheme.primary}
  radius={8}
  shadowBlur={4}
>
  <Txt text="Button Text" fill="#FFFFFF" />
</Rect>
```

#### Inputs
```typescript
<Rect
  fill={bgColor}
  stroke={borderColor}
  lineWidth={2}
  radius={4}
/>
```

#### Links
```typescript
<Txt
  text="Link Text"
  fill={colorScheme.primary}
  fontSize={14}
/>
```

#### Icons
```typescript
<Circle
  size={24}
  fill={iconColor}
  opacity={0.8}
/>
```

---

## 🎬 Enhanced Animations

### Cursor Movement
```typescript
// Show highlight BEFORE cursor moves
highlightBox().opacity(0.6, 0.3);

// Add glow to target element
targetNode.shadowBlur(8, 0.3);
targetNode.shadowColor(highlightColor, 0.3);

// Smooth cursor movement
cursorPointer().position(targetPos, duration, easeInOutCubic);
```

### Click Animation
```typescript
// Click down
cursorPointer().scale(0.95, 0.1);
targetNode.scale(0.95, 0.1);

// Ripple effect
cursorClickRipple().size(new Vector2(40 → 80), 0.4);
cursorClickRipple().opacity(1 → 0, 0.4);

// Click up
cursorPointer().scale(1, 0.15);
targetNode.scale(1, 0.15);
```

### Typing Animation
```typescript
// Add focus glow to input
targetNode.shadowBlur(12, 0.3);

// Type character by character
for (each character) {
  typingText().text(text.substring(0, i + 1));
  cursorPointer().bob(); // Subtle movement
}

// Remove focus
targetNode.shadowBlur(0, 0.4);
```

---

## 🔄 Switching Between Modes

Edit `src/project.ts`:

```typescript
// Image Mode (screenshot)
export default makeProject({
  scenes: [masterScene],
  name: 'AaaS Local Animation - Image Mode',
});

// Canvas Mode (reconstructed)
export default makeProject({
  scenes: [canvasScene],
  name: 'AaaS Local Animation - Canvas Mode',
});
```

---

## 📊 Mode Comparison

| Feature | Image Mode | Canvas Mode |
|---------|-----------|-------------|
| Visual Accuracy | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Programmability | ⭐ | ⭐⭐⭐⭐⭐ |
| Element Manipulation | ❌ | ✅ |
| Dynamic Effects | Limited | Full |
| File Size | Larger | Smaller |
| Rendering Speed | Fast | Fast |
| Scalability | Image quality | Vector quality |
| Edit Individual Elements | ❌ | ✅ |
| Add/Remove Elements | ❌ | ✅ |
| Change Colors | ❌ | ✅ |
| Shadows/Glows | ❌ | ✅ |

---

## 🎯 Use Cases

### When to Use Image Mode
- ✅ Need pixel-perfect accuracy
- ✅ Complex UI with gradients/images
- ✅ Quick demo without customization
- ✅ Original design is more important

### When to Use Canvas Mode
- ✅ Need to modify elements dynamically
- ✅ Want to add effects (shadows, glows)
- ✅ Need to highlight/pop-up elements
- ✅ Want vector-based scaling
- ✅ Building interactive tutorials
- ✅ Creating stylized animations

---

## 🛠️ Customization Examples

### Add Pop-up Effect on Click
```typescript
case 'click': {
  // Element pops up before clicking
  yield* all(
    targetNode.position(new Vector2(x, y - 10), 0.2, easeOutCubic),
    targetNode.scale(1.05, 0.2, easeOutCubic),
    targetNode.shadowBlur(16, 0.2)
  );
  
  // Then click down
  yield* targetNode.scale(0.95, 0.1, easeInCubic);
  
  // Return to normal
  yield* all(
    targetNode.position(new Vector2(x, y), 0.3, easeInOutCubic),
    targetNode.scale(1, 0.3, easeOutCubic),
    targetNode.shadowBlur(4, 0.3)
  );
}
```

### Add Error State
```typescript
// Element shakes on error
for (let i = 0; i < 3; i++) {
  yield* targetNode.position(new Vector2(x + 5, y), 0.05);
  yield* targetNode.position(new Vector2(x - 5, y), 0.05);
}
yield* targetNode.position(new Vector2(x, y), 0.05);

// Turn red
yield* targetNode.fill('#EA4335', 0.3);
```

### Add Tooltip
```typescript
// Show tooltip above element
const tooltip = <Rect
  fill="#333333"
  radius={4}
  padding={8}
>
  <Txt text="Click here" fill="#FFFFFF" fontSize={12} />
</Rect>;

tooltip.position(new Vector2(x, y - 40));
tooltip.opacity(0);
view.add(tooltip);

yield* tooltip.opacity(1, 0.3, easeOutCubic);
```

---

## 🔮 Future Enhancements

### Planned Features
1. **Auto-detect UI frameworks** (Material, Bootstrap, etc.)
2. **Import design system colors** from CSS/Figma
3. **Element templates library** (buttons, inputs, cards)
4. **Animation presets** (bounce, shake, pulse, spin)
5. **Interactive elements** (real typing, form validation)
6. **Particle effects** (confetti, sparkles)
7. **Transitions** (fade, slide, zoom, flip)
8. **Layered rendering** (background, content, overlay)

---

## 📝 Technical Details

### Element Detection
- Uses **Qwen2.5-VL-72B** for precise element detection
- Extracts: position, size, type, description
- Detects: buttons, inputs, links, icons, text

### Color Scheme
- Automatically extracts color palette
- Adapts element styling to theme (light/dark)
- Uses brand colors for highlights and effects

### Coordinate System
- MotionCanvas: center-origin (0,0)
- Screenshots: top-left origin (0,0)
- Conversion: `(x - 960, y - 540)` for 1920x1080

### Performance
- Each element is a separate node
- Efficient rendering with GPU acceleration
- Smooth 60fps animations
- Minimal memory footprint

---

## 🎓 Learning Resources

### MotionCanvas Documentation
- Official Docs: https://motioncanvas.io/docs/
- Components: https://motioncanvas.io/docs/components
- Animations: https://motioncanvas.io/docs/tweening

### Key Concepts
- **Nodes**: Base class for all visual elements
- **Signals**: Animatable properties
- **Tweening**: Smooth transitions between values
- **Easing**: Animation curves (linear, cubic, elastic)
- **Generators**: Yield-based animation sequencing

---

## 🚀 Getting Started with Canvas Mode

1. **Generate storyboard with AI detection:**
   ```bash
   npx tsx src/main.ts assets/screenshot.png "Your prompt"
   ```

2. **Switch to Canvas Mode in `src/project.ts`:**
   ```typescript
   scenes: [canvasScene]
   ```

3. **Start dev server:**
   ```bash
   npm start
   ```

4. **View and customize:**
   - Open http://localhost:9000
   - Edit `src/render/CanvasScene.tsx` for custom effects
   - Edit `src/render/UIElements.tsx` for element styles

5. **Export video:**
   - Use MotionCanvas UI render button
   - Choose format (MP4, WebM, PNG sequence)

---

## 🎉 Benefits Summary

✅ **Full Programmability** - Control every pixel
✅ **Dynamic Effects** - Shadows, glows, scales, colors
✅ **Element Manipulation** - Move, hide, show, animate
✅ **Vector Quality** - Infinite scaling
✅ **Theme Adaptation** - Colors match your UI
✅ **Real-time Editing** - See changes instantly
✅ **Export Flexibility** - Multiple formats

Canvas mode transforms static screenshots into **fully programmable, dynamic animations** with professional effects and complete creative control!
