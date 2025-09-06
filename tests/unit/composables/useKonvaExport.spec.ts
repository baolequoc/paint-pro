import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ref } from 'vue';
import { useKonvaExport } from '@/composables/konva/useKonvaExport';
import { createMockStage, createMockTransformer, createMockRect } from '../../mocks/konva';

// Mock fetch
global.fetch = vi.fn(() =>
  Promise.resolve({
    blob: () => Promise.resolve(new Blob(['test'], { type: 'image/png' })),
  } as Response)
);

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: {
    write: vi.fn(() => Promise.resolve()),
  },
  configurable: true,
});

// Mock ClipboardItem
global.ClipboardItem = vi.fn((items) => items) as any;

// Mock document methods
const mockLink = {
  download: '',
  href: '',
  click: vi.fn(),
};

document.createElement = vi.fn((tag) => {
  if (tag === 'a') return mockLink as any;
  return document.createElement.call(document, tag);
});

document.body.appendChild = vi.fn();
document.body.removeChild = vi.fn();

describe('useKonvaExport', () => {
  let stageRef: any;
  let transformerRef: any;

  beforeEach(() => {
    stageRef = ref(createMockStage());
    transformerRef = ref(createMockTransformer());
    vi.clearAllMocks();
  });

  describe('Export to Data URL', () => {
    it('should export stage to data URL', () => {
      const { exportToDataURL } = useKonvaExport(stageRef, transformerRef);
      
      const dataURL = exportToDataURL();
      
      expect(dataURL).toBe('data:image/png;base64,mock');
      expect(stageRef.value.toDataURL).toHaveBeenCalledWith({
        mimeType: 'image/png',
        quality: 1,
        pixelRatio: 2,
      });
    });

    it('should hide transformer during export', () => {
      transformerRef.value.visible = vi.fn((val?: boolean) => val === undefined ? true : undefined);
      const { exportToDataURL } = useKonvaExport(stageRef, transformerRef);
      
      exportToDataURL();
      
      expect(transformerRef.value.visible).toHaveBeenCalledWith(false);
      expect(transformerRef.value.visible).toHaveBeenCalledWith(true);
    });

    it('should use custom export config', () => {
      const { exportToDataURL } = useKonvaExport(stageRef, transformerRef);
      
      const config = {
        mimeType: 'image/jpeg' as const,
        quality: 0.8,
        pixelRatio: 3,
      };
      
      exportToDataURL(config);
      
      expect(stageRef.value.toDataURL).toHaveBeenCalledWith({
        mimeType: 'image/jpeg',
        quality: 0.8,
        pixelRatio: 3,
      });
    });

    it('should handle null stage', () => {
      const nullStageRef = ref(null);
      const { exportToDataURL } = useKonvaExport(nullStageRef, transformerRef);
      
      const result = exportToDataURL();
      
      expect(result).toBeNull();
    });
  });

  describe('Export Selection', () => {
    it('should export selected area', () => {
      const mockNodes = [
        { ...createMockRect(), getClientRect: vi.fn(() => ({ x: 10, y: 10, width: 100, height: 100 })) },
        { ...createMockRect(), getClientRect: vi.fn(() => ({ x: 50, y: 50, width: 100, height: 100 })) },
      ];
      transformerRef.value.nodes = vi.fn(() => mockNodes);
      
      const { exportSelection } = useKonvaExport(stageRef, transformerRef);
      const dataURL = exportSelection();
      
      expect(dataURL).toBe('data:image/png;base64,mock');
      expect(stageRef.value.toDataURL).toHaveBeenCalledWith({
        x: 10,
        y: 10,
        width: 140,
        height: 140,
        mimeType: 'image/png',
        quality: 1,
        pixelRatio: 2,
      });
    });

    it('should return null for empty selection', () => {
      transformerRef.value.nodes = vi.fn(() => []);
      
      const { exportSelection } = useKonvaExport(stageRef, transformerRef);
      const result = exportSelection();
      
      expect(result).toBeNull();
    });

    it('should handle null transformer', () => {
      const nullTransformerRef = ref(null);
      const { exportSelection } = useKonvaExport(stageRef, nullTransformerRef);
      
      const result = exportSelection();
      
      expect(result).toBeNull();
    });
  });

  describe('Export to PNG', () => {
    it('should export and download as PNG', () => {
      const { exportToPNG } = useKonvaExport(stageRef, transformerRef);
      
      exportToPNG('test-image.png');
      
      expect(mockLink.download).toBe('test-image.png');
      expect(mockLink.href).toBe('data:image/png;base64,mock');
      expect(mockLink.click).toHaveBeenCalled();
      expect(document.body.appendChild).toHaveBeenCalled();
      expect(document.body.removeChild).toHaveBeenCalled();
    });

    it('should use default filename', () => {
      const { exportToPNG } = useKonvaExport(stageRef, transformerRef);
      
      exportToPNG();
      
      expect(mockLink.download).toBe('canvas-export.png');
    });

    it('should handle null stage', () => {
      const nullStageRef = ref(null);
      const { exportToPNG } = useKonvaExport(nullStageRef, transformerRef);
      
      exportToPNG();
      
      expect(mockLink.click).not.toHaveBeenCalled();
    });
  });

  describe('Export to JPEG', () => {
    it('should export and download as JPEG', () => {
      const { exportToJPEG } = useKonvaExport(stageRef, transformerRef);
      
      exportToJPEG('test-image.jpg', 0.95);
      
      expect(mockLink.download).toBe('test-image.jpg');
      expect(stageRef.value.toDataURL).toHaveBeenCalledWith({
        mimeType: 'image/jpeg',
        quality: 0.95,
        pixelRatio: 2,
      });
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('should use default quality', () => {
      const { exportToJPEG } = useKonvaExport(stageRef, transformerRef);
      
      exportToJPEG('test.jpg');
      
      expect(stageRef.value.toDataURL).toHaveBeenCalledWith({
        mimeType: 'image/jpeg',
        quality: 0.9,
        pixelRatio: 2,
      });
    });
  });

  describe('Copy to Clipboard', () => {
    it('should copy canvas to clipboard', async () => {
      const { copyToClipboard } = useKonvaExport(stageRef, transformerRef);
      
      const result = await copyToClipboard();
      
      expect(result).toBe(true);
      expect(fetch).toHaveBeenCalledWith('data:image/png;base64,mock');
      expect(navigator.clipboard.write).toHaveBeenCalled();
    });

    it('should copy selection to clipboard', async () => {
      const mockNodes = [createMockRect()];
      transformerRef.value.nodes = vi.fn(() => mockNodes);
      
      const { copyToClipboard } = useKonvaExport(stageRef, transformerRef);
      const result = await copyToClipboard(true);
      
      expect(result).toBe(true);
    });

    it('should handle clipboard errors', async () => {
      const mockError = new Error('Clipboard error');
      (navigator.clipboard.write as any).mockRejectedValueOnce(mockError);
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { copyToClipboard } = useKonvaExport(stageRef, transformerRef);
      
      const result = await copyToClipboard();
      
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to copy to clipboard:', mockError);
      
      consoleSpy.mockRestore();
    });

    it('should handle null stage', async () => {
      const nullStageRef = ref(null);
      const { copyToClipboard } = useKonvaExport(nullStageRef, transformerRef);
      
      const result = await copyToClipboard();
      
      expect(result).toBe(false);
    });
  });

  describe('JSON Export/Import', () => {
    it('should export to JSON', () => {
      const { exportToJSON } = useKonvaExport(stageRef, transformerRef);
      
      const json = exportToJSON();
      
      expect(json).toBe(JSON.stringify({ mock: true }));
      expect(stageRef.value.toJSON).toHaveBeenCalled();
    });

    it('should handle null stage for JSON export', () => {
      const nullStageRef = ref(null);
      const { exportToJSON } = useKonvaExport(nullStageRef, transformerRef);
      
      const result = exportToJSON();
      
      expect(result).toBeNull();
    });

    it('should load from JSON', async () => {
      const { loadFromJSON } = useKonvaExport(stageRef, transformerRef);
      
      // Mock dynamic import
      vi.mock('konva', () => ({
        default: {
          Node: {
            create: vi.fn(() => createMockStage()),
          },
        },
      }));
      
      const json = JSON.stringify({ test: 'data' });
      loadFromJSON(json);
      
      expect(stageRef.value.destroy).toHaveBeenCalled();
    });

    it('should handle null stage for JSON load', () => {
      const nullStageRef = ref(null);
      const { loadFromJSON } = useKonvaExport(nullStageRef, transformerRef);
      
      // Should not throw
      expect(() => loadFromJSON('{"test": "data"}')).not.toThrow();
    });
  });

  describe('Export to Blob', () => {
    it('should export to blob', async () => {
      const { exportToBlob } = useKonvaExport(stageRef, transformerRef);
      
      const blob = await exportToBlob();
      
      expect(blob).toBeInstanceOf(Blob);
      expect(fetch).toHaveBeenCalledWith('data:image/png;base64,mock');
    });

    it('should use custom config for blob export', async () => {
      const { exportToBlob } = useKonvaExport(stageRef, transformerRef);
      
      const config = {
        mimeType: 'image/jpeg' as const,
        quality: 0.7,
      };
      
      await exportToBlob(config);
      
      expect(stageRef.value.toDataURL).toHaveBeenCalledWith({
        mimeType: 'image/jpeg',
        quality: 0.7,
        pixelRatio: 2,
      });
    });

    it('should handle null stage', async () => {
      const nullStageRef = ref(null);
      const { exportToBlob } = useKonvaExport(nullStageRef, transformerRef);
      
      const result = await exportToBlob();
      
      expect(result).toBeNull();
    });
  });
});