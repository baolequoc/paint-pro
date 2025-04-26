import { Ref, ref, watch } from 'vue';
import { ActiveSelection, Canvas as FabricJSCanvas, FabricObject, FabricObjectProps, ObjectEvents, SerializedObjectProps } from 'fabric';

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

  return {
    addObjectAndSetActive,
    removeCanvasObjects,
    clearCanvas,
    selectAll
  };
} 