import { Rect, Txt, Circle, Icon, Node } from '@motion-canvas/2d';
import { initial, signal, SignalValue } from '@motion-canvas/core';
import { UIElement } from '../core/schema';

export interface UIElementProps {
  element: UIElement;
  colorScheme: {
    primary: string;
    background: string;
    accent: string;
    theme: 'light' | 'dark';
  };
  canvasX: number;
  canvasY: number;
}

/**
 * Renders a UI button as a canvas element
 */
export function UIButton(props: UIElementProps) {
  const { element, colorScheme, canvasX, canvasY } = props;
  const { width, height } = element.coordinates;
  
  // Extract button text from description (e.g., "Google Search" from "Google Search button")
  const buttonText = element.description.replace(/\s+(button|btn)$/i, '').trim();
  
  return (
    <Rect
      key={element.id}
      x={canvasX}
      y={canvasY}
      width={width}
      height={height}
      fill={colorScheme.primary}
      radius={8}
      shadowColor="rgba(0,0,0,0.2)"
      shadowBlur={4}
      shadowOffsetY={2}
    >
      <Txt
        text={buttonText}
        fill="#FFFFFF"
        fontSize={Math.min(16, height * 0.5)}
        fontFamily="'Segoe UI', Arial, sans-serif"
        fontWeight={600}
      />
    </Rect>
  );
}

/**
 * Renders a UI input field as a canvas element
 */
export function UIInput(props: UIElementProps) {
  const { element, colorScheme, canvasX, canvasY } = props;
  const { width, height } = element.coordinates;
  
  const borderColor = colorScheme.theme === 'dark' ? '#666666' : '#CCCCCC';
  const bgColor = colorScheme.theme === 'dark' ? '#2C2C2C' : '#FFFFFF';
  
  return (
    <Rect
      key={element.id}
      x={canvasX}
      y={canvasY}
      width={width}
      height={height}
      fill={bgColor}
      stroke={borderColor}
      lineWidth={2}
      radius={4}
    />
  );
}

/**
 * Renders a UI link as a canvas element
 */
export function UILink(props: UIElementProps) {
  const { element, colorScheme, canvasX, canvasY } = props;
  const { height } = element.coordinates;
  
  const linkText = element.description.replace(/\s+link$/i, '').trim();
  
  return (
    <Txt
      key={element.id}
      x={canvasX}
      y={canvasY}
      text={linkText}
      fill={colorScheme.primary}
      fontSize={Math.min(14, height * 0.7)}
      fontFamily="'Segoe UI', Arial, sans-serif"
    />
  );
}

/**
 * Renders a UI icon as a canvas element
 */
export function UIIconElement(props: UIElementProps) {
  const { element, colorScheme, canvasX, canvasY } = props;
  const { width, height } = element.coordinates;
  
  const size = Math.min(width, height);
  const iconColor = colorScheme.theme === 'dark' ? '#AAAAAA' : '#666666';
  
  return (
    <Circle
      key={element.id}
      x={canvasX}
      y={canvasY}
      size={size}
      fill={iconColor}
      opacity={0.8}
    />
  );
}

/**
 * Renders a UI text element as a canvas element
 */
export function UIText(props: UIElementProps) {
  const { element, colorScheme, canvasX, canvasY } = props;
  const { height } = element.coordinates;
  
  return (
    <Txt
      key={element.id}
      x={canvasX}
      y={canvasY}
      text={element.description}
      fill={colorScheme.theme === 'dark' ? '#FFFFFF' : '#000000'}
      fontSize={Math.min(16, height * 0.7)}
      fontFamily="'Segoe UI', Arial, sans-serif"
    />
  );
}

/**
 * Factory function to create the appropriate UI element based on type
 */
export function createUIElement(props: UIElementProps) {
  const { element } = props;
  
  switch (element.type) {
    case 'button':
      return <UIButton {...props} />;
    case 'input':
      return <UIInput {...props} />;
    case 'link':
      return <UILink {...props} />;
    case 'image':
      return <UIIconElement {...props} />;
    case 'text':
      return <UIText {...props} />;
    default:
      return <UIText {...props} />;
  }
}
