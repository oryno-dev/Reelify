# AaaS Local - Multi-Scene UI Animator

**"Scan Once, Animate Anything."**

A powerful tool that uses AI vision to scan UI screenshots, map interactive elements, and generate professional MotionCanvas animations automatically.

## Features

- 🔍 **AI-Powered UI Detection** - Uses Qwen2.5-VL-72B to detect 10+ UI elements with high precision
- 🎨 **Automatic Color Scheme Detection** - AI extracts colors and adapts styling to match your UI
- 🖱️ **Realistic Cursor Animation** - Professional OS-style arrow pointer with shadows
- 🎬 **Enhanced Animations** - Click ripples, highlight boxes, smooth typing effects
- 💫 **Adaptive Styling** - Colors automatically adjust to light/dark themes
- 🌐 **Multi-Scene Support** - Animate workflows across multiple screenshots
- 📐 **Type-Safe** - Fully typed with TypeScript and Zod schemas

## Tech Stack

- **Runtime:** Node.js 20+, TypeScript
- **Engine:** MotionCanvas (Professional animation framework)
- **Vision AI:** Qwen2.5-VL-72B for detection, Qwen2.5-VL-7B for planning (via OpenRouter)
- **Data Validation:** Zod
- **Rendering:** SVG paths, adaptive color schemes, professional effects

## Installation

Install dependencies using pnpm (or npm/yarn):

```bash
pnpm install
```

## Setup

1. **Get an OpenRouter API Key:**
   - Visit [https://openrouter.ai/keys](https://openrouter.ai/keys)
   - Create an account and generate an API key

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   
3. **Edit `.env` and add your API key:**
   ```env
   OPENROUTER_API_KEY=sk-or-v1-your-actual-key-here
   OUTPUT_DIR=output
   ```

## Usage

### Single Scene Animation

```bash
tsx src/main.ts assets/screenshot.png "Click the login button"
```

### Multi-Scene Animation

```bash
tsx src/main.ts --multi assets/login.png assets/dashboard.png "Log in and navigate to dashboard"
```

### Help

```bash
tsx src/main.ts --help
```

## How It Works

1. **🔍 Mapper (Vision AI)** - Scans the screenshot and detects all UI elements with coordinates
2. **🎭 Director (Story AI)** - Converts your prompt into a sequence of animation actions
3. **💾 Data Storage** - Saves the storyboard to `output/storyboard.json`
4. **🎬 Renderer (MotionCanvas)** - Preview and render the animation through the web UI

After running the CLI, start the MotionCanvas dev server and use the interactive editor to preview and export your video.

## Project Structure

```
aaas-local/
├── src/
│   ├── core/
│   │   └── schema.ts          # Zod schemas (UIElement, SceneMap, StoryAction)
│   ├── logic/
│   │   ├── mapper.ts          # Vision AI - Screenshot → UI Map
│   │   └── director.ts        # Story AI - Prompt → Actions
│   ├── render/
│   │   └── MasterScene.tsx    # MotionCanvas animation scene
│   ├── project.ts             # MotionCanvas configuration
│   └── main.ts                # CLI entry point
├── output/                    # Generated files (storyboard.json, videos)
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## Example Workflow

```bash
# 1. Place your screenshot in the assets folder
mkdir -p assets
cp ~/Desktop/my-ui-screenshot.png assets/

# 2. Generate the storyboard
npx tsx src/main.ts assets/my-ui-screenshot.png "Click on the submit button and type 'Hello World'"

# 3. Start the MotionCanvas dev server
npm start

# 4. Open http://localhost:9000 in your browser
# 5. Use the MotionCanvas UI to preview and export your video
```

## Development

### Start MotionCanvas Dev Server

```bash
npm start
# or
pnpm dev
```

This opens the MotionCanvas editor where you can preview and edit animations interactively.

### Type Checking

```bash
pnpm typecheck
```

## Output

- **Storyboard:** `output/storyboard.json` - The generated animation script
- **Video:** Export from MotionCanvas UI (various formats supported: MP4, WebM, PNG sequences)

## Troubleshooting

### "OPENROUTER_API_KEY is not set"
Make sure you've created a `.env` file and added your API key.

### "Image file not found"
Check that the image path is correct. Use relative paths from the project root.

### "No response from Vision AI"
Check your OpenRouter API key and ensure you have credits available.

## License

MIT

---

Built with ❤️ using MotionCanvas and OpenRouter
