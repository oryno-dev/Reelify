# Inkscape Setup Guide

## Why Inkscape?

This project now uses **Inkscape** for PNG to SVG conversion instead of custom/AI-based solutions. Benefits:

✅ **Professional Quality** - Battle-tested bitmap tracing engine  
✅ **Multi-Color Support** - Up to 256 colors with intelligent color extraction  
✅ **Cost Effective** - No LLM API costs for conversion  
✅ **Reliable** - Open-source, maintained by thousands of developers  
✅ **Scalable** - Perfect vector output for animations  

## Installation

### macOS (Homebrew)
```bash
brew install inkscape
```

### macOS (Manual)
Download from [inkscape.org](https://inkscape.org/release/)

### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install inkscape
```

### Fedora/RHEL
```bash
sudo dnf install inkscape
```

### Windows
1. Download installer from [inkscape.org](https://inkscape.org/release/)
2. Run the installer
3. Add Inkscape to PATH (installer option)

### Verify Installation
```bash
inkscape --version
```

You should see output like:
```
Inkscape 1.3.2 (091e20e, 2023-11-25)
```

## Usage

### Convert Single Image
```bash
# Basic conversion (16 colors)
npm run convert:svg single input.png output.svg

# High-quality conversion (32 colors)
npm run convert:svg single input.png output.svg 32

# Maximum quality (64+ colors)
npm run convert:svg single input.png output.svg 64
```

### Batch Convert Directory
```bash
# Convert all PNGs in public/assets/
npm run convert:batch

# Or specify directory
npx tsx src/cli/convertToSvg.ts batch path/to/images
```

## Configuration Options

The converter supports multiple tracing modes:

### Color Modes
- **`color`** (default) - Multi-color tracing with intelligent color extraction
- **`gray`** - Grayscale tracing (good for photos)
- **`mono`** - Black and white (good for logos)

### Color Count
- **16** (default) - Balanced quality and file size
- **32** - High quality for complex images
- **64+** - Maximum quality for detailed artwork

### Smoothing
- **0-2** - Higher values = smoother paths (default: 1)

## Programmatic Usage

```typescript
import { convertPngToSvg } from './src/logic/pngToSvgConverter';

// Basic conversion
await convertPngToSvg('input.png', 'output.svg');

// Custom options
await convertPngToSvg('input.png', 'output.svg', {
  inkscapeOptions: {
    mode: 'color',        // 'color' | 'gray' | 'mono'
    colors: 32,           // Number of colors to extract
    smooth: 1,            // Smoothing level
    removeBackground: false
  }
});
```

## Troubleshooting

### "Inkscape not found" Error

**macOS/Linux:**
```bash
which inkscape
```

If not found, check your PATH or reinstall.

**Windows:**
Ensure Inkscape is in your PATH. Add this to your environment variables:
```
C:\Program Files\Inkscape\bin
```

### Conversion Too Slow

For faster conversion, reduce colors:
```bash
npm run convert:svg single input.png output.svg 8
```

### File Size Too Large

Use fewer colors or switch to grayscale:
```typescript
await convertPngToSvg('input.png', 'output.svg', {
  inkscapeOptions: {
    mode: 'gray',
    colors: 8
  }
});
```

### Poor Quality Output

Increase color count:
```bash
npm run convert:svg single input.png output.svg 64
```

## Comparison: Before vs After

### Before (Custom/AI Solution)
- ❌ Inconsistent quality
- ❌ High LLM API costs ($0.10+ per image)
- ❌ Small PNG crops in `/public/assets/`
- ❌ Limited color support
- ❌ Requires AI interpretation

### After (Inkscape Solution)
- ✅ Professional, consistent quality
- ✅ Zero API costs
- ✅ Full screenshot as SVG
- ✅ Up to 256 colors
- ✅ Battle-tested algorithm

## Performance

| Image Size | Colors | Conversion Time | Output Quality |
|------------|--------|-----------------|----------------|
| 1920×1080  | 16     | ~2-3 seconds    | Good           |
| 1920×1080  | 32     | ~4-6 seconds    | Excellent      |
| 1920×1080  | 64     | ~8-12 seconds   | Maximum        |
| 3840×2160  | 16     | ~5-8 seconds    | Good           |

## Best Practices

1. **Use 16 colors** for quick iterations and testing
2. **Use 32 colors** for production-quality output
3. **Use 64+ colors** only for detailed artwork or photos
4. **Convert full screenshots** instead of small crops
5. **Use SVG clipping** for individual elements in animations

## Next Steps

After converting your images:

1. ✅ SVG files are in `/public/assets/`
2. ✅ Import them in your animations
3. ✅ Use SVG clipping paths for individual elements
4. ✅ Animate with Motion Canvas

## Support

- **Inkscape Docs**: https://inkscape.org/doc/
- **Issue Tracker**: Report issues with the integration
- **Community**: Inkscape has a large, helpful community

---

**Migration Complete!** 🎉

Your project now uses Inkscape for high-quality, cost-effective PNG to SVG conversion.
