import { ref, Ref } from 'vue';
import { Canvas as FabricJSCanvas, Line, Polygon, PencilBrush, Group } from 'fabric';

export default function useDrawing(
  canvasRef: Ref<FabricJSCanvas | null>,
  brushColor: Ref<string>,
  strokeWidth: Ref<number>
) {
  // Line drawing state
  const isDrawingLine = ref(false);
  let lineStartPoint: { x: number; y: number } | null = null;
  let currentLine: Line | null = null;

  // Arrow drawing state
  const isDrawingArrow = ref(false);
  let arrowStartPoint: { x: number; y: number } | null = null;
  let arrowLine: Line | null = null;
  let arrowHead: Polygon | null = null;

  function startDrawingLine(o: any) {
    if (!canvasRef.value) return;
    canvasRef.value.isDrawingMode = true;
    const pointer = canvasRef.value.getPointer(o.e);
    lineStartPoint = { x: pointer.x, y: pointer.y };

    currentLine = new Line([pointer.x, pointer.y, pointer.x, pointer.y], {
      stroke: brushColor.value,
      strokeWidth: strokeWidth.value,
      selectable: true,
      evented: true
    });

    canvasRef.value.add(currentLine);
    canvasRef.value.requestRenderAll();
  }

  function drawLine(o: any) {
    if (!isDrawingLine.value || !lineStartPoint || !canvasRef.value || !currentLine) return;

    const pointer = canvasRef.value.getPointer(o.e);

    // Update line end point
    currentLine.set({
      x2: pointer.x,
      y2: pointer.y
    });

    canvasRef.value.requestRenderAll();
  }

  function finishDrawingLine() {
    if (!isDrawingLine.value || !currentLine || !canvasRef.value) return;

    // Make the line selectable and save to history
    currentLine.set({
      selectable: true,
      evented: true
    });

    canvasRef.value.requestRenderAll();

    // Reset the line drawing state
    lineStartPoint = null;
    currentLine = null;
  }

  function startDrawingArrow(o: any) {
    if (!canvasRef.value) return;
    canvasRef.value.isDrawingMode = true;
    const pointer = canvasRef.value.getPointer(o.e);
    arrowStartPoint = { x: pointer.x, y: pointer.y };

    arrowLine = new Line([pointer.x, pointer.y, pointer.x, pointer.y], {
      stroke: brushColor.value,
      strokeWidth: strokeWidth.value,
      selectable: true,
      evented: true
    });

    canvasRef.value.add(arrowLine);
    canvasRef.value.requestRenderAll();
  }

  function drawArrow(o: any) {
    if (!isDrawingArrow.value || !arrowStartPoint || !canvasRef.value || !arrowLine) return;

    const pointer = canvasRef.value.getPointer(o.e);

    // Update line end point
    arrowLine.set({
      x2: pointer.x,
      y2: pointer.y
    });

    if (!arrowHead) {
      // Create arrow head at the end of the line
      arrowHead = new Polygon([
        { x: 0, y: 0 },
        { x: -10, y: -5 },
        { x: -10, y: 5 }
      ], {
        stroke: brushColor.value,
        strokeWidth: strokeWidth.value,
        fill: brushColor.value,
        originX: 'center',
        originY: 'center'
      });
      canvasRef.value.add(arrowHead);
    }

    // Calculate angle between start and end points
    const angle = Math.atan2(pointer.y - arrowStartPoint.y, pointer.x - arrowStartPoint.x);
    
    // Position arrow head at the end of the line
    arrowHead.set({
      left: pointer.x,
      top: pointer.y,
      angle: (angle * 180) / Math.PI // Convert to degrees
    });

    canvasRef.value.requestRenderAll();
  }

  function finishDrawingArrow() {
    if (!isDrawingArrow.value || !arrowStartPoint || !canvasRef.value || !arrowLine || !arrowHead) return;

    arrowLine.set({
      selectable: true,
      evented: true,
    });

    arrowHead.set({
      selectable: true,
      evented: true,
    });

    const arrowGroup = new Group([arrowLine, arrowHead]);
    canvasRef.value.add(arrowGroup);
    canvasRef.value.remove(arrowLine);
    canvasRef.value.remove(arrowHead);
    canvasRef.value.setActiveObject(arrowGroup);

    canvasRef.value.requestRenderAll();

    // Reset the arrow drawing state
    arrowStartPoint = null;
    arrowLine = null;
    arrowHead = null;
  }

  function setupBrush() {
    if (!canvasRef.value) return;
    canvasRef.value.isDrawingMode = true;
    canvasRef.value.freeDrawingBrush = new PencilBrush(canvasRef.value);
    canvasRef.value.freeDrawingBrush.width = strokeWidth.value;
    canvasRef.value.freeDrawingBrush.color = brushColor.value;
  }

  return {
    isDrawingLine,
    isDrawingArrow,
    startDrawingLine,
    drawLine,
    finishDrawingLine,
    startDrawingArrow,
    drawArrow,
    finishDrawingArrow,
    setupBrush
  };
} 