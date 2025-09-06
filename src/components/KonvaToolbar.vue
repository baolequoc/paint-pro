<template>
  <div class="toolbar">
    <!-- Drawing Tools Group -->
    <div class="tool-group">
      <button
        class="tool-btn"
        :class="{ active: activeTool === 'select' }"
        title="Select Tool (V)"
        @click="$emit('set-tool', 'select')"
      >
        <i class="fas fa-mouse-pointer" />
      </button>
      
      <button
        class="tool-btn"
        :class="{ active: activeTool === 'pan' }"
        title="Pan Tool (H)"
        @click="$emit('set-tool', 'pan')"
      >
        <i class="fas fa-hand-paper" />
      </button>
      
      <button
        class="tool-btn"
        :class="{ active: activeTool === 'brush' }"
        title="Brush Tool (B)"
        @click="$emit('set-tool', 'brush')"
      >
        <i class="fas fa-paint-brush" />
      </button>
      
      <button
        class="tool-btn"
        :class="{ active: activeTool === 'line' }"
        title="Line Tool (L)"
        @click="$emit('set-tool', 'line')"
      >
        <i class="fas fa-slash" />
      </button>
      
      <button
        class="tool-btn"
        :class="{ active: activeTool === 'arrow' }"
        title="Arrow Tool"
        @click="$emit('set-tool', 'arrow')"
      >
        <i class="fas fa-arrow-right" />
      </button>
      
      <button
        class="tool-btn"
        :class="{ active: activeTool === 'rectangle' }"
        title="Rectangle Tool (R)"
        @click="$emit('set-tool', 'rectangle')"
      >
        <i class="fas fa-square" />
      </button>
      
      <button
        class="tool-btn"
        :class="{ active: activeTool === 'text' }"
        title="Text Tool (T)"
        @click="$emit('set-tool', 'text')"
      >
        <i class="fas fa-font" />
      </button>
    </div>

    <!-- Color and Stroke Options -->
    <div class="tool-group">
      <div class="color-picker-wrapper">
        <label>Color:</label>
        <input
          type="color"
          :value="brushColor"
          class="color-picker"
          @input="$emit('update:brush-color', $event.target.value)"
        />
      </div>
      
      <div class="stroke-width-wrapper">
        <label>Size:</label>
        <input
          type="range"
          :value="strokeWidth"
          min="1"
          max="20"
          class="stroke-slider"
          @input="$emit('update:stroke-width', Number($event.target.value))"
        />
        <span class="stroke-value">{{ strokeWidth }}px</span>
      </div>
    </div>

    <!-- Image Tools Group -->
    <div class="tool-group">
      <button
        class="tool-btn"
        title="Upload Image"
        @click="$emit('trigger-image-upload')"
      >
        <i class="fas fa-file-image" />
      </button>
      
      <button
        v-if="!isCropping"
        class="tool-btn"
        title="Crop Image"
        @click="$emit('start-crop')"
      >
        <i class="fas fa-crop-alt" />
      </button>
      
      <template v-if="isCropping">
        <button
          class="tool-btn success"
          title="Apply Crop"
          @click="$emit('apply-crop')"
        >
          <i class="fas fa-check" />
        </button>
        
        <button
          class="tool-btn danger"
          title="Cancel Crop"
          @click="$emit('cancel-crop')"
        >
          <i class="fas fa-times" />
        </button>
      </template>
    </div>

    <!-- History Tools Group -->
    <div class="tool-group">
      <button
        class="tool-btn"
        :disabled="!canUndo"
        title="Undo (Ctrl+Z)"
        @click="$emit('undo')"
      >
        <i class="fas fa-undo" />
      </button>
      
      <button
        class="tool-btn"
        :disabled="!canRedo"
        title="Redo (Ctrl+Shift+Z)"
        @click="$emit('redo')"
      >
        <i class="fas fa-redo" />
      </button>
    </div>

    <!-- Zoom Tools Group -->
    <div class="tool-group">
      <button
        class="tool-btn"
        title="Zoom In"
        @click="$emit('zoom-in')"
      >
        <i class="fas fa-search-plus" />
      </button>
      
      <button
        class="tool-btn"
        title="Zoom Out"
        @click="$emit('zoom-out')"
      >
        <i class="fas fa-search-minus" />
      </button>
      
      <button
        class="tool-btn"
        title="Reset Zoom"
        @click="$emit('reset-zoom')"
      >
        <i class="fas fa-compress-arrows-alt" />
      </button>
      
      <span class="zoom-level">{{ Math.round(zoomLevel * 100) }}%</span>
    </div>

    <!-- Export Tools Group -->
    <div class="tool-group">
      <button
        class="tool-btn"
        title="Export as PNG"
        @click="$emit('export', 'png')"
      >
        <i class="fas fa-download" />
      </button>
      
      <button
        class="tool-btn"
        title="Copy to Clipboard"
        @click="$emit('export', 'clipboard')"
      >
        <i class="fas fa-copy" />
      </button>
      
      <button
        class="tool-btn"
        title="Center View"
        @click="$emit('center-view')"
      >
        <i class="fas fa-crosshairs" />
      </button>
      
      <button
        class="tool-btn danger"
        title="Clear Canvas"
        @click="$emit('clear')"
      >
        <i class="fas fa-trash-alt" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Tool } from '@/types/konva';

interface Props {
  activeTool: Tool;
  brushColor: string;
  strokeWidth: number;
  isCropping: boolean;
  canUndo: boolean;
  canRedo: boolean;
  zoomLevel: number;
}

defineProps<Props>();

defineEmits<{
  'set-tool': [tool: Tool];
  'update:brush-color': [color: string];
  'update:stroke-width': [width: number];
  'trigger-image-upload': [];
  'start-crop': [];
  'apply-crop': [];
  'cancel-crop': [];
  'export': [type: 'png' | 'jpeg' | 'clipboard'];
  'clear': [];
  'center-view': [];
  'undo': [];
  'redo': [];
  'zoom-in': [];
  'zoom-out': [];
  'reset-zoom': [];
}>();
</script>

<style scoped>
.toolbar {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 8px;
  display: flex;
  gap: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  z-index: 1000;
}

.tool-group {
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 0 8px;
  border-right: 1px solid #e0e0e0;
}

.tool-group:last-child {
  border-right: none;
}

.tool-btn {
  width: 36px;
  height: 36px;
  border: 1px solid transparent;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
  transition: all 0.2s;
  font-size: 16px;
}

.tool-btn:hover:not(:disabled) {
  background: #f0f0f0;
  border-color: #d0d0d0;
}

.tool-btn.active {
  background: #007bff;
  color: white;
  border-color: #0056b3;
}

.tool-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tool-btn.success {
  color: #28a745;
}

.tool-btn.success:hover {
  background: #28a745;
  color: white;
}

.tool-btn.danger {
  color: #dc3545;
}

.tool-btn.danger:hover {
  background: #dc3545;
  color: white;
}

.color-picker-wrapper,
.stroke-width-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-picker-wrapper label,
.stroke-width-wrapper label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.color-picker {
  width: 32px;
  height: 32px;
  border: 1px solid #d0d0d0;
  border-radius: 4px;
  cursor: pointer;
  padding: 2px;
}

.stroke-slider {
  width: 80px;
}

.stroke-value {
  font-size: 12px;
  color: #666;
  min-width: 35px;
}

.zoom-level {
  font-size: 12px;
  color: #666;
  font-weight: 500;
  padding: 0 8px;
  display: flex;
  align-items: center;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .toolbar {
    flex-wrap: wrap;
    max-width: 90%;
  }
  
  .tool-group {
    padding: 0 4px;
  }
}
</style>