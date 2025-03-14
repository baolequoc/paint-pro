<!-- src/components/Toolbar.vue -->
<template>
  <div class="toolbar">
    <button @click="setTool('select')">Select</button>
    <button @click="setTool('brush')">Brush</button>
    <button @click="setTool('rectangle')">Rectangle</button>
    <button @click="setTool('text')">Text</button>
    <button @click="undo">Undo</button>
    <button @click="redo">Redo</button>
    <button @click="exportCanvas">Export PNG</button>
  </div>
</template>
<script setup lang="ts">
  import { useCanvasTools } from "@/composables/useCanvasTools";
  import { useHistory } from "@/composables/useHistory";

  const props = defineProps({
    canvas: {
      type: Object,
      required: true
    }
  });
  const { setTool, exportCanvas } = useCanvasTools(props.canvas);
  const { undo, redo } = useHistory(props.canvas);
</script>
