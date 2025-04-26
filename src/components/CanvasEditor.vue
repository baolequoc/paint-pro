<template>
  <div class="w-screen h-screen flex flex-col items-center justify-center font-sans bg-gray-100 overflow-hidden fixed top-0 left-0">
    <Toolbox
      :active-tool="activeTool"
      :brush-color="brushColor"
      :shape-color="shapeColor"
      :stroke-width="strokeWidth"
      :is-cropping="isCropping"
      @set-tool="setTool"
      @update:brush-color="updateBrushColor"
      @update:shape-color="updateShapeColor"
      @trigger-image-upload="triggerImageUpload"
      @trigger-new-image-upload="triggerNewImageUpload"
      @start-crop="startCrop"
      @apply-crop="applyCropToCanvas"
      @export="handleExport"
      @clear="clearCanvas"
    />

    <div
      ref="canvasContainer"
      class="absolute top-0 left-0 w-screen h-screen bg-white shadow-md overflow-auto"
    >
      <div
        class="canvas-wrapper"
        style="min-width: 3000px; min-height: 3000px; position: relative;"
      >
        <canvas
          ref="canvasEl"
          tabindex="0"
          class="block absolute top-0 left-0"
          style="width: 3000px; height: 3000px;"
        />
      </div>
      <!-- Upload image -->
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        class="hidden"
        @change="handleFileUpload"
      >
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, nextTick, useTemplateRef, onUnmounted, computed } from "vue";
  import {
    Canvas as FabricJSCanvas,
    PencilBrush,
  } from "fabric";
  import Toolbox from "./Toolbox.vue";
  import useExport from "../composables/useExport";
  import useCanvas from "../composables/useCanvas";
  import useKeyboard from "../composables/useKeyboard";
  import useCrop from "../composables/useCrop";
  import useZoom from "../composables/useZoom";
  import useFileUpload from "../composables/useFileUpload";
  import useTools from "../composables/actions/useTools";
  import CanvasHistory from "../services/canvasHistory";

  const canvasEl = useTemplateRef("canvasEl");
  const fileInput = useTemplateRef("fileInput");
  const activeTool = ref("select");

  let canvas: FabricJSCanvas | null = null;
  let canvasHistory: CanvasHistory | null = null;


  const { exportCanvas } = useExport();
  const computedCanvas = computed(() => canvas);

  const {
    addObjectAndSetActive,
    removeCanvasObjects,
    clearCanvas,
    selectAll
  } = useCanvas(computedCanvas, canvasHistory);

  // Initialize crop functionality
  const { isCropping, startCrop, applyCropToCanvas, selectedImage } = useCrop(computedCanvas);

  // Initialize file upload functionality
  const {
    handleFileUpload,
    handlePaste,
    triggerImageUpload,
    triggerNewImageUpload,
  } = useFileUpload(
    computedCanvas,
    selectedImage,
    addObjectAndSetActive,
    removeCanvasObjects,
    fileInput
  );

  // Initialize keyboard handlers
  useKeyboard(computedCanvas, {
    onUndo: () => canvasHistory?.undo(),
    onRedo: () => canvasHistory?.redo(),
    onSelectAll: selectAll,
    onDelete: removeCanvasObjects,
    onPaste: handlePaste
  });

  const brushColor = ref("#000000");
  const strokeWidth = ref(2);
  const shapeColor = ref("#000000");

  function updateBrushColor(color: string) {
    if (!canvas) return;
    if (activeTool.value === "brush") {
      if (!canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush = new PencilBrush(canvas);
      }
      canvas.freeDrawingBrush.color = color;
    }
    brushColor.value = color;
  }

  function updateShapeColor(color: string) {
    if (!canvas) return;
    const activeObj = canvas.getActiveObject();
    if (activeObj) {
      shapeColor.value = color;
      activeObj.set("fill", shapeColor.value);
      canvas.renderAll();
    }
  }

  // Initialize tools
  const { setTool  } = useTools(
    computedCanvas,
    activeTool,
    brushColor,
    strokeWidth,
    addObjectAndSetActive
  );

  onMounted(async () => {
    await nextTick();
    if (!canvasEl.value) return;

    // Set a large initial canvas size
    const initialWidth = 3000;
    const initialHeight = 3000;

    canvas = new FabricJSCanvas(canvasEl.value, {
      width: initialWidth,
      height: initialHeight,
      backgroundColor: "#ffffff",
      isDrawingMode: false,
      selection: true,
      preserveObjectStacking: true
    });

    if (canvas) {
      canvasHistory = new CanvasHistory(canvas);
      canvasHistory.init();

      // Center the canvas view
      const container = canvasEl.value.parentElement;
      if (container) {
        container.scrollLeft = (initialWidth - window.innerWidth) / 2;
        container.scrollTop = (initialHeight - window.innerHeight) / 2;
      }
    }

    // Initialize zoom functionality
    const { setupZoom } = useZoom(computedCanvas);
    setupZoom();

    canvasEl.value.focus();
    canvas.renderAll();
  });

  onUnmounted(() => {
    const { cleanupZoom } = useZoom(computedCanvas);
    cleanupZoom();
  });

  function handleExport(type: 'clipboard' | 'png') {
    if (!canvas) return;
    exportCanvas(canvas, type);
  }
</script>
