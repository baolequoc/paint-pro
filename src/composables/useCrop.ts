import { ref, Ref } from 'vue';
import { Canvas as FabricJSCanvas, FabricObject, FabricObjectProps, ObjectEvents, SerializedObjectProps, Rect } from 'fabric';
import useImageCrop from './useImageCrop';

export default function useCrop(canvasRef: Ref<FabricJSCanvas | null>) {
  const isCropping = ref(false);
  const selectedImage = ref<FabricObject<Partial<FabricObjectProps>, SerializedObjectProps, ObjectEvents> | null>(null);
  const cropRect = ref<FabricObject<Partial<FabricObjectProps>, SerializedObjectProps, ObjectEvents> | null>(null);
  const { applyCrop } = useImageCrop();

  function startCrop() {
    if (!canvasRef.value) return;
    const active = canvasRef.value.getActiveObject();
    if (!active || active.type !== "image") {
      alert("Please select an image to crop.");
      return;
    }

    isCropping.value = true;
    selectedImage.value = active;

    cropRect.value = new Rect({
      left: active.left + 20,
      top: active.top + 20,
      width: 100,
      height: 100,
      fill: "rgba(0, 123, 255, 0.2)",
      stroke: "#0056b3",
      strokeWidth: 1,
      hasRotatingPoint: false,
      cornerStyle: "circle",
      transparentCorners: false
    });

    canvasRef.value.add(cropRect.value);
    canvasRef.value.setActiveObject(cropRect.value);
    canvasRef.value.bringObjectToFront(cropRect.value);
    canvasRef.value.requestRenderAll();
  }

  async function applyCropToCanvas() {
    if (!selectedImage.value || !cropRect.value || !canvasRef.value) return;

    const result = await applyCrop({ selectedImage: selectedImage.value, cropRect: cropRect.value });
    if (!result) return;

    const { newImg, position } = result;
    newImg.left = position.left + 50;
    newImg.top = position.top + 50;

    // Remove old objects
    canvasRef.value.remove(selectedImage.value);
    canvasRef.value.remove(cropRect.value);
    cropRect.value = null;
    selectedImage.value = null;
    isCropping.value = false;

    // Add new cropped image
    canvasRef.value.add(newImg);
    canvasRef.value.setActiveObject(newImg);
    canvasRef.value.requestRenderAll();
  }

  return {
    isCropping,
    selectedImage,
    cropRect,
    startCrop,
    applyCropToCanvas
  };
}
