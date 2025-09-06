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

    const container = stage.value.container();
    const oldStage = stage.value;
    
    // Clear and recreate
    oldStage.destroy();
    import('konva').then(({ default: Konva }) => {
      const newStage = Konva.Node.create(json, container) as KonvaStage;
      
      // Update the stage ref (this needs to be handled by parent)
      stage.value = newStage;
    });
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