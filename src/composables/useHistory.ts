// src/composables/useHistory.js
import { ref } from "vue";

export function useHistory(canvas) {
  const history = ref([]);
  const historyIndex = ref(-1);

  function saveState() {
    const state = JSON.stringify(canvas);
    if (historyIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyIndex.value + 1);
    }
    history.value.push(state);
    historyIndex.value++;
  }

  function undo() {
    if (historyIndex.value > 0) {
      historyIndex.value--;
      canvas.loadFromJSON(history.value[historyIndex.value]);
      canvas.renderAll();
    }
  }

  function redo() {
    if (historyIndex.value < history.value.length - 1) {
      historyIndex.value++;
      canvas.loadFromJSON(history.value[historyIndex.value]);
      canvas.renderAll();
    }
  }

  return { saveState, undo, redo };
}
export default useHistory;
