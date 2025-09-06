<template>
  <Teleport to="body">
    <div 
      v-if="visible" 
      class="context-menu"
      :style="{ left: `${position.x}px`, top: `${position.y}px` }"
      @contextmenu.prevent
    >
      <!-- Layer Actions -->
      <div class="menu-section">
        <div class="menu-header">
          Layer
        </div>
        <button
          class="menu-item"
          @click="handleAction('bringToFront')"
        >
          <span class="icon">⬆</span> Bring to Front
        </button>
        <button
          class="menu-item"
          @click="handleAction('sendToBack')"
        >
          <span class="icon">⬇</span> Send to Back
        </button>
        <button
          class="menu-item"
          @click="handleAction('bringForward')"
        >
          <span class="icon">↑</span> Bring Forward
        </button>
        <button
          class="menu-item"
          @click="handleAction('sendBackward')"
        >
          <span class="icon">↓</span> Send Backward
        </button>
      </div>

      <div class="menu-divider" />

      <!-- Edit Actions -->
      <div class="menu-section">
        <div class="menu-header">
          Edit
        </div>
        <button
          class="menu-item"
          @click="handleAction('cut')"
        >
          <span class="icon">✂️</span> Cut <span class="shortcut">⌘X</span>
        </button>
        <button
          class="menu-item"
          @click="handleAction('copy')"
        >
          <span class="icon">📋</span> Copy <span class="shortcut">⌘C</span>
        </button>
        <button
          class="menu-item"
          :disabled="!canPaste"
          @click="handleAction('paste')"
        >
          <span class="icon">📄</span> Paste <span class="shortcut">⌘V</span>
        </button>
        <button
          class="menu-item"
          @click="handleAction('duplicate')"
        >
          <span class="icon">📑</span> Duplicate <span class="shortcut">⌘D</span>
        </button>
        <button
          class="menu-item"
          @click="handleAction('delete')"
        >
          <span class="icon">🗑️</span> Delete <span class="shortcut">⌫</span>
        </button>
      </div>

      <div class="menu-divider" />

      <!-- Transform Actions -->
      <div class="menu-section">
        <div class="menu-header">
          Transform
        </div>
        <button
          class="menu-item"
          @click="handleAction('flipHorizontal')"
        >
          <span class="icon">↔️</span> Flip Horizontal
        </button>
        <button
          class="menu-item"
          @click="handleAction('flipVertical')"
        >
          <span class="icon">↕️</span> Flip Vertical
        </button>
        <button
          class="menu-item"
          @click="handleAction('rotate90')"
        >
          <span class="icon">↻</span> Rotate 90° CW
        </button>
        <button
          class="menu-item"
          @click="handleAction('rotate-90')"
        >
          <span class="icon">↺</span> Rotate 90° CCW
        </button>
      </div>

      <div
        v-if="hasMultipleSelected"
        class="menu-divider"
      />

      <!-- Alignment Actions (only for multiple selections) -->
      <div
        v-if="hasMultipleSelected"
        class="menu-section"
      >
        <div class="menu-header">
          Align
        </div>
        <div class="menu-row">
          <button
            class="menu-item-small"
            title="Align Left"
            @click="handleAction('alignLeft')"
          >
            ⬅
          </button>
          <button
            class="menu-item-small"
            title="Align Center Horizontal"
            @click="handleAction('alignCenterH')"
          >
            ↔
          </button>
          <button
            class="menu-item-small"
            title="Align Right"
            @click="handleAction('alignRight')"
          >
            ➡
          </button>
          <button
            class="menu-item-small"
            title="Align Top"
            @click="handleAction('alignTop')"
          >
            ⬆
          </button>
          <button
            class="menu-item-small"
            title="Align Center Vertical"
            @click="handleAction('alignCenterV')"
          >
            ↕
          </button>
          <button
            class="menu-item-small"
            title="Align Bottom"
            @click="handleAction('alignBottom')"
          >
            ⬇
          </button>
        </div>
      </div>

      <!-- Group Actions -->
      <div
        v-if="hasMultipleSelected || hasGroup"
        class="menu-section"
      >
        <div class="menu-header">
          Group
        </div>
        <button
          v-if="hasMultipleSelected && !hasGroup"
          class="menu-item"
          @click="handleAction('group')"
        >
          <span class="icon">🔗</span> Group <span class="shortcut">⌘G</span>
        </button>
        <button
          v-if="hasGroup"
          class="menu-item"
          @click="handleAction('ungroup')"
        >
          <span class="icon">🔓</span> Ungroup <span class="shortcut">⌘⇧G</span>
        </button>
      </div>

      <div class="menu-divider" />

      <!-- Style Actions -->
      <div class="menu-section">
        <div class="menu-header">
          Style
        </div>
        <div class="menu-item-inline">
          <label>Fill:</label>
          <input 
            type="color" 
            :value="fillColor"
            class="color-input"
            @change="(e) => handleColorChange('fill', (e.target as HTMLInputElement).value)"
          >
        </div>
        <div class="menu-item-inline">
          <label>Stroke:</label>
          <input 
            type="color" 
            :value="strokeColor"
            class="color-input"
            @change="(e) => handleColorChange('stroke', (e.target as HTMLInputElement).value)"
          >
        </div>
        <div class="menu-item-inline">
          <label>Stroke Width:</label>
          <input 
            type="range" 
            min="1" 
            max="20" 
            :value="strokeWidth"
            class="slider-input"
            @input="(e) => handleStrokeWidthChange((e.target as HTMLInputElement).value)"
          >
          <span class="value">{{ strokeWidth }}</span>
        </div>
        <div class="menu-item-inline">
          <label>Opacity:</label>
          <input 
            type="range" 
            min="0" 
            max="100" 
            :value="opacity * 100"
            class="slider-input"
            @input="(e) => handleOpacityChange((e.target as HTMLInputElement).value)"
          >
          <span class="value">{{ Math.round(opacity * 100) }}%</span>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface Props {
  visible: boolean;
  position: { x: number; y: number };
  selectedCount: number;
  hasGroup: boolean;
  canPaste: boolean;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  opacity: number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  action: [action: string];
  colorChange: [type: 'fill' | 'stroke', color: string];
  strokeWidthChange: [width: number];
  opacityChange: [opacity: number];
  close: [];
}>();

const hasMultipleSelected = computed(() => props.selectedCount > 1);

const handleAction = (action: string) => {
  emit('action', action);
  emit('close');
};

const handleColorChange = (type: 'fill' | 'stroke', color: string) => {
  emit('colorChange', type, color);
};

const handleStrokeWidthChange = (value: string) => {
  emit('strokeWidthChange', parseInt(value));
};

const handleOpacityChange = (value: string) => {
  emit('opacityChange', parseInt(value) / 100);
};

// Close menu when clicking outside
const handleClickOutside = (e: MouseEvent) => {
  const menu = document.querySelector('.context-menu');
  if (menu && !menu.contains(e.target as Node)) {
    emit('close');
  }
};

// Add/remove click listener
document.addEventListener('click', handleClickOutside);
</script>

<style scoped>
.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 8px 0;
  z-index: 10000;
  min-width: 220px;
  font-size: 14px;
}

.menu-section {
  padding: 4px 0;
}

.menu-header {
  padding: 4px 16px;
  font-weight: 600;
  font-size: 12px;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 8px 16px;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s;
}

.menu-item:hover:not(:disabled) {
  background-color: #f0f0f0;
}

.menu-item:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.menu-item .icon {
  margin-right: 8px;
  font-size: 16px;
}

.menu-item .shortcut {
  margin-left: auto;
  font-size: 12px;
  color: #999;
}

.menu-divider {
  height: 1px;
  background-color: #e0e0e0;
  margin: 4px 0;
}

.menu-row {
  display: flex;
  gap: 4px;
  padding: 0 12px;
  flex-wrap: wrap;
}

.menu-item-small {
  padding: 6px 10px;
  background: none;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.menu-item-small:hover {
  background-color: #f0f0f0;
  border-color: #999;
}

.menu-item-inline {
  display: flex;
  align-items: center;
  padding: 6px 16px;
  gap: 8px;
}

.menu-item-inline label {
  font-size: 13px;
  min-width: 80px;
}

.color-input {
  width: 40px;
  height: 24px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  cursor: pointer;
}

.slider-input {
  flex: 1;
  min-width: 80px;
}

.value {
  font-size: 12px;
  color: #666;
  min-width: 40px;
  text-align: right;
}
</style>