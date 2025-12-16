import { Node, Img, Path, Rect, Circle, Txt } from '@motion-canvas/2d';
import { createRef, Reference, all, Vector2 } from '@motion-canvas/core';
import { SVGPart } from '../logic/pngToSvgConverter';

/**
 * Adobe After Effects-style SVG Animator
 * 
 * Allows animating individual parts of an SVG independently
 * Each part acts like a layer in After Effects
 */

export interface AnimatableSVGPartProps {
  part: SVGPart;
  svgPath: string;
  parent?: Reference<Node>;
}

export interface SVGAnimationPreset {
  name: string;
  description: string;
  animate: (partRef: Reference<Node>, duration: number) => Generator;
}

/**
 * Create an animatable SVG part (like an After Effects layer)
 */
export function createAnimatableSVGPart(props: AnimatableSVGPartProps) {
  const { part, svgPath } = props;
  const { x, y, width, height } = part.bounds;

  // For now, render as an image with the full SVG
  // In a full implementation, you'd extract just this part
  return (
    <Img
      key={part.id}
      src={svgPath}
      x={x + width / 2 - 960}
      y={y + height / 2 - 540}
      width={width}
      height={height}
      opacity={1}
    />
  );
}

/**
 * Animation presets (like After Effects animation presets)
 */
export const SVGAnimationPresets: Record<string, SVGAnimationPreset> = {
  fadeIn: {
    name: 'Fade In',
    description: 'Gradually fade in the element',
    animate: function* (partRef, duration) {
      const node = partRef();
      node.opacity(0);
      yield* node.opacity(1, duration);
    },
  },

  slideInLeft: {
    name: 'Slide In from Left',
    description: 'Slide element in from the left',
    animate: function* (partRef, duration) {
      const node = partRef();
      const startPos = node.position();
      node.position(new Vector2(startPos.x - 200, startPos.y));
      yield* node.position(startPos, duration);
    },
  },

  scaleUp: {
    name: 'Scale Up',
    description: 'Scale element from 0 to 100%',
    animate: function* (partRef, duration) {
      const node = partRef();
      node.scale(0);
      yield* node.scale(1, duration);
    },
  },

  rotate: {
    name: 'Rotate 360',
    description: 'Complete 360 degree rotation',
    animate: function* (partRef, duration) {
      const node = partRef();
      yield* node.rotation(360, duration);
    },
  },

  pulse: {
    name: 'Pulse',
    description: 'Pulsing scale animation',
    animate: function* (partRef, duration) {
      const node = partRef();
      yield* all(
        node.scale(1.2, duration / 2),
        node.scale(1, duration / 2)
      );
    },
  },

  glow: {
    name: 'Glow',
    description: 'Add glowing effect',
    animate: function* (partRef, duration) {
      const node = partRef();
      yield* all(
        node.shadowBlur(20, duration / 2),
        node.shadowColor('#4285f4', duration / 2)
      );
    },
  },

  morphPath: {
    name: 'Morph Path',
    description: 'Morph between two paths (After Effects path animation)',
    animate: function* (partRef, duration) {
      const node = partRef();
      // This would require path interpolation
      // Placeholder for now
      yield* node.opacity(0.5, duration / 2);
      yield* node.opacity(1, duration / 2);
    },
  },
};

/**
 * Sequencer for multi-part SVG animations (like After Effects timeline)
 */
export class SVGAnimationSequencer {
  private parts: Map<string, Reference<Node>> = new Map();
  private timeline: Array<{
    partId: string;
    preset: string;
    startTime: number;
    duration: number;
  }> = [];

  /**
   * Register a part for animation
   */
  registerPart(partId: string, partRef: Reference<Node>) {
    this.parts.set(partId, partRef);
  }

  /**
   * Add animation to timeline
   */
  addAnimation(partId: string, preset: string, startTime: number, duration: number) {
    this.timeline.push({ partId, preset, startTime, duration });
    // Sort by start time
    this.timeline.sort((a, b) => a.startTime - b.startTime);
  }

  /**
   * Play the animation sequence
   */
  *play() {
    for (const anim of this.timeline) {
      const partRef = this.parts.get(anim.partId);
      const preset = SVGAnimationPresets[anim.preset];

      if (!partRef || !preset) {
        console.warn(`Animation skipped: ${anim.partId} - ${anim.preset}`);
        continue;
      }

      yield* preset.animate(partRef, anim.duration);
    }
  }

  /**
   * Get timeline duration
   */
  getDuration(): number {
    if (this.timeline.length === 0) return 0;
    const last = this.timeline[this.timeline.length - 1];
    return last.startTime + last.duration;
  }
}

/**
 * Example: Animate Google logo letters sequentially (like After Effects stagger)
 */
export function* animateGoogleLogoSequence(
  letterRefs: Reference<Node>[],
  staggerDelay: number = 0.1
) {
  // Fade in each letter with stagger
  for (let i = 0; i < letterRefs.length; i++) {
    const letter = letterRefs[i]();
    letter.opacity(0);
    letter.scale(0);
  }

  for (let i = 0; i < letterRefs.length; i++) {
    const letter = letterRefs[i]();
    yield* all(
      letter.opacity(1, 0.3),
      letter.scale(1, 0.3)
    );
    if (i < letterRefs.length - 1) {
      yield* new Promise(resolve => setTimeout(resolve, staggerDelay * 1000));
    }
  }
}

/**
 * Parse SVG and extract paths for individual animation
 */
export function parseSVGPaths(svgCode: string): Map<string, string> {
  const paths = new Map<string, string>();
  
  // Extract paths with IDs
  const pathRegex = /<path[^>]*id="([^"]+)"[^>]*d="([^"]+)"[^>]*>/g;
  let match;

  while ((match = pathRegex.exec(svgCode)) !== null) {
    const [, id, d] = match;
    paths.set(id, d);
  }

  return paths;
}

/**
 * Helper to extract individual SVG elements by comment markers
 */
export function extractSVGLayerByComment(svgCode: string, layerId: string): string {
  const startComment = `<!-- LAYER: ${layerId}`;
  const startIndex = svgCode.indexOf(startComment);
  
  if (startIndex === -1) {
    return '';
  }

  // Find the next comment or closing tag
  const nextCommentIndex = svgCode.indexOf('<!-- LAYER:', startIndex + 1);
  const endIndex = nextCommentIndex !== -1 ? nextCommentIndex : svgCode.indexOf('</svg>', startIndex);

  return svgCode.substring(startIndex, endIndex);
}
