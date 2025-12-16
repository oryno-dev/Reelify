#!/usr/bin/env node

import 'dotenv/config';
import { writeFileSync, existsSync, mkdirSync, copyFileSync } from 'fs';
import { resolve, basename } from 'path';
import { spawn } from 'child_process';
import { mapScreenshot } from './logic/mapper.js';
import { generateStoryboard, generateMultiSceneStoryboard } from './logic/director.js';
import type { Storyboard } from './core/schema.js';

// ANSI color codes for pretty console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
};

const log = {
  info: (msg: string) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  success: (msg: string) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg: string) => console.error(`${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg: string) => console.warn(`${colors.yellow}⚠${colors.reset} ${msg}`),
  step: (step: number, msg: string) => console.log(`${colors.bright}${colors.blue}[${step}]${colors.reset} ${msg}`),
};

/**
 * Ensures the output directory exists
 */
function ensureOutputDir() {
  const outputDir = resolve(process.cwd(), 'output');
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
    log.info('Created output directory');
  }
  return outputDir;
}

/**
 * Ensures the public directory exists and copies image to it
 */
function copyImageToPublic(imagePath: string): string {
  const publicDir = resolve(process.cwd(), 'public');
  if (!existsSync(publicDir)) {
    mkdirSync(publicDir, { recursive: true });
    log.info('Created public directory');
  }
  
  const filename = basename(imagePath);
  const destPath = resolve(publicDir, filename);
  
  copyFileSync(imagePath, destPath);
  log.info(`Copied image to public/${filename}`);
  
  return destPath;
}

/**
 * Saves the storyboard JSON to output/storyboard.json
 */
function saveStoryboard(storyboard: Storyboard, outputPath: string) {
  try {
    const jsonContent = JSON.stringify(storyboard, null, 2);
    writeFileSync(outputPath, jsonContent, 'utf-8');
    log.success(`Storyboard saved to ${outputPath}`);
  } catch (error) {
    throw new Error(`Failed to save storyboard: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Runs the MotionCanvas render command
 */
function renderVideo(): Promise<void> {
  return new Promise((resolve, reject) => {
    log.step(4, 'Starting MotionCanvas render...');
    
    const renderProcess = spawn('npm', ['run', 'render'], {
      stdio: 'inherit',
      shell: true,
    });

    renderProcess.on('close', (code) => {
      if (code === 0) {
        log.success('Video rendered successfully!');
        resolve();
      } else {
        reject(new Error(`Render process exited with code ${code}`));
      }
    });

    renderProcess.on('error', (error) => {
      reject(new Error(`Failed to start render process: ${error.message}`));
    });
  });
}

/**
 * Main workflow: Single scene animation
 */
async function createAnimation(imagePath: string, prompt: string) {
  try {
    console.log(`\n${colors.bright}${colors.green}AaaS Local - Multi-Scene UI Animator${colors.reset}\n`);
    
    // Validate inputs
    if (!imagePath || !prompt) {
      throw new Error('Missing required arguments: imagePath and prompt');
    }

    // Resolve and validate image path
    const resolvedImagePath = resolve(process.cwd(), imagePath);
    if (!existsSync(resolvedImagePath)) {
      throw new Error(`Image file not found: ${resolvedImagePath}`);
    }

    // Check for API key
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY environment variable is not set');
    }

    // Ensure output directory exists
    const outputDir = ensureOutputDir();
    const storyboardPath = resolve(outputDir, 'storyboard.json');

    // Copy image to public folder for MotionCanvas
    copyImageToPublic(resolvedImagePath);

    // Step 1: Multi-pass extraction (Adobe After Effects style)
    log.step(1, 'Running Adobe After Effects-style multi-pass extraction...');
    
    // Import the asset extractor
    const { multiPassExtraction } = await import('./logic/assetExtractor.js');
    
    // Run multi-pass extraction
    const extractionResult = await multiPassExtraction(resolvedImagePath);
    log.success('Multi-pass extraction complete!');
    log.info(`  → Layout analyzed: ${extractionResult.layout.layers?.length || 0} layers`);
    log.info(`  → Elements detected: ${extractionResult.elements.length}`);
    log.info(`  → PNG assets extracted: ${extractionResult.pngAssets.size}`);
    log.info(`  → SVG assets generated: ${extractionResult.svgAssets.size}`);

    // Step 1b: Also run standard mapper for backwards compatibility
    log.step('1b', 'Running standard element detection...');
    const sceneMap = await mapScreenshot(resolvedImagePath);
    log.success(`Detected ${sceneMap.elements.length} UI elements`);

    // Step 2: Generate the animation storyboard
    log.step(2, 'Generating animation storyboard...');
    const storyboard = await generateStoryboard(prompt, sceneMap);
    log.success(`Generated ${storyboard.actions.length} animation actions`);

    // Step 3: Save the storyboard to JSON
    log.step(3, 'Saving storyboard...');
    saveStoryboard(storyboard, storyboardPath);

    // Step 4: Preview instructions
    log.step(4, 'Storyboard ready for rendering');
    console.log(`\n${colors.green}${colors.bright}✓ Storyboard generation complete!${colors.reset}\n`);
    console.log(`${colors.cyan}To preview and render your animation:${colors.reset}`);
    console.log(`  1. Run: ${colors.bright}npm start${colors.reset}`);
    console.log(`  2. Open: ${colors.bright}http://localhost:9000${colors.reset}`);
    console.log(`  3. Use the MotionCanvas UI to preview and export your video\n`);

  } catch (error) {
    log.error(error instanceof Error ? error.message : 'Unknown error occurred');
    process.exit(1);
  }
}

/**
 * Multi-scene workflow: Animation across multiple screenshots
 */
async function createMultiSceneAnimation(imagePaths: string[], prompt: string) {
  try {
    console.log(`\n${colors.bright}${colors.green}AaaS Local - Multi-Scene UI Animator${colors.reset}\n`);
    
    // Validate inputs
    if (!imagePaths || imagePaths.length === 0 || !prompt) {
      throw new Error('Missing required arguments: imagePaths and prompt');
    }

    // Check for API key
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY environment variable is not set');
    }

    // Ensure output directory exists
    const outputDir = ensureOutputDir();
    const storyboardPath = resolve(outputDir, 'storyboard.json');

    // Step 1: Map all screenshots
    log.step(1, `Mapping ${imagePaths.length} screenshots to UI elements...`);
    const sceneMaps = [];
    
    for (let i = 0; i < imagePaths.length; i++) {
      const imagePath = imagePaths[i];
      const resolvedImagePath = resolve(process.cwd(), imagePath);
      
      if (!existsSync(resolvedImagePath)) {
        throw new Error(`Image file not found: ${resolvedImagePath}`);
      }

      // Copy image to public folder for MotionCanvas
      copyImageToPublic(resolvedImagePath);

      log.info(`Mapping scene ${i + 1}/${imagePaths.length}: ${imagePath}`);
      const sceneMap = await mapScreenshot(resolvedImagePath, `scene_${i + 1}`);
      sceneMaps.push(sceneMap);
    }
    
    const totalElements = sceneMaps.reduce((sum, scene) => sum + scene.elements.length, 0);
    log.success(`Detected ${totalElements} total UI elements across ${sceneMaps.length} scenes`);

    // Step 2: Generate the multi-scene storyboard
    log.step(2, 'Generating multi-scene animation storyboard...');
    const storyboard = await generateMultiSceneStoryboard(prompt, sceneMaps);
    log.success(`Generated ${storyboard.actions.length} animation actions`);

    // Step 3: Save the storyboard to JSON
    log.step(3, 'Saving storyboard...');
    saveStoryboard(storyboard, storyboardPath);

    // Step 4: Preview instructions
    log.step(4, 'Storyboard ready for rendering');
    console.log(`\n${colors.green}${colors.bright}✓ Multi-scene storyboard generation complete!${colors.reset}\n`);
    console.log(`${colors.cyan}To preview and render your animation:${colors.reset}`);
    console.log(`  1. Run: ${colors.bright}npm start${colors.reset}`);
    console.log(`  2. Open: ${colors.bright}http://localhost:9000${colors.reset}`);
    console.log(`  3. Use the MotionCanvas UI to preview and export your video\n`);

  } catch (error) {
    log.error(error instanceof Error ? error.message : 'Unknown error occurred');
    process.exit(1);
  }
}

/**
 * CLI argument parsing
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
${colors.bright}${colors.green}AaaS Local - Multi-Scene UI Animator${colors.reset}

${colors.bright}Usage:${colors.reset}
  Single Scene:
    tsx src/main.ts <imagePath> "<prompt>"
  
  Multi Scene:
    tsx src/main.ts --multi <imagePath1> <imagePath2> ... "<prompt>"

${colors.bright}Examples:${colors.reset}
  tsx src/main.ts assets/login.png "Click the login button"
  tsx src/main.ts --multi assets/login.png assets/dashboard.png "Log in and navigate to dashboard"

${colors.bright}Environment Variables:${colors.reset}
  OPENROUTER_API_KEY - Your OpenRouter API key (required)

${colors.bright}Output:${colors.reset}
  - Storyboard JSON: output/storyboard.json
  - Rendered video: output/animation.mp4
`);
    process.exit(0);
  }

  // Multi-scene mode
  if (args[0] === '--multi') {
    const prompt = args[args.length - 1];
    const imagePaths = args.slice(1, -1);
    
    if (imagePaths.length === 0) {
      log.error('No image paths provided');
      process.exit(1);
    }

    createMultiSceneAnimation(imagePaths, prompt);
    return;
  }

  // Single scene mode
  if (args.length < 2) {
    log.error('Missing required arguments');
    console.log('Run with --help for usage information');
    process.exit(1);
  }

  const [imagePath, prompt] = args;
  createAnimation(imagePath, prompt);
}

// Run the CLI
main();
