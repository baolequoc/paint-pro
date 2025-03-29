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
      @apply-crop="applyCrop"
      @export="exportCanvas"
      @clear="clearCanvas"
    />
    <div class="p-6 max-w-sm mx-auto bg-white rounded-xl shadow-md flex items-center space-x-4">
      <div class="flex-shrink-0">
        <img
          class="h-12 w-12"
          src="/img/logo.svg"
          alt="ChitChat Logo"
        >
      </div>
      <div>
        <div class="text-xl font-medium text-black">
          ChitChat
        </div>
        <p class="text-gray-500">
          You have a new message!
        </p>
      </div>
    </div>

    <div
      ref="canvasContainer"
      class="absolute top-0 left-0 w-screen h-screen bg-white shadow-md"
    >
      <canvas
        ref="canvasEl"
        tabindex="0"
        class="block w-full h-full outline-none"
      />
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
  import { ref, onMounted, nextTick, useTemplateRef, onUnmounted } from "vue";
  import {
    Canvas as FabricJSCanvas,
    Rect,
    IText,
    PencilBrush,
    FabricImage,
    FabricObject,
    FabricObjectProps,
    ObjectEvents,
    SerializedObjectProps,
    Line
  } from "fabric";
  import { useEventListener, onKeyStroke } from "@vueuse/core";
  import Toolbox from "./Toolbox.vue";
  import useFile from "../composables/useFile";
  import CanvasHistory from "../services/canvasHistory";

  const canvasEl = useTemplateRef("canvasEl");
  const fileInput = useTemplateRef("fileInput");
  const activeTool = ref("select");
  const isCropping = ref(false);

  let canvas: FabricJSCanvas | null = null;
  let canvasHistory: CanvasHistory | null = null;
  let selectedImage: FabricObject<Partial<FabricObjectProps>, SerializedObjectProps, ObjectEvents> | null = null;
  let cropRect: FabricObject<Partial<FabricObjectProps>, SerializedObjectProps, ObjectEvents> | null = null;

  const brushColor = ref("#000000");
  const { getDataFromFile } = useFile();
  const isClearingCanvas = ref(false);

  onKeyStroke("z", (e) => {
    if (e.metaKey) {
      e.preventDefault();
      if (e.shiftKey) {
        performRedo();
      } else {
        performUndo();
      }
    }
  });

  // Undo/Redo functions that load the snapshot into the canvas.
  async function performUndo() {
    canvasHistory?.undo();
  }

  async function performRedo(): Promise<void> {
    await canvasHistory?.redo();
  }

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


  function removeCanvasObjects(
    objects: FabricObject<Partial<FabricObjectProps>, SerializedObjectProps, ObjectEvents>[]
  ) {
    objects.forEach((obj) => {
      canvas.remove(obj);
    });
  }

  function addObjectAndSetActive(obj: FabricObject<Partial<FabricObjectProps>, SerializedObjectProps, ObjectEvents>) {
    canvas.add(obj);
    canvas.setActiveObject(obj);
    canvas.requestRenderAll();
    canvasHistory?.triggerSave();
  }

  async function handlePaste(e: ClipboardEvent) {
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
        const scale = Math.min(canvas.width / img.width!, canvas.height / img.height!, 1);
        img.scale(scale);
        img.set({ left: 50, top: 50 });
        // Add image to canvas
        addObjectAndSetActive(img);
      });
  }

  const shapeColor = ref("#000000");
  const strokeWidth = ref(2);

  function updateShapeColor(color: string) {
    const activeObj = canvas.getActiveObject();
    if (activeObj) {
      shapeColor.value = color;
      activeObj.set("fill", shapeColor.value);
      canvas.renderAll();
    }
  }

  function handleKeyDown(e: KeyboardEvent): void {
    if (["Delete", "Backspace"].includes(e.key)) {
      const activeObj = canvas.getActiveObject();

      // If the active object is text and it's currently being edited,
      // let the default text editing behavior happen.
      if (activeObj && activeObj.type === "i-text" && (activeObj as IText).isEditing) {
        return;
      }
      removeCanvasObjects(canvas.getActiveObjects());
      canvas.discardActiveObject();
      canvas.requestRenderAll();
    }
  }

  function readFileAsDataURL(file: File) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  useEventListener("paste", handlePaste);
  useEventListener("keydown", handleKeyDown);

  // Add these new variables and functions for line drawing
  const isDrawingLine = ref(false);
  let lineStartPoint = null;
  let currentLine = null;

  function startDrawingLine(o) {
    const pointer = canvas.getPointer(o.e);
    lineStartPoint = { x: pointer.x, y: pointer.y };

    currentLine = new Line([pointer.x, pointer.y, pointer.x, pointer.y], {
      stroke: brushColor.value,
      strokeWidth: strokeWidth.value,
      selectable: true,
      evented: true
    });

    canvas.add(currentLine);
    canvas.requestRenderAll();
  }

  function drawLine(o) {
    if (!isDrawingLine.value || !lineStartPoint) return;

    const pointer = canvas.getPointer(o.e);

    // Update line end point
    currentLine.set({
      x2: pointer.x,
      y2: pointer.y
    });

    canvas.requestRenderAll();
  }

  function finishDrawingLine() {
    if (!isDrawingLine.value || !currentLine) return;

    // Make the line selectable and save to history
    currentLine.set({
      selectable: true,
      evented: true
    });

    canvas.requestRenderAll();
    canvasHistory?.triggerSave();

    // Reset the line drawing state
    lineStartPoint = null;
    currentLine = null;
  }

  onMounted(async () => {
    await nextTick();
    if (!canvasEl.value) return;

    const containerWidth = window.innerWidth;
    const containerHeight = window.innerHeight;

    canvas = new FabricJSCanvas(canvasEl.value, {
      width: containerWidth,
      height: containerHeight,
      backgroundColor: "#ffffff", // White background
      isDrawingMode: false
    });


    if (canvas) {
      canvasHistory = new CanvasHistory(canvas);
      canvasHistory.init();
    }

    canvas.on('mouse:wheel', function(opt) {
      const delta = opt.e.deltaY;
      const pointer = canvas.getPointer(opt.e);
      let zoom = canvas.getZoom();
      zoom *= 0.999 ** delta;
      if (zoom > 20) zoom = 20;
      if (zoom < 0.01) zoom = 0.01;

      // Get the point in canvas coordinates before zoom
      const x = pointer.x;
      const y = pointer.y;

      // Set zoom while maintaining the point position
      canvas.zoomToPoint({ x, y }, zoom);

      opt.e.preventDefault();
      opt.e.stopPropagation();
    })

    canvasEl.value.focus();
    canvas.renderAll();
  });

  onUnmounted(() => {
    canvas?.off('mouse:wheel');
  })

  const tools = {
    select: () => {
      canvas.isDrawingMode = false;
      // Remove line drawing event listeners if they exist
      if (isDrawingLine.value) {
        canvas.off("mouse:down", startDrawingLine);
        canvas.off("mouse:move", drawLine);
        canvas.off("mouse:up", finishDrawingLine);
        isDrawingLine.value = false;
      }
    },
    brush: () => {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush = new PencilBrush(canvas);
      canvas.freeDrawingBrush.width = 5;
      canvas.freeDrawingBrush.color = "#000000";
      // Monkey patch onMouseUp
      const originalOnMouseUp = canvas.freeDrawingBrush.onMouseUp;

      canvas.freeDrawingBrush.onMouseUp = function (...args) {
        const result = originalOnMouseUp.apply(this, args);
        // Now the path is fully added to canvas
        canvas.requestRenderAll(); // optional
        canvas.fire("custom:added");
        return result;
      };
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
      addObjectAndSetActive(rect);
    },
    text: () => {
      canvas.isDrawingMode = false;
      const text = new IText("Edit me", {
        left: 100,
        top: 100,
        fontSize: 20
      });
      addObjectAndSetActive(text);
    },
    line: () => {
      canvas.isDrawingMode = false;
      isDrawingLine.value = true;
      canvas.on("mouse:down", startDrawingLine);
      canvas.on("mouse:move", drawLine);
      canvas.on("mouse:up", finishDrawingLine);
    }
  };

  function setTool(toolName) {
    activeTool.value = toolName;
    if (tools[toolName]) {
      tools[toolName]();
    }
  }

  function triggerImageUpload() {
    const activeObj = canvas.getActiveObject();
    if (activeObj && activeObj.type === "image") {
      selectedImage = activeObj;
    } else {
      selectedImage = null;
    }
    fileInput.value?.click();
  }

  function triggerNewImageUpload() {
    selectedImage = null;
    fileInput.value?.click();
  }

  async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const dataURL = await readFileAsDataURL(file);
    const img = await FabricImage.fromURL(dataURL, { crossOrigin: "anonymous" });

    const scale = Math.min(canvas.width / img.width, canvas.height / img.height, 1);
    img.scale(scale);
    img.left = 50;
    img.top = 50;

    if (selectedImage) {
      img.left = selectedImage.left;
      img.top = selectedImage.top;
      img.scaleX = selectedImage.scaleX;
      img.scaleY = selectedImage.scaleY;
      img.angle = selectedImage.angle;
      removeCanvasObjects([selectedImage]);
    }

    addObjectAndSetActive(img);
    selectedImage = img;
    event.target.value = "";
  }

  function exportCanvas() {
    const dataURL = canvas.toDataURL({ format: "png", quality: 1.0, multiplier: 1 });
    const link = document.createElement("a");
    link.download = "canvas-export.png";
    link.href = dataURL;
    link.click();
  }

  function clearCanvas() {
    isClearingCanvas.value = true;
    canvas.clear();
    canvas.backgroundColor = "#ffffff";
    canvas.requestRenderAll();
    isClearingCanvas.value = false;
  }

  // 📸 Start cropping
  function startCrop() {
    const active = canvas.getActiveObject();
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

    canvas.add(cropRect);
    canvas.setActiveObject(cropRect);
    canvas.bringObjectToFront(cropRect);
    canvas.requestRenderAll();
  }

  // ✂️ Apply actual image crop (flattened)
  async function applyCrop() {
    if (!selectedImage || !cropRect) return;

    const rect = cropRect.getBoundingRect();
    const img = selectedImage;

    const scaleX = img.scaleX;
    const scaleY = img.scaleY;

    const cropX = (rect.left - img.left) / scaleX;
    const cropY = (rect.top - img.top) / scaleY;
    const cropWidth = rect.width / scaleX;
    const cropHeight = rect.height / scaleY;

    // Create temp canvas to draw cropped image
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = cropWidth;
    tempCanvas.height = cropHeight;
    const ctx = tempCanvas.getContext("2d");

    const source = img._element;
    ctx.drawImage(source, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

    const croppedDataUrl = tempCanvas.toDataURL();
    const newImg = await FabricImage.fromURL(croppedDataUrl, { crossOrigin: "anonymous" });
    newImg.left = img.left + (rect.left - img.left);
    newImg.top = img.top + (rect.top - img.top);
    removeCanvasObjects([img, cropRect]);
    cropRect = null;
    selectedImage = null;
    isCropping.value = false;
    addObjectAndSetActive(newImg);
  }
</script>

