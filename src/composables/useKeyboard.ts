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

  // // Handle Ctrl/Cmd + C for copy
  // onKeyStroke("c", (e) => {
  //   if (!canvasRef.value || !(e.ctrlKey || e.metaKey)) return;
  //   e.preventDefault();
    
  //   const activeObj = canvasRef.value.getActiveObject();
  //   console.log("🚀 ~ onKeyStroke ~ activeObj:", activeObj)
  //   if (!activeObj) return;

  //   // Convert the object to JSON
  //   const json = JSON.stringify(activeObj.toJSON());
  //   navigator.clipboard.writeText(json);
  // });

  // // Handle Ctrl/Cmd + V for paste
  // onKeyStroke("v", (e) => {
  //   if (!canvasRef.value || !(e.ctrlKey || e.metaKey)) return;
  //   e.preventDefault();

  //   // Get the clipboard data
  //   navigator.clipboard.readText().then((text) => {
  //     try {
  //       const json = JSON.parse(text);
  //       const obj = canvasRef.value?.loadFromJSON(json, (objects) => {
  //         if (objects && objects.length > 0) {
  //           const obj = objects[0];
  //           // Offset the pasted object slightly
  //           obj.set({
  //             left: (obj.left || 0) + 10,
  //             top: (obj.top || 0) + 10
  //           });
  //           canvasRef.value?.add(obj);
  //           canvasRef.value?.setActiveObject(obj);
  //           canvasRef.value?.requestRenderAll();
  //         }
  //       });
  //     } catch (error) {
  //       console.error('Failed to paste object:', error);
  //     }
  //   });
  // });

  // // Handle paste
  useEventListener("paste", onPaste);
}
