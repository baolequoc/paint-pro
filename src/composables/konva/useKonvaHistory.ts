import { ref, type Ref } from 'vue';
import type { KonvaStage, HistoryState } from '@/types/konva';

export function useKonvaHistory(
  stage: Ref<KonvaStage | null>, 
  clearSelection?: () => void
) {
  const history = ref<HistoryState[]>([]);
  const historyStep = ref(-1);
  const maxHistorySize = 50;
  const isRestoring = ref(false);

  // Save current state to history
  const saveState = () => {
    if (!stage.value || isRestoring.value) return;

    try {
      // Before saving, store image data for all Image nodes
      const layers = stage.value.getLayers();
      const imageDataMap = new Map();
      
      layers.forEach((layer: any, layerIndex: number) => {
        if (layerIndex < 2) { // Only process main layer and temp layer
          layer.children.forEach((child: any, childIndex: number) => {
            if (child.className === 'Image' && child.image()) {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              const img = child.image();
              
              canvas.width = img.width || img.naturalWidth;
              canvas.height = img.height || img.naturalHeight;
              
              if (ctx && canvas.width > 0 && canvas.height > 0) {
                ctx.drawImage(img, 0, 0);
                const imageData = canvas.toDataURL('image/png');
                imageDataMap.set(`${layerIndex}-${childIndex}`, imageData);
                
                // Temporarily store image data in the node for serialization
                child.setAttr('_imageData', imageData);
                console.log('Stored image data for node:', `${layerIndex}-${childIndex}`);
              }
            }
          });
        }
      });
      
      const json = stage.value.toJSON();
      console.log('Saving state:', { step: historyStep.value + 1, hasContent: json.length > 100, imageCount: imageDataMap.size });
      
      // Clean up temporary image data attributes
      layers.forEach((layer: any, layerIndex: number) => {
        if (layerIndex < 2) {
          layer.children.forEach((child: any) => {
            if (child.className === 'Image' && child.getAttr('_imageData')) {
              child.setAttr('_imageData', undefined);
            }
          });
        }
      });
      
      // Remove any states after current step
      if (historyStep.value < history.value.length - 1) {
        history.value = history.value.slice(0, historyStep.value + 1);
      }

      // Add new state
      history.value.push({
        json,
        timestamp: Date.now(),
      });

      // Limit history size
      if (history.value.length > maxHistorySize) {
        history.value.shift();
      } else {
        historyStep.value++;
      }

      // Save to localStorage
      saveToLocalStorage();
    } catch (error) {
      console.error('Error saving state:', error);
    }
  };

  // Undo last action
  const undo = async () => {
    if (!stage.value || historyStep.value <= 0) {
      console.log('Cannot undo:', { 
        hasStage: !!stage.value, 
        step: historyStep.value 
      });
      return;
    }

    // Clear selection before undo operation
    clearSelection?.();

    historyStep.value--;
    isRestoring.value = true;
    console.log('Undoing to step:', historyStep.value);

    const state = history.value[historyStep.value];
    await restoreState(state.json);

    isRestoring.value = false;
    
    // Clear selection after undo operation to ensure clean state
    // clearSelection?.();
  };

  // Redo action
  const redo = async () => {
    if (!stage.value || historyStep.value >= history.value.length - 1) {
      console.log('Cannot redo:', { 
        hasStage: !!stage.value, 
        step: historyStep.value, 
        historyLength: history.value.length 
      });
      return;
    }

    // Clear selection before redo operation
    clearSelection?.();

    historyStep.value++;
    isRestoring.value = true;
    console.log('Redoing to step:', historyStep.value);

    const state = history.value[historyStep.value];
    await restoreState(state.json);

    isRestoring.value = false;
    
    // Clear selection after redo operation to ensure clean state
    clearSelection?.();
  };

  // Restore state from JSON
  const restoreState = async (json: string) => {
    if (!stage.value) return;

    try {
      // Parse the JSON
      const stageData = JSON.parse(json);
      console.log('Restoring state:', { 
        hasChildren: !!stageData.children, 
        layerCount: stageData.children?.length || 0 
      });
      
      // Clear all layers but keep the stage intact
      const layers = stage.value.getLayers();
      layers.forEach((layer: any, index: number) => {
        // Only clear the main layer (index 0) and temp layer (index 1)
        // Keep transformer layer (index 2) intact
        if (index < 2) {
          layer.destroyChildren();
        }
      });
      
      // Restore only the children of each layer
      if (stageData.children) {
        const { default: Konva } = await import('konva');
        
        for (let index = 0; index < stageData.children.length; index++) {
          const layerData = stageData.children[index];
          const layer = layers[index];
          
          if (layer && layerData.children) {
            console.log(`Restoring ${layerData.children.length} children to layer ${index}`);
            
            for (const childData of layerData.children) {
              try {
                if (childData.className === 'Image') {
                  // Special handling for Image nodes
                  console.log('Restoring image node with data:', childData.attrs);
                  
                  // Check if we have image source data
                  if (childData.attrs && childData.attrs._imageData) {
                    // Restore from stored image data
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    
                    await new Promise((resolve, reject) => {
                      img.onload = () => {
                        const imageNode = new Konva.Image({
                          ...childData.attrs,
                          image: img,
                        });
                        // Remove the temporary data attribute
                        delete imageNode.attrs._imageData;
                        layer.add(imageNode);
                        console.log('Image node restored successfully');
                        resolve(imageNode);
                      };
                      img.onerror = () => {
                        console.error('Failed to restore image from data');
                        reject(new Error('Failed to restore image'));
                      };
                      img.src = childData.attrs._imageData;
                    });
                  } else {
                    console.warn('Image node missing image data, trying normal restoration');
                    const child = Konva.Node.create(childData);
                    layer.add(child);
                  }
                } else {
                  // Handle other node types normally
                  const child = Konva.Node.create(childData);
                  layer.add(child);
                }
              } catch (error) {
                console.error('Error creating child node:', error, childData);
              }
            }
          }
        }
        
        // Redraw all layers
        layers.forEach((layer: any) => {
          layer.batchDraw();
        });
        
        console.log('State restoration complete');
      }
    } catch (error) {
      console.error('Error restoring state:', error);
    }
  };

  // Check if can undo
  const canUndo = () => historyStep.value > 0;

  // Check if can redo
  const canRedo = () => historyStep.value < history.value.length - 1;

  // Clear history
  const clearHistory = () => {
    history.value = [];
    historyStep.value = -1;
    localStorage.removeItem('konva-history');
  };

  // Save to localStorage
  const saveToLocalStorage = () => {
    try {
      const data = {
        history: history.value,
        step: historyStep.value,
      };
      localStorage.setItem('konva-history', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save history to localStorage:', error);
    }
  };

  // Load from localStorage
  const loadFromLocalStorage = () => {
    try {
      const data = localStorage.getItem('konva-history');
      if (data) {
        const parsed = JSON.parse(data);
        history.value = parsed.history || [];
        historyStep.value = parsed.step || -1;
        return true;
      }
    } catch (error) {
      console.error('Failed to load history from localStorage:', error);
    }
    return false;
  };

  // Initialize with first state
  const initHistory = () => {
    if (!loadFromLocalStorage()) {
      saveState();
    }
  };

  // Get history info
  const getHistoryInfo = () => ({
    current: historyStep.value + 1,
    total: history.value.length,
    canUndo: canUndo(),
    canRedo: canRedo(),
  });

  return {
    history,
    historyStep,
    isRestoring,
    saveState,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    initHistory,
    getHistoryInfo,
    saveToLocalStorage,
    loadFromLocalStorage,
  };
}