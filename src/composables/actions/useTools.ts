import { ref, Ref } from 'vue';
import { Canvas as FabricJSCanvas, Line, Polygon, PencilBrush, Rect, IText, Group } from 'fabric';

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

  function createRectangle() {
    if (!canvasRef.value) return;
    canvasRef.value.isDrawingMode = false;
    const rect = new Rect({
      left: 100,
      top: 100,
      width: 100,
      height: 100,
      fill: "transparent",
      stroke: "black",
      strokeWidth: 2
    });
    addObjectAndSetActive(rect);
  }

  function createText() {
    if (!canvasRef.value) return;
    canvasRef.value.isDrawingMode = false;
    const text = new IText("Edit me", {
      left: 100,
      top: 100,
      fontSize: 20
    });
    addObjectAndSetActive(text);
  }

  function selectTool() {
    if (!canvasRef.value) return;
    canvasRef.value.isDrawingMode = false;
    // Remove line drawing event listeners if they exist
    if (isDrawingLine.value) {
      canvasRef.value.off("mouse:down", startDrawingLine);
      canvasRef.value.off("mouse:move", drawLine);
      canvasRef.value.off("mouse:up", finishDrawingLine);
      isDrawingLine.value = false;
    }
    // Remove arrow drawing event listeners if they exist
    if (isDrawingArrow.value) {
      canvasRef.value.off("mouse:down", startDrawingArrow);
      canvasRef.value.off("mouse:move", drawArrow);
      canvasRef.value.off("mouse:up", finishDrawingArrow);
      isDrawingArrow.value = false;
    }
  }

  function setupLine() {
    if (!canvasRef.value) return;
    canvasRef.value.isDrawingMode = true;
    canvasRef.value.freeDrawingBrush = undefined;
    isDrawingLine.value = true;
    canvasRef.value.on("mouse:down", startDrawingLine);
    canvasRef.value.on("mouse:move", drawLine);
    canvasRef.value.on("mouse:up", finishDrawingLine);
  }

  function setupArrow() {
    if (!canvasRef.value) return;
    canvasRef.value.isDrawingMode = true;
    canvasRef.value.freeDrawingBrush = undefined;
    isDrawingArrow.value = true;
    canvasRef.value.on("mouse:down", startDrawingArrow);
    canvasRef.value.on("mouse:move", drawArrow);
    canvasRef.value.on("mouse:up", finishDrawingArrow);
  }

  const tools = {
    select: selectTool,
    brush: setupBrush,
    rectangle: createRectangle,
    text: createText,
    line: setupLine,
    arrow: setupArrow
  };

  function setTool(toolName: string) {
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
