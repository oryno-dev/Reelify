# Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1. Install Dependencies
```bash
pnpm install
# or
npm install
```

### 2. Set Up Your API Key
```bash
cp .env.example .env
# Edit .env and add your OpenRouter API key
```

Get your API key from: https://openrouter.ai/keys

### 3. Generate Your First Animation

```bash
# Add a screenshot to the assets folder
mkdir -p assets
# (Copy your UI screenshot to assets/screenshot.png)

# Generate the storyboard
npx tsx src/main.ts assets/screenshot.png "Your animation prompt here"

# Start the MotionCanvas editor
npm start

# Open http://localhost:9000 in your browser
```

## 📝 Example Prompts

- `"Click the login button"`
- `"Type 'Hello World' into the search bar and click search"`
- `"Navigate to the settings menu and toggle dark mode"`
- `"Fill out the registration form with sample data"`

## 🎬 Rendering Your Video

1. The CLI generates `output/storyboard.json` with your animation data
2. Start the dev server with `npm start`
3. Open http://localhost:9000 in your browser
4. Use the MotionCanvas UI to:
   - Preview your animation
   - Adjust timing and parameters
   - Export as MP4, WebM, or PNG sequence

## 📂 Project Files

- `output/storyboard.json` - Generated animation script
- `src/render/MasterScene.tsx` - Animation renderer (auto-loads storyboard.json)
- `assets/` - Your UI screenshots

## 🔍 Troubleshooting

**No animations showing?**
- Make sure `output/storyboard.json` exists
- Check browser console for errors
- Verify image paths in the storyboard are correct

**API errors?**
- Check your `.env` file has `OPENROUTER_API_KEY` set
- Verify you have credits on OpenRouter

**Server won't start?**
- Make sure port 9000 is available
- Try `pkill -f vite` to stop any existing servers

## 🎯 Next Steps

- Try multi-scene animations with `--multi` flag
- Customize `MasterScene.tsx` for different animation styles
- Adjust the Director prompts in `src/logic/director.ts` for better results
