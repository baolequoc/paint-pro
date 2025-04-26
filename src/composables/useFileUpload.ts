import { Ref } from 'vue';
import { Canvas as FabricJSCanvas, FabricImage } from 'fabric';
import useFile from './useFile';

export default function useFileUpload(
  canvasRef: Ref<FabricJSCanvas | null>,
  selectedImageRef: Ref<any>,
  addObjectAndSetActive: (obj: any) => void,
  removeCanvasObjects: (objects: any[]) => void,
  fileInputRef: Ref<HTMLInputElement | null>
) {
  const { getDataFromFile } = useFile();

  function readFileAsDataURL(file: File) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  function triggerImageUpload() {
    if (!canvasRef.value) return;
    const activeObj = canvasRef.value.getActiveObject();
    if (activeObj && activeObj.type === "image") {
      selectedImageRef.value = activeObj;
    } else {
      selectedImageRef.value = null;
    }
    fileInputRef.value?.click();
  }

  function triggerNewImageUpload() {
    selectedImageRef.value = null;
    fileInputRef.value?.click();
  }

  async function handleFileUpload(event: any) {
    if (!canvasRef.value || !event) return;
    const file = event.target.files[0];
    if (!file) return;

    const dataURL = await readFileAsDataURL(file);
    const img = await FabricImage.fromURL(dataURL as string, { crossOrigin: "anonymous" });

    const scale = Math.min(canvasRef.value.width / img.width, canvasRef.value.height / img.height, 1);
    img.scale(scale);
    img.left = 50;
    img.top = 50;

    if (selectedImageRef.value) {
      img.left = selectedImageRef.value.left;
      img.top = selectedImageRef.value.top;
      img.scaleX = selectedImageRef.value.scaleX;
      img.scaleY = selectedImageRef.value.scaleY;
      img.angle = selectedImageRef.value.angle;
      removeCanvasObjects([selectedImageRef.value]);
    }

    addObjectAndSetActive(img);
    selectedImageRef.value = img;
    event.target.value = "";
  }

  async function handlePaste(e: ClipboardEvent) {
    if (!canvasRef.value) return;

    const items = e.clipboardData?.items;
    if (!items) return;

    const imagePromises = Array.from(items)
      .filter((item) => item.type.startsWith("image"))
      .map((item) => getDataFromFile(item.getAsFile()));

    const imageDataUrls = await Promise.all(imagePromises);

    imageDataUrls
      .filter((data) => data !== null)
      .forEach(async ({ dataURL }) => {
        if (!canvasRef.value) return;
        const img = await FabricImage.fromURL(dataURL as string, { crossOrigin: "anonymous" });
        const scale = Math.min(canvasRef.value.width / img.width!, canvasRef.value.height / img.height!, 1);
        img.scale(scale);
        img.set({ left: 50, top: 50 });
        addObjectAndSetActive(img);
      });
  }

  return {
    handleFileUpload,
    handlePaste,
    triggerImageUpload,
    triggerNewImageUpload
  };
} 