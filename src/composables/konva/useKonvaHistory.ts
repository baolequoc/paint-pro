import { ref, type Ref } from 'vue';
import type { KonvaStage, HistoryState } from '@/types/konva';

export function useKonvaHistory(stage: Ref<KonvaStage | null>) {
  const history = ref<HistoryState[]>([]);
  const historyStep = ref(-1);
  const maxHistorySize = 50;
  const isRestoring = ref(false);

  // Save current state to history
  const saveState = () => {
    if (!stage.value || isRestoring.value) return;

    const json = stage.value.toJSON();
    
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
  };

  // Undo last action
  const undo = () => {
    if (!stage.value || historyStep.value <= 0) return;

    historyStep.value--;
    isRestoring.value = true;

    const state = history.value[historyStep.value];
    restoreState(state.json);

    isRestoring.value = false;
  };

  // Redo action
  const redo = () => {
    if (!stage.value || historyStep.value >= history.value.length - 1) return;

    historyStep.value++;
    isRestoring.value = true;

    const state = history.value[historyStep.value];
    restoreState(state.json);

    isRestoring.value = false;
  };

  // Restore state from JSON
  const restoreState = (json: string) => {
    if (!stage.value) return;

    // Parse the JSON
    const stageData = JSON.parse(json);
    
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
      import('konva').then(({ default: Konva }) => {
        stageData.children.forEach((layerData: any, index: number) => {
          const layer = layers[index];
          if (layer && layerData.children) {
            layerData.children.forEach((childData: any) => {
              const child = Konva.Node.create(childData);
              layer.add(child);
            });
          }
        });
        
        // Redraw all layers
        layers.forEach((layer: any) => {
          layer.batchDraw();
        });
      });
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