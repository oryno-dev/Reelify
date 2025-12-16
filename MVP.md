I understand perfectly. You want a **"Full UI Scan" approach**.

Instead of asking the AI for one button at a time, we will:
1.  **Scan the input image(s) once** to detect *every* UI element (buttons, inputs, text).
2.  **Map them** to a coordinate system (creating a "Digital Twin" of the screenshot).
3.  **Animate a sequence (Story)** based on that map.
4.  Support **Multiple Scenes** (e.g., Scene 1: Login Page → Scene 2: Dashboard).

Here is the refined, consistent specification designed for an LLM to build.

***

# AaaS Local MVP - Multi-Scene UI Animator

## 1. Core Concept
**"Scan Once, Animate Anything."**
The system takes a screenshot, uses AI to turn it into a semantic map of elements (Buttons, Inputs, Text), and then uses MotionCanvas to script interactions (cursor movement, typing, scene transitions) based on those elements.

## 2. Tech Stack (MotionCanvas Focused)
- **Runtime:** Node.js 20+, TypeScript.
- **Engine:** `MotionCanvas` (API-based video rendering).
- **Vision:** `Qwen2.5-VL-7B` (via OpenRouter) - Optimized for OCR and Bounding Box detection.
- **Data Handling:** `Zod` (Schema validation).

---

## 3. Data Architecture (The "Brain")

This is the most important part. We need to separate the **UI Map** (Where things are) from the **Story** (What happens).

### The Schema Contracts (`src/core/schema.ts`)

```typescript
import { z } from 'zod';

// --- 1. The Map (The "Digital Twin" of the Screenshot) ---
export const UIElementSchema = z.object({
  id: z.string(),          // e.g., "login_btn", "nav_home"
  type: z.enum(['button', 'input', 'text', 'image']),
  description: z.string(), // e.g., "Blue Submit Button"
  coordinates: z.object({
    x: z.number(), // Center X relative to image width (0-1920)
    y: z.number(), // Center Y relative to image height (0-1080)
    width: z.number(),
    height: z.number(),
  }),
});

export const SceneMapSchema = z.object({
  sceneId: z.string(),
  imagePath: z.string(),
  elements: z.array(UIElementSchema),
});

// --- 2. The Story (The Animation Script) ---
export const ActionSchema = z.object({
  type: z.enum(['cursor_move', 'click', 'type', 'wait', 'switch_scene']),
  targetElementId: z.string().optional(), // Links to UIElementSchema.id
  payload: z.string().optional(),         // Text to type, or ID of next scene
  duration: z.number().default(1.0),
});

export const StoryboardSchema = z.object({
  scenes: z.array(SceneMapSchema),
  actions: z.array(ActionSchema),
});

export type UIElement = z.infer<typeof UIElementSchema>;
export type SceneMap = z.infer<typeof SceneMapSchema>;
export type StoryAction = z.infer<typeof ActionSchema>;
```

---

## 4. Workflow Implementation

### Step 1: The "Mapper" (Vision)
*Goal: Turn pixels into data.*

**File:** `src/logic/mapper.ts`
```typescript
import OpenAI from 'openai'; // Uses OpenRouter
import { SceneMapSchema } from '../core/schema';

// Prompt for the LLM
const SYSTEM_PROMPT = `
You are a UI Analysis Engine. Analyze the provided screenshot.
Detect ALL interactive elements (buttons, inputs, links).
Return a JSON object containing a list of elements with their bounding boxes (x,y,w,h) and unique IDs.
Format: { elements: [{ id: "login_btn", type: "button", ... }] }
`;

export async function mapScreenshot(imagePath: string, sceneId: string) {
  // 1. Load image and convert to Base64
  // 2. Send to OpenRouter (Qwen2.5-VL)
  // 3. Parse JSON response using SceneMapSchema
  // 4. Return the "Map"
}
```

### Step 2: The "Director" (Story Generation)
*Goal: Convert user text to strict actions.*

**File:** `src/logic/director.ts`
```typescript
// Input: User Prompt ("Log in with user 'admin'") + The Maps from Step 1
// Output: JSON Array of actions

/*
Example Output:
[
  { type: "cursor_move", targetElementId: "username_input", duration: 1 },
  { type: "click", targetElementId: "username_input", duration: 0.2 },
  { type: "type", payload: "admin", duration: 1.5 },
  { type: "cursor_move", targetElementId: "login_btn", duration: 0.8 },
  { type: "click", targetElementId: "login_btn", duration: 0.2 },
  { type: "switch_scene", payload: "dashboard_scene", duration: 0.5 }
]
*/
```

### Step 3: The "Engine" (MotionCanvas)
*Goal: Render the frames.*

**File:** `src/scenes/MasterScene.tsx`
```tsx
import { makeScene2D, Img, Rect, Circle } from '@motion-canvas/2d';
import { createRef, all, tween, map, Vector2, easeInOutCubic } from '@motion-canvas/core';
import { StoryboardSchema } from '../core/schema';

// Injected Data
import storyboardData from '../../output/storyboard.json';

export default makeScene2D(function* (view) {
  const cursor = createRef<Circle>();
  const currentImage = createRef<Img>();
  const highlightBox = createRef<Rect>();

  // 1. Load Initial Scene
  let activeScene = storyboardData.scenes[0];
  
  view.add(
    <>
      <Img ref={currentImage} src={activeScene.imagePath} />
      {/* Invisible layer for debug or highlights */}
      <Rect ref={highlightBox} opacity={0} stroke="#00E5FF" lineWidth={4} />
      <Circle ref={cursor} size={30} fill="#FF0055" zIndex={100} />
    </>
  );

  // 2. Play Actions
  for (const action of storyboardData.actions) {
    
    // LOOKUP: Find coordinates based on ID
    const targetElement = activeScene.elements.find(e => e.id === action.targetElementId);

    if (action.type === 'cursor_move' && targetElement) {
      const { x, y } = targetElement.coordinates;
      // Convert image coords to MotionCanvas coords (center origin)
      const targetPos = new Vector2(x - 960, y - 540); 
      
      yield* cursor().position(targetPos, action.duration, easeInOutCubic);
    }

    if (action.type === 'click') {
      // Animate click ripple or scale
      yield* cursor().scale(0.8, 0.1).to(1, 0.2);
    }

    if (action.type === 'switch_scene') {
      // Find new scene data
      const nextSceneId = action.payload;
      activeScene = storyboardData.scenes.find(s => s.sceneId === nextSceneId)!;
      
      // Fade out current, Fade in new
      yield* currentImage().opacity(0, 0.5);
      currentImage().src(activeScene.imagePath);
      yield* currentImage().opacity(1, 0.5);
    }
  }
});
```

---

## 5. Directory Structure

```text
aaas-local/
├── src/
│   ├── assets/              # Input screenshots
│   ├── core/
│   │   └── schema.ts        # The Zod definitions (Map & Story)
│   ├── logic/
│   │   ├── mapper.ts        # Vision API (Get Coordinates)
│   │   └── director.ts      # Logic API (Create Timeline)
│   ├── render/
│   │   ├── MasterScene.tsx  # The MotionCanvas Loop
│   │   └── components/
│   │       └── Cursor.tsx   # Custom Cursor Logic
│   └── main.ts              # CLI Entry Point
├── project.ts               # MotionCanvas config
├── package.json
└── vite.config.ts
```

---
