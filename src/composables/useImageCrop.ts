import { FabricImage, FabricObject, FabricObjectProps, SerializedObjectProps, ObjectEvents } from "fabric";

interface CropOptions {
  selectedImage: FabricObject<Partial<FabricObjectProps>, SerializedObjectProps, ObjectEvents>;
  cropRect: FabricObject<Partial<FabricObjectProps>, SerializedObjectProps, ObjectEvents>;
}

export default function useImageCrop() {
  async function applyCrop({ selectedImage, cropRect }: CropOptions) {
    if (!selectedImage || !cropRect) return null;

    const rect = cropRect.getBoundingRect();
    const img = selectedImage;

    const scaleX = img.scaleX;
    const scaleY = img.scaleY;

    const cropX = (rect.left - img.left) / scaleX;
    const cropY = (rect.top - img.top) / scaleY;
    const cropWidth = rect.width / scaleX;
    const cropHeight = rect.height / scaleY;

    // Create temp canvas to draw cropped image
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = cropWidth;
    tempCanvas.height = cropHeight;
    const ctx = tempCanvas.getContext("2d");

    if (!ctx) return null;

    const source = (img as FabricImage)._element;
    ctx.drawImage(source, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

    const croppedDataUrl = tempCanvas.toDataURL();
    const newImg = await FabricImage.fromURL(croppedDataUrl, { crossOrigin: "anonymous" });
    
    return {
      newImg,
      position: {
        left: img.left + (rect.left - img.left),
        top: img.top + (rect.top - img.top)
      }
    };
  }

  return {
    applyCrop
  };
} 