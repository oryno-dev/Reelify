import sharp from 'sharp';
import { mkdirSync, existsSync } from 'fs';
import { resolve } from 'path';
import OpenAI from 'openai';
import { UIElement } from '../core/schema';
import { convertPngToSvg } from './pngToSvgConverter';

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

/**
 * Inkscape-powered asset extraction system
 * 
 * Instead of creating small PNG crops, we now:
 * 1. Convert the entire screenshot to high-quality SVG using Inkscape
 * 2. Extract individual assets as SVG (better quality, scalable)
 * 3. Optionally crop PNGs only when absolutely needed
 */

// PASS 1: Layout Analysis
const LAYOUT_ANALYSIS_PROMPT = `You are a Layout Analysis Expert. Analyze this UI screenshot and identify the COMPLETE layer hierarchy.

Identify:
1. Background layer (color, gradients, patterns)
2. Major containers (header, main, sidebar, footer)
3. Z-index order (which elements are on top)
4. Visual depth and shadows
5. Overlapping elements

Return JSON:
{
  "background": {
    "type": "solid|gradient|image",
    "color": "#1f1f1f",
    "description": "Dark background with subtle texture"
  },
  "layers": [
    {
      "id": "background",
      "zIndex": 0,
      "type": "background"
    },
    {
      "id": "header",
      "zIndex": 1,
      "type": "container",
      "bounds": { "x": 0, "y": 0, "width": 1920, "height": 80 }
    }
  ]
}`;

// PASS 2: Element Detection with Extraction Boundaries
const ELEMENT_DETECTION_PROMPT = `You are an Asset Extraction Specialist. For EACH visual element, provide PRECISE pixel-perfect extraction boundaries.

For each element:
1. Identify element type (logo, button, icon, text, image, shape)
2. Provide extraction bounds (include padding/shadows)
3. Determine if it should be:
   - EXTRACTED as PNG (logos, complex icons, images)
   - GENERATED as SVG (simple buttons, shapes, text)
4. Provide visual description for SVG generation

Return JSON:
{
  "elements": [
    {
      "id": "google_logo",
      "type": "logo",
      "extractionMethod": "png|svg",
      "bounds": {
        "x": 100,
        "y": 50,
        "width": 200,
        "height": 80,
        "padding": 10
      },
      "visualDescription": "Google logo with multicolor letters: Blue G, Red o, Yellow o, Blue g, Green l, Red e. Sans-serif font, clean design.",
      "svgComplexity": "high|medium|low",
      "zIndex": 10
    }
  ]
}`;

/**
 * Extract visual assets from screenshot using Inkscape
 * 
 * NEW APPROACH: Convert entire image to SVG instead of creating small PNG crops
 */
export async function extractAssets(
  imagePath: string,
  elements: UIElement[]
): Promise<Map<string, string>> {
  const assets = new Map<string, string>();
  const assetsDir = resolve(process.cwd(), 'public/assets');
  
  if (!existsSync(assetsDir)) {
    mkdirSync(assetsDir, { recursive: true });
  }

  console.log(`🎨 Converting entire image to SVG with Inkscape...`);
  
  // Convert the entire screenshot to SVG using Inkscape
  const fullSvgPath = resolve(assetsDir, 'full_screenshot.svg');
  
  try {
    await convertPngToSvg(imagePath, fullSvgPath, {
      inkscapeOptions: {
        mode: 'color',
        colors: 64, // Use more colors for better quality on full images
        smooth: 1,
        removeBackground: false,
      }
    });
    
    console.log(`  ✓ Full SVG created: full_screenshot.svg`);
    assets.set('full_screenshot', '/assets/full_screenshot.svg');
    
    // Store the full SVG for all elements to use
    // Individual elements can be clipped/masked from this SVG in the animation
    console.log(`\n💡 TIP: Use the full SVG with clipping paths for individual elements`);
    console.log(`  This provides better quality than small PNG crops!`);
    
  } catch (error) {
    console.error('  ❌ Inkscape conversion failed, falling back to PNG extraction');
    console.error('  Make sure Inkscape is installed: brew install inkscape');
    
    // Fallback: extract individual PNGs
    return await extractAssetsAsPNG(imagePath, elements);
  }

  return assets;
}

/**
 * Fallback: Extract individual PNG crops (legacy method)
 */
async function extractAssetsAsPNG(
  imagePath: string,
  elements: UIElement[]
): Promise<Map<string, string>> {
  const assets = new Map<string, string>();
  const assetsDir = resolve(process.cwd(), 'public/assets');

  const image = sharp(imagePath);
  const metadata = await image.metadata();

  console.log(`📐 Image size: ${metadata.width}x${metadata.height}`);
  console.log(`🔍 Extracting ${elements.length} elements as separate PNG assets...`);

  for (const element of elements) {
    try {
      const { x, y, width, height } = element.coordinates;
      
      const padding = 10;
      const extractX = Math.max(0, x - padding);
      const extractY = Math.max(0, y - padding);
      const extractWidth = Math.min(metadata.width! - extractX, width + padding * 2);
      const extractHeight = Math.min(metadata.height! - extractY, height + padding * 2);

      const assetPath = resolve(assetsDir, `${element.id}.png`);
      
      await image
        .clone()
        .extract({
          left: Math.round(extractX),
          top: Math.round(extractY),
          width: Math.round(extractWidth),
          height: Math.round(extractHeight),
        })
        .toFile(assetPath);

      assets.set(element.id, `/assets/${element.id}.png`);
      console.log(`  ✓ Extracted: ${element.id}`);

    } catch (error) {
      console.warn(`  ⚠ Failed to extract ${element.id}:`, error);
    }
  }

  console.log(`✅ Extracted ${assets.size} PNG assets to public/assets/`);
  return assets;
}

/**
 * Multi-pass extraction with AI guidance
 */
export async function multiPassExtraction(imagePath: string) {
  console.log('\n🎬 Starting Multi-Pass Adobe After Effects-style Extraction...\n');

  // PASS 1: Layout Analysis
  console.log('📋 PASS 1: Analyzing layout hierarchy...');
  const layoutData = await analyzeLayout(imagePath);

  // PASS 2: Element Detection with Extraction Specs
  console.log('🔍 PASS 2: Detecting elements and extraction boundaries...');
  const elementsData = await detectElementsForExtraction(imagePath);

  // PASS 3: Convert to SVG with Inkscape (replaces PNG extraction)
  console.log('🎨 PASS 3: Converting to SVG with Inkscape...');
  const extractedAssets = await extractAssetsFromBounds(imagePath, elementsData);

  // PASS 4: No longer needed - Inkscape handles vectorization
  console.log('✓ PASS 4: Skipped (using Inkscape instead of AI SVG generation)');
  const svgAssets = await generateSVGAssets(elementsData);

  return {
    layout: layoutData,
    elements: elementsData,
    pngAssets: extractedAssets,
    svgAssets: svgAssets,
  };
}

/**
 * PASS 1: Analyze layout hierarchy
 */
async function analyzeLayout(imagePath: string) {
  console.log('  → Analyzing background, containers, z-index...');
  
  const imageBuffer = sharp(imagePath).toBuffer();
  const base64Image = (await imageBuffer).toString('base64');
  const mimeType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';
  const dataUrl = `data:${mimeType};base64,${base64Image}`;

  const response = await openai.chat.completions.create({
    model: 'qwen/qwen-2.5-vl-72b-instruct',
    messages: [
      { role: 'system', content: LAYOUT_ANALYSIS_PROMPT },
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: dataUrl } },
          { type: 'text', text: 'Analyze the layout hierarchy of this UI.' },
        ],
      },
    ],
    temperature: 0.1,
    max_tokens: 2048,
  });

  const content = response.choices[0]?.message?.content || '{}';
  let jsonStr = content.trim();
  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  }

  return JSON.parse(jsonStr);
}

/**
 * PASS 2: Detect elements with extraction specifications
 */
async function detectElementsForExtraction(imagePath: string) {
  console.log('  → Detecting elements, bounds, and extraction methods...');
  
  const imageBuffer = sharp(imagePath).toBuffer();
  const base64Image = (await imageBuffer).toString('base64');
  const mimeType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';
  const dataUrl = `data:${mimeType};base64,${base64Image}`;

  const response = await openai.chat.completions.create({
    model: 'qwen/qwen-2.5-vl-72b-instruct',
    messages: [
      { role: 'system', content: ELEMENT_DETECTION_PROMPT },
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: dataUrl } },
          { type: 'text', text: 'Detect all visual elements with extraction boundaries.' },
        ],
      },
    ],
    temperature: 0.1,
    max_tokens: 4096,
  });

  const content = response.choices[0]?.message?.content || '{"elements":[]}';
  let jsonStr = content.trim();
  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  }

  const parsed = JSON.parse(jsonStr);
  return parsed.elements || [];
}

/**
 * PASS 3: Convert full screenshot to SVG using Inkscape
 */
async function extractAssetsFromBounds(imagePath: string, _elementsData: any[]) {
  console.log('  → Converting to high-quality SVG with Inkscape...');
  const assets = new Map<string, string>();
  const assetsDir = resolve(process.cwd(), 'public/assets');
  
  if (!existsSync(assetsDir)) {
    mkdirSync(assetsDir, { recursive: true });
  }

  // Convert entire screenshot to high-quality SVG
  const fullSvgPath = resolve(assetsDir, 'full_screenshot.svg');
  
  try {
    await convertPngToSvg(imagePath, fullSvgPath, {
      inkscapeOptions: {
        mode: 'color',
        colors: 64,
        smooth: 1,
        removeBackground: false,
      }
    });
    
    assets.set('full_screenshot', '/assets/full_screenshot.svg');
    console.log(`    ✓ Created full SVG: full_screenshot.svg`);
    console.log(`    💡 Individual elements can be clipped from this SVG`);
    
  } catch (error) {
    console.warn(`    ⚠ Inkscape conversion failed:`, error);
    console.warn(`    Please install Inkscape: brew install inkscape`);
  }

  return assets;
}

/**
 * PASS 4: No longer needed - Inkscape handles all vectorization
 */
async function generateSVGAssets(_elementsData: any[]) {
  // Inkscape now handles all SVG conversion, no need for AI-based generation
  return new Map<string, string>();
}
