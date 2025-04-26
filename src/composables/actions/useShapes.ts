import { Ref } from 'vue';
import { Canvas as FabricJSCanvas, Rect, IText } from 'fabric';

export default function useShapes(
  canvasRef: Ref<FabricJSCanvas | null>,
  addObjectAndSetActive: (obj: any) => void
) {
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

  return {
    createRectangle,
    createText
  };
}