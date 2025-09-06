<template>
  <div class="canvas-editor">
    <!-- Context Menu -->
    <ContextMenu
      v-if="contextMenuVisible"
      :visible="contextMenuVisible"
      :position="contextMenuPosition"
      :selected-count="selectedNodes.length"
      :has-group="hasGroupSelected"
      :can-paste="canPaste"
      :fill-color="currentFillColor"
      :stroke-color="currentStrokeColor"
      :stroke-width="currentStrokeWidth"
      :opacity="currentOpacity"
      @action="handleContextMenuAction"
      @color-change="handleColorChange"
      @stroke-width-change="handleStrokeWidthChange"
      @opacity-change="handleOpacityChange"
      @close="closeContextMenu"
    />
    
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
import { useKonvaActions } from '@/composables/konva/useKonvaActions';

// Components
import KonvaToolbar from './KonvaToolbar.vue';
import ContextMenu from './ContextMenu.vue';

// Refs
const containerRef = ref<HTMLDivElement | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);

// Tool state
const activeTool = ref<Tool>('select');
const brushColor = ref('#000000');
const strokeWidth = ref(2);

// Context menu state
const contextMenuVisible = ref(false);
const contextMenuPosition = ref({ x: 0, y: 0 });
const canPaste = ref(false);
const hasGroupSelected = ref(false);
const currentFillColor = ref('#000000');
const currentStrokeColor = ref('#000000');
const currentStrokeWidth = ref(2);
const currentOpacity = ref(1);

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
} = useKonvaDrawing(stage, mainLayer, getPointerPosition);

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

// Actions
const {
  bringToFront,
  sendToBack,
  bringForward,
  sendBackward,
  changeColor,
  changeStrokeWidth,
  changeOpacity,
  copySelected,
  cutSelected,
  paste,
  deleteSelected: deleteFromActions,
  duplicateSelected,
  flipHorizontal,
  flipVertical,
  rotate,
  groupSelected,
  ungroupSelected,
  alignLeft,
  alignRight,
  alignTop,
  alignBottom,
  alignCenterHorizontal,
  alignCenterVertical,
} = useKonvaActions(stage, mainLayer, selectedNodes);

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
  stage.value.on('contextmenu', handleContextMenu);
  
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
      if (e.target === stage.value) {
        startSelection(e);
      } else if (e.target.hasName('selectable')) {
        // Handle selection immediately on mousedown for selectable elements
        handleNodeClick(e);
      }
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
    // Only update properties, selection is already handled in mousedown
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
  // Clear selection when changing from select tool to another tool
  if (activeTool.value === 'select' && tool !== 'select') {
    clearSelection();
  }
  
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
    // Clear selection first
    clearSelection();
    // Clear the stage
    clearStage();
    // Reset any drawing state
    drawingState.value = {
      isDrawing: false,
      startPoint: null,
      currentShape: null,
    };
    // Save the empty state
    saveState();
  }
};

const centerView = () => {
  fitToScreen();
};

// History operations
const handleUndo = () => {
  // Clear selection before undo to avoid orphaned selections
  clearSelection();
  undo();
  // Re-initialize transformer after undo
  setTimeout(() => {
    clearSelection();
    // Re-initialize transformer to ensure it works with the restored stage
    initTransformer();
    // Ensure drawing tools still work
    if (tempLayer.value) {
      tempLayer.value.moveToTop();
    }
    if (transformerLayer.value) {
      transformerLayer.value.moveToTop();
    }
  }, 100);
};

const handleRedo = () => {
  // Clear selection before redo to avoid orphaned selections
  clearSelection();
  redo();
  // Re-initialize transformer after redo
  setTimeout(() => {
    clearSelection();
    // Re-initialize transformer to ensure it works with the restored stage
    initTransformer();
    // Ensure drawing tools still work
    if (tempLayer.value) {
      tempLayer.value.moveToTop();
    }
    if (transformerLayer.value) {
      transformerLayer.value.moveToTop();
    }
  }, 100);
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

// Context Menu handlers
const handleContextMenu = (e: Konva.KonvaEventObject<MouseEvent>) => {
  e.evt.preventDefault();
  
  // Only show context menu if there are selected elements
  if (selectedNodes.value.length > 0) {
    const container = containerRef.value;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    contextMenuPosition.value = {
      x: e.evt.clientX,
      y: e.evt.clientY
    };
    
    // Update current properties from selected nodes
    if (selectedNodes.value.length === 1) {
      const node = selectedNodes.value[0];
      currentStrokeColor.value = (node.stroke && node.stroke()) || '#000000';
      currentFillColor.value = (node.fill && node.fill()) || '#000000';
      currentStrokeWidth.value = (node.strokeWidth && node.strokeWidth()) || 2;
      currentOpacity.value = node.opacity() || 1;
    }
    
    // Check if any selected node is a group
    hasGroupSelected.value = selectedNodes.value.some(node => node.className === 'Group');
    
    contextMenuVisible.value = true;
  }
};

const closeContextMenu = () => {
  contextMenuVisible.value = false;
};

const handleContextMenuAction = (action: string) => {
  switch (action) {
    case 'bringToFront':
      bringToFront();
      break;
    case 'sendToBack':
      sendToBack();
      break;
    case 'bringForward':
      bringForward();
      break;
    case 'sendBackward':
      sendBackward();
      break;
    case 'cut':
      cutSelected();
      canPaste.value = true;
      break;
    case 'copy':
      copySelected();
      canPaste.value = true;
      break;
    case 'paste':
      const pastedNodes = paste();
      if (pastedNodes) {
        selectNodes(pastedNodes);
      }
      break;
    case 'duplicate':
      const duplicated = duplicateSelected();
      if (duplicated) {
        selectNodes(duplicated);
      }
      break;
    case 'delete':
      deleteFromActions();
      clearSelection();
      break;
    case 'flipHorizontal':
      flipHorizontal();
      break;
    case 'flipVertical':
      flipVertical();
      break;
    case 'rotate90':
      rotate(90);
      break;
    case 'rotate-90':
      rotate(-90);
      break;
    case 'group':
      const group = groupSelected();
      if (group) {
        selectNodes([group]);
      }
      break;
    case 'ungroup':
      const ungrouped = ungroupSelected();
      if (ungrouped) {
        selectNodes(ungrouped);
      }
      break;
    case 'alignLeft':
      alignLeft();
      break;
    case 'alignRight':
      alignRight();
      break;
    case 'alignTop':
      alignTop();
      break;
    case 'alignBottom':
      alignBottom();
      break;
    case 'alignCenterH':
      alignCenterHorizontal();
      break;
    case 'alignCenterV':
      alignCenterVertical();
      break;
  }
  saveState();
};

const handleColorChange = (type: 'fill' | 'stroke', color: string) => {
  changeColor(color, type);
  if (type === 'stroke') {
    brushColor.value = color;
  }
  saveState();
};

const handleStrokeWidthChange = (width: number) => {
  changeStrokeWidth(width);
  strokeWidth.value = width;
  saveState();
};

const handleOpacityChange = (opacity: number) => {
  changeOpacity(opacity);
  saveState();
};

// Keyboard shortcuts
useKonvaKeyboard({
  onUndo: handleUndo,
  onRedo: handleRedo,
  onSelectAll: selectAll,
  onDelete: () => {
    if (selectedNodes.value.length > 0) {
      deleteSelected();
      saveState();
    }
  },
  onCopy: () => {
    if (selectedNodes.value.length > 0) {
      copySelected();
      canPaste.value = true;
    }
  },
  onPaste: () => {
    const pastedNodes = paste();
    if (pastedNodes) {
      selectNodes(pastedNodes);
      saveState();
    }
  },
  onCut: () => {
    if (selectedNodes.value.length > 0) {
      cutSelected();
      canPaste.value = true;
      saveState();
    }
  },
  onDuplicate: () => {
    if (selectedNodes.value.length > 0) {
      const duplicated = duplicateSelected();
      if (duplicated) {
        selectNodes(duplicated);
        saveState();
      }
    }
  },
  onGroup: () => {
    if (selectedNodes.value.length > 1) {
      const group = groupSelected();
      if (group) {
        selectNodes([group]);
        saveState();
      }
    }
  },
  onUngroup: () => {
    if (selectedNodes.value.some(node => node.className === 'Group')) {
      const ungrouped = ungroupSelected();
      if (ungrouped) {
        selectNodes(ungrouped);
        saveState();
      }
    }
  },
  onEscape: () => {
    clearSelection();
    closeContextMenu();
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