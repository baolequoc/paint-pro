<template>
  <div class="canvas-editor">
    <!-- Toolbar -->
    <KonvaToolbar
      :active-tool="activeTool"
      :brush-color="brushColor"
      :stroke-width="strokeWidth"
      :is-cropping="isCropping"
      :can-undo="canUndo"
      :can-redo="canRedo"
      :zoom-level="zoomLevel"
      @set-tool="setTool"
      @update:brush-color="brushColor = $event"
      @update:stroke-width="strokeWidth = $event"
      @trigger-image-upload="triggerImageUpload"
      @start-crop="startCropMode"
      @apply-crop="applyCropToCanvas"
      @cancel-crop="cancelCrop"
      @export="handleExport"
      @clear="clearCanvas"
      @center-view="centerView"
      @undo="handleUndo"
      @redo="handleRedo"
      @zoom-in="handleZoomIn"
      @zoom-out="handleZoomOut"
      @reset-zoom="handleResetZoom"
    />

    <!-- Canvas Container -->
    <div 
      ref="containerRef" 
      class="canvas-container"
      @wheel="handleWheel"
      @paste="handlePaste"
    />

    <!-- Hidden file input -->
    <input
      ref="fileInputRef"
      type="file"
      accept="image/*"
      class="hidden"
      @change="handleFileUpload"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import Konva from 'konva';
import type { Tool, Point } from '@/types/konva';

// Composables
import { useKonvaStage } from '@/composables/konva/useKonvaStage';
import { useKonvaSelection } from '@/composables/konva/useKonvaSelection';
import { useKonvaDrawing } from '@/composables/konva/useKonvaDrawing';
import { useKonvaImage } from '@/composables/konva/useKonvaImage';
import { useKonvaExport } from '@/composables/konva/useKonvaExport';
import { useKonvaHistory } from '@/composables/konva/useKonvaHistory';
import { useKonvaZoom } from '@/composables/konva/useKonvaZoom';
import { useKonvaKeyboard } from '@/composables/konva/useKonvaKeyboard';

// Components
import KonvaToolbar from './KonvaToolbar.vue';

// Refs
const containerRef = ref<HTMLDivElement | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);

// Tool state
const activeTool = ref<Tool>('select');
const brushColor = ref('#000000');
const strokeWidth = ref(2);

// Stage setup
const {
  stage,
  mainLayer,
  tempLayer,
  transformerLayer,
  isReady,
  initStage,
  clearStage,
  toDataURL,
  toJSON,
  loadFromJSON,
  getPointerPosition,
  batchDraw,
} = useKonvaStage(containerRef);

// Selection
const {
  selectedNodes,
  transformer,
  selectNodes,
  clearSelection,
  startSelection,
  updateSelection,
  endSelection,
  handleNodeClick,
  deleteSelected,
  selectAll,
  initTransformer,
} = useKonvaSelection(stage, mainLayer, transformerLayer, getPointerPosition);

// Drawing
const {
  isDrawing,
  brushConfig,
  startBrushDrawing,
  continueBrushDrawing,
  endBrushDrawing,
  drawLine,
  drawArrow,
  drawRectangle,
  drawCircle,
  addText,
  enableTextEditing,
  setBrushColor,
  setBrushSize,
} = useKonvaDrawing(stage, mainLayer);

// Images
const {
  selectedImage,
  cropRect,
  isCropping,
  loadImage,
  loadImageFromFile,
  handlePaste: handleImagePaste,
  startCrop,
  applyCrop,
  cancelCrop: cancelImageCrop,
  replaceImage,
} = useKonvaImage(mainLayer);

// Export
const {
  exportToDataURL,
  exportSelection,
  exportToPNG,
  exportToJPEG,
  copyToClipboard,
  exportToJSON,
  exportToBlob,
} = useKonvaExport(stage, transformer);

// History
const {
  history,
  historyStep,
  saveState,
  undo,
  redo,
  canUndo,
  canRedo,
  initHistory,
} = useKonvaHistory(stage);

// Zoom
const {
  zoomLevel,
  handleWheel,
  zoomIn,
  zoomOut,
  resetZoom,
  fitToScreen,
} = useKonvaZoom(stage);

// Drawing state for shapes
const drawingState = ref<{
  isDrawing: boolean;
  startPoint: Point | null;
  currentShape: any | null;
}>({
  isDrawing: false,
  startPoint: null,
  currentShape: null,
});

// Initialize canvas
onMounted(() => {
  initStage();
  
  // Wait for stage to be ready
  const checkReady = setInterval(() => {
    if (isReady.value && stage.value) {
      clearInterval(checkReady);
      setupEventListeners();
      initTransformer();
      initHistory();
    }
  }, 100);
});

// Setup event listeners
const setupEventListeners = () => {
  if (!stage.value) return;

  stage.value.on('mousedown touchstart', handleMouseDown);
  stage.value.on('mousemove touchmove', handleMouseMove);
  stage.value.on('mouseup touchend', handleMouseUp);
  stage.value.on('click tap', handleClick);
  stage.value.on('dblclick dbltap', handleDoubleClick);
  
  // Prevent direct dragging of elements - only allow through drag handles
  stage.value.on('dragstart', (e: Konva.KonvaEventObject<DragEvent>) => {
    // Only allow dragging of drag handles, prevent dragging of selectable elements
    if (e.target.hasName('selectable')) {
      e.target.stopDrag();
    }
  });
};

// Mouse event handlers
const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
  const pos = getPointerPosition();
  if (!pos) return;

  switch (activeTool.value) {
    case 'select':
      // Only start drag selection if clicking on empty area (stage)
      // Don't start selection if clicking on a selectable element or drag handle
      if (e.target === stage.value && !e.target.hasName('drag-handle')) {
        startSelection(e);
      }
      // Note: If clicking on a selectable element, Konva will handle dragging automatically
      // if the element has draggable: true
      break;
    case 'brush':
      startBrushDrawing();
      break;
    case 'line':
    case 'arrow':
    case 'rectangle':
      startShapeDrawing(pos);
      break;
    case 'text':
      handleTextTool(pos);
      break;
  }
};

const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
  const pos = getPointerPosition();
  if (!pos) return;

  switch (activeTool.value) {
    case 'select':
      updateSelection(e);
      break;
    case 'brush':
      continueBrushDrawing();
      break;
    case 'line':
    case 'arrow':
    case 'rectangle':
      updateShapeDrawing(pos);
      break;
  }
};

const handleMouseUp = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
  switch (activeTool.value) {
    case 'select':
      endSelection(e);
      break;
    case 'brush':
      endBrushDrawing();
      saveState();
      break;
    case 'line':
    case 'arrow':
    case 'rectangle':
      endShapeDrawing();
      saveState();
      break;
  }
};

const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
  if (activeTool.value === 'select') {
    handleNodeClick(e);
    
    // Update brush color and stroke width based on selected object
    if (selectedNodes.value.length === 1) {
      const node = selectedNodes.value[0];
      if (node.stroke && node.stroke()) {
        brushColor.value = node.stroke() as string;
      } else if (node.fill && node.fill()) {
        brushColor.value = node.fill() as string;
      }
      
      if (node.strokeWidth && node.strokeWidth()) {
        strokeWidth.value = node.strokeWidth() as number;
      }
    }
  }
};

const handleDoubleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
  // Handle text editing on double click
  if (e.target.className === 'Text') {
    enableTextEditing(e.target as Konva.Text);
  }
};

// Shape drawing handlers
const startShapeDrawing = (pos: Point) => {
  drawingState.value.isDrawing = true;
  drawingState.value.startPoint = pos;

  // Create preview shape based on tool
  switch (activeTool.value) {
    case 'line':
      drawingState.value.currentShape = new Konva.Line({
        points: [pos.x, pos.y, pos.x, pos.y],
        stroke: brushColor.value,
        strokeWidth: strokeWidth.value,
        lineCap: 'round',
        name: 'temp-shape',
      });
      break;
    case 'arrow':
      drawingState.value.currentShape = new Konva.Arrow({
        points: [pos.x, pos.y, pos.x, pos.y],
        stroke: brushColor.value,
        strokeWidth: strokeWidth.value,
        fill: brushColor.value,
        pointerLength: 10,
        pointerWidth: 10,
        name: 'temp-shape',
      });
      break;
    case 'rectangle':
      drawingState.value.currentShape = new Konva.Rect({
        x: pos.x,
        y: pos.y,
        width: 0,
        height: 0,
        stroke: brushColor.value,
        strokeWidth: strokeWidth.value,
        fill: 'transparent',
        name: 'temp-shape',
      });
      break;
  }

  if (drawingState.value.currentShape) {
    tempLayer.value?.add(drawingState.value.currentShape);
    tempLayer.value?.batchDraw();
  }
};

const updateShapeDrawing = (pos: Point) => {
  if (!drawingState.value.isDrawing || !drawingState.value.startPoint || !drawingState.value.currentShape) return;

  const start = drawingState.value.startPoint;

  switch (activeTool.value) {
    case 'line':
    case 'arrow':
      drawingState.value.currentShape.setAttrs({
        points: [start.x, start.y, pos.x, pos.y],
      });
      break;
    case 'rectangle':
      const width = pos.x - start.x;
      const height = pos.y - start.y;
      drawingState.value.currentShape.setAttrs({
        x: width < 0 ? pos.x : start.x,
        y: height < 0 ? pos.y : start.y,
        width: Math.abs(width),
        height: Math.abs(height),
      });
      break;
  }
  
  tempLayer.value?.batchDraw();
};

const endShapeDrawing = () => {
  if (!drawingState.value.isDrawing || !drawingState.value.startPoint) return;

  const start = drawingState.value.startPoint;
  const pos = getPointerPosition();
  
  if (!pos) return;

  // Remove temp shape
  if (drawingState.value.currentShape) {
    drawingState.value.currentShape.destroy();
    tempLayer.value?.batchDraw();
  }

  // Create final shape
  switch (activeTool.value) {
    case 'line':
      drawLine(start, pos);
      break;
    case 'arrow':
      drawArrow(start, pos);
      break;
    case 'rectangle':
      const width = pos.x - start.x;
      const height = pos.y - start.y;
      drawRectangle(
        width < 0 ? pos.x : start.x,
        height < 0 ? pos.y : start.y,
        Math.abs(width),
        Math.abs(height)
      );
      break;
  }

  // Reset drawing state
  drawingState.value.isDrawing = false;
  drawingState.value.startPoint = null;
  drawingState.value.currentShape = null;
};

// Text tool handler
const handleTextTool = (pos: Point) => {
  const text = addText(pos.x, pos.y, 'Double-click to edit');
  if (text) {
    enableTextEditing(text);
    saveState();
  }
  setTool('select');
};

// Tool management
const setTool = (tool: Tool) => {
  activeTool.value = tool;
  
  // Clear any ongoing operations
  drawingState.value.isDrawing = false;
  drawingState.value.currentShape?.destroy();
  
  // Update cursor
  if (stage.value) {
    switch (tool) {
      case 'pan':
        stage.value.container().style.cursor = 'grab';
        stage.value.draggable(true);
        break;
      default:
        stage.value.container().style.cursor = 'default';
        stage.value.draggable(false);
        break;
    }
  }
};

// Watch for brush config changes and apply to selected objects
watch(brushColor, (color) => {
  setBrushColor(color);
  
  // Apply to selected objects
  if (selectedNodes.value.length > 0) {
    selectedNodes.value.forEach((node) => {
      if (node.className === 'Line' || node.className === 'Arrow') {
        node.stroke(color);
      } else if (node.className === 'Rect' || node.className === 'Circle') {
        node.stroke(color);
      } else if (node.className === 'Text') {
        node.fill(color);
      }
    });
    mainLayer.value?.batchDraw();
  }
});

watch(strokeWidth, (width) => {
  setBrushSize(width);
  
  // Apply to selected objects
  if (selectedNodes.value.length > 0) {
    selectedNodes.value.forEach((node) => {
      if (node.strokeWidth) {
        node.strokeWidth(width);
      }
    });
    mainLayer.value?.batchDraw();
  }
});

// File handling
const triggerImageUpload = () => {
  fileInputRef.value?.click();
};

const handleFileUpload = async (e: Event) => {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  
  if (file) {
    await loadImageFromFile(file);
    saveState();
  }
  
  // Reset input
  input.value = '';
};

const handlePaste = async (e: ClipboardEvent) => {
  await handleImagePaste(e);
  saveState();
};

// Crop operations
const startCropMode = () => {
  const selected = selectedNodes.value[0];
  if (selected && selected.className === 'Image') {
    startCrop(selected as Konva.Image);
  } else {
    alert('Please select an image to crop');
  }
};

const applyCropToCanvas = async () => {
  const cropped = await applyCrop();
  if (cropped) {
    saveState();
  }
};

const cancelCrop = () => {
  cancelImageCrop();
};

// Export operations
const handleExport = async (type: 'png' | 'jpeg' | 'clipboard') => {
  switch (type) {
    case 'png':
      exportToPNG();
      break;
    case 'jpeg':
      exportToJPEG();
      break;
    case 'clipboard':
      const success = await copyToClipboard(selectedNodes.value.length > 0);
      if (success) {
        alert('Copied to clipboard!');
      }
      break;
  }
};

// Canvas operations
const clearCanvas = () => {
  if (confirm('Are you sure you want to clear the canvas?')) {
    clearStage();
    saveState();
  }
};

const centerView = () => {
  fitToScreen();
};

// History operations
const handleUndo = () => {
  undo();
};

const handleRedo = () => {
  redo();
};

// Zoom operations
const handleZoomIn = () => {
  zoomIn();
};

const handleZoomOut = () => {
  zoomOut();
};

const handleResetZoom = () => {
  resetZoom();
};

// Keyboard shortcuts
useKonvaKeyboard({
  onUndo: handleUndo,
  onRedo: handleRedo,
  onSelectAll: selectAll,
  onDelete: () => {
    deleteSelected();
    saveState();
  },
  onCopy: () => {
    // TODO: Implement copy
    console.log('Copy selected');
  },
  onPaste: () => {
    // TODO: Implement paste
    console.log('Paste');
  },
  onCut: () => {
    // TODO: Implement cut
    console.log('Cut selected');
  },
  onSave: () => {
    // Save to JSON
    const json = exportToJSON();
    if (json) {
      localStorage.setItem('canvas-save', json);
      alert('Canvas saved!');
    }
  },
});

// Cleanup
onUnmounted(() => {
  if (stage.value) {
    stage.value.destroy();
  }
});
</script>

<style scoped>
.canvas-editor {
  width: 100%;
  height: 100vh;
  position: relative;
  overflow: hidden;
  background: #f0f0f0;
}

.canvas-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background: white;
}

.hidden {
  display: none;
}
</style>