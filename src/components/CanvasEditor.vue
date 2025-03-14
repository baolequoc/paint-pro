<template>
  <div class="editor-container">
    <div class="toolbar">
      <button :class="{ active: activeTool === 'select' }" @click="setTool('select')">Select</button>
      <button :class="{ active: activeTool === 'brush' }" @click="setTool('brush')">Brush</button>
      <button :class="{ active: activeTool === 'rectangle' }" @click="setTool('rectangle')">Rectangle</button>
      <button :class="{ active: activeTool === 'text' }" @click="setTool('text')">Text</button>
      <button @click="triggerImageUpload">Replace Image</button>
      <button @click="triggerNewImageUpload">Add File</button>
      <button @click="startCrop">Crop</button>
      <button v-if="isCropping" @click="applyCrop">Apply Crop</button>
      <button @click="exportCanvas">Export PNG</button>
      <button @click="clearCanvas">Clear Canvas</button>
    </div>

    <div class="canvas-container">
      <canvas ref="canvasEl" tabindex="0" />
      <input ref="fileInput" type="file" accept="image/*" style="display: none" @change="handleFileUpload" />
    </div>
  </div>
</template>

<script setup>
  import { ref, onMounted, onBeforeUnmount, nextTick } from "vue";
  import { Canvas as FabricJSCanvas, Rect, IText, PencilBrush, FabricImage } from "fabric";

  const canvasEl = ref(null);
  const fileInput = ref(null);
  const activeTool = ref("select");

  let canvas = null;
  let selectedImage = null;
  const isCropping = ref(false);
  let cropRect = null;

  const resizeCanvas = () => {
    const container = canvasEl.value.parentElement;
    canvas.setDimensions({
      width: container.clientWidth,
      height: container.clientHeight
    });
  };

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
      backgroundColor: "#f0f0f0",
      isDrawingMode: false
    });

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("paste", handlePaste);

    await nextTick();
    canvasEl.value.focus();
  });

  onBeforeUnmount(() => {
    window.removeEventListener("resize", resizeCanvas);
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
    canvas.setBackgroundColor("#f0f0f0", () => canvas.renderAll());
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
      fill: "rgba(255, 0, 0, 0.2)",
      stroke: "red",
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
  .editor-container {
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .toolbar {
    padding: 10px;
    background: #f5f5f5;
    border-bottom: 1px solid #ddd;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .toolbar button {
    margin: 0;
    padding: 5px 10px;
    cursor: pointer;
    border: none;
    border-radius: 4px;
    background-color: #e0e0e0;
    transition: background-color 0.3s;
  }

  .toolbar button:hover:not(:disabled) {
    background-color: #d5d5d5;
  }

  .toolbar button.active {
    background-color: #007bff;
    color: #fff;
  }

  .toolbar button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .canvas-container {
    flex: 1;
    width: 100%;
    position: relative;
  }

  canvas {
    display: block;
    width: 100%;
    height: 100%;
    outline: none;
  }
</style>
