import { Node, Path, Circle } from '@motion-canvas/2d';
import { SignalValue, initial, signal } from '@motion-canvas/core';

export interface CursorProps {
  x?: SignalValue<number>;
  y?: SignalValue<number>;
  scale?: SignalValue<number>;
  opacity?: SignalValue<number>;
  color?: SignalValue<string>;
}

/**
 * Realistic cursor component that looks like an actual mouse pointer
 */
export class Cursor extends Node {
  @initial('#000000')
  @signal()
  public declare readonly color: SignalValue<string>;

  public constructor(props?: CursorProps) {
    super(props);
  }

  protected override draw(context: CanvasRenderingContext2D) {
    // Draw a realistic cursor shape using Path2D
    // Standard cursor: arrow pointer
    context.save();
    
    const cursorPath = new Path2D();
    
    // Cursor outline (black)
    cursorPath.moveTo(0, 0);
    cursorPath.lineTo(0, 20);
    cursorPath.lineTo(5, 16);
    cursorPath.lineTo(8, 24);
    cursorPath.lineTo(10, 23);
    cursorPath.lineTo(7, 15);
    cursorPath.lineTo(13, 15);
    cursorPath.closePath();
    
    // Fill white interior
    context.fillStyle = '#FFFFFF';
    context.fill(cursorPath);
    
    // Black outline
    context.strokeStyle = this.color() as string;
    context.lineWidth = 1.5;
    context.stroke(cursorPath);
    
    context.restore();
  }
}
