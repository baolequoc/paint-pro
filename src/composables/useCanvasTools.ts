// src/composables/useCanvasTools.js
import { ref } from "vue";
import { FabricJSCanvas, Rect, Ellipse, Line, IText } from "fabric";

export function useCanvasTools(canvas) {
  const activeTool = ref("select");

  const tools = {
    brush: () => {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush.width = 5;
      canvas.freeDrawingBrush.color = "#000000";
    },
    rectangle: () => {
      canvas.isDrawingMode = false;
      const rect = new Rect({
        left: 100,
        top: 100,
        width: 100,
        height: 100,
        fill: "transparent",
        stroke: "black",
        strokeWidth: 2
      });
      canvas.add(rect);
    },
    text: () => {
      canvas.isDrawingMode = false;
      const text = new IText("Edit me", {
        left: 100,
        top: 100,
        fontSize: 20
      });
      canvas.add(text);
    }
  };

  function setTool(toolName) {
    activeTool.value = toolName;
    tools[toolName]?.();
  }
  function exportCanvas() {
    const dataURL = canvas.toDataURL({
      format: "png",
      quality: 1.0
    });
    const link = document.createElement("a");
    link.download = "canvas-export.png";
    link.href = dataURL;
    link.click();
  }

  function exportJSON() {
    const json = JSON.stringify(canvas);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = "canvas-project.json";
    link.href = url;
    link.click();
  }

  return { activeTool, setTool, exportCanvas, exportJSON };
}

export default useCanvasTools;
