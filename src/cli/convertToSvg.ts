#!/usr/bin/env tsx
/**
 * CLI tool to convert PNG assets to SVG files using Inkscape
 * High-quality vectorization with professional bitmap tracing
 */

import { resolve } from 'path';
import { batchConvertAssets, convertPngToSvg } from '../logic/pngToSvgConverter';

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
🎨 PNG to SVG Converter (Inkscape-Powered)

Usage:
  npx tsx src/cli/convertToSvg.ts <command> [options]

Commands:
  batch <directory>           Convert all PNG files in directory
  single <input.png> [output.svg] [colors]   Convert a single PNG file

Examples:
  npx tsx src/cli/convertToSvg.ts batch public/assets
  npx tsx src/cli/convertToSvg.ts single assets/google.png output/google.svg
  npx tsx src/cli/convertToSvg.ts single assets/logo.png output/logo.svg 32

Features:
  ✓ Professional-grade Inkscape bitmap tracing
  ✓ Multi-color vectorization (up to 256 colors)
  ✓ High-quality output with smooth paths
  ✓ No LLM costs - uses local Inkscape engine
  ✓ Battle-tested open-source solution

Requirements:
  • Inkscape must be installed (brew install inkscape)
`);
    process.exit(0);
  }

  const command = args[0];

  try {
    switch (command) {
      case 'batch': {
        const directory = args[1] || 'public/assets';
        const fullPath = resolve(process.cwd(), directory);
        
        console.log(`\n🎬 Batch Converting PNG → SVG (Inkscape Mode)`);
        console.log(`📁 Directory: ${fullPath}\n`);
        
        const results = await batchConvertAssets(fullPath);
        
        console.log(`\n✅ Conversion Complete!`);
        console.log(`📊 Summary:`);
        console.log(`   • Total converted: ${results.size}`);
        console.log(`\n💡 High-quality SVG files ready for animation!`);
        break;
      }

      case 'single': {
        const inputPath = args[1];
        if (!inputPath) {
          console.error('❌ Error: Please provide input PNG file');
          process.exit(1);
        }

        const outputPath = args[2] || inputPath.replace(/\.png$/, '.svg');
        const colors = args[3] ? parseInt(args[3], 10) : 16;
        const fullInputPath = resolve(process.cwd(), inputPath);
        const fullOutputPath = resolve(process.cwd(), outputPath);

        console.log(`\n🎨 Converting: ${inputPath} → ${outputPath}`);
        
        const result = await convertPngToSvg(fullInputPath, fullOutputPath, {
          annotate: false,
          simplify: true,
          inkscapeOptions: {
            mode: 'color',
            colors: colors,
            smooth: 1,
            removeBackground: false,
          }
        });

        console.log(`\n✅ Conversion Complete!`);
        console.log(`📊 Result:`);
        console.log(`   • Size: ${result.width}x${result.height}`);
        console.log(`   • Traced with Inkscape (${colors} colors)`);
        console.log(`\n💡 Your SVG is ready for high-quality animations!`);
        break;
      }

      default:
        console.error(`❌ Unknown command: ${command}`);
        console.log(`Run without arguments to see usage.`);
        process.exit(1);
    }
  } catch (error) {
    console.error(`\n❌ Error:`, error);
    process.exit(1);
  }
}

main();
