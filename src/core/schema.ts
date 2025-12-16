import { z } from 'zod';

// --- 1. The Map (The "Digital Twin" of the Screenshot) ---
export const UIElementSchema = z.object({
  id: z.string(),          // e.g., "login_btn", "nav_home"
  type: z.enum(['button', 'input', 'text', 'image', 'link']),
  description: z.string(), // e.g., "Blue Submit Button"
  coordinates: z.object({
    x: z.number(), // Center X relative to image width (0-1920)
    y: z.number(), // Center Y relative to image height (0-1080)
    width: z.number(),
    height: z.number(),
  }),
});

export const ColorSchemeSchema = z.object({
  primary: z.string(),
  background: z.string(),
  accent: z.string(),
  theme: z.enum(['light', 'dark']),
});

export const SceneMapSchema = z.object({
  sceneId: z.string(),
  imagePath: z.string(),
  colorScheme: ColorSchemeSchema,
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

// --- 3. Exported TypeScript Types ---
export type UIElement = z.infer<typeof UIElementSchema>;
export type ColorScheme = z.infer<typeof ColorSchemeSchema>;
export type SceneMap = z.infer<typeof SceneMapSchema>;
export type StoryAction = z.infer<typeof ActionSchema>;
export type Storyboard = z.infer<typeof StoryboardSchema>;
