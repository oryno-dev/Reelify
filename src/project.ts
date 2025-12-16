import { makeProject } from '@motion-canvas/core';

// Import the MasterScene with the special ?scene suffix required by MotionCanvas
import masterScene from './render/MasterScene?scene';

export default makeProject({
  scenes: [masterScene],
  name: 'AaaS Local Animation',
  background: '#141414',
});
