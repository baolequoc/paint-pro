import { onMounted, onUnmounted } from 'vue';

interface KeyboardHandlers {
  onUndo?: () => void;
  onRedo?: () => void;
  onSelectAll?: () => void;
  onDelete?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onCut?: () => void;
  onSave?: () => void;
}

export function useKonvaKeyboard(handlers: KeyboardHandlers) {
  const handleKeyDown = (e: KeyboardEvent) => {
    const isCtrlOrCmd = e.ctrlKey || e.metaKey;
    
    // Undo
    if (isCtrlOrCmd && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      handlers.onUndo?.();
      return;
    }
    
    // Redo
    if (isCtrlOrCmd && e.key === 'z' && e.shiftKey) {
      e.preventDefault();
      handlers.onRedo?.();
      return;
    }
    
    // Select All
    if (isCtrlOrCmd && e.key === 'a') {
      e.preventDefault();
      handlers.onSelectAll?.();
      return;
    }
    
    // Copy
    if (isCtrlOrCmd && e.key === 'c') {
      e.preventDefault();
      handlers.onCopy?.();
      return;
    }
    
    // Paste
    if (isCtrlOrCmd && e.key === 'v') {
      e.preventDefault();
      handlers.onPaste?.();
      return;
    }
    
    // Cut
    if (isCtrlOrCmd && e.key === 'x') {
      e.preventDefault();
      handlers.onCut?.();
      return;
    }
    
    // Save
    if (isCtrlOrCmd && e.key === 's') {
      e.preventDefault();
      handlers.onSave?.();
      return;
    }
    
    // Delete
    if (e.key === 'Delete' || e.key === 'Backspace') {
      // Don't prevent default if target is input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }
      e.preventDefault();
      handlers.onDelete?.();
      return;
    }
  };
  
  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown);
  });
  
  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown);
  });
  
  return {
    handleKeyDown,
  };
}