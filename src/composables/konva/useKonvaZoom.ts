import { ref, type Ref } from 'vue';
import type { KonvaStage } from '@/types/konva';

export function useKonvaZoom(stage: Ref<KonvaStage | null>) {
  const zoomLevel = ref(1);
  const minZoom = 0.1;
  const maxZoom = 10;
  const zoomStep = 1.1;

  // Handle mouse wheel zoom
  const handleWheel = (e: WheelEvent) => {
    if (!stage.value) return;
    
    e.preventDefault();
    
    // Only zoom if Ctrl/Cmd is pressed
    if (!e.ctrlKey && !e.metaKey) return;

    const oldScale = stage.value.scaleX();
    const pointer = stage.value.getPointerPosition();
    
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.value.x()) / oldScale,
      y: (pointer.y - stage.value.y()) / oldScale,
    };

    const direction = e.deltaY > 0 ? -1 : 1;
    const newScale = direction > 0 ? oldScale * zoomStep : oldScale / zoomStep;
    
    // Limit zoom
    const finalScale = Math.max(minZoom, Math.min(maxZoom, newScale));
    
    stage.value.scale({ x: finalScale, y: finalScale });

    const newPos = {
      x: pointer.x - mousePointTo.x * finalScale,
      y: pointer.y - mousePointTo.y * finalScale,
    };
    
    stage.value.position(newPos);
    stage.value.batchDraw();
    
    zoomLevel.value = finalScale;
  };

  // Zoom in
  const zoomIn = () => {
    if (!stage.value) return;
    
    const currentScale = stage.value.scaleX();
    const newScale = Math.min(maxZoom, currentScale * zoomStep);
    
    const center = {
      x: stage.value.width() / 2,
      y: stage.value.height() / 2,
    };
    
    zoomToPoint(center, newScale);
  };

  // Zoom out
  const zoomOut = () => {
    if (!stage.value) return;
    
    const currentScale = stage.value.scaleX();
    const newScale = Math.max(minZoom, currentScale / zoomStep);
    
    const center = {
      x: stage.value.width() / 2,
      y: stage.value.height() / 2,
    };
    
    zoomToPoint(center, newScale);
  };

  // Zoom to specific point
  const zoomToPoint = (point: { x: number; y: number }, scale: number) => {
    if (!stage.value) return;
    
    const oldScale = stage.value.scaleX();
    
    const mousePointTo = {
      x: (point.x - stage.value.x()) / oldScale,
      y: (point.y - stage.value.y()) / oldScale,
    };
    
    const finalScale = Math.max(minZoom, Math.min(maxZoom, scale));
    
    stage.value.scale({ x: finalScale, y: finalScale });
    
    const newPos = {
      x: point.x - mousePointTo.x * finalScale,
      y: point.y - mousePointTo.y * finalScale,
    };
    
    stage.value.position(newPos);
    stage.value.batchDraw();
    
    zoomLevel.value = finalScale;
  };

  // Reset zoom
  const resetZoom = () => {
    if (!stage.value) return;
    
    stage.value.scale({ x: 1, y: 1 });
    stage.value.position({ x: 0, y: 0 });
    stage.value.batchDraw();
    
    zoomLevel.value = 1;
  };

  // Fit to screen
  const fitToScreen = () => {
    if (!stage.value) return;
    
    const stageWidth = stage.value.width();
    const stageHeight = stage.value.height();
    
    // Get bounding box of all content
    const children = stage.value.find('.selectable');
    if (children.length === 0) return;
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    children.forEach((child) => {
      const box = child.getClientRect();
      minX = Math.min(minX, box.x);
      minY = Math.min(minY, box.y);
      maxX = Math.max(maxX, box.x + box.width);
      maxY = Math.max(maxY, box.y + box.height);
    });
    
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    
    // Calculate scale to fit
    const scaleX = stageWidth / contentWidth;
    const scaleY = stageHeight / contentHeight;
    const scale = Math.min(scaleX, scaleY) * 0.9; // 90% to add some padding
    
    const finalScale = Math.max(minZoom, Math.min(maxZoom, scale));
    
    stage.value.scale({ x: finalScale, y: finalScale });
    
    // Center content
    const scaledContentWidth = contentWidth * finalScale;
    const scaledContentHeight = contentHeight * finalScale;
    
    stage.value.position({
      x: (stageWidth - scaledContentWidth) / 2 - minX * finalScale,
      y: (stageHeight - scaledContentHeight) / 2 - minY * finalScale,
    });
    
    stage.value.batchDraw();
    zoomLevel.value = finalScale;
  };

  // Get zoom percentage
  const getZoomPercentage = () => Math.round(zoomLevel.value * 100);

  return {
    zoomLevel,
    minZoom,
    maxZoom,
    handleWheel,
    zoomIn,
    zoomOut,
    zoomToPoint,
    resetZoom,
    fitToScreen,
    getZoomPercentage,
  };
}