import { Ref, ref, watch } from 'vue';
import { ActiveSelection, Canvas as FabricJSCanvas, FabricObject, FabricObjectProps, ObjectEvents, SerializedObjectProps, Point } from 'fabric';

export default function useCanvas(canvasRef: Ref<FabricJSCanvas | null>, canvasHistory: any) {

  function addObjectAndSetActive(obj: FabricObject<Partial<FabricObjectProps>, SerializedObjectProps, ObjectEvents>) {
    if (!canvasRef.value) return;
    canvasRef.value.add(obj);
    canvasRef.value.setActiveObject(obj);
    canvasRef.value.requestRenderAll();
    canvasHistory?.triggerSave();
  }

  function removeCanvasObjects(
    objects: FabricObject<Partial<FabricObjectProps>, SerializedObjectProps, ObjectEvents>[]
  ) {
    if (!canvasRef.value) return;
    objects.forEach((obj) => {
      canvasRef.value?.remove(obj);
    });
  }

  function clearCanvas() {
    if (!canvasRef.value) return;
    canvasRef.value.clear();
    canvasRef.value.backgroundColor = "#ffffff";
    canvasRef.value.requestRenderAll();
  }

  function selectAll() {
    if (!canvasRef.value) return;
    const objects = canvasRef.value.getObjects();
    if (objects.length > 0) {
      canvasRef.value.discardActiveObject();
      const selection = new ActiveSelection(objects, { canvas: canvasRef.value });
      canvasRef.value.setActiveObject(selection);
      canvasRef.value.requestRenderAll();
    }
  }

  function centerView() {
    if (!canvasRef.value) return;
    
    const canvas = canvasRef.value;
    const objects = canvas.getObjects();
    
    const width = canvas.width || 0;
    const height = canvas.height || 0;
    const container = canvas.getElement().parentElement;
    if (!container) return;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const centerX = (width - containerWidth) / 2;
    const centerY = (height - containerHeight) / 2;
    canvas.setViewportTransform([1, 0, 0, 1, -centerX, -centerY]);
  }

  return {
    addObjectAndSetActive,
    removeCanvasObjects,
    clearCanvas,
    selectAll,
    centerView
  };
} 