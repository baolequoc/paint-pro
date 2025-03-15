<template>
  <div class="editor-container">
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
      @apply-crop="applyCrop"
      @export="exportCanvas"
      @clear="clearCanvas"
    />

    <div ref="canvasContainer" class="canvas-container">
      <canvas ref="canvasEl" tabindex="0" />
      <ResizeFrame :container="canvasContainer" @resize="resizeCanvas" />
      <!-- Hidden file input -->
      <input ref="fileInput" type="file" accept="image/*" style="display: none" @change="handleFileUpload" />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, nextTick, useTemplateRef } from "vue";
  import {
    Canvas as FabricJSCanvas,
    Rect,
    IText,
    PencilBrush,
    FabricImage,
    FabricObject,
    FabricObjectProps,
    ObjectEvents,
    SerializedObjectProps
  } from "fabric";
  import { useEventListener } from "@vueuse/core";
  import ResizeFrame from "./ResizeFrame.vue";
  import Toolbox from "./Toolbox.vue";
  import useFile from "../composables/useFile";

  // --- Template Refs ---
  const canvasEl = useTemplateRef<HTMLCanvasElement>("canvasEl");
  const fileInput = useTemplateRef<HTMLInputElement>("fileInput");
  const canvasContainer = useTemplateRef<HTMLDivElement>("canvasContainer");

  // --- Reactive State & Variables ---
  const activeTool = ref<"select" | "brush" | "rectangle" | "text">("select");
  let canvas: FabricJSCanvas | null = null;
  let selectedImage: FabricObject<Partial<FabricObjectProps>, SerializedObjectProps, ObjectEvents> | null = null;
  const isCropping = ref(false);
  let cropRect: FabricObject<Partial<FabricObjectProps>, SerializedObjectProps, ObjectEvents> | null = null;
  const brushColor = ref("#000000");
  const shapeColor = ref("#000000");
  const strokeWidth = ref(2);

  const { getDataFromFile } = useFile();

  // --- Helper Functions ---

  function updateBrushColor(color: string): void {
    if (!canvas) return;
    if (activeTool.value === "brush") {
      if (!canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush = new PencilBrush(canvas);
      }
      canvas.freeDrawingBrush.color = color;
    }
    brushColor.value = color;
  }

  function resizeCanvas({ width, height }: { width: number; height: number }): void {
    canvas?.setDimensions({ width, height });
  }

  function removeCanvasObjects(
    objects: FabricObject<Partial<FabricObjectProps>, SerializedObjectProps, ObjectEvents>[]
  ): void {
    objects.forEach((obj) => canvas?.remove(obj));
  }

  function addObjectAndSetActive(
    obj: FabricObject<Partial<FabricObjectProps>, SerializedObjectProps, ObjectEvents>
  ): void {
    canvas?.add(obj);
    canvas?.setActiveObject(obj);
    canvas?.requestRenderAll();
  }

  async function readFileAsDataURL(file: File): Promise<string | ArrayBuffer | null> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  // --- Event Handlers ---

  async function handlePaste(e: ClipboardEvent): Promise<void> {
    const items = e.clipboardData?.items;
    if (!items) return;

    const imagePromises = Array.from(items)
      .filter((item) => item.type.startsWith("image"))
      .map((item) => getDataFromFile(item.getAsFile()));

    const imageDataUrls = await Promise.all(imagePromises);

    imageDataUrls
      .filter((data) => data !== null)
      .forEach(async ({ dataURL }) => {
        const img = await FabricImage.fromURL(dataURL as string, { crossOrigin: "anonymous" });
        const scale = Math.min(canvas!.width / img.width!, canvas!.height / img.height!, 1);
        img.scale(scale);
        img.set({ left: 50, top: 50 });
        addObjectAndSetActive(img);
      });
  }

  function handleKeyDown(e: KeyboardEvent): void {
    const activeObj = canvas?.getActiveObject();

    // Allow default text editing when in IText edit mode
    if (activeObj && activeObj.type === "i-text" && (activeObj as IText).isEditing) return;

    if (["Delete", "Backspace"].includes(e.key)) {
      removeCanvasObjects(canvas?.getActiveObjects() || []);
      canvas?.discardActiveObject();
      canvas?.requestRenderAll();
    }
  }

  function updateShapeColor(color: string): void {
    const activeObj = canvas?.getActiveObject();
    if (activeObj) {
      shapeColor.value = color;
      activeObj.set("fill", shapeColor.value);
      canvas?.renderAll();
    }
  }

  // --- Canvas Initialization & Event Listener Registration ---
  onMounted(async () => {
    await nextTick();
    canvas = new FabricJSCanvas(canvasEl.value, {
      width: 800,
      height: 600,
      backgroundColor: "#ffffff",
      isDrawingMode: false
    });

    canvasEl.value?.focus();
    canvas.renderAll();
  });

  useEventListener("paste", handlePaste);
  useEventListener("keydown", handleKeyDown);

  // --- Tool Definitions ---
  const tools = {
    select: () => {
      if (canvas) canvas.isDrawingMode = false;
    },
    brush: () => {
      if (canvas) {
        canvas.isDrawingMode = true;
        canvas.freeDrawingBrush = new PencilBrush(canvas);
        canvas.freeDrawingBrush.width = 5;
        canvas.freeDrawingBrush.color = "#000000";
      }
    },
    rectangle: () => {
      if (canvas) {
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
        addObjectAndSetActive(rect);
      }
    },
    text: () => {
      if (canvas) {
        canvas.isDrawingMode = false;
        const text = new IText("Edit me", {
          left: 100,
          top: 100,
          fontSize: 20
        });
        addObjectAndSetActive(text);
      }
    }
  };

  function setTool(toolName: keyof typeof tools): void {
    activeTool.value = toolName;
    tools[toolName]?.();
  }

  // --- File Upload Handling ---
  function triggerImageUpload(): void {
    const activeObj = canvas?.getActiveObject();
    selectedImage = activeObj && activeObj.type === "image" ? activeObj : null;
    fileInput.value?.click();
  }

  function triggerNewImageUpload(): void {
    selectedImage = null;
    fileInput.value?.click();
  }

  async function handleFileUpload(event: Event): Promise<void> {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    const dataURL = await readFileAsDataURL(file);
    const img = await FabricImage.fromURL(dataURL as string, { crossOrigin: "anonymous" });
    const scale = Math.min(canvas!.width / img.width, canvas!.height / img.height, 1);

    img.set({ left: 50, top: 50, scaleX: scale, scaleY: scale });

    if (selectedImage) {
      img.set({
        left: selectedImage.left,
        top: selectedImage.top,
        scaleX: selectedImage.scaleX,
        scaleY: selectedImage.scaleY,
        angle: selectedImage.angle
      });
      removeCanvasObjects([selectedImage]);
    }

    addObjectAndSetActive(img);
    selectedImage = img;
    target.value = "";
  }

  // --- Canvas Export & Clear ---
  function exportCanvas(): void {
    if (!canvas) return;
    const dataURL = canvas.toDataURL({ format: "png", quality: 1.0, multiplier: 1 });
    const link = document.createElement("a");
    link.download = "canvas-export.png";
    link.href = dataURL;
    link.click();
  }

  function clearCanvas(): void {
    if (!canvas) return;
    canvas.clear();
    canvas.backgroundColor = "#ffffff";
    canvas.requestRenderAll();
  }

  // --- Cropping Functions ---
  function startCrop(): void {
    const active = canvas?.getActiveObject();
    if (!active || active.type !== "image") {
      alert("Please select an image to crop.");
      return;
    }

    isCropping.value = true;
    selectedImage = active;

    cropRect = new Rect({
      left: active.left + 20,
      top: active.top + 20,
      width: 100,
      height: 100,
      fill: "rgba(0, 123, 255, 0.2)",
      stroke: "#0056b3",
      strokeWidth: 2,
      hasRotatingPoint: false,
      cornerStyle: "circle",
      transparentCorners: false
    });

    canvas?.add(cropRect);
    canvas?.setActiveObject(cropRect);
    canvas?.bringObjectToFront(cropRect);
    canvas?.requestRenderAll();
  }

  async function applyCrop(): Promise<void> {
    if (!selectedImage || !cropRect || !canvas) return;

    const rect = cropRect.getBoundingRect();
    const img = selectedImage;
    const { scaleX, scaleY } = img;

    const cropX = (rect.left - img.left) / scaleX;
    const cropY = (rect.top - img.top) / scaleY;
    const cropWidth = rect.width / scaleX;
    const cropHeight = rect.height / scaleY;

    // Create a temporary canvas for the cropped image
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = cropWidth;
    tempCanvas.height = cropHeight;
    const ctx = tempCanvas.getContext("2d");
    if (ctx) {
      const source = img._element;
      ctx.drawImage(source, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
    }

    const croppedDataUrl = tempCanvas.toDataURL();
    const newImg = await FabricImage.fromURL(croppedDataUrl, { crossOrigin: "anonymous" });
    newImg.set({
      left: img.left + (rect.left - img.left),
      top: img.top + (rect.top - img.top)
    });

    removeCanvasObjects([img, cropRect]);
    cropRect = null;
    selectedImage = null;
    isCropping.value = false;
    canvas.add(newImg);
    canvas.setActiveObject(newImg);
    canvas.requestRenderAll();
  }
</script>

<style scoped>
  @import url("https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css");

  .editor-container {
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    background-color: #f0f4f8; /* Softer background */
  }

  .canvas-container {
    position: relative;
    width: fit-content;
    height: fit-content;
    background-color: #f0f4f8;
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.05);
    border: #3182ce;
    border-width: 10px;
    resize: both;
  }

  canvas {
    display: block;
    width: 100%;
    height: 100%;
    outline: none;
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .toolbar {
      padding: 12px;
      gap: 8px;
      flex-direction: column;
    }

    .tool-group {
      width: 100%;
      justify-content: space-between;
    }
  }
</style>
