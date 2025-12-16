import { Rect, Txt, Circle, Node, Path } from '@motion-canvas/2d';
import { UIElement, Styling, Content } from '../core/schema';
import { createRef } from '@motion-canvas/core';

export interface EnhancedUIElementProps {
  element: UIElement;
  colorScheme: {
    primary: string;
    background: string;
    accent: string;
    theme: 'light' | 'dark';
  };
}

/**
 * Helper to convert top-left coordinates to MotionCanvas center coordinates
 */
function toCanvasCoords(x: number, y: number, width: number, height: number) {
  return {
    x: x + width / 2 - 960,
    y: y + height / 2 - 540,
  };
}

/**
 * Renders a UI button with full styling
 */
export function EnhancedButton(props: EnhancedUIElementProps) {
  const { element, colorScheme } = props;
  const { x, y, width, height } = element.coordinates;
  const styling = element.styling || {};
  const content = element.content || {};
  
  const centerPos = toCanvasCoords(x, y, width, height);
  const buttonText = content.text || element.description.replace(/\s+(button|btn)$/i, '').trim();
  
  return (
    <Rect
      key={element.id}
      x={centerPos.x}
      y={centerPos.y}
      width={width}
      height={height}
      fill={styling.backgroundColor || colorScheme.primary}
      radius={styling.borderRadius || 8}
      stroke={styling.borderColor}
      lineWidth={styling.borderWidth || 0}
      shadowColor="rgba(0,0,0,0.2)"
      shadowBlur={4}
      shadowOffsetY={2}
      zIndex={element.zIndex || 1}
    >
      <Txt
        text={buttonText}
        fill={styling.textColor || '#FFFFFF'}
        fontSize={styling.fontSize || Math.min(16, height * 0.5)}
        fontFamily="'Segoe UI', Arial, sans-serif"
        fontWeight={styling.fontWeight === 'bold' ? 700 : 400}
      />
    </Rect>
  );
}

/**
 * Renders a UI input field with full styling
 */
export function EnhancedInput(props: EnhancedUIElementProps) {
  const { element, colorScheme } = props;
  const { x, y, width, height } = element.coordinates;
  const styling = element.styling || {};
  const content = element.content || {};
  
  const centerPos = toCanvasCoords(x, y, width, height);
  const borderColor = styling.borderColor || (colorScheme.theme === 'dark' ? '#666666' : '#CCCCCC');
  const bgColor = styling.backgroundColor || (colorScheme.theme === 'dark' ? '#2C2C2C' : '#FFFFFF');
  
  return (
    <Rect
      key={element.id}
      x={centerPos.x}
      y={centerPos.y}
      width={width}
      height={height}
      fill={bgColor}
      stroke={borderColor}
      lineWidth={styling.borderWidth || 2}
      radius={styling.borderRadius || 4}
      zIndex={element.zIndex || 1}
    >
      {/* Placeholder text if provided */}
      {content.text && (
        <Txt
          text={content.text}
          fill={colorScheme.theme === 'dark' ? '#666666' : '#999999'}
          fontSize={styling.fontSize || Math.min(14, height * 0.5)}
          fontFamily="'Segoe UI', Arial, sans-serif"
          opacity={0.6}
        />
      )}
    </Rect>
  );
}

/**
 * Renders a UI link with full styling
 */
export function EnhancedLink(props: EnhancedUIElementProps) {
  const { element, colorScheme } = props;
  const { x, y, width, height } = element.coordinates;
  const styling = element.styling || {};
  const content = element.content || {};
  
  const centerPos = toCanvasCoords(x, y, width, height);
  const linkText = content.text || element.description.replace(/\s+link$/i, '').trim();
  
  return (
    <Txt
      key={element.id}
      x={centerPos.x}
      y={centerPos.y}
      text={linkText}
      fill={styling.textColor || colorScheme.primary}
      fontSize={styling.fontSize || Math.min(14, height * 0.7)}
      fontFamily="'Segoe UI', Arial, sans-serif"
      fontWeight={styling.fontWeight === 'bold' ? 700 : 400}
      zIndex={element.zIndex || 1}
    />
  );
}

/**
 * Renders a UI icon with styling
 */
export function EnhancedIcon(props: EnhancedUIElementProps) {
  const { element, colorScheme } = props;
  const { x, y, width, height } = element.coordinates;
  const styling = element.styling || {};
  
  const centerPos = toCanvasCoords(x, y, width, height);
  const size = Math.min(width, height);
  const iconColor = styling.textColor || (colorScheme.theme === 'dark' ? '#AAAAAA' : '#666666');
  
  return (
    <Circle
      key={element.id}
      x={centerPos.x}
      y={centerPos.y}
      size={size}
      fill={styling.backgroundColor || iconColor}
      opacity={0.8}
      zIndex={element.zIndex || 1}
    />
  );
}

/**
 * Renders a UI logo (placeholder or SVG if available)
 */
export function EnhancedLogo(props: EnhancedUIElementProps) {
  const { element, colorScheme } = props;
  const { x, y, width, height } = element.coordinates;
  const content = element.content || {};
  
  const centerPos = toCanvasCoords(x, y, width, height);
  
  // If SVG description provided, render a placeholder for now
  // TODO: Implement SVG path rendering
  return (
    <Rect
      key={element.id}
      x={centerPos.x}
      y={centerPos.y}
      width={width}
      height={height}
      fill={colorScheme.primary}
      opacity={0.3}
      radius={4}
      zIndex={element.zIndex || 1}
    >
      <Txt
        text={content.text || "LOGO"}
        fill={colorScheme.theme === 'dark' ? '#FFFFFF' : '#000000'}
        fontSize={Math.min(20, height * 0.6)}
        fontFamily="'Segoe UI', Arial, sans-serif"
        fontWeight={700}
      />
    </Rect>
  );
}

/**
 * Renders a UI text element with full styling
 */
export function EnhancedText(props: EnhancedUIElementProps) {
  const { element, colorScheme } = props;
  const { x, y, width, height } = element.coordinates;
  const styling = element.styling || {};
  const content = element.content || {};
  
  const centerPos = toCanvasCoords(x, y, width, height);
  const textContent = content.text || element.description;
  
  return (
    <Txt
      key={element.id}
      x={centerPos.x}
      y={centerPos.y}
      text={textContent}
      fill={styling.textColor || (colorScheme.theme === 'dark' ? '#FFFFFF' : '#000000')}
      fontSize={styling.fontSize || Math.min(16, height * 0.7)}
      fontFamily="'Segoe UI', Arial, sans-serif"
      fontWeight={styling.fontWeight === 'bold' ? 700 : 400}
      zIndex={element.zIndex || 1}
    />
  );
}

/**
 * Renders a container element
 */
export function EnhancedContainer(props: EnhancedUIElementProps) {
  const { element } = props;
  const { x, y, width, height } = element.coordinates;
  const styling = element.styling || {};
  
  const centerPos = toCanvasCoords(x, y, width, height);
  
  return (
    <Rect
      key={element.id}
      x={centerPos.x}
      y={centerPos.y}
      width={width}
      height={height}
      fill={styling.backgroundColor || null}
      stroke={styling.borderColor}
      lineWidth={styling.borderWidth || 0}
      radius={styling.borderRadius || 0}
      zIndex={element.zIndex || 0}
    />
  );
}

/**
 * Factory function to create the appropriate enhanced UI element
 */
export function createEnhancedUIElement(props: EnhancedUIElementProps) {
  const { element } = props;
  
  switch (element.type) {
    case 'button':
      return <EnhancedButton {...props} />;
    case 'input':
      return <EnhancedInput {...props} />;
    case 'link':
      return <EnhancedLink {...props} />;
    case 'icon':
      return <EnhancedIcon {...props} />;
    case 'logo':
      return <EnhancedLogo {...props} />;
    case 'image':
      return <EnhancedIcon {...props} />;
    case 'container':
      return <EnhancedContainer {...props} />;
    case 'text':
      return <EnhancedText {...props} />;
    default:
      return <EnhancedText {...props} />;
  }
}

/**
 * Helper to get the actual rendered position of an element for cursor targeting
 */
export function getElementCanvasPosition(element: UIElement) {
  const { x, y, width, height } = element.coordinates;
  return toCanvasCoords(x, y, width, height);
}
