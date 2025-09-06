import { type Ref } from 'vue';
import type { KonvaStage, KonvaTransformer, ExportConfig } from '@/types/konva';

export function useKonvaExport(
  stage: Ref<KonvaStage | null>,
  transformer: Ref<KonvaTransformer | null>
) {
  // Export to data URL
  const exportToDataURL = (config?: ExportConfig): string | null => {
    if (!stage.value) return null;

    // Hide transformer before export
    const transformerVisible = transformer.value?.visible();
    if (transformer.value) {
      transformer.value.visible(false);
    }

    const dataURL = stage.value.toDataURL({
      mimeType: config?.mimeType || 'image/png',
      quality: config?.quality || 1,
      pixelRatio: config?.pixelRatio || 2,
    });

    // Restore transformer visibility
    if (transformer.value && transformerVisible) {
      transformer.value.visible(true);
    }

    return dataURL;
  };

  // Export selected area only
  const exportSelection = (config?: ExportConfig): string | null => {
    if (!stage.value || !transformer.value) return null;

    const nodes = transformer.value.nodes();
    if (nodes.length === 0) return null;

    // Get bounding box of selected nodes
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    nodes.forEach((node) => {
      const box = node.getClientRect();
      minX = Math.min(minX, box.x);
      minY = Math.min(minY, box.y);
      maxX = Math.max(maxX, box.x + box.width);
      maxY = Math.max(maxY, box.y + box.height);
    });

    // Hide transformer
    transformer.value.visible(false);

    // Export specific area
    const dataURL = stage.value.toDataURL({
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      mimeType: config?.mimeType || 'image/png',
      quality: config?.quality || 1,
      pixelRatio: config?.pixelRatio || 2,
    });

    // Restore transformer
    transformer.value.visible(true);

    return dataURL;
  };

  // Export to PNG and trigger download
  const exportToPNG = (filename = 'canvas-export.png') => {
    const dataURL = exportToDataURL({ mimeType: 'image/png' });
    if (!dataURL) return;

    const link = document.createElement('a');
    link.download = filename;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to JPEG and trigger download
  const exportToJPEG = (filename = 'canvas-export.jpg', quality = 0.9) => {
    const dataURL = exportToDataURL({ 
      mimeType: 'image/jpeg',
      quality 
    });
    if (!dataURL) return;

    const link = document.createElement('a');
    link.download = filename;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy to clipboard
  const copyToClipboard = async (selection = false): Promise<boolean> => {
    try {
      const dataURL = selection ? exportSelection() : exportToDataURL();
      if (!dataURL) return false;

      // Convert data URL to blob
      const response = await fetch(dataURL);
      const blob = await response.blob();

      // Copy to clipboard
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);

      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  };

  // Export to JSON (for saving/loading)
  const exportToJSON = (): string | null => {
    if (!stage.value) return null;
    return stage.value.toJSON();
  };

  // Load from JSON
  const loadFromJSON = (json: string) => {
    if (!stage.value) return;
    
    const container = stage.value.container();
    stage.value.destroy();
    
    // Recreate stage from JSON
    import('konva').then(({ default: Konva }) => {
      const newStage = Konva.Node.create(json, container);
      // Note: You'll need to update the stage ref in the parent component
      return newStage;
    });
  };

  // Get blob from canvas
  const exportToBlob = async (config?: ExportConfig): Promise<Blob | null> => {
    const dataURL = exportToDataURL(config);
    if (!dataURL) return null;

    const response = await fetch(dataURL);
    return response.blob();
  };

  return {
    exportToDataURL,
    exportSelection,
    exportToPNG,
    exportToJPEG,
    copyToClipboard,
    exportToJSON,
    loadFromJSON,
    exportToBlob,
  };
}