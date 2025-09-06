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
  onDuplicate?: () => void;
  onGroup?: () => void;
  onUngroup?: () => void;
  onEscape?: () => void;
  // Tool shortcuts
  onSelectTool?: () => void;
  onPanTool?: () => void;
  onBrushTool?: () => void;
  onLineTool?: () => void;
  onArrowTool?: () => void;
  onRectangleTool?: () => void;
  onTextTool?: () => void;
  onImageUpload?: () => void;
  // View shortcuts
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitToScreen?: () => void;
  onExport?: () => void;
  // Text editing
  onEditText?: () => void;
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
    
    // Redo (Ctrl+Shift+Z or Ctrl+Y)
    if ((isCtrlOrCmd && e.key === 'z' && e.shiftKey) || (isCtrlOrCmd && e.key === 'y')) {
      console.log('Redo shortcut detected:', { key: e.key, shiftKey: e.shiftKey, ctrlOrCmd: isCtrlOrCmd });
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
    
    // Duplicate
    if (isCtrlOrCmd && e.key === 'd') {
      e.preventDefault();
      handlers.onDuplicate?.();
      return;
    }
    
    // Group
    if (isCtrlOrCmd && e.key === 'g' && !e.shiftKey) {
      e.preventDefault();
      handlers.onGroup?.();
      return;
    }
    
    // Ungroup
    if (isCtrlOrCmd && e.key === 'g' && e.shiftKey) {
      e.preventDefault();
      handlers.onUngroup?.();
      return;
    }
    
    // Escape
    if (e.key === 'Escape') {
      e.preventDefault();
      handlers.onEscape?.();
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
    
    // Tool shortcuts (no modifiers)
    if (!isCtrlOrCmd && !e.shiftKey && !e.altKey) {
      // Check if target is input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }
      
      switch(e.key.toLowerCase()) {
        case 'v':
          e.preventDefault();
          handlers.onSelectTool?.();
          return;
        case 'h':
          e.preventDefault();
          handlers.onPanTool?.();
          return;
        case 'b':
          e.preventDefault();
          handlers.onBrushTool?.();
          return;
        case 'l':
          e.preventDefault();
          handlers.onLineTool?.();
          return;
        case 'a':
          e.preventDefault();
          handlers.onArrowTool?.();
          return;
        case 'r':
          e.preventDefault();
          handlers.onRectangleTool?.();
          return;
        case 't':
          e.preventDefault();
          handlers.onTextTool?.();
          return;
        case 'u':
          e.preventDefault();
          handlers.onImageUpload?.();
          return;
        case 'e':
          e.preventDefault();
          handlers.onEditText?.();
          return;
        case 'f':
          e.preventDefault();
          handlers.onFitToScreen?.();
          return;
        case '+':
        case '=':
          e.preventDefault();
          handlers.onZoomIn?.();
          return;
        case '-':
        case '_':
          e.preventDefault();
          handlers.onZoomOut?.();
          return;
      }
    }
    
    // Export shortcut (Cmd/Ctrl + E)
    if (isCtrlOrCmd && e.key === 'e') {
      e.preventDefault();
      handlers.onExport?.();
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