import { z } from 'zod';

// --- 1. Enhanced UI Blueprint Schema ---

export const ColorSchemeSchema = z.object({
  primary: z.string(),
  background: z.string(),
  accent: z.string(),
  theme: z.enum(['light', 'dark']),
});

export const StylingSchema = z.object({
  backgroundColor: z.string().nullable().optional(),
  textColor: z.string().nullable().optional(),
  borderRadius: z.number().optional(),
  borderColor: z.string().nullable().optional(),
  borderWidth: z.number().optional(),
  shadow: z.string().nullable().optional(),
  fontSize: z.number().optional(),
  fontWeight: z.enum(['normal', 'bold', 'light']).optional(),
  padding: z.number().optional(),
});

export const ContentSchema = z.object({
  text: z.string().nullable().optional(),
  imagePath: z.string().nullable().optional(),
  svgDescription: z.string().nullable().optional(),
});

export const UIElementSchema = z.object({
  id: z.string(),
  type: z.enum(['button', 'input', 'text', 'image', 'link', 'icon', 'logo', 'container']),
  description: z.string(),
  coordinates: z.object({
    x: z.number(), // Top-left X
    y: z.number(), // Top-left Y
    width: z.number(),
    height: z.number(),
  }),
  styling: StylingSchema.optional(),
  content: ContentSchema.optional(),
  parent: z.string().nullable().optional(),
  zIndex: z.number().optional(),
});

export const ContainerSchema = z.object({
  id: z.string(),
  type: z.literal('container'),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  backgroundColor: z.string().nullable().optional(),
  children: z.array(z.string()).optional(),
});

export const MetadataSchema = z.object({
  imageWidth: z.number(),
  imageHeight: z.number(),
  colorScheme: ColorSchemeSchema,
});

export const LayoutSchema = z.object({
  containers: z.array(ContainerSchema).optional(),
});

export const UIBlueprintSchema = z.object({
  metadata: MetadataSchema,
  layout: LayoutSchema.optional(),
  elements: z.array(UIElementSchema),
});

export const SceneMapSchema = z.object({
  sceneId: z.string(),
  imagePath: z.string(),
  colorScheme: ColorSchemeSchema,
  elements: z.array(UIElementSchema),
  blueprint: UIBlueprintSchema.optional(), // New comprehensive blueprint
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
export type ColorScheme = z.infer<typeof ColorSchemeSchema>;
export type Styling = z.infer<typeof StylingSchema>;
export type Content = z.infer<typeof ContentSchema>;
export type UIElement = z.infer<typeof UIElementSchema>;
export type Container = z.infer<typeof ContainerSchema>;
export type Metadata = z.infer<typeof MetadataSchema>;
export type Layout = z.infer<typeof LayoutSchema>;
export type UIBlueprint = z.infer<typeof UIBlueprintSchema>;
export type SceneMap = z.infer<typeof SceneMapSchema>;
export type StoryAction = z.infer<typeof ActionSchema>;
export type Storyboard = z.infer<typeof StoryboardSchema>;
