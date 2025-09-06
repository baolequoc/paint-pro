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
    <ModernToolbar
      :active-tool="activeTool"
      :brush-color="brushColor"
      :stroke-width="strokeWidth"
      :is-cropping="isCropping"
      :can-undo="canUndo"
      :can-redo="canRedo"
      :zoom-level="zoomLevel"
      :selected-nodes-count="selectedNodes.length"
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
    
    <!-- Property Panel -->
    <PropertyPanel
      :stroke-color="brushColor"
      :fill-color="fillColor"
      :stroke-width="strokeWidth"
      :opacity="currentOpacity"
      :stroke-style="strokeStyle"
      :line-cap="lineCap"
      :show-text-properties="hasTextSelected"
      :font-family="currentFontFamily"
      :font-size="currentFontSize"
      @update:stroke-color="brushColor = $event"
      @update:fill-color="fillColor = $event"
      @update:stroke-width="strokeWidth = $event"
      @update:opacity="handleOpacityChange"
      @update:stroke-style="strokeStyle = $event"
      @update:line-cap="lineCap = $event"
    />

    <!-- Canvas Container -->
    <div 
      ref="containerRef" 
      class="canvas-container"
      tabindex="0"
      @wheel="handleWheel"
      @paste="handlePaste"
      @click="focusCanvas"
    >
      <!-- Paste Hint Overlay (shown when canvas is empty) -->
      <div
        v-if="isCanvasEmpty"
        class="paste-hint"
      >
        <div class="paste-hint-content">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
          >
            <rect
              x="9"
              y="9"
              width="13"
              height="13"
              rx="2"
              ry="2"
              stroke="currentColor"
              stroke-width="2"
            />
            <path
              d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
              stroke="currentColor"
              stroke-width="2"
            />
          </svg>
          <h3>Start Creating</h3>
          <p>
            Copy an image and paste it here (Ctrl+V)<br>
            or drag and drop an image file
          </p>
        </div>
      </div>
    </div>

    <!-- Hidden file input -->
    <input
      ref="fileInputRef"
      type="file"
      accept="image/*"
      class="hidden"
      @change="handleFileUpload"
    >
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
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
import ModernToolbar from './ModernToolbar.vue';
import PropertyPanel from './PropertyPanel.vue';
import ContextMenu from './ContextMenu.vue';

// Refs
const containerRef = ref<HTMLDivElement | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);

// Tool state
const activeTool = ref<Tool>('select');
const brushColor = ref('#000000');
const fillColor = ref<string | null>(null);
const strokeWidth = ref(2);
const currentOpacity = ref(1);
const strokeStyle = ref<'solid' | 'dashed' | 'dotted'>('solid');
const lineCap = ref<'butt' | 'round' | 'square'>('round');
const hasTextSelected = ref(false);
const currentFontFamily = ref('Arial');
const currentFontSize = ref(20);

// Context menu state
const contextMenuVisible = ref(false);
const contextMenuPosition = ref({ x: 0, y: 0 });
const canPaste = ref(false);
const hasGroupSelected = ref(false);
const currentFillColor = ref('#000000');
const currentStrokeColor = ref('#000000');
const currentStrokeWidth = ref(2);

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
  setFillColor,
  setOpacity,
  setStrokeStyle,
  setLineCap,
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
} = useKonvaHistory(stage, clearSelection);

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
      // Auto-focus the canvas for paste functionality
      nextTick(() => {
        focusCanvas();
      });
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
  
  // Test if dblclick is working at all
  stage.value.on('dblclick', () => {
    console.log('Stage level double-click detected!');
  });
  
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
  console.log('Single click detected on:', e.target.className);
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
  console.log('Double click event triggered');
  console.log('Target:', e.target);
  console.log('Target className:', e.target.className);
  console.log('Target constructor name:', e.target.constructor.name);
  
  // Handle text editing on double click
  if (e.target.className === 'Text' || e.target.constructor.name === 'Text') {
    console.log('Double-clicked on text, calling enableTextEditing');
    enableTextEditing(e.target as Konva.Text);
  } else {
    console.log('Not a text element, className:', e.target.className);
  }
};

// Manual text edit trigger (temporary workaround)
const editSelectedText = () => {
  if (selectedNodes.value.length === 1) {
    const node = selectedNodes.value[0];
    if (node.className === 'Text') {
      console.log('Manually triggering text edit');
      enableTextEditing(node as Konva.Text);
    }
  }
};

// Reattach double-click listeners to text nodes after undo/redo
const reattachTextListeners = () => {
  if (!mainLayer.value) return;
  
  const textNodes = mainLayer.value.find('.selectable').filter((node: any) => node.className === 'Text');
  textNodes.forEach((textNode: any) => {
    // Remove old listeners first
    textNode.off('dblclick dbltap');
    // Add new listener
    textNode.on('dblclick dbltap', () => {
      console.log('Text node double-clicked (reattached)');
      enableTextEditing(textNode);
    });
  });
};

// Shape drawing handlers
const startShapeDrawing = (pos: Point) => {
  drawingState.value.isDrawing = true;
  drawingState.value.startPoint = pos;

  // Create preview shape based on tool
  switch (activeTool.value) {
    case 'line':
      const lineDash = strokeStyle.value === 'dashed' ? [10, 5] : strokeStyle.value === 'dotted' ? [2, 4] : undefined;
      drawingState.value.currentShape = new Konva.Line({
        points: [pos.x, pos.y, pos.x, pos.y],
        stroke: brushColor.value,
        strokeWidth: strokeWidth.value,
        lineCap: lineCap.value,
        dash: lineDash,
        name: 'temp-shape',
      });
      break;
    case 'arrow':
      const arrowDash = strokeStyle.value === 'dashed' ? [10, 5] : strokeStyle.value === 'dotted' ? [2, 4] : undefined;
      drawingState.value.currentShape = new Konva.Arrow({
        points: [pos.x, pos.y, pos.x, pos.y],
        stroke: brushColor.value,
        strokeWidth: strokeWidth.value,
        fill: brushColor.value,
        dash: arrowDash,
        pointerLength: 10,
        pointerWidth: 10,
        name: 'temp-shape',
      });
      break;
    case 'rectangle':
      const rectDash = strokeStyle.value === 'dashed' ? [10, 5] : strokeStyle.value === 'dotted' ? [2, 4] : undefined;
      drawingState.value.currentShape = new Konva.Rect({
        x: pos.x,
        y: pos.y,
        width: 0,
        height: 0,
        stroke: brushColor.value,
        strokeWidth: strokeWidth.value,
        fill: 'transparent',
        dash: rectDash,
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
  const dashArray = strokeStyle.value === 'dashed' ? [10, 5] : strokeStyle.value === 'dotted' ? [2, 4] : undefined;
  const shapeConfig = {
    dash: dashArray,
    lineCap: lineCap.value,
  };
  
  switch (activeTool.value) {
    case 'line':
      drawLine(start, pos, shapeConfig);
      break;
    case 'arrow':
      drawArrow(start, pos, shapeConfig);
      break;
    case 'rectangle':
      const width = pos.x - start.x;
      const height = pos.y - start.y;
      drawRectangle(
        width < 0 ? pos.x : start.x,
        height < 0 ? pos.y : start.y,
        Math.abs(width),
        Math.abs(height),
        shapeConfig
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
    // Don't call enableTextEditing here - it will be handled by double-click
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

// Watch for selected nodes changes
watch(selectedNodes, (nodes) => {
  // Check if any selected node is text
  hasTextSelected.value = nodes.some(node => node.className === 'Text');
  
  // Update properties based on selected nodes
  if (nodes.length === 1) {
    const node = nodes[0];
    if (node.className === 'Text') {
      currentFontFamily.value = node.fontFamily?.() || 'Arial';
      currentFontSize.value = node.fontSize?.() || 20;
    }
    currentOpacity.value = node.opacity?.() || 1;
  }
});

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

watch(fillColor, (color) => {
  setFillColor(color || 'transparent');
  
  // Apply to selected objects
  if (selectedNodes.value.length > 0) {
    selectedNodes.value.forEach((node) => {
      if (node.className === 'Rect' || node.className === 'Circle') {
        node.fill(color || 'transparent');
      }
    });
    mainLayer.value?.batchDraw();
  }
});

watch(currentOpacity, (opacity) => {
  setOpacity(opacity);
  
  // Apply to selected objects
  if (selectedNodes.value.length > 0) {
    selectedNodes.value.forEach((node) => {
      node.opacity(opacity);
    });
    mainLayer.value?.batchDraw();
  }
});

watch(strokeStyle, (style) => {
  setStrokeStyle(style);
  
  // Apply to selected objects
  if (selectedNodes.value.length > 0) {
    let dashArray: number[] | undefined;
    switch (style) {
      case 'dashed':
        dashArray = [10, 5];
        break;
      case 'dotted':
        dashArray = [2, 4];
        break;
      default:
        dashArray = undefined;
    }
    
    selectedNodes.value.forEach((node) => {
      if (node.dash) {
        node.dash(dashArray);
      }
    });
    mainLayer.value?.batchDraw();
  }
});

watch(lineCap, (cap) => {
  setLineCap(cap);
  
  // Apply to selected objects
  if (selectedNodes.value.length > 0) {
    selectedNodes.value.forEach((node) => {
      if (node.lineCap) {
        node.lineCap(cap);
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
    const imageNode = await loadImageFromFile(file);
    if (imageNode) {
      // Select the newly uploaded image
      clearSelection();
      selectNodes([imageNode]);
      saveState();
      showNotification('Image uploaded to canvas', 'success');
    }
  }
  
  // Reset input
  input.value = '';
};

const handlePaste = async (e: ClipboardEvent) => {
  // Check if clipboard has image data
  const items = e.clipboardData?.items;
  let hasImage = false;
  
  if (items) {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        hasImage = true;
        break;
      }
    }
  }
  
  if (hasImage) {
    // Handle image paste
    const imageNode = await handleImagePaste(e);
    if (imageNode) {
      // Select the newly pasted image
      clearSelection();
      selectNodes([imageNode]);
      saveState();
      showNotification('Image pasted to canvas', 'success');
    }
  } else {
    // Handle object paste (existing functionality)
    const pastedNodes = paste();
    if (pastedNodes && pastedNodes.length > 0) {
      selectNodes(pastedNodes);
      saveState();
      showNotification(`${pastedNodes.length} object(s) pasted`, 'success');
    }
  }
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
const handleExport = async (type: 'png' | 'jpeg' | 'clipboard', scope: 'selection' | 'all' | 'auto' = 'auto') => {
  // Auto-detect: if there are selected nodes, export selection, otherwise export all
  const hasSelection = selectedNodes.value.length > 0;
  const exportSelection = scope === 'selection' || (scope === 'auto' && hasSelection);
  
  switch (type) {
    case 'png':
      if (exportSelection) {
        exportSelectionToPNG();
      } else {
        exportToPNG();
      }
      break;
    case 'jpeg':
      if (exportSelection) {
        exportSelectionToJPEG();
      } else {
        exportToJPEG();
      }
      break;
    case 'clipboard':
      const success = await copyToClipboard(exportSelection);
      if (success) {
        const message = exportSelection ? 'Selected objects copied to clipboard!' : 'Canvas copied to clipboard!';
        // Create a toast notification instead of alert
        showNotification(message, 'success');
      } else {
        showNotification('Failed to copy to clipboard', 'error');
      }
      break;
  }
};

// Export selected objects to PNG
const exportSelectionToPNG = (filename?: string) => {
  const dataURL = exportSelection({ mimeType: 'image/png' });
  if (!dataURL) {
    showNotification('No objects selected for export', 'warning');
    return;
  }

  const link = document.createElement('a');
  link.download = filename || 'selected-objects.png';
  link.href = dataURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  showNotification('Selected objects exported as PNG', 'success');
};

// Export selected objects to JPEG
const exportSelectionToJPEG = (filename?: string, quality = 0.9) => {
  const dataURL = exportSelection({ 
    mimeType: 'image/jpeg',
    quality 
  });
  if (!dataURL) {
    showNotification('No objects selected for export', 'warning');
    return;
  }

  const link = document.createElement('a');
  link.download = filename || 'selected-objects.jpg';
  link.href = dataURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  showNotification('Selected objects exported as JPEG', 'success');
};

// Simple notification system
const showNotification = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
  // Create a simple toast notification
  const notification = document.createElement('div');
  notification.className = `toast-notification toast-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 8px;
    color: white;
    font-size: 14px;
    font-weight: 500;
    z-index: 10001;
    animation: slideInRight 0.3s ease-out, fadeOut 0.3s ease-out 2.7s;
    max-width: 300px;
    word-wrap: break-word;
  `;
  
  const colors = {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b'
  };
  
  notification.style.backgroundColor = colors[type];
  
  document.body.appendChild(notification);
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 3000);
  
  // Add CSS animations if not already present
  if (!document.querySelector('#toast-animations')) {
    const style = document.createElement('style');
    style.id = 'toast-animations';
    style.textContent = `
      @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
};

// Check if canvas is empty (for showing hint)
const isCanvasEmpty = computed(() => {
  if (!mainLayer.value) return true;
  
  // Check for actual content (selectable objects)
  const children = mainLayer.value.children || [];
  const hasSelectableContent = children.some((child: any) => {
    return child.name && (child.name() === 'selectable' || 
           child.className === 'Image' || 
           child.className === 'Text' ||
           child.className === 'Rect' ||
           child.className === 'Circle' ||
           child.className === 'Line' ||
           child.className === 'Arrow');
  });
  
  return !hasSelectableContent;
});

// Focus management
const focusCanvas = () => {
  containerRef.value?.focus();
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
const handleUndo = async () => {
  await undo();
  // Re-initialize transformer after undo
  await nextTick(); // Wait for DOM updates
  // Re-initialize transformer to ensure it works with the restored stage
  initTransformer();
  // Reattach double-click listeners to text nodes
  reattachTextListeners();
  // Ensure drawing tools still work
  if (tempLayer.value) {
    tempLayer.value.moveToTop();
  }
  if (transformerLayer.value) {
    transformerLayer.value.moveToTop();
  }
};

const handleRedo = async () => {
  console.log('handleRedo called');
  await redo();
  // Re-initialize transformer after redo
  await nextTick(); // Wait for DOM updates
  // Re-initialize transformer to ensure it works with the restored stage
  initTransformer();
  // Reattach double-click listeners to text nodes
  reattachTextListeners();
  // Ensure drawing tools still work
  if (tempLayer.value) {
    tempLayer.value.moveToTop();
  }
  if (transformerLayer.value) {
    transformerLayer.value.moveToTop();
  }
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
  currentOpacity.value = opacity;
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
  onPaste: async () => {
    // Check clipboard for images first
    try {
      const clipboardItems = await navigator.clipboard.read();
      let hasImage = false;
      
      for (const clipboardItem of clipboardItems) {
        for (const type of clipboardItem.types) {
          if (type.startsWith('image/')) {
            hasImage = true;
            const blob = await clipboardItem.getType(type);
            const url = URL.createObjectURL(blob);
            const imageNode = await loadImage(url, 100, 100);
            URL.revokeObjectURL(url);
            if (imageNode) {
              // Select the newly pasted image
              clearSelection();
              selectNodes([imageNode]);
              saveState(); // Save state after image is added
              showNotification('Image pasted from clipboard', 'success');
            }
            return;
          }
        }
      }
      
      if (!hasImage) {
        // Handle object paste (existing functionality)
        const pastedNodes = paste();
        if (pastedNodes && pastedNodes.length > 0) {
          selectNodes(pastedNodes);
          saveState();
          showNotification(`${pastedNodes.length} object(s) pasted`, 'success');
        }
      }
    } catch (error) {
      // Fallback to object paste if clipboard API fails
      const pastedNodes = paste();
      if (pastedNodes && pastedNodes.length > 0) {
        selectNodes(pastedNodes);
        saveState();
        showNotification(`${pastedNodes.length} object(s) pasted`, 'success');
      }
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
  // Tool shortcuts
  onSelectTool: () => setTool('select'),
  onPanTool: () => setTool('pan'),
  onBrushTool: () => setTool('brush'),
  onLineTool: () => setTool('line'),
  onArrowTool: () => setTool('arrow'),
  onRectangleTool: () => setTool('rectangle'),
  onTextTool: () => setTool('text'),
  onImageUpload: () => triggerImageUpload(),
  // View shortcuts
  onZoomIn: () => handleZoomIn(),
  onZoomOut: () => handleZoomOut(),
  onFitToScreen: () => handleCenterView(),
  onExport: () => handleExport('png', 'auto'),
  // Text editing (moved from separate handler)
  onEditText: () => {
    if (selectedNodes.value.length === 1) {
      const node = selectedNodes.value[0];
      if (node.className === 'Text') {
        console.log('Editing text via keyboard shortcut');
        enableTextEditing(node as Konva.Text);
      }
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
  background: #f8f9fa;
  display: flex;
  flex-direction: column;
}

.canvas-container {
  width: 100%;
  height: calc(100% - 56px); /* Account for toolbar height */
  margin-top: 56px; /* Push down for fixed toolbar */
  position: relative;
  overflow: hidden;
  background: radial-gradient(circle, #ffffff 1px, transparent 1px);
  background-size: 20px 20px;
  background-color: #fafbfc;
  outline: none; /* Remove default focus outline */
}

.canvas-container:focus {
  /* Optional: Add subtle focus indicator */
  box-shadow: inset 0 0 0 2px rgba(59, 130, 246, 0.1);
}

/* Paste Hint Overlay */
.paste-hint {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #9ca3af;
  pointer-events: none;
  z-index: 1;
}

.paste-hint-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 32px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 16px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(229, 231, 235, 0.5);
}

.paste-hint-content svg {
  color: #d1d5db;
}

.paste-hint-content h3 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #6b7280;
}

.paste-hint-content p {
  margin: 0;
  font-size: 16px;
  line-height: 1.5;
  color: #9ca3af;
}

.hidden {
  display: none;
}
</style>