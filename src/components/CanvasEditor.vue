<template>
  <div class="editor-container">
    <div class="toolbar">
      <div class="tool-group">
        <IconButton
          icon-class="fas fa-mouse-pointer"
          :active="activeTool === 'select'"
          tooltip="Select Tool"
          :on-click="() => setTool('select')"
        />
        <IconButton
          icon-class="fas fa-paint-brush"
          :active="activeTool === 'brush'"
          tooltip="Brush Tool"
          :on-click="() => setTool('brush')"
        />
        <input v-if="activeTool === 'brush'" v-model="brushColor" type="color" @input="updateBrushColor" />
        <IconButton
          icon-class="fas fa-square"
          :active="activeTool === 'rectangle'"
          tooltip="Rectangle Tool"
          :on-click="() => setTool('rectangle')"
        />
        <IconButton
          icon-class="fas fa-font"
          :active="activeTool === 'text'"
          tooltip="Text Tool"
          :on-click="() => setTool('text')"
        />
        <div v-if="activeTool === 'rectangle' || activeTool === 'text'" class="shape-options">
          <label for="shapeColor">Color:</label>
          <input v-model="shapeColor" type="color" @input="updateShapeColor" />
          <label for="strokeWidth">Stroke Width:</label>
          <input v-model.number="strokeWidth" type="number" min="1" @input="updateStrokeWidth" />
        </div>
      </div>

      <div class="tool-group">
        <IconButton icon-class="fas fa-exchange-alt" tooltip="Replace Image" :on-click="triggerImageUpload" />
        <IconButton icon-class="fas fa-file-image" tooltip="Add File" :on-click="triggerNewImageUpload" />
        <IconButton icon-class="fas fa-crop-alt" tooltip="Crop" :on-click="startCrop" />
        <IconButton v-if="isCropping" icon-class="fas fa-check" tooltip="Undo" :on-click="applyCrop" />
      </div>

      <div class="tool-group actions">
        <button class="btn-export" @click="exportCanvas"><i class="fas fa-download"></i></button>
        <button class="btn-clear" @click="clearCanvas"><i class="fas fa-trash-alt"></i></button>
      </div>
    </div>

    <div ref="canvasContainer" class="canvas-container">
      <canvas ref="canvasEl" tabindex="0" />

      <!-- Resize handles -->
      <div class="resize-handle top" @mousedown="startResize('top')"></div>
      <div class="resize-handle right" @mousedown="startResize('right')"></div>
      <div class="resize-handle bottom" @mousedown="startResize('bottom')"></div>
      <div class="resize-handle left" @mousedown="startResize('left')"></div>

      <!-- Hidden file input -->
      <input ref="fileInput" type="file" accept="image/*" style="display: none" @change="handleFileUpload" />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount, nextTick, useTemplateRef } from "vue";
  import { Canvas as FabricJSCanvas, Rect, IText, PencilBrush, FabricImage } from "fabric";
  import { useElementSize } from "@vueuse/core";
  import IconButton from "./IconButton.vue";

  const canvasEl = useTemplateRef("canvasEl");
  const fileInput = useTemplateRef("fileInput");
  const canvasContainer = useTemplateRef("canvasContainer");
  const activeTool = ref("select");
  let canvas: FabricJSCanvas | null = null;

  let isResizing = false;
  let currentDirection = null;

  const { canvasContainerWidth: width, canvasContainerHeight: height } = useElementSize(canvasContainer);

  function startResize(direction) {
    isResizing = true;
    currentDirection = direction;
    document.addEventListener("mousemove", handleResize);
    document.addEventListener("mouseup", stopResize);
  }

  function stopResize() {
    isResizing = false;
    currentDirection = null;
    document.removeEventListener("mousemove", handleResize);
    document.removeEventListener("mouseup", stopResize);
  }

  function handleResize(e) {
    if (!isResizing || !canvasEl.value) return;

    const container = canvasEl.value.parentElement;
    const rect = container.getBoundingClientRect();

    let newWidth = rect.width;
    let newHeight = rect.height;

    if (currentDirection === "right") {
      newWidth = e.clientX - rect.left;
    } else if (currentDirection === "left") {
      newWidth = rect.right - e.clientX;
      container.style.left = `${e.clientX}px`;
    } else if (currentDirection === "bottom") {
      newHeight = e.clientY - rect.top;
    } else if (currentDirection === "top") {
      newHeight = rect.bottom - e.clientY;
      container.style.top = `${e.clientY}px`;
    }

    // Apply the new size
    canvas.setDimensions({
      width: Math.max(newWidth, 100),
      height: Math.max(newHeight, 100)
    });
  }

  // useResizeObserver(canvasEl, (entries) => {
  //   const entry = entries[0];
  //   const { width, height } = entry.contentRect;
  //   if (!canvas) return;
  //   (canvas as FabricJSCanvas).width = width;
  //   (canvas as FabricJSCanvas).height = height;
  // });

  let selectedImage = null;
  const isCropping = ref(false);
  let cropRect = null;

  const brushColor = ref("#000000");

  function updateBrushColor() {
    if (activeTool.value === "brush") {
      canvas.freeDrawingBrush.color = brushColor.value;
    }
  }

  async function handlePaste(e) {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (!item.type.startsWith("image")) continue;

      const file = item.getAsFile();
      if (!file) continue;

      try {
        const dataURL = await readFileAsDataURL(file);
        const img = await FabricImage.fromURL(dataURL, { crossOrigin: "anonymous" });

        const scale = Math.min(canvas.width / img.width, canvas.height / img.height, 1);
        img.scale(scale);
        img.left = 50;
        img.top = 50;

        canvas.add(img);
        canvas.setActiveObject(img);
      } catch (err) {
        console.error("❌ Failed to handle pasted image:", err);
      }
    }
  }

  const shapeColor = ref("#000000");
  const strokeWidth = ref(2);

  function updateShapeColor() {
    const activeObj = canvas.getActiveObject();
    if (activeObj) {
      activeObj.set("fill", shapeColor.value);
      canvas.renderAll();
    }
  }

  function updateStrokeWidth() {
    const activeObj = canvas.getActiveObject();
    if (activeObj) {
      activeObj.set("strokeWidth", strokeWidth.value);
      canvas.renderAll();
    }
  }

  function handleKeyDown(e) {
    if (["Delete", "Backspace"].includes(e.key)) {
      canvas.getActiveObjects().forEach((obj) => canvas.remove(obj));
      canvas.discardActiveObject();
      canvas.requestRenderAll();
    }
  }

  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  onMounted(async () => {
    canvas = new FabricJSCanvas(canvasEl.value, {
      width: 800,
      height: 600,
      backgroundColor: "#ffffff",
      isDrawingMode: false
    });

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("paste", handlePaste);

    await nextTick();
    canvasEl.value.focus();
    canvas.renderAll();
  });

  onBeforeUnmount(() => {
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("paste", handlePaste);
  });

  const tools = {
    select: () => {
      canvas.isDrawingMode = false;
    },
    brush: () => {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush = new PencilBrush(canvas);
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
      canvas.setActiveObject(rect);
    },
    text: () => {
      canvas.isDrawingMode = false;
      const text = new IText("Edit me", {
        left: 100,
        top: 100,
        fontSize: 20
      });
      canvas.add(text);
      canvas.setActiveObject(text);
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
      canvas.remove(selectedImage);
    }

    canvas.add(img);
    canvas.setActiveObject(img);
    selectedImage = img;
    canvas.requestRenderAll();
    event.target.value = "";
  }

  function exportCanvas() {
    const dataURL = canvas.toDataURL({ format: "png", quality: 1.0 });
    const link = document.createElement("a");
    link.download = "canvas-export.png";
    link.href = dataURL;
    link.click();
  }

  function clearCanvas() {
    canvas.clear();
    canvas.setBackgroundColor("#ffffff", () => canvas.renderAll());
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
    canvas.bringToFront(cropRect);
  }

  // ✂️ Apply actual image crop (flattened)
  async function applyCrop() {
    if (!selectedImage || !cropRect) return;

    const rect = cropRect.getBoundingRect();
    const img = selectedImage;
    const imgRect = img.getBoundingRect();

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
    canvas.remove(img);
    canvas.remove(cropRect);
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

  .editor-container {
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    background-color: #f0f4f8; /* Softer background */
  }

  .toolbar {
    padding: 16px;
    background: #ffffff;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    z-index: 10;
  }

  .tool-group {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    align-items: center;
  }

  .toolbar button {
    padding: 10px 14px;
    cursor: pointer;
    border: none;
    border-radius: 8px; /* Rounded corners */
    background-color: #ffffff;
    color: #555;
    font-size: 14px;
    transition: background-color 0.3s, transform 0.2s;
  }

  .toolbar button:hover {
    background-color: #e7f1ff; /* Light hover effect */
    transform: scale(1.05);
  }

  .toolbar button.active {
    background-color: #bee3f8; /* Active button color */
    color: #3182ce;
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
