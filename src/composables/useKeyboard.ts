import { onKeyStroke } from "@vueuse/core";
import { IText, Canvas as FabricJSCanvas } from "fabric";
import { useEventListener } from "@vueuse/core";
import { Ref } from "vue";

export default function useKeyboard(
  canvasRef: Ref<FabricJSCanvas | null>,
  {
    onUndo,
    onRedo,
    onSelectAll,
    onDelete,
    onPaste
  }: {
    onUndo: () => void;
    onRedo: () => void;
    onSelectAll: () => void;
    onDelete: (objects: any[]) => void;
    onPaste: (e: ClipboardEvent) => void;
  }
) {
  // Handle Ctrl/Cmd + Z for undo/redo
  onKeyStroke("z", (e) => {
    if (e.metaKey) {
      e.preventDefault();
      if (e.shiftKey) {
        onRedo();
      } else {
        onUndo();
      }
    }
  });

  // Handle Ctrl/Cmd + A for select all
  onKeyStroke("a", (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      onSelectAll();
    }
  });

  // Handle Delete/Backspace
  onKeyStroke(["Delete", "Backspace"], (e) => {
    if (!canvasRef.value) return;
    const activeObj = canvasRef.value.getActiveObject();

    // If the active object is text and it's currently being edited,
    // let the default text editing behavior happen.
    if (activeObj && activeObj.type === "i-text" && (activeObj as IText).isEditing) {
      return;
    }
    onDelete(canvasRef.value.getActiveObjects());
    canvasRef.value.discardActiveObject();
    canvasRef.value.requestRenderAll();
  });

  // Handle paste
  useEventListener("paste", onPaste);
}
