import { ref, type Ref } from 'vue';
import Konva from 'konva';
import type { KonvaStage, KonvaLayer, DrawingConfig, Point } from '@/types/konva';

export function useKonvaDrawing(
  stage: Ref<KonvaStage | null>,
  mainLayer: Ref<KonvaLayer | null>
) {
  const isDrawing = ref(false);
  const currentLine = ref<Konva.Line | null>(null);
  const brushConfig = ref<DrawingConfig>({
    stroke: '#000000',
    strokeWidth: 2,
  });

  // Brush/Pencil Tool
  const startBrushDrawing = () => {
    if (!stage.value || !mainLayer.value) return;

    const pos = stage.value.getPointerPosition();
    if (!pos) return;

    isDrawing.value = true;
    
    const line = new Konva.Line({
      stroke: brushConfig.value.stroke,
      strokeWidth: brushConfig.value.strokeWidth,
      globalCompositeOperation: 'source-over',
      lineCap: 'round',
      lineJoin: 'round',
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

    const pos = stage.value.getPointerPosition();
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
      lineCap: 'round',
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
      pointerLength: 10,
      pointerWidth: 10,
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
      fill: config?.fill || 'transparent',
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
      fill: config?.fill || 'transparent',
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
      name: 'selectable',
      draggable: false,
    });

    mainLayer.value.add(textNode);
    mainLayer.value.batchDraw();
    return textNode;
  };

  // Edit text on double click
  const enableTextEditing = (textNode: Konva.Text) => {
    const handleEdit = () => {
      // Hide the original text while editing
      textNode.hide();
      mainLayer.value?.batchDraw();
      
      // Create textarea for editing
      const textPosition = textNode.absolutePosition();
      const stageBox = stage.value?.container().getBoundingClientRect();
      const scale = stage.value?.scaleX() || 1;
      
      if (!stageBox) return;

      // Check if textarea already exists and remove it
      const existingTextarea = document.getElementById('konva-text-editor');
      if (existingTextarea) {
        existingTextarea.remove();
      }

      const textarea = document.createElement('textarea');
      textarea.id = 'konva-text-editor';
      document.body.appendChild(textarea);

      textarea.value = textNode.text();
      textarea.style.position = 'absolute';
      textarea.style.top = `${stageBox.top + textPosition.y * scale}px`;
      textarea.style.left = `${stageBox.left + textPosition.x * scale}px`;
      textarea.style.width = `${Math.max(100, textNode.width() * scale)}px`;
      textarea.style.height = `${Math.max(30, textNode.height() * scale)}px`;
      textarea.style.fontSize = `${textNode.fontSize() * scale}px`;
      textarea.style.fontFamily = textNode.fontFamily();
      textarea.style.color = String(textNode.fill() || '#000000');
      textarea.style.border = '1px solid #007bff';
      textarea.style.padding = '2px';
      textarea.style.margin = '0px';
      textarea.style.overflow = 'hidden';
      textarea.style.background = 'white';
      textarea.style.outline = 'none';
      textarea.style.resize = 'none';
      textarea.style.zIndex = '10000';
      textarea.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';

      textarea.focus();
      textarea.select();

      const removeTextarea = () => {
        if (textarea.parentNode) {
          textarea.parentNode.removeChild(textarea);
        }
        textNode.show();
        mainLayer.value?.batchDraw();
      };

      const saveText = () => {
        textNode.text(textarea.value);
        removeTextarea();
      };

      textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          saveText();
        }
        if (e.key === 'Escape') {
          removeTextarea();
        }
      });

      textarea.addEventListener('blur', saveText);
    };

    // Remove previous listeners to avoid duplicates
    textNode.off('dblclick dbltap');
    textNode.on('dblclick dbltap', handleEdit);
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
  };
}