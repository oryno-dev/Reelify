import OpenAI from 'openai';
import { readFileSync } from 'fs';
import { SceneMapSchema, type SceneMap } from '../core/schema';

// Initialize OpenRouter client
const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Enhanced system prompt for comprehensive UI blueprint extraction
const SYSTEM_PROMPT = `You are an Advanced UI Blueprint Extraction Engine. Your task is to create a COMPLETE, DETAILED map of EVERY visual element in the screenshot.

CRITICAL REQUIREMENTS:
1. Detect EVERYTHING - not just interactive elements, but ALL visual components
2. Measure coordinates from TOP-LEFT corner (x, y), provide width and height in pixels
3. Be PIXEL-PERFECT with measurements
4. Include visual properties (colors, borders, shadows, backgrounds)

ELEMENT CATEGORIES TO DETECT:

**Interactive Elements:**
- Buttons (with background color, text, border radius, shadows)
- Input fields (with placeholder text, border, background)
- Links (with text and color)
- Dropdowns, toggles, checkboxes

**Visual Elements:**
- Logos (provide description for SVG conversion later)
- Icons (describe shape and color for rendering)
- Images (describe content and position)
- Decorative shapes (circles, rectangles, lines)

**Layout Elements:**
- Containers (nav bars, headers, footers, sidebars)
- Background colors and gradients
- Dividers and separators
- Spacing and padding

**Text Elements:**
- Headings (with font size estimate)
- Body text
- Labels
- Placeholder text

**Styling Details:**
- Border radius (rounded corners)
- Shadows (box shadows, drop shadows)
- Opacity/transparency
- Border styles and colors

Return a COMPREHENSIVE JSON blueprint:
{
  "metadata": {
    "imageWidth": 1920,
    "imageHeight": 1080,
    "colorScheme": {
      "primary": "#4285f4",
      "background": "#ffffff",
      "accent": "#ea4335",
      "theme": "light"
    }
  },
  "layout": {
    "containers": [
      {
        "id": "header",
        "type": "container",
        "x": 0,
        "y": 0,
        "width": 1920,
        "height": 80,
        "backgroundColor": "#ffffff",
        "children": ["logo", "nav_links"]
      }
    ]
  },
  "elements": [
    {
      "id": "element_id",
      "type": "button|input|text|image|icon|logo|container",
      "description": "Detailed description",
      "coordinates": {
        "x": 100,
        "y": 200,
        "width": 150,
        "height": 40
      },
      "styling": {
        "backgroundColor": "#4285f4",
        "textColor": "#ffffff",
        "borderRadius": 8,
        "borderColor": null,
        "borderWidth": 0,
        "shadow": "0px 2px 4px rgba(0,0,0,0.1)",
        "fontSize": 16,
        "fontWeight": "normal|bold",
        "padding": 12
      },
      "content": {
        "text": "Button text or placeholder",
        "imagePath": null,
        "svgDescription": "For logos/icons: describe shape for SVG generation"
      },
      "parent": "container_id",
      "zIndex": 1
    }
  ]
}

BE EXTREMELY THOROUGH. Map every pixel. Create a complete digital twin of the UI.`;

/**
 * Maps a screenshot to a semantic UI element map using Vision AI
 * @param imagePath - Path to the screenshot file
 * @param sceneId - Optional scene identifier (defaults to filename)
 * @returns SceneMap object with detected UI elements
 */
export async function mapScreenshot(
  imagePath: string,
  sceneId?: string
): Promise<SceneMap> {
  try {
    // 1. Load image and convert to Base64
    const imageBuffer = readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';
    const dataUrl = `data:${mimeType};base64,${base64Image}`;

    // 2. Send to OpenRouter with Qwen2.5-VL-72B model (more precise)
    const response = await openai.chat.completions.create({
      model: 'qwen/qwen-2.5-vl-72b-instruct',
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: dataUrl,
              },
            },
            {
              type: 'text',
              text: 'Analyze this screenshot and detect all interactive UI elements with their coordinates.',
            },
          ],
        },
      ],
      temperature: 0.1, // Low temperature for consistent, structured output
      max_tokens: 4096,
    });

    // 3. Parse the response
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from Vision API');
    }

    // Extract JSON from response (handling potential markdown code blocks)
    let jsonStr = content.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```\n?/g, '');
    }

    const parsed = JSON.parse(jsonStr);

    // 4. Construct SceneMap object with comprehensive blueprint
    const filename = imagePath.split('/').pop() || 'scene.png';
    
    // Handle both old simple format and new comprehensive format
    const colorScheme = parsed.metadata?.colorScheme || parsed.colorScheme || {
      primary: '#4285f4',
      background: '#ffffff',
      accent: '#ea4335',
      theme: 'light',
    };
    
    const elements = parsed.elements || [];
    
    const sceneMap = {
      sceneId: sceneId || filename.replace(/\.(png|jpg|jpeg)$/i, ''),
      imagePath: `/${filename}`, // MotionCanvas path relative to public/
      colorScheme: colorScheme,
      elements: elements,
      blueprint: parsed.metadata ? parsed : undefined, // Store full blueprint if available
    };

    // 5. Validate with Zod schema
    const validated = SceneMapSchema.parse(sceneMap);

    console.log(`✓ Mapped ${validated.elements.length} UI elements from ${imagePath}`);
    return validated;

  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to map screenshot: ${error.message}`);
    }
    throw error;
  }
}
