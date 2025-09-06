import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ref } from 'vue';
import { useKonvaImage } from '@/composables/konva/useKonvaImage';
import { createMockLayer, createMockImage, createMockRect, createMockCircle } from '../../mocks/konva';

// Mock Konva
vi.mock('konva', () => ({
  default: {
    Image: {
      fromURL: vi.fn((url, callback) => {
        const mockImage = createMockImage({ width: 400, height: 300 });
        callback(mockImage);
      }),
    },
    Rect: vi.fn((config) => createMockRect(config)),
    Circle: vi.fn((config) => createMockCircle(config)),
  },
}));

// Mock FileReader
global.FileReader = vi.fn(() => ({
  readAsDataURL: vi.fn(function(this: any) {
    setTimeout(() => {
      this.onload?.({ target: { result: 'data:image/png;base64,test' } });
    }, 0);
  }),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
})) as any;

// Mock URL
global.URL.createObjectURL = vi.fn(() => 'blob:test-url');
global.URL.revokeObjectURL = vi.fn();

describe('useKonvaImage', () => {
  let mainLayerRef: any;

  beforeEach(() => {
    mainLayerRef = ref(createMockLayer());
    vi.clearAllMocks();
  });

  describe('Image Loading', () => {
    it('should load image from URL', async () => {
      const { loadImage } = useKonvaImage(mainLayerRef);
      
      const image = await loadImage('test-image.png', 100, 100);
      
      expect(image).toBeDefined();
      expect(image?.setAttrs).toHaveBeenCalledWith({
        x: 100,
        y: 100,
        draggable: true,
        name: 'selectable',
      });
      expect(mainLayerRef.value.add).toHaveBeenCalledWith(image);
      expect(mainLayerRef.value.batchDraw).toHaveBeenCalled();
    });

    it('should scale large images to fit screen', async () => {
      // Mock large window size
      Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true });
      Object.defineProperty(window, 'innerHeight', { value: 768, configurable: true });
      
      // Mock large image
      const Konva = await import('konva');
      (Konva.default.Image.fromURL as any) = vi.fn((url: string, callback: any) => {
        const mockImage = createMockImage({ width: 2000, height: 1500 });
        callback(mockImage);
      });
      
      const { loadImage } = useKonvaImage(mainLayerRef);
      const image = await loadImage('large-image.png');
      
      expect(image?.scale).toHaveBeenCalled();
    });

    it('should load image from File', async () => {
      const { loadImageFromFile } = useKonvaImage(mainLayerRef);
      
      const mockFile = new File([''], 'test.png', { type: 'image/png' });
      const image = await loadImageFromFile(mockFile, 150, 150);
      
      expect(image).toBeDefined();
      expect(mainLayerRef.value.add).toHaveBeenCalled();
    });

    it('should handle null main layer', async () => {
      const nullLayerRef = ref(null);
      const { loadImage } = useKonvaImage(nullLayerRef);
      
      const image = await loadImage('test.png');
      
      expect(image).toBeNull();
    });
  });

  describe('Clipboard Paste', () => {
    it('should handle paste from clipboard', async () => {
      const { handlePaste } = useKonvaImage(mainLayerRef);
      
      const mockBlob = new Blob([''], { type: 'image/png' });
      const mockItem = {
        type: 'image/png',
        getAsFile: vi.fn(() => mockBlob),
      };
      
      const event = {
        clipboardData: {
          items: [mockItem],
        },
      } as unknown as ClipboardEvent;
      
      await handlePaste(event);
      
      expect(URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-url');
    });

    it('should ignore non-image clipboard items', async () => {
      const { handlePaste } = useKonvaImage(mainLayerRef);
      
      const mockItem = {
        type: 'text/plain',
        getAsFile: vi.fn(),
      };
      
      const event = {
        clipboardData: {
          items: [mockItem],
        },
      } as unknown as ClipboardEvent;
      
      await handlePaste(event);
      
      expect(mockItem.getAsFile).not.toHaveBeenCalled();
    });

    it('should handle empty clipboard', async () => {
      const { handlePaste } = useKonvaImage(mainLayerRef);
      
      const event = {
        clipboardData: null,
      } as unknown as ClipboardEvent;
      
      // Should not throw
      await expect(handlePaste(event)).resolves.toBeUndefined();
    });
  });

  describe('Image Cropping', () => {
    it('should start crop on image', () => {
      const { startCrop, isCropping, cropRect } = useKonvaImage(mainLayerRef);
      
      const mockImage = createMockImage({
        x: 50,
        y: 50,
        width: 200,
        height: 150,
      });
      
      startCrop(mockImage);
      
      expect(isCropping.value).toBe(true);
      expect(cropRect.value).toBeDefined();
      expect(mainLayerRef.value.add).toHaveBeenCalled();
      expect(mainLayerRef.value.batchDraw).toHaveBeenCalled();
    });

    it('should add crop anchors', () => {
      const { startCrop } = useKonvaImage(mainLayerRef);
      
      const mockImage = createMockImage();
      let addCallCount = 0;
      mainLayerRef.value.add = vi.fn(() => addCallCount++);
      
      startCrop(mockImage);
      
      // 1 for crop rect + 4 for anchors
      expect(addCallCount).toBe(5);
    });

    it('should apply crop', async () => {
      const { startCrop, applyCrop, selectedImage, cropRect } = useKonvaImage(mainLayerRef);
      
      const mockImage = createMockImage({
        x: 0,
        y: 0,
        width: 200,
        height: 200,
        scaleX: 1,
        scaleY: 1,
        image: new Image(),
      });
      
      mainLayerRef.value.find = vi.fn(() => [
        createMockCircle(),
        createMockCircle(),
        createMockCircle(),
        createMockCircle(),
      ]);
      
      startCrop(mockImage);
      const croppedImage = await applyCrop();
      
      expect(croppedImage).toBeDefined();
      expect(mockImage.destroy).toHaveBeenCalled();
      expect(cropRect.value).toBeNull();
      expect(selectedImage.value).toBeNull();
    });

    it('should cancel crop', () => {
      const { startCrop, cancelCrop, isCropping, cropRect } = useKonvaImage(mainLayerRef);
      
      const mockImage = createMockImage();
      const mockAnchors = [createMockCircle(), createMockCircle()];
      mainLayerRef.value.find = vi.fn(() => mockAnchors);
      
      startCrop(mockImage);
      cancelCrop();
      
      expect(isCropping.value).toBe(false);
      expect(cropRect.value).toBeNull();
      mockAnchors.forEach(anchor => {
        expect(anchor.destroy).toHaveBeenCalled();
      });
    });

    it('should handle null layer when starting crop', () => {
      const nullLayerRef = ref(null);
      const { startCrop, isCropping } = useKonvaImage(nullLayerRef);
      
      const mockImage = createMockImage();
      startCrop(mockImage);
      
      expect(isCropping.value).toBe(true); // State changes but no layer operations
    });
  });

  describe('Image Replacement', () => {
    it('should replace image', async () => {
      const { replaceImage } = useKonvaImage(mainLayerRef);
      
      const oldImage = createMockImage({
        x: 100,
        y: 100,
        scale: { x: 0.5, y: 0.5 },
      });
      
      const newImage = await replaceImage(oldImage, 'new-image.png');
      
      expect(oldImage.destroy).toHaveBeenCalled();
      expect(newImage).toBeDefined();
      expect(newImage?.scale).toHaveBeenCalledWith({ x: 0.5, y: 0.5 });
    });

    it('should handle null layer when replacing', async () => {
      const nullLayerRef = ref(null);
      const { replaceImage } = useKonvaImage(nullLayerRef);
      
      const oldImage = createMockImage();
      const newImage = await replaceImage(oldImage, 'new.png');
      
      expect(oldImage.destroy).toHaveBeenCalled();
      expect(newImage).toBeNull();
    });
  });

  describe('Crop Anchor Dragging', () => {
    it('should update crop rectangle when dragging anchors', () => {
      const { startCrop, cropRect } = useKonvaImage(mainLayerRef);
      
      const mockImage = createMockImage();
      const capturedAnchors: any[] = [];
      
      mainLayerRef.value.add = vi.fn((node) => {
        if (node.className === 'Circle') {
          capturedAnchors.push(node);
        }
      });
      
      startCrop(mockImage);
      
      // Simulate dragging top-left anchor
      if (capturedAnchors.length > 0 && cropRect.value) {
        const anchor = capturedAnchors[0];
        anchor.position = vi.fn(() => ({ x: 10, y: 10 }));
        
        // Get the dragmove handler
        const onCall = anchor.on.mock.calls.find((call: any) => call[0] === 'dragmove');
        if (onCall) {
          const handler = onCall[1];
          handler();
          
          expect(cropRect.value.x).toHaveBeenCalled();
          expect(cropRect.value.width).toHaveBeenCalled();
          expect(mainLayerRef.value.batchDraw).toHaveBeenCalled();
        }
      }
    });
  });
});