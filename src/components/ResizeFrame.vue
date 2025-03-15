<template>
  <!-- Resize handles -->
  <div class="resize-handle top" @mousedown="startResize('top')"></div>
  <div class="resize-handle right" @mousedown="startResize('right')"></div>
  <div class="resize-handle bottom" @mousedown="startResize('bottom')"></div>
  <div class="resize-handle left" @mousedown="startResize('left')"></div>
</template>
<script setup lang="ts">
  import { ref, defineProps, defineEmits } from "vue";

  interface ResizeFrameProps {
    container: HTMLDivElement | null;
  }

  const isResizing = ref(false);
  const currentDirection = ref<"top" | "right" | "bottom" | "left" | null>(null);
  const props = defineProps<ResizeFrameProps>();

  const emit = defineEmits(["resize"]);

  function handleResize(e: MouseEvent) {
    if (!isResizing.value || !props.container) return;

    const container = props.container;
    if (!container) return;

    const rect = container.getBoundingClientRect();

    let newWidth = rect.width;
    let newHeight = rect.height;

    if (currentDirection.value === "right") {
      newWidth = e.clientX - rect.left;
    } else if (currentDirection.value === "left") {
      newWidth = rect.right - e.clientX;
      container.style.left = `${e.clientX}px`;
    } else if (currentDirection.value === "bottom") {
      newHeight = e.clientY - rect.top;
    } else if (currentDirection.value === "top") {
      newHeight = rect.bottom - e.clientY;
      container.style.top = `${e.clientY}px`;
    }
    emit("resize", { width: newWidth, height: newHeight });
  }

  function stopResize() {
    isResizing.value = false;
    currentDirection.value = null;
  }

  function startResize(direction: "top" | "right" | "bottom" | "left") {
    isResizing.value = true;
    currentDirection.value = direction;
    document.addEventListener("mousemove", handleResize);
    document.addEventListener("mouseup", stopResize);
  }
</script>
<style scoped>
  .resize-handle {
    position: absolute;
    background: rgba(0, 123, 255, 0.6);
    z-index: 10;
    cursor: pointer;
  }

  .resize-handle.top {
    top: 0;
    left: 0;
    right: 0;
    height: 8px;
    cursor: ns-resize;
  }

  .resize-handle.right {
    top: 0;
    right: 0;
    bottom: 0;
    width: 8px;
    cursor: ew-resize;
  }

  .resize-handle.bottom {
    bottom: 0;
    left: 0;
    right: 0;
    height: 8px;
    cursor: ns-resize;
  }

  .resize-handle.left {
    top: 0;
    left: 0;
    bottom: 0;
    width: 8px;
    cursor: ew-resize;
  }
</style>
