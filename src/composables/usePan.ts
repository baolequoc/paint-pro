import { Ref } from 'vue';
import { Canvas as FabricJSCanvas } from 'fabric';

export default function usePan(canvasRef: Ref<FabricJSCanvas | null>) {
  let isPanning = false;
  let lastPosX = 0;
  let lastPosY = 0;

  function startPanning(o: any) {
    if (!canvasRef.value) return;
    isPanning = true;
    lastPosX = o.e.clientX;
    lastPosY = o.e.clientY;
    
    // Disable object selection and interaction
    const canvas = canvasRef.value;
    canvas.selection = false;
    canvas.forEachObject((obj) => {
      const newObj = { ...obj };
      newObj.selectable = false;
      newObj.evented = false;
      obj.set(newObj);
    });
    
    // Change cursor to grabbing
    canvas.defaultCursor = 'grabbing';
    canvas.hoverCursor = 'grabbing';
    
    canvas.requestRenderAll();
  }

  function pan(o: any) {
    if (!isPanning || !canvasRef.value) return;
    
    const canvas = canvasRef.value;
    const deltaX = o.e.clientX - lastPosX;
    const deltaY = o.e.clientY - lastPosY;

    // Get current viewport transform
    const vpt = canvas.viewportTransform;
    if (!vpt) return;

    // Update viewport transform
    vpt[4] += deltaX;
    vpt[5] += deltaY;

    // Update last position
    lastPosX = o.e.clientX;
    lastPosY = o.e.clientY;

    // Request render
    canvas.requestRenderAll();
  }

  function stopPanning() {
    if (!canvasRef.value) return;
    isPanning = false;
    
    const canvas = canvasRef.value;
    // Keep objects non-interactive while in pan mode
    canvas.selection = false;
    canvas.forEachObject((obj) => {
      const newObj = { ...obj };
      newObj.selectable = false;
      newObj.evented = false;
      obj.set(newObj);
    });
    
    // Change cursor back to grab
    canvas.defaultCursor = 'grab';
    canvas.hoverCursor = 'grab';
    
    canvas.requestRenderAll();
  }

  function setupPan() {
    if (!canvasRef.value) return;
    const canvas = canvasRef.value;
    
    // Set initial cursor
    canvas.defaultCursor = 'grab';
    canvas.hoverCursor = 'grab';
    
    // Disable object selection and interaction
    canvas.selection = false;
    canvas.forEachObject((obj) => {
      const newObj = { ...obj };
      newObj.selectable = false;
      newObj.evented = false;
      obj.set(newObj);
    });
    
    // Add event listeners
    canvas.on('mouse:down', startPanning);
    canvas.on('mouse:move', pan);
    canvas.on('mouse:up', stopPanning);
  }

  function cleanupPan() {
    if (!canvasRef.value) return;
    const canvas = canvasRef.value;
    
    // Reset cursor
    canvas.defaultCursor = 'default';
    canvas.hoverCursor = 'move';
    
    // Re-enable object selection and interaction
    canvas.selection = true;
    canvas.forEachObject((obj) => {
      const newObj = { ...obj };
      newObj.selectable = true;
      newObj.evented = true;
      obj.set(newObj);
    });
    
    // Remove event listeners
    canvas.off('mouse:down', startPanning);
    canvas.off('mouse:move', pan);
    canvas.off('mouse:up', stopPanning);
  }

  return {
    setupPan,
    cleanupPan
  };
} 