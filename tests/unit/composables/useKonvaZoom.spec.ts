import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ref } from 'vue';
import { useKonvaZoom } from '@/composables/konva/useKonvaZoom';
import { createMockStage, createMockRect } from '../../mocks/konva';

describe('useKonvaZoom', () => {
  let stageRef: any;

  beforeEach(() => {
    stageRef = ref(createMockStage());
    vi.clearAllMocks();
  });

  describe('Wheel Zoom', () => {
    it('should zoom in on wheel up with ctrl', () => {
      const { handleWheel, zoomLevel } = useKonvaZoom(stageRef);
      
      const event = new WheelEvent('wheel', {
        deltaY: -100,
        ctrlKey: true,
      });
      event.preventDefault = vi.fn();
      
      handleWheel(event);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(stageRef.value.scale).toHaveBeenCalled();
      expect(zoomLevel.value).toBeGreaterThan(1);
    });

    it('should zoom out on wheel down with ctrl', () => {
      const { handleWheel, zoomLevel } = useKonvaZoom(stageRef);
      
      const event = new WheelEvent('wheel', {
        deltaY: 100,
        ctrlKey: true,
      });
      event.preventDefault = vi.fn();
      
      handleWheel(event);
      
      expect(stageRef.value.scale).toHaveBeenCalled();
      expect(zoomLevel.value).toBeLessThan(1);
    });

    it('should not zoom without ctrl/cmd key', () => {
      const { handleWheel, zoomLevel } = useKonvaZoom(stageRef);
      
      const event = new WheelEvent('wheel', {
        deltaY: -100,
        ctrlKey: false,
      });
      event.preventDefault = vi.fn();
      
      handleWheel(event);
      
      expect(stageRef.value.scale).not.toHaveBeenCalled();
      expect(zoomLevel.value).toBe(1);
    });

    it('should zoom with metaKey (cmd on Mac)', () => {
      const { handleWheel } = useKonvaZoom(stageRef);
      
      const event = new WheelEvent('wheel', {
        deltaY: -100,
        metaKey: true,
      });
      event.preventDefault = vi.fn();
      
      handleWheel(event);
      
      expect(stageRef.value.scale).toHaveBeenCalled();
    });

    it('should respect min zoom limit', () => {
      const { handleWheel, zoomLevel, minZoom } = useKonvaZoom(stageRef);
      
      // Set initial scale very low
      stageRef.value.scaleX = vi.fn(() => 0.15);
      
      const event = new WheelEvent('wheel', {
        deltaY: 100, // Zoom out
        ctrlKey: true,
      });
      event.preventDefault = vi.fn();
      
      handleWheel(event);
      
      expect(zoomLevel.value).toBeGreaterThanOrEqual(minZoom);
    });

    it('should respect max zoom limit', () => {
      const { handleWheel, zoomLevel, maxZoom } = useKonvaZoom(stageRef);
      
      // Set initial scale very high
      stageRef.value.scaleX = vi.fn(() => 9.5);
      
      const event = new WheelEvent('wheel', {
        deltaY: -100, // Zoom in
        ctrlKey: true,
      });
      event.preventDefault = vi.fn();
      
      handleWheel(event);
      
      expect(zoomLevel.value).toBeLessThanOrEqual(maxZoom);
    });

    it('should handle null pointer position', () => {
      const { handleWheel } = useKonvaZoom(stageRef);
      
      stageRef.value.getPointerPosition = vi.fn(() => null);
      
      const event = new WheelEvent('wheel', {
        deltaY: -100,
        ctrlKey: true,
      });
      event.preventDefault = vi.fn();
      
      handleWheel(event);
      
      expect(stageRef.value.scale).not.toHaveBeenCalled();
    });

    it('should handle null stage', () => {
      const nullStageRef = ref(null);
      const { handleWheel } = useKonvaZoom(nullStageRef);
      
      const event = new WheelEvent('wheel', {
        deltaY: -100,
        ctrlKey: true,
      });
      
      // Should not throw
      expect(() => handleWheel(event)).not.toThrow();
    });
  });

  describe('Zoom Controls', () => {
    it('should zoom in', () => {
      const { zoomIn, zoomLevel } = useKonvaZoom(stageRef);
      
      zoomIn();
      
      expect(stageRef.value.scale).toHaveBeenCalled();
      expect(zoomLevel.value).toBeGreaterThan(1);
    });

    it('should zoom out', () => {
      const { zoomOut, zoomLevel } = useKonvaZoom(stageRef);
      
      zoomOut();
      
      expect(stageRef.value.scale).toHaveBeenCalled();
      expect(zoomLevel.value).toBeLessThan(1);
    });

    it('should zoom to specific point', () => {
      const { zoomToPoint, zoomLevel } = useKonvaZoom(stageRef);
      
      const point = { x: 200, y: 200 };
      const scale = 2;
      
      zoomToPoint(point, scale);
      
      expect(stageRef.value.scale).toHaveBeenCalledWith({ x: 2, y: 2 });
      expect(stageRef.value.position).toHaveBeenCalled();
      expect(zoomLevel.value).toBe(2);
    });

    it('should limit zoom when zooming to point', () => {
      const { zoomToPoint, zoomLevel, maxZoom } = useKonvaZoom(stageRef);
      
      const point = { x: 100, y: 100 };
      const scale = 20; // Exceeds max
      
      zoomToPoint(point, scale);
      
      expect(zoomLevel.value).toBe(maxZoom);
    });

    it('should handle null stage for zoom controls', () => {
      const nullStageRef = ref(null);
      const { zoomIn, zoomOut, zoomToPoint } = useKonvaZoom(nullStageRef);
      
      // Should not throw
      expect(() => {
        zoomIn();
        zoomOut();
        zoomToPoint({ x: 100, y: 100 }, 2);
      }).not.toThrow();
    });
  });

  describe('Reset Zoom', () => {
    it('should reset zoom to 100%', () => {
      const { zoomIn, resetZoom, zoomLevel } = useKonvaZoom(stageRef);
      
      // First zoom in
      zoomIn();
      expect(zoomLevel.value).toBeGreaterThan(1);
      
      // Then reset
      resetZoom();
      
      expect(stageRef.value.scale).toHaveBeenCalledWith({ x: 1, y: 1 });
      expect(stageRef.value.position).toHaveBeenCalledWith({ x: 0, y: 0 });
      expect(zoomLevel.value).toBe(1);
    });

    it('should handle null stage', () => {
      const nullStageRef = ref(null);
      const { resetZoom } = useKonvaZoom(nullStageRef);
      
      // Should not throw
      expect(() => resetZoom()).not.toThrow();
    });
  });

  describe('Fit to Screen', () => {
    it('should fit content to screen', () => {
      const { fitToScreen, zoomLevel } = useKonvaZoom(stageRef);
      
      const mockShapes = [
        { ...createMockRect(), getClientRect: vi.fn(() => ({ x: 0, y: 0, width: 100, height: 100 })) },
        { ...createMockRect(), getClientRect: vi.fn(() => ({ x: 100, y: 100, width: 100, height: 100 })) },
      ];
      
      stageRef.value.find = vi.fn(() => mockShapes);
      stageRef.value.width = vi.fn(() => 800);
      stageRef.value.height = vi.fn(() => 600);
      
      fitToScreen();
      
      expect(stageRef.value.scale).toHaveBeenCalled();
      expect(stageRef.value.position).toHaveBeenCalled();
      expect(zoomLevel.value).toBeGreaterThan(0);
    });

    it('should handle empty canvas', () => {
      const { fitToScreen, zoomLevel } = useKonvaZoom(stageRef);
      
      stageRef.value.find = vi.fn(() => []);
      
      fitToScreen();
      
      expect(stageRef.value.scale).not.toHaveBeenCalled();
      expect(zoomLevel.value).toBe(1);
    });

    it('should respect zoom limits when fitting', () => {
      const { fitToScreen, zoomLevel, minZoom, maxZoom } = useKonvaZoom(stageRef);
      
      const mockShapes = [
        { ...createMockRect(), getClientRect: vi.fn(() => ({ x: 0, y: 0, width: 10000, height: 10000 })) },
      ];
      
      stageRef.value.find = vi.fn(() => mockShapes);
      stageRef.value.width = vi.fn(() => 800);
      stageRef.value.height = vi.fn(() => 600);
      
      fitToScreen();
      
      expect(zoomLevel.value).toBeGreaterThanOrEqual(minZoom);
      expect(zoomLevel.value).toBeLessThanOrEqual(maxZoom);
    });

    it('should handle null stage', () => {
      const nullStageRef = ref(null);
      const { fitToScreen } = useKonvaZoom(nullStageRef);
      
      // Should not throw
      expect(() => fitToScreen()).not.toThrow();
    });
  });

  describe('Get Zoom Percentage', () => {
    it('should return zoom percentage', () => {
      const { getZoomPercentage } = useKonvaZoom(stageRef);
      
      expect(getZoomPercentage()).toBe(100);
    });

    it('should return correct percentage after zoom', () => {
      const { zoomIn, getZoomPercentage } = useKonvaZoom(stageRef);
      
      zoomIn();
      
      expect(getZoomPercentage()).toBe(110);
    });

    it('should round percentage', () => {
      const { zoomToPoint, getZoomPercentage } = useKonvaZoom(stageRef);
      
      zoomToPoint({ x: 100, y: 100 }, 1.256);
      
      expect(getZoomPercentage()).toBe(126);
    });
  });
});