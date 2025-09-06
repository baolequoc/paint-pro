import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ref } from 'vue';
import { useKonvaHistory } from '@/composables/konva/useKonvaHistory';
import { createMockStage } from '../../mocks/konva';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock Konva dynamic import
vi.mock('konva', () => ({
  default: {
    Node: {
      create: vi.fn((json) => createMockStage()),
    },
  },
}));

describe('useKonvaHistory', () => {
  let stageRef: any;

  beforeEach(() => {
    stageRef = ref(createMockStage());
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('State Management', () => {
    it('should save state to history', () => {
      const { saveState, history, historyStep } = useKonvaHistory(stageRef);
      
      saveState();
      
      expect(history.value.length).toBe(1);
      expect(historyStep.value).toBe(0);
      expect(stageRef.value.toJSON).toHaveBeenCalled();
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should not save state when restoring', () => {
      const { saveState, isRestoring, history } = useKonvaHistory(stageRef);
      
      isRestoring.value = true;
      saveState();
      
      expect(history.value.length).toBe(0);
      expect(stageRef.value.toJSON).not.toHaveBeenCalled();
    });

    it('should limit history size', () => {
      const { saveState, history } = useKonvaHistory(stageRef);
      
      // Add 51 states (max is 50)
      for (let i = 0; i < 51; i++) {
        saveState();
      }
      
      expect(history.value.length).toBe(50);
    });

    it('should handle null stage', () => {
      const nullStageRef = ref(null);
      const { saveState, history } = useKonvaHistory(nullStageRef);
      
      saveState();
      
      expect(history.value.length).toBe(0);
    });
  });

  describe('Undo/Redo', () => {
    it('should undo last action', async () => {
      const { saveState, undo, historyStep } = useKonvaHistory(stageRef);
      
      saveState(); // State 0
      saveState(); // State 1
      
      expect(historyStep.value).toBe(1);
      
      undo();
      
      expect(historyStep.value).toBe(0);
      expect(stageRef.value.destroy).toHaveBeenCalled();
    });

    it('should not undo when at beginning', () => {
      const { undo, historyStep } = useKonvaHistory(stageRef);
      
      undo();
      
      expect(historyStep.value).toBe(-1);
      expect(stageRef.value.destroy).not.toHaveBeenCalled();
    });

    it('should redo action', () => {
      const { saveState, undo, redo, historyStep } = useKonvaHistory(stageRef);
      
      saveState(); // State 0
      saveState(); // State 1
      undo(); // Back to State 0
      
      expect(historyStep.value).toBe(0);
      
      redo();
      
      expect(historyStep.value).toBe(1);
      expect(stageRef.value.destroy).toHaveBeenCalled();
    });

    it('should not redo when at latest', () => {
      const { saveState, redo, historyStep } = useKonvaHistory(stageRef);
      
      saveState();
      const initialStep = historyStep.value;
      
      redo();
      
      expect(historyStep.value).toBe(initialStep);
      expect(stageRef.value.destroy).not.toHaveBeenCalled();
    });

    it('should clear future states when saving after undo', () => {
      const { saveState, undo, history } = useKonvaHistory(stageRef);
      
      saveState(); // State 0
      saveState(); // State 1
      saveState(); // State 2
      
      undo(); // Back to State 1
      undo(); // Back to State 0
      
      saveState(); // New State 1
      
      expect(history.value.length).toBe(2); // State 0 and new State 1
    });
  });

  describe('Can Undo/Redo', () => {
    it('should check if can undo', () => {
      const { saveState, canUndo } = useKonvaHistory(stageRef);
      
      expect(canUndo()).toBe(false);
      
      saveState();
      saveState();
      
      expect(canUndo()).toBe(true);
    });

    it('should check if can redo', () => {
      const { saveState, undo, canRedo } = useKonvaHistory(stageRef);
      
      expect(canRedo()).toBe(false);
      
      saveState();
      saveState();
      
      expect(canRedo()).toBe(false);
      
      undo();
      
      expect(canRedo()).toBe(true);
    });
  });

  describe('Clear History', () => {
    it('should clear all history', () => {
      const { saveState, clearHistory, history, historyStep } = useKonvaHistory(stageRef);
      
      saveState();
      saveState();
      
      clearHistory();
      
      expect(history.value.length).toBe(0);
      expect(historyStep.value).toBe(-1);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('konva-history');
    });
  });

  describe('LocalStorage', () => {
    it('should save to localStorage', () => {
      const { saveState, saveToLocalStorage, history, historyStep } = useKonvaHistory(stageRef);
      
      saveState();
      saveToLocalStorage();
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'konva-history',
        JSON.stringify({
          history: history.value,
          step: historyStep.value,
        })
      );
    });

    it('should handle localStorage save errors', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      const { saveToLocalStorage } = useKonvaHistory(stageRef);
      saveToLocalStorage();
      
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should load from localStorage', () => {
      const mockData = {
        history: [{ json: '{"test": "data"}', timestamp: 12345 }],
        step: 0,
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData));
      
      const { loadFromLocalStorage, history, historyStep } = useKonvaHistory(stageRef);
      const result = loadFromLocalStorage();
      
      expect(result).toBe(true);
      expect(history.value).toEqual(mockData.history);
      expect(historyStep.value).toBe(0);
    });

    it('should handle localStorage load errors', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      localStorageMock.getItem.mockReturnValue('invalid json');
      
      const { loadFromLocalStorage } = useKonvaHistory(stageRef);
      const result = loadFromLocalStorage();
      
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should return false when no localStorage data', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const { loadFromLocalStorage } = useKonvaHistory(stageRef);
      const result = loadFromLocalStorage();
      
      expect(result).toBe(false);
    });
  });

  describe('Initialization', () => {
    it('should initialize with saved state', () => {
      const mockData = {
        history: [{ json: '{"test": "data"}', timestamp: 12345 }],
        step: 0,
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData));
      
      const { initHistory, history } = useKonvaHistory(stageRef);
      initHistory();
      
      expect(history.value).toEqual(mockData.history);
    });

    it('should initialize with new state if no saved data', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const { initHistory, history } = useKonvaHistory(stageRef);
      initHistory();
      
      expect(history.value.length).toBe(1);
      expect(stageRef.value.toJSON).toHaveBeenCalled();
    });
  });

  describe('History Info', () => {
    it('should get history info', () => {
      const { saveState, undo, getHistoryInfo } = useKonvaHistory(stageRef);
      
      saveState();
      saveState();
      saveState();
      undo();
      
      const info = getHistoryInfo();
      
      expect(info).toEqual({
        current: 2,
        total: 3,
        canUndo: true,
        canRedo: true,
      });
    });

    it('should get initial history info', () => {
      const { getHistoryInfo } = useKonvaHistory(stageRef);
      
      const info = getHistoryInfo();
      
      expect(info).toEqual({
        current: 0,
        total: 0,
        canUndo: false,
        canRedo: false,
      });
    });
  });
});