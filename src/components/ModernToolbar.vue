<template>
  <div class="modern-toolbar-container">
    <!-- Left Toolbar - Main Tools -->
    <div class="toolbar-left">
      <div class="tool-section">
        <!-- Logo/Menu -->
        <button
          class="menu-btn"
          title="Menu"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M3 12h18M3 6h18M3 18h18"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </div>

      <div class="divider-vertical" />

      <div class="tool-section">
        <!-- Selection Tools -->
        <div
          class="tool-item"
          :class="{ active: activeTool === 'select' }"
          @click="setTool('select')"
        >
          <div
            class="tool-icon"
            title="Select (V)"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M7 2l12 11.5-5.5.5L11 19.5z"
                stroke="currentColor"
                stroke-width="1.5"
                fill="currentColor"
              />
            </svg>
          </div>
          <span class="shortcut">V</span>
        </div>

        <div
          class="tool-item"
          :class="{ active: activeTool === 'pan' }"
          @click="setTool('pan')"
        >
          <div
            class="tool-icon"
            title="Hand Tool (H)"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M11 5.5V3a1 1 0 112 0v2.5m0 0V12m0-6.5v-1a1 1 0 112 0v4.5m0 0V12m0-3.5v-2a1 1 0 112 0V12m0 0v1a7 7 0 01-7 7 7 7 0 01-7-7V9.5a1 1 0 112 0V12"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
          </div>
          <span class="shortcut">H</span>
        </div>
      </div>

      <div class="divider-vertical" />

      <div class="tool-section">
        <!-- Drawing Tools -->
        <div
          class="tool-item"
          :class="{ active: activeTool === 'brush' }"
          @click="setTool('brush')"
        >
          <div
            class="tool-icon"
            title="Brush (B)"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M9.5 21A2.5 2.5 0 017 18.5c0-1.5.5-2.5 2-4l8.5-8.5a2.12 2.12 0 013 3L12 17.5c-1.5 1.5-2.5 2-4 2a2.5 2.5 0 01.5 1.5z"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
          </div>
          <span class="shortcut">B</span>
        </div>

        <div
          class="tool-item"
          :class="{ active: activeTool === 'line' }"
          @click="setTool('line')"
        >
          <div
            class="tool-icon"
            title="Line (L)"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M5 19L19 5"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
          </div>
          <span class="shortcut">L</span>
        </div>

        <div
          class="tool-item"
          :class="{ active: activeTool === 'arrow' }"
          @click="setTool('arrow')"
        >
          <div
            class="tool-icon"
            title="Arrow (A)"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M5 12h14m0 0l-6-6m6 6l-6 6"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
          <span class="shortcut">A</span>
        </div>
      </div>

      <div class="divider-vertical" />

      <div class="tool-section">
        <!-- Shape Tools -->
        <div
          class="tool-item"
          :class="{ active: activeTool === 'rectangle' }"
          @click="setTool('rectangle')"
        >
          <div
            class="tool-icon"
            title="Rectangle (R)"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
            >
              <rect
                x="4"
                y="6"
                width="16"
                height="12"
                stroke="currentColor"
                stroke-width="2"
                rx="1"
              />
            </svg>
          </div>
          <span class="shortcut">R</span>
        </div>

        <div
          class="tool-item"
          :class="{ active: activeTool === 'text' }"
          @click="setTool('text')"
        >
          <div
            class="tool-icon"
            title="Text (T)"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M12 3v18m-5-18h10M9 21h6"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
          </div>
          <span class="shortcut">T</span>
        </div>
      </div>

      <div class="divider-vertical" />

      <div class="tool-section">
        <!-- Media Tools -->
        <div
          class="tool-item"
          @click="$emit('trigger-image-upload')"
        >
          <div
            class="tool-icon"
            title="Upload Image (U)"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
          <span class="shortcut">U</span>
        </div>
      </div>
    </div>

    <!-- Center Toolbar - Properties -->
    <div class="toolbar-center">
      <!-- Color Controls -->
      <div class="property-section">
        <div class="color-control">
          <div
            class="color-preview"
            :style="{ background: brushColor }"
            @click="toggleColorPicker"
          >
            <input 
              v-show="false"
              ref="colorInput"
              type="color" 
              :value="brushColor"
              @input="updateColor($event.target.value)"
            >
          </div>
          <div class="color-label">
            Color
          </div>
        </div>

        <!-- Quick Color Palette -->
        <div class="quick-colors">
          <div 
            v-for="color in quickColors" 
            :key="color"
            class="quick-color"
            :style="{ background: color }"
            :class="{ active: brushColor === color }"
            @click="updateColor(color)"
          />
        </div>
      </div>

      <div class="divider-vertical" />

      <!-- Stroke Controls -->
      <div class="property-section">
        <div class="stroke-control">
          <label class="property-label">Stroke</label>
          <div class="stroke-input-group">
            <input 
              type="number" 
              :value="strokeWidth" 
              min="1" 
              max="100"
              class="stroke-input"
              @input="updateStrokeWidth(Number($event.target.value))"
            >
            <span class="unit">px</span>
          </div>
          <input 
            type="range" 
            :value="strokeWidth" 
            min="1" 
            max="100"
            class="stroke-slider"
            @input="updateStrokeWidth(Number($event.target.value))"
          >
        </div>
      </div>

      <div class="divider-vertical" />

      <!-- History Controls -->
      <div class="property-section">
        <button 
          class="action-btn" 
          :disabled="!canUndo"
          title="Undo (⌘Z)"
          @click="$emit('undo')"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M3 10h10a5 5 0 010 10M3 10l4-4M3 10l4 4"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
        <button 
          class="action-btn" 
          :disabled="!canRedo"
          title="Redo (⌘⇧Z)"
          @click="$emit('redo')"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M21 10H11a5 5 0 000 10m10-10l-4-4m4 4l-4 4"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- Right Toolbar - View Controls -->
    <div class="toolbar-right">
      <!-- Zoom Controls -->
      <div class="zoom-controls">
        <button
          class="zoom-btn"
          title="Zoom Out (-)"
          @click="$emit('zoom-out')"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM7 10h6"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </button>
        <div
          class="zoom-display"
          @click="$emit('reset-zoom')"
        >
          {{ Math.round(zoomLevel * 100) }}%
        </div>
        <button
          class="zoom-btn"
          title="Zoom In (+)"
          @click="$emit('zoom-in')"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </div>

      <div class="divider-vertical" />

      <!-- View Actions -->
      <div class="view-actions">
        <button
          class="action-btn"
          title="Fit to Screen (F)"
          @click="$emit('center-view')"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M4 8V4h4M4 16v4h4m8 0h4v-4m0-8V4h-4"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
        <button
          class="action-btn"
          title="Export (⌘E)"
          @click="$emit('export', 'png')"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M12 15V3m0 0l-4 4m4-4l4 4M3 15v4a2 2 0 002 2h14a2 2 0 002-2v-4"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
        <button
          class="action-btn danger"
          title="Clear Canvas"
          @click="confirmClear"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
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

const props = defineProps<Props>();
const emit = defineEmits<{
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

const colorInput = ref<HTMLInputElement>();
const quickColors = [
  '#000000', '#FFFFFF', '#FF5252', '#FF9800', '#FFEB3B', 
  '#4CAF50', '#2196F3', '#9C27B0', '#607D8B', '#795548'
];

const setTool = (tool: Tool) => {
  emit('set-tool', tool);
};

const updateColor = (color: string) => {
  emit('update:brush-color', color);
};

const updateStrokeWidth = (width: number) => {
  if (width >= 1 && width <= 100) {
    emit('update:stroke-width', width);
  }
};

const toggleColorPicker = () => {
  colorInput.value?.click();
};

const confirmClear = () => {
  if (confirm('Are you sure you want to clear the canvas?')) {
    emit('clear');
  }
};
</script>

<style scoped>
.modern-toolbar-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  z-index: 1000;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

/* Left Toolbar */
.toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.menu-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  color: #374151;
  transition: all 0.2s;
}

.menu-btn:hover {
  background: #f3f4f6;
}

.tool-section {
  display: flex;
  gap: 2px;
}

.tool-item {
  position: relative;
  width: 40px;
  height: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  color: #6b7280;
}

.tool-item:hover {
  background: #f3f4f6;
  color: #111827;
}

.tool-item.active {
  background: #eff6ff;
  color: #2563eb;
}

.tool-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.shortcut {
  position: absolute;
  bottom: 2px;
  right: 4px;
  font-size: 9px;
  font-weight: 600;
  opacity: 0.5;
  text-transform: uppercase;
}

.divider-vertical {
  width: 1px;
  height: 32px;
  background: #e5e7eb;
  margin: 0 8px;
}

/* Center Toolbar */
.toolbar-center {
  display: flex;
  align-items: center;
  gap: 16px;
}

.property-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-control {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.color-preview {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 2px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
}

.color-preview:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.color-label {
  font-size: 10px;
  color: #6b7280;
  font-weight: 500;
}

.quick-colors {
  display: flex;
  gap: 4px;
}

.quick-color {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-color:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.quick-color.active {
  border-color: #2563eb;
}

.stroke-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.property-label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

.stroke-input-group {
  display: flex;
  align-items: center;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 4px 8px;
}

.stroke-input {
  width: 40px;
  border: none;
  background: transparent;
  font-size: 14px;
  font-weight: 500;
  color: #111827;
  outline: none;
}

.unit {
  font-size: 12px;
  color: #9ca3af;
  margin-left: 2px;
}

.stroke-slider {
  width: 80px;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: #e5e7eb;
  border-radius: 2px;
  outline: none;
}

.stroke-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: #2563eb;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.action-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s;
}

.action-btn:hover:not(:disabled) {
  background: #f3f4f6;
  color: #111827;
}

.action-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.action-btn.danger:hover {
  background: #fee2e2;
  color: #dc2626;
}

/* Right Toolbar */
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 4px;
}

.zoom-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s;
}

.zoom-btn:hover {
  background: #ffffff;
  color: #111827;
}

.zoom-display {
  min-width: 50px;
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
}

.zoom-display:hover {
  background: #ffffff;
}

.view-actions {
  display: flex;
  gap: 4px;
}

/* Responsive */
@media (max-width: 1024px) {
  .quick-colors {
    display: none;
  }
  
  .stroke-slider {
    display: none;
  }
}

@media (max-width: 768px) {
  .modern-toolbar-container {
    padding: 0 8px;
  }
  
  .toolbar-center {
    display: none;
  }
  
  .shortcut {
    display: none;
  }
}
</style>