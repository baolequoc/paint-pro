import { ref, Ref } from 'vue';
import { Canvas as FabricJSCanvas, Line, Polygon, PencilBrush, Rect, IText, Group } from 'fabric';
import usePan from '../usePan';

type ToolName = 'select' | 'brush' | 'rectangle' | 'text' | 'line' | 'arrow' | 'pan';

export default function useTools(
  canvasRef: Ref<FabricJSCanvas | null>,
  activeTool: Ref<string>,
  brushColor: Ref<string>,
  strokeWidth: Ref<number>,
  addObjectAndSetActive: (obj: any) => void
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

  // Rectangle drawing state
  let rectStartPoint: { x: number; y: number } | null = null;
  let currentRect: Rect | null = null;

  let panCleanup: (() => void) | null = null;

  function cleanupCurrentTool() {
    if (!canvasRef.value) return;
    const canvas = canvasRef.value;

    // Reset cursor
    canvas.defaultCursor = 'default';
    canvas.hoverCursor = 'move';

    // Re-enable object selection and interaction
    canvas.selection = true;
    canvas.forEachObject((obj) => {
      const newObj = { ...obj };
      newObj.selectable = true;
      newObj.evented = true;
      obj.set(newObj);
    });

    // Clean up pan mode if it was active
    if (panCleanup) {
      panCleanup();
      panCleanup = null;
    }

    // Clean up other tool states
    canvas.isDrawingMode = false;
    canvas.freeDrawingBrush = undefined;
    isDrawingLine.value = false;
    isDrawingArrow.value = false;
    lineStartPoint = null;
    currentLine = null;
    arrowStartPoint = null;
    arrowLine = null;
    arrowHead = null;
    rectStartPoint = null;
    currentRect = null;

    canvas.requestRenderAll();
  }

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
    // Remove line drawing event listeners if they exist
    canvasRef.value.off("mouse:down", startDrawingLine);
    canvasRef.value.off("mouse:move", drawLine);
    canvasRef.value.off("mouse:up", finishDrawingLine);
    isDrawingLine.value = false;
    setTool('select');
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

    canvasRef.value.off("mouse:down", startDrawingArrow);
    canvasRef.value.off("mouse:move", drawArrow);
    canvasRef.value.off("mouse:up", finishDrawingArrow);
    isDrawingArrow.value = false;
    setTool('select');
  }

  function setupPan() {
    if (!canvasRef.value) return;
    cleanupCurrentTool();
    const { setupPan, cleanupPan } = usePan(canvasRef);
    setupPan();
    panCleanup = cleanupPan;
  }

  function setupBrush() {
    if (!canvasRef.value) return;
    cleanupCurrentTool();
    canvasRef.value.isDrawingMode = true;
    canvasRef.value.freeDrawingBrush = new PencilBrush(canvasRef.value);
    canvasRef.value.freeDrawingBrush.width = strokeWidth.value;
    canvasRef.value.freeDrawingBrush.color = brushColor.value;
  }

  function createRectangle() {
    if (!canvasRef.value) return;
    cleanupCurrentTool();
    canvasRef.value.isDrawingMode = true;
    canvasRef.value.freeDrawingBrush = undefined;

    // Add event listeners for rectangle drawing
    canvasRef.value.on("mouse:down", startDrawingRectangle);
    canvasRef.value.on("mouse:move", drawRectangle);
    canvasRef.value.on("mouse:up", finishDrawingRectangle);
  }

  function startDrawingRectangle(o: any) {
    if (!canvasRef.value) return;
    const pointer = canvasRef.value.getPointer(o.e);
    rectStartPoint = { x: pointer.x, y: pointer.y };

    currentRect = new Rect({
      left: pointer.x,
      top: pointer.y,
      width: 0,
      height: 0,
      fill: "transparent",
      stroke: brushColor.value,
      strokeWidth: strokeWidth.value,
    });

    canvasRef.value.add(currentRect);
    canvasRef.value.requestRenderAll();
  }

  function drawRectangle(o: any) {
    if (!rectStartPoint || !currentRect || !canvasRef.value) return;

    const pointer = canvasRef.value.getPointer(o.e);
    const width = pointer.x - rectStartPoint.x;
    const height = pointer.y - rectStartPoint.y;

    currentRect.set({
      width: Math.abs(width),
      height: Math.abs(height),
      left: width < 0 ? pointer.x : rectStartPoint.x,
      top: height < 0 ? pointer.y : rectStartPoint.y
    });

    canvasRef.value.requestRenderAll();
  }

  function finishDrawingRectangle() {
    if (!currentRect || !canvasRef.value) return;

    // Make the rectangle selectable and add to history
    currentRect.set({
      selectable: true,
      evented: true
    });

    canvasRef.value.requestRenderAll();

    // Reset rectangle drawing state
    rectStartPoint = null;
    currentRect = null;

    // Remove event listeners
    canvasRef.value.off("mouse:down", startDrawingRectangle);
    canvasRef.value.off("mouse:move", drawRectangle);
    canvasRef.value.off("mouse:up", finishDrawingRectangle);

    setTool('select');
  }

  function createText() {
    if (!canvasRef.value) return;
    cleanupCurrentTool();
    canvasRef.value.isDrawingMode = false;
    const text = new IText("Edit me", {
      left: 100,
      top: 100,
      fontSize: 20
    });
    addObjectAndSetActive(text);

    setTool('select');
  }

  function selectTool() {
    if (!canvasRef.value) return;
    cleanupCurrentTool();
  }

  function setupLine() {
    if (!canvasRef.value) return;
    cleanupCurrentTool();
    canvasRef.value.isDrawingMode = true;
    canvasRef.value.freeDrawingBrush = undefined;
    isDrawingLine.value = true;
    canvasRef.value.on("mouse:down", startDrawingLine);
    canvasRef.value.on("mouse:move", drawLine);
    canvasRef.value.on("mouse:up", finishDrawingLine);
  }

  function setupArrow() {
    if (!canvasRef.value) return;
    cleanupCurrentTool();
    canvasRef.value.isDrawingMode = true;
    canvasRef.value.freeDrawingBrush = undefined;
    isDrawingArrow.value = true;
    canvasRef.value.on("mouse:down", startDrawingArrow);
    canvasRef.value.on("mouse:move", drawArrow);
    canvasRef.value.on("mouse:up", finishDrawingArrow);
  }

  const tools: Record<ToolName, () => void> = {
    select: selectTool,
    brush: setupBrush,
    rectangle: createRectangle,
    text: createText,
    line: setupLine,
    arrow: setupArrow,
    pan: setupPan
  };

  function setTool(toolName: ToolName) {
    activeTool.value = toolName;
    if (tools[toolName]) {
      tools[toolName]();
    }
  }

  return {
    isDrawingLine,
    isDrawingArrow,
    setTool,
    tools
  };
}
