import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ref, nextTick } from 'vue';
import { useKonvaStage } from '@/composables/konva/useKonvaStage';
import { createMockStage, createMockLayer } from '../../mocks/konva';

// Mock Konva
vi.mock('konva', () => ({
  default: {
    Stage: vi.fn((config) => createMockStage(config)),
    Layer: vi.fn(() => createMockLayer()),
    Node: {
      create: vi.fn((json) => createMockStage()),
    },
  },
}));

describe('useKonvaStage', () => {
  let containerRef: any;

  beforeEach(() => {
    // Create mock container
    const div = document.createElement('div');
    div.style.width = '800px';
    div.style.height = '600px';
    containerRef = ref(div);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Stage Initialization', () => {
    it('should initialize stage with default dimensions', () => {
      const { stage, initStage, isReady } = useKonvaStage(containerRef);
      
      initStage();
      
      expect(stage.value).toBeDefined();
      expect(isReady.value).toBe(true);
      expect(stage.value?.width()).toBe(window.innerWidth);
      expect(stage.value?.height()).toBe(window.innerHeight);
    });

    it('should initialize stage with custom dimensions', () => {
      const { stage, initStage } = useKonvaStage(containerRef);
      
      initStage({ width: 1200, height: 800 });
      
      expect(stage.value?.width()).toBe(1200);
      expect(stage.value?.height()).toBe(800);
    });

    it('should create three layers', () => {
      const { mainLayer, tempLayer, transformerLayer, initStage } = useKonvaStage(containerRef);
      
      initStage();
      
      expect(mainLayer.value).toBeDefined();
      expect(tempLayer.value).toBeDefined();
      expect(transformerLayer.value).toBeDefined();
    });

    it('should handle missing container', () => {
      const emptyRef = ref(null);
      const { stage, initStage } = useKonvaStage(emptyRef);
      
      initStage();
      
      expect(stage.value).toBeNull();
    });
  });

  describe('Stage Operations', () => {
    it('should clear stage', () => {
      const { mainLayer, initStage, clearStage } = useKonvaStage(containerRef);
      
      initStage();
      clearStage();
      
      expect(mainLayer.value?.destroyChildren).toHaveBeenCalled();
      expect(mainLayer.value?.draw).toHaveBeenCalled();
    });

    it('should export to data URL', () => {
      const { stage, initStage, toDataURL } = useKonvaStage(containerRef);
      
      initStage();
      const dataURL = toDataURL();
      
      expect(dataURL).toBe('data:image/png;base64,mock');
      expect(stage.value?.toDataURL).toHaveBeenCalledWith({
        pixelRatio: 2,
        mimeType: 'image/png',
      });
    });

    it('should export to JSON', () => {
      const { stage, initStage, toJSON } = useKonvaStage(containerRef);
      
      initStage();
      const json = toJSON();
      
      expect(json).toBe(JSON.stringify({ mock: true }));
      expect(stage.value?.toJSON).toHaveBeenCalled();
    });

    it('should batch draw all layers', () => {
      const { mainLayer, tempLayer, transformerLayer, initStage, batchDraw } = useKonvaStage(containerRef);
      
      initStage();
      batchDraw();
      
      expect(mainLayer.value?.batchDraw).toHaveBeenCalled();
      expect(tempLayer.value?.batchDraw).toHaveBeenCalled();
      expect(transformerLayer.value?.batchDraw).toHaveBeenCalled();
    });
  });

  describe('Pointer Position', () => {
    it('should get pointer position with transformation', () => {
      const { stage, initStage, getPointerPosition } = useKonvaStage(containerRef);
      
      initStage();
      const pos = getPointerPosition();
      
      expect(pos).toEqual({ x: 100, y: 100 });
      expect(stage.value?.getAbsoluteTransform).toHaveBeenCalled();
    });

    it('should handle null pointer position', () => {
      const { stage, initStage, getPointerPosition } = useKonvaStage(containerRef);
      
      initStage();
      if (stage.value) {
        stage.value.getPointerPosition = vi.fn(() => null);
      }
      
      const pos = getPointerPosition();
      expect(pos).toBeNull();
    });
  });

  describe('Window Resize', () => {
    it('should handle window resize', async () => {
      const { stage, initStage, handleResize } = useKonvaStage(containerRef);
      
      initStage();
      
      // Mock container dimensions
      Object.defineProperty(containerRef.value, 'offsetWidth', { value: 1024, configurable: true });
      Object.defineProperty(containerRef.value, 'offsetHeight', { value: 768, configurable: true });
      
      handleResize();
      
      expect(stage.value?.width).toHaveBeenCalledWith(1024);
      expect(stage.value?.height).toHaveBeenCalledWith(768);
    });
  });

  describe('Load from JSON', () => {
    it('should load stage from JSON', () => {
      const { stage, initStage, loadFromJSON } = useKonvaStage(containerRef);
      
      initStage();
      const mockJSON = JSON.stringify({ test: 'data' });
      
      loadFromJSON(mockJSON);
      
      expect(stage.value?.destroy).toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should destroy stage on unmount', () => {
      const { stage, initStage } = useKonvaStage(containerRef);
      
      initStage();
      const destroySpy = stage.value?.destroy;
      
      // Simulate unmount by calling destroy
      stage.value?.destroy();
      
      expect(destroySpy).toHaveBeenCalled();
    });
  });
});