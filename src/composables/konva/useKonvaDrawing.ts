import { ref, type Ref } from 'vue';
import Konva from 'konva';
import type { KonvaStage, KonvaLayer, DrawingConfig, Point } from '@/types/konva';

export function useKonvaDrawing(
  stage: Ref<KonvaStage | null>,
  mainLayer: Ref<KonvaLayer | null>,
  getPointerPosition?: () => { x: number; y: number } | null
) {
  const isDrawing = ref(false);
  const currentLine = ref<Konva.Line | null>(null);
  const brushConfig = ref<DrawingConfig>({
    stroke: '#000000',
    strokeWidth: 2,
    fill: undefined,
    opacity: 1,
    dash: undefined,
    lineCap: 'round',
  });

  // Brush/Pencil Tool
  const startBrushDrawing = () => {
    if (!stage.value || !mainLayer.value) return;

    const pos = getPointerPosition ? getPointerPosition() : stage.value.getPointerPosition();
    if (!pos) return;

    isDrawing.value = true;
    
    const line = new Konva.Line({
      stroke: brushConfig.value.stroke,
      strokeWidth: brushConfig.value.strokeWidth,
      opacity: brushConfig.value.opacity || 1,
      globalCompositeOperation: 'source-over',
      lineCap: brushConfig.value.lineCap || 'round',
      lineJoin: 'round',
      dash: brushConfig.value.dash,
      points: [pos.x, pos.y, pos.x, pos.y],
      tension: 0.5,
      name: 'selectable',
      draggable: false,
    });

    mainLayer.value.add(line);
    currentLine.value = line;
  };

  const continueBrushDrawing = () => {
    if (!isDrawing.value || !stage.value || !currentLine.value) return;

    const pos = getPointerPosition ? getPointerPosition() : stage.value.getPointerPosition();
    if (!pos) return;

    const points = currentLine.value.points();
    const newPoints = points.concat([pos.x, pos.y]);
    currentLine.value.points(newPoints);
    mainLayer.value?.batchDraw();
  };

  const endBrushDrawing = () => {
    isDrawing.value = false;
    currentLine.value = null;
  };

  // Line Tool
  const drawLine = (start: Point, end: Point, config?: Partial<DrawingConfig>) => {
    if (!mainLayer.value) return null;

    const line = new Konva.Line({
      points: [start.x, start.y, end.x, end.y],
      stroke: config?.stroke || brushConfig.value.stroke,
      strokeWidth: config?.strokeWidth || brushConfig.value.strokeWidth,
      opacity: config?.opacity || brushConfig.value.opacity || 1,
      lineCap: config?.lineCap || brushConfig.value.lineCap || 'round',
      dash: config?.dash || brushConfig.value.dash,
      name: 'selectable',
      draggable: false,
    });

    mainLayer.value.add(line);
    mainLayer.value.batchDraw();
    return line;
  };

  // Arrow Tool
  const drawArrow = (start: Point, end: Point, config?: Partial<DrawingConfig>) => {
    if (!mainLayer.value) return null;

    const arrow = new Konva.Arrow({
      points: [start.x, start.y, end.x, end.y],
      stroke: config?.stroke || brushConfig.value.stroke,
      strokeWidth: config?.strokeWidth || brushConfig.value.strokeWidth,
      fill: config?.stroke || brushConfig.value.stroke,
      opacity: config?.opacity || brushConfig.value.opacity || 1,
      pointerLength: 10,
      pointerWidth: 10,
      dash: config?.dash || brushConfig.value.dash,
      name: 'selectable',
      draggable: false,
    });

    mainLayer.value.add(arrow);
    mainLayer.value.batchDraw();
    return arrow;
  };

  // Rectangle Tool
  const drawRectangle = (x: number, y: number, width: number, height: number, config?: Partial<DrawingConfig>) => {
    if (!mainLayer.value) return null;

    const rect = new Konva.Rect({
      x,
      y,
      width: Math.abs(width),
      height: Math.abs(height),
      stroke: config?.stroke || brushConfig.value.stroke,
      strokeWidth: config?.strokeWidth || brushConfig.value.strokeWidth,
      fill: config?.fill !== undefined ? config.fill : (brushConfig.value.fill || 'transparent'),
      opacity: config?.opacity || brushConfig.value.opacity || 1,
      dash: config?.dash || brushConfig.value.dash,
      name: 'selectable',
      draggable: false,
    });

    mainLayer.value.add(rect);
    mainLayer.value.batchDraw();
    return rect;
  };

  // Circle Tool
  const drawCircle = (x: number, y: number, radius: number, config?: Partial<DrawingConfig>) => {
    if (!mainLayer.value) return null;

    const circle = new Konva.Circle({
      x,
      y,
      radius,
      stroke: config?.stroke || brushConfig.value.stroke,
      strokeWidth: config?.strokeWidth || brushConfig.value.strokeWidth,
      fill: config?.fill !== undefined ? config.fill : (brushConfig.value.fill || 'transparent'),
      opacity: config?.opacity || brushConfig.value.opacity || 1,
      dash: config?.dash || brushConfig.value.dash,
      name: 'selectable',
      draggable: false,
    });

    mainLayer.value.add(circle);
    mainLayer.value.batchDraw();
    return circle;
  };

  // Text Tool
  const addText = (x: number, y: number, text: string, config?: Partial<{
    fontSize: number;
    fontFamily: string;
    fill: string;
  }>) => {
    if (!mainLayer.value) return null;

    const textNode = new Konva.Text({
      x,
      y,
      text,
      fontSize: config?.fontSize || 20,
      fontFamily: config?.fontFamily || 'Arial',
      fill: config?.fill || brushConfig.value.stroke,
      opacity: brushConfig.value.opacity || 1,
      name: 'selectable',
      draggable: false,
    });

    // Add double-click listener directly to the text node
    textNode.on('dblclick dbltap', () => {
      console.log('Text node double-clicked directly');
      enableTextEditing(textNode);
    });

    mainLayer.value.add(textNode);
    mainLayer.value.batchDraw();
    return textNode;
  };

  // Edit text on double click
  const enableTextEditing = (textNode: Konva.Text) => {
    console.log('enableTextEditing called for text:', textNode.text());
    
    if (!stage.value) return;
    
    // Get stage container and transformations
    const container = stage.value.container();
    const stageBox = container.getBoundingClientRect();
    
    // Get the absolute transform of the text node
    const absTransform = textNode.getAbsoluteTransform();
    const pos = absTransform.point({ x: 0, y: 0 });
    
    // Get stage transform
    const stageScale = stage.value.scaleX() || 1;
    const stagePos = stage.value.position();
    
    // Calculate the actual position on screen
    const areaPosition = {
      x: stageBox.left + pos.x * stageScale + stagePos.x,
      y: stageBox.top + pos.y * stageScale + stagePos.y
    };
    
    // Check if textarea already exists and remove it
    const existingWrapper = document.getElementById('konva-text-editor-wrapper');
    if (existingWrapper) {
      existingWrapper.remove();
    }

    // Create wrapper div for better positioning
    const wrapper = document.createElement('div');
    wrapper.id = 'konva-text-editor-wrapper';
    wrapper.style.position = 'fixed';
    wrapper.style.left = `${areaPosition.x}px`;
    wrapper.style.top = `${areaPosition.y}px`;
    wrapper.style.zIndex = '10000';
    wrapper.style.transform = `scale(${stageScale})`;
    wrapper.style.transformOrigin = 'top left';
    document.body.appendChild(wrapper);

    // Create textarea
    const textarea = document.createElement('textarea');
    textarea.id = 'konva-text-editor';
    textarea.value = textNode.text();
    
    // Style to match the text node
    textarea.style.width = `${Math.max(200, textNode.width())}px`;
    textarea.style.minHeight = `${Math.max(textNode.fontSize() * 1.5, 30)}px`;
    textarea.style.fontSize = `${textNode.fontSize()}px`;
    textarea.style.fontFamily = textNode.fontFamily();
    textarea.style.fontWeight = 'normal'; // fontWeight is not a method in Konva.Text
    textarea.style.lineHeight = String(textNode.lineHeight());
    textarea.style.color = String(textNode.fill() || '#000000');
    textarea.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
    textarea.style.border = '2px solid #0066ff';
    textarea.style.borderRadius = '4px';
    textarea.style.padding = '4px 6px';
    textarea.style.margin = '0';
    textarea.style.outline = 'none';
    textarea.style.resize = 'both';
    textarea.style.overflow = 'auto';
    textarea.style.boxShadow = '0 2px 12px rgba(0,0,0,0.15)';
    textarea.style.whiteSpace = 'pre-wrap';
    textarea.style.overflowWrap = 'break-word'; // Use overflowWrap instead of deprecated wordWrap
    
    wrapper.appendChild(textarea);
    
    // Auto-resize textarea as user types
    const autoResize = () => {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    };
    
    textarea.addEventListener('input', autoResize);
    autoResize();
    
    // Hide the original text
    textNode.hide();
    mainLayer.value?.batchDraw();
    
    // Focus and select text
    setTimeout(() => {
      textarea.focus();
      textarea.select();
    }, 10);

    const cleanup = () => {
      if (wrapper.parentNode) {
        wrapper.parentNode.removeChild(wrapper);
      }
      textNode.show();
      mainLayer.value?.batchDraw();
    };

    const saveText = () => {
      const newText = textarea.value.trim();
      if (newText) {
        textNode.text(newText);
        // Update text node size based on new content
        textNode.width(undefined); // Auto-width
        textNode.height(undefined); // Auto-height
      }
      cleanup();
    };

    // Handle keyboard events
    textarea.addEventListener('keydown', (e) => {
      // Save on Enter (allow Shift+Enter for new lines)
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        saveText();
      }
      // Cancel on Escape
      if (e.key === 'Escape') {
        e.preventDefault();
        cleanup();
      }
      // Stop propagation to prevent triggering canvas shortcuts
      e.stopPropagation();
    });

    // Save on blur (clicking outside)
    textarea.addEventListener('blur', () => {
      // Small delay to prevent immediate blur when clicking
      setTimeout(saveText, 100);
    });
  };

  const setBrushColor = (color: string) => {
    brushConfig.value.stroke = color;
  };

  const setBrushSize = (size: number) => {
    brushConfig.value.strokeWidth = size;
  };

  const setFillColor = (color: string) => {
    brushConfig.value.fill = color;
  };

  const setOpacity = (opacity: number) => {
    brushConfig.value.opacity = opacity;
  };

  const setStrokeStyle = (style: 'solid' | 'dashed' | 'dotted') => {
    switch (style) {
      case 'dashed':
        brushConfig.value.dash = [10, 5];
        break;
      case 'dotted':
        brushConfig.value.dash = [2, 4];
        break;
      default:
        brushConfig.value.dash = undefined;
    }
  };

  const setLineCap = (cap: 'butt' | 'round' | 'square') => {
    brushConfig.value.lineCap = cap;
  };

  return {
    isDrawing,
    brushConfig,
    startBrushDrawing,
    continueBrushDrawing,
    endBrushDrawing,
    drawLine,
    drawArrow,
    drawRectangle,
    drawCircle,
    addText,
    enableTextEditing,
    setBrushColor,
    setBrushSize,
    setFillColor,
    setOpacity,
    setStrokeStyle,
    setLineCap,
  };
}