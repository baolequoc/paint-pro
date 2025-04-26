import { Ref } from 'vue';
import { Canvas as FabricJSCanvas } from 'fabric';

export default function useZoom(canvasRef: Ref<FabricJSCanvas | null>) {
  function handleZoom(opt: any) {
    if (!canvasRef.value) return;
    const delta = opt.e.deltaY;
    const pointer = canvasRef.value.getPointer(opt.e);
    let zoom = canvasRef.value.getZoom();
    zoom *= 0.999 ** delta;
    if (zoom > 20) zoom = 20;
    if (zoom < 0.01) zoom = 0.01;

    // Get the point in canvas coordinates before zoom
    const x = pointer.x;
    const y = pointer.y;

    // Set zoom while maintaining the point position
    canvasRef.value.zoomToPoint({ x, y }, zoom);

    opt.e.preventDefault();
    opt.e.stopPropagation();
  }

  function setupZoom() {
    if (!canvasRef.value) return;
    canvasRef.value.on('mouse:wheel', handleZoom);
  }

  function cleanupZoom() {
    if (!canvasRef.value) return;
    canvasRef.value.off('mouse:wheel', handleZoom);
  }

  return {
    setupZoom,
    cleanupZoom
  };
} 