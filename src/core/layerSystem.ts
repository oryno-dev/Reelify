import { z } from 'zod';

/**
 * Adobe After Effects-style Layer System
 */

// Layer Types (like After Effects)
export enum LayerType {
  BACKGROUND = 'background',
  IMAGE = 'image',
  SHAPE = 'shape',
  TEXT = 'text',
  SOLID = 'solid',
  ADJUSTMENT = 'adjustment',
  NULL = 'null',
  CAMERA = 'camera',
}

// Blend Modes (like After Effects)
export enum BlendMode {
  NORMAL = 'normal',
  MULTIPLY = 'multiply',
  SCREEN = 'screen',
  OVERLAY = 'overlay',
  ADD = 'add',
}

// Transform properties (like After Effects)
export const TransformSchema = z.object({
  position: z.object({ x: z.number(), y: z.number() }),
  scale: z.object({ x: z.number(), y: z.number() }).default({ x: 100, y: 100 }),
  rotation: z.number().default(0),
  opacity: z.number().min(0).max(100).default(100),
  anchorPoint: z.object({ x: z.number(), y: z.number() }).optional(),
});

// Layer Schema (complete After Effects-style layer)
export const LayerSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.nativeEnum(LayerType),
  
  // Layer ordering
  index: z.number(), // Layer stack order (0 = bottom)
  parent: z.string().nullable().optional(),
  
  // Transform
  transform: TransformSchema,
  
  // Visual properties
  blendMode: z.nativeEnum(BlendMode).default(BlendMode.NORMAL),
  
  // Content (depends on layer type)
  content: z.object({
    // For IMAGE layers
    assetPath: z.string().optional(),
    
    // For SHAPE layers
    svgPath: z.string().optional(),
    fillColor: z.string().optional(),
    strokeColor: z.string().optional(),
    strokeWidth: z.number().optional(),
    
    // For TEXT layers
    text: z.string().optional(),
    fontSize: z.number().optional(),
    fontFamily: z.string().optional(),
    textColor: z.string().optional(),
    
    // For SOLID layers
    color: z.string().optional(),
  }).optional(),
  
  // Effects (like After Effects effects)
  effects: z.array(z.object({
    type: z.enum(['glow', 'shadow', 'blur', 'color-correction']),
    properties: z.record(z.any()),
  })).optional(),
  
  // Masks (for clipping)
  masks: z.array(z.object({
    path: z.string(), // SVG path
    mode: z.enum(['add', 'subtract', 'intersect']),
  })).optional(),
  
  // Timing
  inPoint: z.number().default(0), // Start time in seconds
  outPoint: z.number().optional(), // End time in seconds
  
  // Visibility
  visible: z.boolean().default(true),
  solo: z.boolean().default(false),
  locked: z.boolean().default(false),
  
  // Markers (for animations)
  markers: z.array(z.object({
    time: z.number(),
    label: z.string(),
  })).optional(),
});

// Composition (like After Effects composition)
export const CompositionSchema = z.object({
  id: z.string(),
  name: z.string(),
  width: z.number(),
  height: z.number(),
  duration: z.number(), // in seconds
  frameRate: z.number().default(60),
  backgroundColor: z.string(),
  
  // Layers (ordered from bottom to top)
  layers: z.array(LayerSchema),
  
  // Assets registry
  assets: z.record(z.object({
    id: z.string(),
    type: z.enum(['image', 'svg', 'video']),
    path: z.string(),
    width: z.number().optional(),
    height: z.number().optional(),
  })),
});

// Export types
export type Transform = z.infer<typeof TransformSchema>;
export type Layer = z.infer<typeof LayerSchema>;
export type Composition = z.infer<typeof CompositionSchema>;

/**
 * Layer creation helpers
 */

export function createBackgroundLayer(
  id: string,
  width: number,
  height: number,
  color: string
): Layer {
  return {
    id,
    name: 'Background',
    type: LayerType.SOLID,
    index: 0,
    transform: {
      position: { x: width / 2, y: height / 2 },
      scale: { x: 100, y: 100 },
      rotation: 0,
      opacity: 100,
    },
    blendMode: BlendMode.NORMAL,
    content: { color },
    visible: true,
    solo: false,
    locked: false,
    inPoint: 0,
  };
}

export function createImageLayer(
  id: string,
  name: string,
  assetPath: string,
  position: { x: number; y: number },
  index: number
): Layer {
  return {
    id,
    name,
    type: LayerType.IMAGE,
    index,
    transform: {
      position,
      scale: { x: 100, y: 100 },
      rotation: 0,
      opacity: 100,
    },
    blendMode: BlendMode.NORMAL,
    content: { assetPath },
    visible: true,
    solo: false,
    locked: false,
    inPoint: 0,
  };
}

export function createShapeLayer(
  id: string,
  name: string,
  position: { x: number; y: number },
  fillColor: string,
  index: number
): Layer {
  return {
    id,
    name,
    type: LayerType.SHAPE,
    index,
    transform: {
      position,
      scale: { x: 100, y: 100 },
      rotation: 0,
      opacity: 100,
    },
    blendMode: BlendMode.NORMAL,
    content: { fillColor },
    visible: true,
    solo: false,
    locked: false,
    inPoint: 0,
  };
}

export function createTextLayer(
  id: string,
  name: string,
  text: string,
  position: { x: number; y: number },
  fontSize: number,
  textColor: string,
  index: number
): Layer {
  return {
    id,
    name,
    type: LayerType.TEXT,
    index,
    transform: {
      position,
      scale: { x: 100, y: 100 },
      rotation: 0,
      opacity: 100,
    },
    blendMode: BlendMode.NORMAL,
    content: { text, fontSize, textColor, fontFamily: "'Segoe UI', Arial, sans-serif" },
    visible: true,
    solo: false,
    locked: false,
    inPoint: 0,
  };
}

/**
 * Composition builder
 */
export class CompositionBuilder {
  private layers: Layer[] = [];
  private assets: Record<string, any> = {};
  private nextIndex = 0;

  constructor(
    private id: string,
    private name: string,
    private width: number,
    private height: number,
    private duration: number,
    private backgroundColor: string
  ) {}

  addLayer(layer: Layer): this {
    layer.index = this.nextIndex++;
    this.layers.push(layer);
    return this;
  }

  addAsset(id: string, type: 'image' | 'svg' | 'video', path: string): this {
    this.assets[id] = { id, type, path };
    return this;
  }

  build(): Composition {
    return {
      id: this.id,
      name: this.name,
      width: this.width,
      height: this.height,
      duration: this.duration,
      frameRate: 60,
      backgroundColor: this.backgroundColor,
      layers: this.layers.sort((a, b) => a.index - b.index),
      assets: this.assets,
    };
  }
}
