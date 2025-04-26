import { Canvas as FabricJSCanvas, FabricImage, FabricObject, FabricObjectProps, ObjectEvents, SerializedObjectProps } from 'fabric';

export default function useExport() {
  async function getImageDataURL(canvas: FabricJSCanvas | null) {
    if (!canvas) return null;
    
    const activeObject = canvas.getActiveObject();
    let dataURL;
    
    if (activeObject) {
      // Create a temporary canvas for the selected object
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      
      // Set canvas size to match the object's dimensions
      const bounds = activeObject.getBoundingRect();
      tempCanvas.width = bounds.width;
      tempCanvas.height = bounds.height;
      
      // Create a temporary fabric canvas
      const tempFabricCanvas = new FabricJSCanvas(tempCanvas, {
        width: bounds.width,
        height: bounds.height,
        backgroundColor: 'transparent'
      });
      
      // Properly clone the object using async/await
      const clonedObject = await activeObject.clone();
      
      // Reset position to top-left of the temporary canvas
      clonedObject.set({
        left: 0,
        top: 0,
        evented: true
      });
      
      tempFabricCanvas.add(clonedObject);
      tempFabricCanvas.renderAll();
      
      dataURL = tempCanvas.toDataURL('image/png');
    } else {
      // Export entire canvas if no object is selected
      dataURL = canvas.toDataURL('image/png');
    }
    return dataURL;
  }

  async function exportToClipboard(canvas: FabricJSCanvas | null) {
    if (!canvas) return;
    const dataURL = await getImageDataURL(canvas);
    if (!dataURL) return;
    
    try {
      const response = await fetch(dataURL);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
      alert('Image copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      alert('Failed to copy to clipboard');
    }
  }

  async function exportToPNG(canvas: FabricJSCanvas | null) {
    if (!canvas) return;

    const dataURL = await getImageDataURL(canvas);
    if (!dataURL) return;
    
    const link = document.createElement("a");
    link.download = "canvas-export.png";
    link.href = dataURL;
    link.click();
  }

  function exportCanvas(canvas: FabricJSCanvas | null, type: 'clipboard' | 'png') {
    if (type === 'clipboard') {
      exportToClipboard(canvas);
    } else {
      exportToPNG(canvas);
    }
  }

  return {
    exportCanvas,
    exportToClipboard,
    exportToPNG,
    getImageDataURL
  };
}
