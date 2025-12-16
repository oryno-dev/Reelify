import OpenAI from 'openai';
import { StoryboardSchema, type Storyboard, type SceneMap } from '../core/schema';

// Initialize OpenRouter client
const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

// System prompt for the Animation Director
const SYSTEM_PROMPT = `You are an Animation Director. You are given a list of UI Elements with IDs and a User Goal. Return a JSON sequence of actions (cursor_move, click, type, wait) to achieve the goal using specific element IDs.

Available action types:
- cursor_move: Move the cursor to an element (requires targetElementId)
- click: Click on an element (requires targetElementId)
- type: Type text into an input (requires targetElementId and payload with the text)
- wait: Pause for a duration (requires duration in seconds)
- switch_scene: Switch to another scene (requires payload with the sceneId)

Rules:
1. Always use cursor_move before click or type actions
2. Use only element IDs that exist in the provided list
3. Be realistic with durations (cursor_move: 0.8-1.5s, click: 0.2s, type: 1-3s depending on text length)
4. Add brief wait actions between major steps for natural pacing

Return ONLY a valid JSON object in this exact format:
{
  "scenes": [/* scenes will be provided by the system */],
  "actions": [
    {
      "type": "cursor_move",
      "targetElementId": "element_id",
      "duration": 1.0
    },
    {
      "type": "click",
      "targetElementId": "element_id",
      "duration": 0.2
    },
    {
      "type": "type",
      "targetElementId": "input_id",
      "payload": "text to type",
      "duration": 1.5
    }
  ]
}`;

/**
 * Generates a storyboard from a user prompt and scene map
 * @param userPrompt - Natural language description of the desired animation
 * @param sceneMap - The mapped UI elements from the screenshot
 * @returns A validated Storyboard with scenes and actions
 */
export async function generateStoryboard(
  userPrompt: string,
  sceneMap: SceneMap
): Promise<Storyboard> {
  try {
    // Prepare the context with available UI elements
    const elementsContext = sceneMap.elements.map(el => ({
      id: el.id,
      type: el.type,
      description: el.description,
    }));

    const contextMessage = `Available UI Elements in scene "${sceneMap.sceneId}":
${JSON.stringify(elementsContext, null, 2)}

User Goal: ${userPrompt}

Generate the action sequence to achieve this goal.`;

    // Call OpenRouter API (using 7B for director - faster and sufficient for action planning)
    const response = await openai.chat.completions.create({
      model: 'qwen/qwen3-vl-8b-instruct',
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: contextMessage,
        },
      ],
      temperature: 0.3, // Low temperature for consistent, logical sequences
      max_tokens: 4096,
      response_format: { type: 'json_object' },
    });

    // Parse the response
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from Director AI');
    }

    // Extract JSON from response (handling potential markdown code blocks)
    let jsonStr = content.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```\n?/g, '');
    }

    const parsed = JSON.parse(jsonStr);

    // Construct the full storyboard with the scene
    const storyboard = {
      scenes: [sceneMap],
      actions: parsed.actions || [],
    };

    // Validate with Zod schema
    const validated = StoryboardSchema.parse(storyboard);

    console.log(`✓ Generated storyboard with ${validated.actions.length} actions`);
    return validated;

  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to generate storyboard: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Generates a multi-scene storyboard from a user prompt and multiple scene maps
 * @param userPrompt - Natural language description of the desired animation
 * @param sceneMaps - Array of mapped UI elements from multiple screenshots
 * @returns A validated Storyboard with multiple scenes and actions
 */
export async function generateMultiSceneStoryboard(
  userPrompt: string,
  sceneMaps: SceneMap[]
): Promise<Storyboard> {
  try {
    if (sceneMaps.length === 0) {
      throw new Error('At least one scene map is required');
    }

    // Prepare the context with all available scenes and elements
    const scenesContext = sceneMaps.map(scene => ({
      sceneId: scene.sceneId,
      elements: scene.elements.map(el => ({
        id: el.id,
        type: el.type,
        description: el.description,
      })),
    }));

    const contextMessage = `Available Scenes and UI Elements:
${JSON.stringify(scenesContext, null, 2)}

User Goal: ${userPrompt}

Generate the action sequence to achieve this goal across multiple scenes. Use switch_scene actions to transition between scenes.`;

    // Call OpenRouter API (using 7B for director - faster and sufficient)
    const response = await openai.chat.completions.create({
      model: 'qwen/qwen-2.5-vl-7b-instruct',
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: contextMessage,
        },
      ],
      temperature: 0.3,
      max_tokens: 4096,
      response_format: { type: 'json_object' },
    });

    // Parse the response
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from Director AI');
    }

    // Extract JSON from response
    let jsonStr = content.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```\n?/g, '');
    }

    const parsed = JSON.parse(jsonStr);

    // Construct the full storyboard with all scenes
    const storyboard = {
      scenes: sceneMaps,
      actions: parsed.actions || [],
    };

    // Validate with Zod schema
    const validated = StoryboardSchema.parse(storyboard);

    console.log(`✓ Generated multi-scene storyboard with ${validated.scenes.length} scenes and ${validated.actions.length} actions`);
    return validated;

  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to generate multi-scene storyboard: ${error.message}`);
    }
    throw error;
  }
}
