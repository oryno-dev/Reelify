import OpenAI from 'openai';
import { readFileSync } from 'fs';
import { SceneMapSchema, type SceneMap } from '../core/schema';

// Initialize OpenRouter client
const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

// System prompt for UI element detection with color analysis
const SYSTEM_PROMPT = `You are a UI Analysis Engine. Analyze the provided screenshot and detect ALL interactive elements (buttons, inputs, links, text fields, images).

For each element, provide:
- A unique ID (descriptive snake_case, e.g., "login_btn", "username_input")
- Type (button, input, text, or image)
- A brief description of the element
- Bounding box coordinates (x, y as CENTER POINT in pixels, width, height in pixels)
- IMPORTANT: Be VERY PRECISE with coordinates. Measure carefully from the image.

Also analyze the overall color scheme:
- Primary color (hex code)
- Background color (hex code)
- Accent color (hex code)
- Overall theme (light/dark)

Return ONLY a valid JSON object in this exact format:
{
  "colorScheme": {
    "primary": "#4285f4",
    "background": "#ffffff",
    "accent": "#ea4335",
    "theme": "light"
  },
  "elements": [
    {
      "id": "element_id",
      "type": "button",
      "description": "Description of the element",
      "coordinates": {
        "x": 100,
        "y": 200,
        "width": 150,
        "height": 40
      }
    }
  ]
}

Be thorough, precise, and detect every interactive UI element visible in the screenshot.`;

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

    // 4. Construct SceneMap object
    // Extract just the filename for MotionCanvas (it will look in public/)
    const filename = imagePath.split('/').pop() || 'scene.png';
    const sceneMap = {
      sceneId: sceneId || filename.replace(/\.(png|jpg|jpeg)$/i, ''),
      imagePath: `/${filename}`, // MotionCanvas path relative to public/
      colorScheme: parsed.colorScheme || {
        primary: '#4285f4',
        background: '#ffffff',
        accent: '#ea4335',
        theme: 'light',
      },
      elements: parsed.elements || [],
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
