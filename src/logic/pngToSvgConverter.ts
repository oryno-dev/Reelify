import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync, existsSync } from 'fs';
import sharp from 'sharp';

const execAsync = promisify(exec);

/**
 * Inkscape-based PNG to SVG Converter
 * 
 * Uses Inkscape's powerful bitmap tracing engine for high-quality vectorization:
 * - Multiple color modes and tracing algorithms
 * - Professional-grade output quality
 * - Efficient CLI-based processing
 * - No LLM costs for conversion
 * 
 * Replaces custom/AI-based conversion with battle-tested open-source solution.
 */

export interface SVGPart {
  id: string;
  type: 'path' | 'rect' | 'circle' | 'text' | 'group';
  description: string;
  bounds: { x: number; y: number; width: number; height: number };
  svgCode: string;
}

export interface AnnotatedSVG {
  svgCode: string;
  parts: SVGPart[];
  width: number;
  height: number;
}

export interface InkscapeTraceOptions {
  // Trace mode: 'color' for multi-color, 'gray' for grayscale, 'mono' for black & white
  mode?: 'color' | 'gray' | 'mono';
  // Number of colors to extract (for color mode)
  colors?: number;
  // Smoothing iterations
  smooth?: number;
  // Remove background
  removeBackground?: boolean;
  // Speckle suppression (remove small artifacts)
  despeckle?: number;
}

/**
 * Convert PNG to SVG using Inkscape's bitmap tracer
 */
export async function convertPngToSvg(
  pngPath: string,
  outputPath: string,
  options: {
    annotate?: boolean;
    simplify?: boolean;
    tolerance?: number;
    inkscapeOptions?: InkscapeTraceOptions;
  } = {}
): Promise<AnnotatedSVG> {
  console.log(`\n🎨 Converting PNG to SVG with Inkscape: ${pngPath}`);

  const { inkscapeOptions = {} } = options;

  // Verify Inkscape is installed
  await verifyInkscapeInstalled();

  // Get image metadata
  const metadata = await sharp(pngPath).metadata();
  const width = metadata.width || 100;
  const height = metadata.height || 100;

  // Convert using Inkscape
  const svgCode = await traceWithInkscape(pngPath, outputPath, inkscapeOptions);

  // For now, parts are empty (we removed AI annotation to save costs)
  // If needed, parts can be added back with optional AI analysis
  const parts: SVGPart[] = [];

  console.log(`  ✓ SVG saved: ${outputPath}`);
  console.log(`  ✓ High-quality vectorization complete`);

  return {
    svgCode,
    parts,
    width,
    height,
  };
}

/**
 * Verify Inkscape is installed on the system
 */
async function verifyInkscapeInstalled(): Promise<void> {
  try {
    const { stdout } = await execAsync('inkscape --version');
    const version = stdout.trim();
    console.log(`  ✓ Found ${version}`);
  } catch (error) {
    throw new Error(
      '❌ Inkscape not found! Please install Inkscape:\n' +
      '  • macOS: brew install inkscape\n' +
      '  • Ubuntu/Debian: sudo apt-get install inkscape\n' +
      '  • Windows: Download from https://inkscape.org/\n'
    );
  }
}

/**
 * Trace PNG to SVG using Inkscape's bitmap tracer
 */
async function traceWithInkscape(
  pngPath: string,
  outputPath: string,
  options: InkscapeTraceOptions
): Promise<string> {
  const {
    mode = 'color',
    colors = 16,
    smooth = 1,
    removeBackground = false,
  } = options;

  console.log(`  → Tracing with Inkscape (${mode} mode, ${colors} colors)...`);

  // Build Inkscape trace command based on mode
  let traceAction = '';
  
  if (mode === 'color') {
    // Multi-color trace with specified number of colors
    // Parameters: colors, smooth, stack, removeBackground
    traceAction = `selection-trace:${colors},false,${removeBackground},true,0.1,${smooth},0.2`;
  } else if (mode === 'gray') {
    // Grayscale trace
    traceAction = `selection-trace:8,true,${removeBackground},true,0.1,${smooth},0.2`;
  } else {
    // Monochrome (black & white)
    traceAction = `selection-trace:2,true,${removeBackground},true,0.45,${smooth},0.2`;
  }

  // Inkscape command with actions pipeline
  const inkscapeCommand = `inkscape "${pngPath}" --actions="select-all;${traceAction};export-filename:${outputPath};export-do;" --batch-process`;

  try {
    const { stderr } = await execAsync(inkscapeCommand);
    
    if (stderr && !stderr.includes('Background RRGGBBAA')) {
      console.log(`  ⚠ Inkscape warnings: ${stderr.substring(0, 100)}`);
    }

    // Read the generated SVG
    if (!existsSync(outputPath)) {
      throw new Error('Inkscape failed to generate SVG file');
    }

    const svgCode = readFileSync(outputPath, 'utf-8');
    console.log('  ✓ Traced with Inkscape successfully');
    
    return svgCode;
  } catch (error: any) {
    console.error('  ❌ Inkscape trace failed:', error.message);
    throw new Error(`Inkscape conversion failed: ${error.message}`);
  }
}

/**
 * Batch convert all PNG assets in a directory to annotated SVGs
 */
export async function batchConvertAssets(assetsDir: string): Promise<Map<string, AnnotatedSVG>> {
  console.log(`\n🎬 Batch converting PNG assets to annotated SVGs...`);
  console.log(`📁 Directory: ${assetsDir}\n`);

  const fs = require('fs');
  const path = require('path');
  
  const results = new Map<string, AnnotatedSVG>();
  
  if (!existsSync(assetsDir)) {
    console.log('❌ Assets directory not found');
    return results;
  }

  const files = fs.readdirSync(assetsDir);
  const pngFiles = files.filter((f: string) => f.endsWith('.png'));

  console.log(`Found ${pngFiles.length} PNG files to convert\n`);

  for (const pngFile of pngFiles) {
    const pngPath = path.join(assetsDir, pngFile);
    const svgPath = pngPath.replace(/\.png$/, '.svg');
    
    try {
      const result = await convertPngToSvg(pngPath, svgPath, {
        annotate: true,
        simplify: true,
      });
      
      results.set(pngFile, result);
    } catch (error) {
      console.error(`  ❌ Failed to convert ${pngFile}:`, error);
    }
  }

  console.log(`\n✅ Converted ${results.size}/${pngFiles.length} files successfully`);
  return results;
}

/**
 * Get animatable parts from an SVG file
 */
export function getAnimatableParts(svgPath: string): SVGPart[] {
  if (!existsSync(svgPath)) {
    return [];
  }

  const svgCode = readFileSync(svgPath, 'utf-8');
  const parts: SVGPart[] = [];

  // Parse comments to extract part information
  const commentRegex = /<!--\s*LAYER:\s*(\w+)\s*\|\s*([^|]+)\|\s*Bounds:\s*\(([^)]+)\)\s*-->/g;
  let match;

  while ((match = commentRegex.exec(svgCode)) !== null) {
    const [, id, description, boundsStr] = match;
    const [x, y, width, height] = boundsStr.split(',').map(s => parseFloat(s.trim()));

    parts.push({
      id,
      type: 'group',
      description: description.trim(),
      bounds: { x, y, width, height },
      svgCode: '', // Would need to extract actual SVG code
    });
  }

  return parts;
}
