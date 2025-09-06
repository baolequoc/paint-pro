import { ref, type Ref } from 'vue';
import Konva from 'konva';
import type { KonvaLayer } from '@/types/konva';

export function useKonvaImage(mainLayer: Ref<KonvaLayer | null>) {
  const selectedImage = ref<Konva.Image | null>(null);
  const cropRect = ref<Konva.Rect | null>(null);
  const isCropping = ref(false);

  // Load image from URL
  const loadImage = async (url: string, x = 50, y = 50): Promise<Konva.Image | null> => {
    if (!mainLayer.value) return null;

    return new Promise((resolve) => {
      Konva.Image.fromURL(url, (imageNode) => {
        imageNode.setAttrs({
          x,
          y,
          draggable: true,
          name: 'selectable',
        });

        // Scale image if too large
        const maxWidth = window.innerWidth * 0.8;
        const maxHeight = window.innerHeight * 0.8;
        
        if (imageNode.width() > maxWidth || imageNode.height() > maxHeight) {
          const scale = Math.min(maxWidth / imageNode.width(), maxHeight / imageNode.height());
          imageNode.scale({ x: scale, y: scale });
        }

        mainLayer.value?.add(imageNode);
        mainLayer.value?.batchDraw();
        resolve(imageNode);
      });
    });
  };

  // Load image from File
  const loadImageFromFile = (file: File, x = 50, y = 50): Promise<Konva.Image | null> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const url = e.target?.result as string;
        const image = await loadImage(url, x, y);
        resolve(image);
      };
      
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle paste from clipboard
  const handlePaste = async (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        const blob = item.getAsFile();
        if (blob) {
          const url = URL.createObjectURL(blob);
          await loadImage(url, 100, 100);
          URL.revokeObjectURL(url);
        }
      }
    }
  };

  // Start crop
  const startCrop = (image: Konva.Image) => {
    if (!mainLayer.value) return;

    selectedImage.value = image;
    isCropping.value = true;

    // Create crop rectangle
    cropRect.value = new Konva.Rect({
      x: image.x() + 20,
      y: image.y() + 20,
      width: Math.min(100, image.width() * 0.5),
      height: Math.min(100, image.height() * 0.5),
      fill: 'rgba(0, 123, 255, 0.2)',
      stroke: '#0056b3',
      strokeWidth: 2,
      dash: [5, 5],
      draggable: true,
      name: 'crop-rect',
    });

    // Add resize anchors
    addCropAnchors(cropRect.value);
    
    mainLayer.value.add(cropRect.value);
    mainLayer.value.batchDraw();
  };

  // Add crop anchors for resizing
  const addCropAnchors = (rect: Konva.Rect) => {
    if (!mainLayer.value) return;

    const anchors = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
    
    anchors.forEach((position) => {
      const anchor = new Konva.Circle({
        radius: 5,
        fill: '#0056b3',
        stroke: '#ffffff',
        strokeWidth: 1,
        draggable: true,
        name: `crop-anchor-${position}`,
      });

      // Position anchor based on corner
      const updateAnchorPosition = () => {
        const x = position.includes('left') ? rect.x() : rect.x() + rect.width();
        const y = position.includes('top') ? rect.y() : rect.y() + rect.height();
        anchor.position({ x, y });
      };

      updateAnchorPosition();

      // Handle anchor drag
      anchor.on('dragmove', () => {
        const pos = anchor.position();
        
        if (position.includes('left')) {
          const width = rect.x() + rect.width() - pos.x;
          rect.width(Math.max(10, width));
          rect.x(pos.x);
        } else {
          rect.width(Math.max(10, pos.x - rect.x()));
        }
        
        if (position.includes('top')) {
          const height = rect.y() + rect.height() - pos.y;
          rect.height(Math.max(10, height));
          rect.y(pos.y);
        } else {
          rect.height(Math.max(10, pos.y - rect.y()));
        }
        
        mainLayer.value?.batchDraw();
      });

      mainLayer.value.add(anchor);
    });
  };

  // Apply crop
  const applyCrop = async () => {
    if (!selectedImage.value || !cropRect.value || !mainLayer.value) return null;

    const image = selectedImage.value;
    const rect = cropRect.value;
    
    // Calculate crop area relative to image
    const cropX = (rect.x() - image.x()) / image.scaleX();
    const cropY = (rect.y() - image.y()) / image.scaleY();
    const cropWidth = rect.width() / image.scaleX();
    const cropHeight = rect.height() / image.scaleY();

    // Create new cropped image
    const croppedImage = new Konva.Image({
      image: image.image(),
      x: rect.x(),
      y: rect.y(),
      width: rect.width(),
      height: rect.height(),
      crop: {
        x: cropX,
        y: cropY,
        width: cropWidth,
        height: cropHeight,
      },
      draggable: true,
      name: 'selectable',
    });

    // Remove original image and crop rectangle
    image.destroy();
    rect.destroy();
    
    // Remove crop anchors
    mainLayer.value.find('.crop-anchor-top-left, .crop-anchor-top-right, .crop-anchor-bottom-left, .crop-anchor-bottom-right').forEach(node => node.destroy());

    // Add cropped image
    mainLayer.value.add(croppedImage);
    mainLayer.value.batchDraw();

    // Reset crop state
    selectedImage.value = null;
    cropRect.value = null;
    isCropping.value = false;

    return croppedImage;
  };

  // Cancel crop
  const cancelCrop = () => {
    if (!mainLayer.value) return;

    cropRect.value?.destroy();
    mainLayer.value.find('.crop-anchor-top-left, .crop-anchor-top-right, .crop-anchor-bottom-left, .crop-anchor-bottom-right').forEach(node => node.destroy());
    
    selectedImage.value = null;
    cropRect.value = null;
    isCropping.value = false;
    
    mainLayer.value.batchDraw();
  };

  // Replace image
  const replaceImage = async (oldImage: Konva.Image, newUrl: string) => {
    if (!mainLayer.value) return null;

    const x = oldImage.x();
    const y = oldImage.y();
    const scale = oldImage.scale();
    
    oldImage.destroy();
    
    const newImage = await loadImage(newUrl, x, y);
    if (newImage) {
      newImage.scale(scale);
    }
    
    return newImage;
  };

  return {
    selectedImage,
    cropRect,
    isCropping,
    loadImage,
    loadImageFromFile,
    handlePaste,
    startCrop,
    applyCrop,
    cancelCrop,
    replaceImage,
  };
}