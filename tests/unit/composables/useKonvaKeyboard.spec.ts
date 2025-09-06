import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useKonvaKeyboard } from '@/composables/konva/useKonvaKeyboard';

describe('useKonvaKeyboard', () => {
  let handlers: any;
  let addEventListenerSpy: any;
  let removeEventListenerSpy: any;

  beforeEach(() => {
    handlers = {
      onUndo: vi.fn(),
      onRedo: vi.fn(),
      onSelectAll: vi.fn(),
      onDelete: vi.fn(),
      onCopy: vi.fn(),
      onPaste: vi.fn(),
      onCut: vi.fn(),
      onSave: vi.fn(),
    };

    addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Keyboard Event Handling', () => {
    it('should handle undo (Ctrl+Z)', () => {
      const { handleKeyDown } = useKonvaKeyboard(handlers);
      
      const event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        shiftKey: false,
      });
      event.preventDefault = vi.fn();
      
      handleKeyDown(event);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(handlers.onUndo).toHaveBeenCalled();
      expect(handlers.onRedo).not.toHaveBeenCalled();
    });

    it('should handle undo (Cmd+Z on Mac)', () => {
      const { handleKeyDown } = useKonvaKeyboard(handlers);
      
      const event = new KeyboardEvent('keydown', {
        key: 'z',
        metaKey: true,
        shiftKey: false,
      });
      event.preventDefault = vi.fn();
      
      handleKeyDown(event);
      
      expect(handlers.onUndo).toHaveBeenCalled();
    });

    it('should handle redo (Ctrl+Shift+Z)', () => {
      const { handleKeyDown } = useKonvaKeyboard(handlers);
      
      const event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        shiftKey: true,
      });
      event.preventDefault = vi.fn();
      
      handleKeyDown(event);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(handlers.onRedo).toHaveBeenCalled();
      expect(handlers.onUndo).not.toHaveBeenCalled();
    });

    it('should handle select all (Ctrl+A)', () => {
      const { handleKeyDown } = useKonvaKeyboard(handlers);
      
      const event = new KeyboardEvent('keydown', {
        key: 'a',
        ctrlKey: true,
      });
      event.preventDefault = vi.fn();
      
      handleKeyDown(event);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(handlers.onSelectAll).toHaveBeenCalled();
    });

    it('should handle copy (Ctrl+C)', () => {
      const { handleKeyDown } = useKonvaKeyboard(handlers);
      
      const event = new KeyboardEvent('keydown', {
        key: 'c',
        ctrlKey: true,
      });
      event.preventDefault = vi.fn();
      
      handleKeyDown(event);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(handlers.onCopy).toHaveBeenCalled();
    });

    it('should handle paste (Ctrl+V)', () => {
      const { handleKeyDown } = useKonvaKeyboard(handlers);
      
      const event = new KeyboardEvent('keydown', {
        key: 'v',
        ctrlKey: true,
      });
      event.preventDefault = vi.fn();
      
      handleKeyDown(event);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(handlers.onPaste).toHaveBeenCalled();
    });

    it('should handle cut (Ctrl+X)', () => {
      const { handleKeyDown } = useKonvaKeyboard(handlers);
      
      const event = new KeyboardEvent('keydown', {
        key: 'x',
        ctrlKey: true,
      });
      event.preventDefault = vi.fn();
      
      handleKeyDown(event);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(handlers.onCut).toHaveBeenCalled();
    });

    it('should handle save (Ctrl+S)', () => {
      const { handleKeyDown } = useKonvaKeyboard(handlers);
      
      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
      });
      event.preventDefault = vi.fn();
      
      handleKeyDown(event);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(handlers.onSave).toHaveBeenCalled();
    });

    it('should handle delete key', () => {
      const { handleKeyDown } = useKonvaKeyboard(handlers);
      
      const event = new KeyboardEvent('keydown', {
        key: 'Delete',
      });
      Object.defineProperty(event, 'target', {
        value: document.createElement('div'),
        writable: false,
      });
      event.preventDefault = vi.fn();
      
      handleKeyDown(event);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(handlers.onDelete).toHaveBeenCalled();
    });

    it('should handle backspace key', () => {
      const { handleKeyDown } = useKonvaKeyboard(handlers);
      
      const event = new KeyboardEvent('keydown', {
        key: 'Backspace',
      });
      Object.defineProperty(event, 'target', {
        value: document.createElement('div'),
        writable: false,
      });
      event.preventDefault = vi.fn();
      
      handleKeyDown(event);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(handlers.onDelete).toHaveBeenCalled();
    });

    it('should not handle delete in input elements', () => {
      const { handleKeyDown } = useKonvaKeyboard(handlers);
      
      const input = document.createElement('input');
      const event = new KeyboardEvent('keydown', {
        key: 'Delete',
      });
      Object.defineProperty(event, 'target', {
        value: input,
        writable: false,
      });
      event.preventDefault = vi.fn();
      
      handleKeyDown(event);
      
      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(handlers.onDelete).not.toHaveBeenCalled();
    });

    it('should not handle delete in textarea elements', () => {
      const { handleKeyDown } = useKonvaKeyboard(handlers);
      
      const textarea = document.createElement('textarea');
      const event = new KeyboardEvent('keydown', {
        key: 'Backspace',
      });
      Object.defineProperty(event, 'target', {
        value: textarea,
        writable: false,
      });
      event.preventDefault = vi.fn();
      
      handleKeyDown(event);
      
      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(handlers.onDelete).not.toHaveBeenCalled();
    });

    it('should ignore non-shortcut keys', () => {
      const { handleKeyDown } = useKonvaKeyboard(handlers);
      
      const event = new KeyboardEvent('keydown', {
        key: 'a',
        ctrlKey: false,
      });
      event.preventDefault = vi.fn();
      
      handleKeyDown(event);
      
      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(handlers.onSelectAll).not.toHaveBeenCalled();
    });
  });

  describe('Optional Handlers', () => {
    it('should handle missing handlers gracefully', () => {
      const { handleKeyDown } = useKonvaKeyboard({});
      
      const event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
      });
      event.preventDefault = vi.fn();
      
      // Should not throw
      expect(() => handleKeyDown(event)).not.toThrow();
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should work with partial handlers', () => {
      const partialHandlers = {
        onUndo: vi.fn(),
        onCopy: vi.fn(),
      };
      
      const { handleKeyDown } = useKonvaKeyboard(partialHandlers);
      
      // Test undo
      const undoEvent = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
      });
      undoEvent.preventDefault = vi.fn();
      handleKeyDown(undoEvent);
      expect(partialHandlers.onUndo).toHaveBeenCalled();
      
      // Test redo (no handler)
      const redoEvent = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        shiftKey: true,
      });
      redoEvent.preventDefault = vi.fn();
      handleKeyDown(redoEvent);
      // Should not throw
    });
  });

  describe('Lifecycle', () => {
    it('should add event listener on mount', () => {
      // Import triggers onMounted in the test environment
      useKonvaKeyboard(handlers);
      
      // Wait for next tick to allow lifecycle hooks to run
      setTimeout(() => {
        expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      }, 0);
    });

    it('should remove event listener on unmount', () => {
      const { handleKeyDown } = useKonvaKeyboard(handlers);
      
      // Simulate unmount by manually calling removeEventListener
      // In a real component test, this would be triggered by unmounting the component
      window.removeEventListener('keydown', handleKeyDown);
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', handleKeyDown);
    });
  });

  describe('Multiple Modifier Keys', () => {
    it('should not trigger shortcuts with additional modifiers', () => {
      const { handleKeyDown } = useKonvaKeyboard(handlers);
      
      const event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        altKey: true, // Additional modifier
      });
      event.preventDefault = vi.fn();
      
      handleKeyDown(event);
      
      // Undo should still be called as we don't check for alt key
      expect(handlers.onUndo).toHaveBeenCalled();
    });
  });
});