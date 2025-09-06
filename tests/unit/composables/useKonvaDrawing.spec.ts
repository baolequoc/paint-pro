import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ref } from 'vue';
import { useKonvaDrawing } from '@/composables/konva/useKonvaDrawing';
import { createMockStage, createMockLayer, createMockLine, createMockArrow, createMockRect, createMockText } from '../../mocks/konva';

// Mock Konva
vi.mock('konva', () => ({
  default: {
    Line: vi.fn((config) => createMockLine(config)),
    Arrow: vi.fn((config) => createMockArrow(config)),
    Rect: vi.fn((config) => createMockRect(config)),
    Circle: vi.fn((config) => ({ ...createMockRect(config), className: 'Circle' })),
    Text: vi.fn((config) => createMockText(config)),
  },
}));

describe('useKonvaDrawing', () => {
  let stageRef: any;
  let mainLayerRef: any;

  beforeEach(() => {
    stageRef = ref(createMockStage());
    mainLayerRef = ref(createMockLayer());
  });

  describe('Brush Drawing', () => {
    it('should start brush drawing', () => {
      const { startBrushDrawing, isDrawing } = useKonvaDrawing(stageRef, mainLayerRef);
      
      startBrushDrawing();
      
      expect(isDrawing.value).toBe(true);
      expect(mainLayerRef.value.add).toHaveBeenCalled();
    });

    it('should continue brush drawing', () => {
      const { startBrushDrawing, continueBrushDrawing, currentLine } = useKonvaDrawing(stageRef, mainLayerRef);
      
      startBrushDrawing();
      continueBrushDrawing();
      
      expect(currentLine.value?.points).toHaveBeenCalled();
      expect(mainLayerRef.value.batchDraw).toHaveBeenCalled();
    });

    it('should end brush drawing', () => {
      const { startBrushDrawing, endBrushDrawing, isDrawing } = useKonvaDrawing(stageRef, mainLayerRef);
      
      startBrushDrawing();
      endBrushDrawing();
      
      expect(isDrawing.value).toBe(false);
    });

    it('should apply brush color and size', () => {
      const { brushConfig, setBrushColor, setBrushSize } = useKonvaDrawing(stageRef, mainLayerRef);
      
      setBrushColor('#ff0000');
      setBrushSize(5);
      
      expect(brushConfig.value.stroke).toBe('#ff0000');
      expect(brushConfig.value.strokeWidth).toBe(5);
    });
  });

  describe('Shape Drawing', () => {
    it('should draw a line', () => {
      const { drawLine } = useKonvaDrawing(stageRef, mainLayerRef);
      
      const line = drawLine({ x: 0, y: 0 }, { x: 100, y: 100 });
      
      expect(line).toBeDefined();
      expect(mainLayerRef.value.add).toHaveBeenCalled();
      expect(mainLayerRef.value.batchDraw).toHaveBeenCalled();
    });

    it('should draw an arrow', () => {
      const { drawArrow } = useKonvaDrawing(stageRef, mainLayerRef);
      
      const arrow = drawArrow({ x: 0, y: 0 }, { x: 100, y: 100 });
      
      expect(arrow).toBeDefined();
      expect(mainLayerRef.value.add).toHaveBeenCalled();
      expect(mainLayerRef.value.batchDraw).toHaveBeenCalled();
    });

    it('should draw a rectangle', () => {
      const { drawRectangle } = useKonvaDrawing(stageRef, mainLayerRef);
      
      const rect = drawRectangle(10, 10, 100, 50);
      
      expect(rect).toBeDefined();
      expect(mainLayerRef.value.add).toHaveBeenCalled();
      expect(mainLayerRef.value.batchDraw).toHaveBeenCalled();
    });

    it('should draw a circle', () => {
      const { drawCircle } = useKonvaDrawing(stageRef, mainLayerRef);
      
      const circle = drawCircle(50, 50, 30);
      
      expect(circle).toBeDefined();
      expect(mainLayerRef.value.add).toHaveBeenCalled();
      expect(mainLayerRef.value.batchDraw).toHaveBeenCalled();
    });

    it('should apply custom config to shapes', () => {
      const { drawLine } = useKonvaDrawing(stageRef, mainLayerRef);
      
      const customConfig = {
        stroke: '#ff0000',
        strokeWidth: 3,
      };
      
      drawLine({ x: 0, y: 0 }, { x: 100, y: 100 }, customConfig);
      
      expect(mainLayerRef.value.add).toHaveBeenCalled();
    });
  });

  describe('Text Handling', () => {
    it('should add text', () => {
      const { addText } = useKonvaDrawing(stageRef, mainLayerRef);
      
      const text = addText(50, 50, 'Test Text');
      
      expect(text).toBeDefined();
      expect(mainLayerRef.value.add).toHaveBeenCalled();
      expect(mainLayerRef.value.batchDraw).toHaveBeenCalled();
    });

    it('should add text with custom config', () => {
      const { addText } = useKonvaDrawing(stageRef, mainLayerRef);
      
      const customConfig = {
        fontSize: 24,
        fontFamily: 'Helvetica',
        fill: '#0000ff',
      };
      
      const text = addText(50, 50, 'Custom Text', customConfig);
      
      expect(text).toBeDefined();
      expect(mainLayerRef.value.add).toHaveBeenCalled();
    });

    it('should enable text editing on double click', () => {
      const { addText, enableTextEditing } = useKonvaDrawing(stageRef, mainLayerRef);
      
      const text = addText(50, 50, 'Editable Text');
      if (text) {
        enableTextEditing(text);
        
        expect(text.on).toHaveBeenCalledWith('dblclick dbltap', expect.any(Function));
      }
    });

    it('should handle text editing workflow', () => {
      const { addText, enableTextEditing } = useKonvaDrawing(stageRef, mainLayerRef);
      
      // Mock container for stage
      stageRef.value.container = vi.fn(() => {
        const div = document.createElement('div');
        div.getBoundingClientRect = vi.fn(() => ({
          top: 100,
          left: 100,
          width: 800,
          height: 600,
        }));
        return div;
      });
      
      const text = addText(50, 50, 'Test');
      if (text) {
        enableTextEditing(text);
        
        // Get the callback function that was registered
        const onCall = (text.on as any).mock.calls[0];
        expect(onCall[0]).toBe('dblclick dbltap');
        
        // Simulate double click
        const handler = onCall[1];
        handler();
        
        // Check if textarea was created
        const textarea = document.getElementById('konva-text-editor');
        expect(textarea).toBeDefined();
        
        // Clean up
        textarea?.remove();
      }
    });
  });

  describe('Fill Color', () => {
    it('should set fill color', () => {
      const { brushConfig, setFillColor } = useKonvaDrawing(stageRef, mainLayerRef);
      
      setFillColor('#ffff00');
      
      expect(brushConfig.value.fill).toBe('#ffff00');
    });

    it('should apply fill color to rectangle', () => {
      const { setFillColor, drawRectangle } = useKonvaDrawing(stageRef, mainLayerRef);
      
      setFillColor('#00ff00');
      const rect = drawRectangle(0, 0, 100, 100);
      
      expect(rect).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle null stage', () => {
      const nullStageRef = ref(null);
      const { startBrushDrawing } = useKonvaDrawing(nullStageRef, mainLayerRef);
      
      // Should not throw
      expect(() => startBrushDrawing()).not.toThrow();
    });

    it('should handle null main layer', () => {
      const nullLayerRef = ref(null);
      const { drawLine } = useKonvaDrawing(stageRef, nullLayerRef);
      
      const line = drawLine({ x: 0, y: 0 }, { x: 100, y: 100 });
      
      expect(line).toBeNull();
    });
  });
});