import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ref } from 'vue';
import { useKonvaSelection } from '@/composables/konva/useKonvaSelection';
import { createMockStage, createMockLayer, createMockTransformer, createMockRect, createMockEvent } from '../../mocks/konva';

// Mock Konva
vi.mock('konva', () => ({
  default: {
    Transformer: vi.fn((config) => createMockTransformer(config)),
    Rect: vi.fn((config) => createMockRect(config)),
    Util: {
      haveIntersection: vi.fn((box1, box2) => {
        // Simple intersection check
        return !(box1.x + box1.width < box2.x ||
                box2.x + box2.width < box1.x ||
                box1.y + box1.height < box2.y ||
                box2.y + box2.height < box1.y);
      }),
    },
  },
}));

describe('useKonvaSelection', () => {
  let stageRef: any;
  let mainLayerRef: any;
  let transformerLayerRef: any;

  beforeEach(() => {
    stageRef = ref(createMockStage());
    mainLayerRef = ref(createMockLayer());
    transformerLayerRef = ref(createMockLayer());
  });

  describe('Transformer Initialization', () => {
    it('should initialize transformer', () => {
      const { initTransformer, transformer } = useKonvaSelection(stageRef, mainLayerRef, transformerLayerRef);
      
      initTransformer();
      
      expect(transformer.value).toBeDefined();
      expect(transformerLayerRef.value.add).toHaveBeenCalled();
    });

    it('should handle missing transformer layer', () => {
      const nullLayerRef = ref(null);
      const { initTransformer, transformer } = useKonvaSelection(stageRef, mainLayerRef, nullLayerRef);
      
      initTransformer();
      
      expect(transformer.value).toBeNull();
    });
  });

  describe('Node Selection', () => {
    it('should select nodes', () => {
      const { selectNodes, selectedNodes, initTransformer } = useKonvaSelection(stageRef, mainLayerRef, transformerLayerRef);
      
      initTransformer();
      const mockNodes = [createMockRect(), createMockRect()];
      
      selectNodes(mockNodes);
      
      expect(selectedNodes.value).toEqual(mockNodes);
      expect(transformerLayerRef.value.batchDraw).toHaveBeenCalled();
    });

    it('should clear selection', () => {
      const { selectNodes, clearSelection, selectedNodes, initTransformer } = useKonvaSelection(stageRef, mainLayerRef, transformerLayerRef);
      
      initTransformer();
      const mockNodes = [createMockRect()];
      selectNodes(mockNodes);
      
      clearSelection();
      
      expect(selectedNodes.value).toEqual([]);
      expect(transformerLayerRef.value.batchDraw).toHaveBeenCalled();
    });

    it('should select all selectable nodes', () => {
      const { selectAll, selectedNodes } = useKonvaSelection(stageRef, mainLayerRef, transformerLayerRef);
      
      const mockShapes = [createMockRect(), createMockRect()];
      mainLayerRef.value.find = vi.fn(() => mockShapes);
      
      selectAll();
      
      expect(mainLayerRef.value.find).toHaveBeenCalledWith('.selectable');
      expect(selectedNodes.value).toEqual(mockShapes);
    });
  });

  describe('Rectangle Selection', () => {
    it('should start rectangle selection', () => {
      const { startSelection, isSelecting, selectionRectangle } = useKonvaSelection(stageRef, mainLayerRef, transformerLayerRef);
      
      const event = createMockEvent('mousedown');
      startSelection(event);
      
      expect(isSelecting.value).toBe(true);
      expect(selectionRectangle.value).toBeDefined();
      expect(mainLayerRef.value.add).toHaveBeenCalled();
    });

    it('should update selection rectangle', () => {
      const { startSelection, updateSelection, selectionRectangle } = useKonvaSelection(stageRef, mainLayerRef, transformerLayerRef);
      
      const startEvent = createMockEvent('mousedown');
      startSelection(startEvent);
      
      stageRef.value.getPointerPosition = vi.fn(() => ({ x: 200, y: 200 }));
      const moveEvent = createMockEvent('mousemove');
      updateSelection(moveEvent);
      
      expect(selectionRectangle.value?.setAttrs).toHaveBeenCalledWith({
        x: 100,
        y: 100,
        width: 100,
        height: 100,
      });
      expect(mainLayerRef.value.batchDraw).toHaveBeenCalled();
    });

    it('should handle negative selection dimensions', () => {
      const { startSelection, updateSelection, selectionRectangle } = useKonvaSelection(stageRef, mainLayerRef, transformerLayerRef);
      
      const startEvent = createMockEvent('mousedown');
      startSelection(startEvent);
      
      stageRef.value.getPointerPosition = vi.fn(() => ({ x: 50, y: 50 }));
      const moveEvent = createMockEvent('mousemove');
      updateSelection(moveEvent);
      
      expect(selectionRectangle.value?.setAttrs).toHaveBeenCalledWith({
        x: 50,
        y: 50,
        width: 50,
        height: 50,
      });
    });

    it('should end selection and select intersecting shapes', () => {
      const { startSelection, endSelection, selectedNodes } = useKonvaSelection(stageRef, mainLayerRef, transformerLayerRef);
      
      const mockShapes = [
        { ...createMockRect(), getClientRect: vi.fn(() => ({ x: 80, y: 80, width: 40, height: 40 })) },
        { ...createMockRect(), getClientRect: vi.fn(() => ({ x: 200, y: 200, width: 40, height: 40 })) },
      ];
      mainLayerRef.value.find = vi.fn(() => mockShapes);
      
      const startEvent = createMockEvent('mousedown');
      startSelection(startEvent);
      
      const endEvent = createMockEvent('mouseup');
      endSelection(endEvent);
      
      expect(selectedNodes.value.length).toBe(1);
      expect(selectedNodes.value[0]).toBe(mockShapes[0]);
    });
  });

  describe('Node Click Selection', () => {
    it('should select node on click', () => {
      const { handleNodeClick, selectedNodes } = useKonvaSelection(stageRef, mainLayerRef, transformerLayerRef);
      
      const mockNode = createMockRect();
      const event = createMockEvent('click', mockNode);
      
      handleNodeClick(event);
      
      expect(selectedNodes.value).toEqual([mockNode]);
    });

    it('should clear selection when clicking stage', () => {
      const { selectNodes, handleNodeClick, selectedNodes, initTransformer } = useKonvaSelection(stageRef, mainLayerRef, transformerLayerRef);
      
      initTransformer();
      selectNodes([createMockRect()]);
      
      const event = createMockEvent('click', stageRef.value);
      handleNodeClick(event);
      
      expect(selectedNodes.value).toEqual([]);
    });

    it('should handle multi-selection with shift key', () => {
      const { handleNodeClick, selectedNodes } = useKonvaSelection(stageRef, mainLayerRef, transformerLayerRef);
      
      const node1 = createMockRect();
      const node2 = createMockRect();
      
      // Select first node
      handleNodeClick(createMockEvent('click', node1));
      
      // Add second node with shift
      handleNodeClick(createMockEvent('click', node2, { shiftKey: true }));
      
      expect(selectedNodes.value).toEqual([node1, node2]);
    });

    it('should toggle selection with ctrl key', () => {
      const { handleNodeClick, selectedNodes } = useKonvaSelection(stageRef, mainLayerRef, transformerLayerRef);
      
      const node = createMockRect();
      
      // Select node
      handleNodeClick(createMockEvent('click', node));
      expect(selectedNodes.value).toEqual([node]);
      
      // Deselect with ctrl
      handleNodeClick(createMockEvent('click', node, { ctrlKey: true }));
      expect(selectedNodes.value).toEqual([]);
    });
  });

  describe('Delete Selected', () => {
    it('should delete selected nodes', () => {
      const { selectNodes, deleteSelected, selectedNodes, initTransformer } = useKonvaSelection(stageRef, mainLayerRef, transformerLayerRef);
      
      initTransformer();
      const mockNodes = [createMockRect(), createMockRect()];
      selectNodes(mockNodes);
      
      deleteSelected();
      
      mockNodes.forEach(node => {
        expect(node.destroy).toHaveBeenCalled();
      });
      expect(selectedNodes.value).toEqual([]);
      expect(mainLayerRef.value.batchDraw).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle null stage', () => {
      const nullStageRef = ref(null);
      const { startSelection, isSelecting } = useKonvaSelection(nullStageRef, mainLayerRef, transformerLayerRef);
      
      const event = createMockEvent('mousedown');
      startSelection(event);
      
      expect(isSelecting.value).toBe(false);
    });

    it('should handle null main layer', () => {
      const nullLayerRef = ref(null);
      const { startSelection } = useKonvaSelection(stageRef, nullLayerRef, transformerLayerRef);
      
      // Should not throw
      expect(() => startSelection(createMockEvent('mousedown'))).not.toThrow();
    });

    it('should handle null pointer position', () => {
      const { startSelection, isSelecting } = useKonvaSelection(stageRef, mainLayerRef, transformerLayerRef);
      
      stageRef.value.getPointerPosition = vi.fn(() => null);
      
      const event = createMockEvent('mousedown');
      startSelection(event);
      
      expect(isSelecting.value).toBe(false);
    });
  });
});