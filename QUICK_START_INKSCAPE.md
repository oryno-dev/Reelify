# Quick Start: Inkscape PNG to SVG Conversion

## 🚀 One-Time Setup

```bash
# Install Inkscape
brew install inkscape          # macOS
sudo apt-get install inkscape  # Ubuntu/Debian

# Verify installation
inkscape --version
```

## 💡 Basic Usage

```bash
# Convert a single PNG to SVG
npm run convert:svg single input.png output.svg

# Convert with more colors (better quality)
npm run convert:svg single input.png output.svg 32

# Batch convert all PNGs in a directory
npm run convert:batch
```

## 📊 Quality Levels

| Colors | Use Case | Speed | File Size |
|--------|----------|-------|-----------|
| 8      | Quick test | ⚡ Fast | Small |
| 16     | Default | ⚡ Fast | Medium |
| 32     | Production | 🐢 Moderate | Medium |
| 64+    | High detail | 🐌 Slow | Large |

## 🎨 Examples

```bash
# Logo/icon (high quality)
npm run convert:svg single logo.png logo.svg 32

# Screenshot (balanced)
npm run convert:svg single screenshot.png screenshot.svg 16

# Photo (maximum detail)
npm run convert:svg single photo.png photo.svg 64
```

## 📖 More Info

- **Full guide**: See `INKSCAPE_SETUP.md`
- **Migration details**: See `MIGRATION_SUMMARY.md`
- **Troubleshooting**: See `INKSCAPE_SETUP.md` → Troubleshooting section

## ✅ Benefits

✅ **$0 cost** (no LLM API fees)  
✅ **Professional quality** (battle-tested)  
✅ **256 colors** supported  
✅ **Works offline**  
✅ **Faster** than AI-based conversion

---

**Ready to convert!** 🎉
