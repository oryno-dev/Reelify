import { makeProject } from '@motion-canvas/core';

// Import scenes with the special ?scene suffix required by MotionCanvas
import masterScene from './render/MasterScene?scene';
import canvasScene from './render/CanvasScene?scene';
import hybridScene from './render/HybridScene?scene';

// Choose rendering mode:
// - masterScene: Uses original screenshot image (simple, accurate)
// - canvasScene: Reconstructs UI with canvas elements (programmable, editable)
// - hybridScene: Adobe After Effects style - starts with screenshot, transitions to extracted assets

export default makeProject({
  scenes: [hybridScene], // Using Adobe After Effects-style hybrid mode
  name: 'AaaS Local - Adobe After Effects Mode',
  background: '#141414',
});
