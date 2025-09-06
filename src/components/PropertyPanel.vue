<template>
  <div
    class="property-panel"
    :class="{ collapsed: isCollapsed }"
  >
    <!-- Panel Header -->
    <div
      class="panel-header"
      @click="toggleCollapse"
    >
      <div class="panel-title">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
            stroke="currentColor"
            stroke-width="2"
          />
          <path
            d="M12 16.5V12M12 8H12.01"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
        <span>Properties</span>
      </div>
      <button class="collapse-btn">
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          :style="{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0)' }"
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>

    <!-- Panel Content -->
    <div
      v-if="!isCollapsed"
      class="panel-content"
    >
      <!-- Stroke Section -->
      <div class="property-section">
        <div class="section-header">
          <span class="section-title">Stroke</span>
        </div>

        <!-- Stroke Color -->
        <div class="property-row">
          <label class="property-label">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
            >
              <rect
                x="3"
                y="3"
                width="18"
                height="18"
                rx="2"
                stroke="currentColor"
                stroke-width="2"
              />
            </svg>
            Color
          </label>
          <div class="property-controls">
            <div class="color-input-wrapper">
              <div 
                class="color-preview"
                :style="{ background: strokeColor }"
                @click="openStrokePicker($event)"
              />
            </div>
          </div>
        </div>

        <!-- Quick Stroke Colors -->
        <div class="property-row">
          <label class="property-label small">Presets</label>
          <div class="quick-colors-grid">
            <div 
              v-for="color in strokePresets"
              :key="'stroke-' + color"
              class="quick-color"
              :style="{ background: color }"
              :class="{ active: strokeColor === color }"
              :title="color"
              @click="updateStrokeColor(color)"
            />
            <div 
              class="quick-color add-color"
              title="Pick custom color"
              @click="openStrokePicker($event)"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M12 5v14m-7-7h14"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </svg>
            </div>
          </div>
        </div>

        <!-- Stroke Width -->
        <div class="property-row">
          <label class="property-label">Width</label>
          <div class="property-controls full-width">
            <div class="slider-with-input">
              <input 
                type="range"
                :value="strokeWidth"
                min="0"
                max="50"
                step="1"
                class="slider"
                @input="updateStrokeWidth(Number($event.target.value))"
              >
              <div class="number-input">
                <input 
                  type="number"
                  :value="strokeWidth"
                  min="0"
                  max="100"
                  step="1"
                  @input="updateStrokeWidth(Number($event.target.value))"
                >
                <span class="unit">px</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Stroke Style -->
        <div class="property-row">
          <label class="property-label">Style</label>
          <div class="property-controls">
            <div class="button-group">
              <button 
                class="style-btn"
                :class="{ active: strokeStyle === 'solid' }"
                title="Solid line"
                @click="updateStrokeStyle('solid')"
              >
                <svg
                  width="24"
                  height="4"
                  viewBox="0 0 24 4"
                  fill="currentColor"
                >
                  <rect
                    width="24"
                    height="2"
                    y="1"
                  />
                </svg>
              </button>
              <button 
                class="style-btn"
                :class="{ active: strokeStyle === 'dashed' }"
                title="Dashed line"
                @click="updateStrokeStyle('dashed')"
              >
                <svg
                  width="24"
                  height="4"
                  viewBox="0 0 24 4"
                  fill="currentColor"
                >
                  <rect
                    width="5"
                    height="2"
                    y="1"
                  />
                  <rect
                    x="7"
                    width="5"
                    height="2"
                    y="1"
                  />
                  <rect
                    x="14"
                    width="5"
                    height="2"
                    y="1"
                  />
                  <rect
                    x="21"
                    width="3"
                    height="2"
                    y="1"
                  />
                </svg>
              </button>
              <button 
                class="style-btn"
                :class="{ active: strokeStyle === 'dotted' }"
                title="Dotted line"
                @click="updateStrokeStyle('dotted')"
              >
                <svg
                  width="24"
                  height="4"
                  viewBox="0 0 24 4"
                  fill="currentColor"
                >
                  <circle
                    cx="2"
                    cy="2"
                    r="1.5"
                  />
                  <circle
                    cx="7"
                    cy="2"
                    r="1.5"
                  />
                  <circle
                    cx="12"
                    cy="2"
                    r="1.5"
                  />
                  <circle
                    cx="17"
                    cy="2"
                    r="1.5"
                  />
                  <circle
                    cx="22"
                    cy="2"
                    r="1.5"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Line Cap -->
        <div class="property-row">
          <label class="property-label">Cap</label>
          <div class="property-controls">
            <div class="button-group">
              <button 
                class="style-btn"
                :class="{ active: lineCap === 'butt' }"
                title="Butt cap"
                @click="$emit('update:line-cap', 'butt')"
              >
                <svg
                  width="24"
                  height="12"
                  viewBox="0 0 24 12"
                  fill="none"
                >
                  <path
                    d="M4 6h16"
                    stroke="currentColor"
                    stroke-width="4"
                    stroke-linecap="butt"
                  />
                </svg>
              </button>
              <button 
                class="style-btn"
                :class="{ active: lineCap === 'round' }"
                title="Round cap"
                @click="$emit('update:line-cap', 'round')"
              >
                <svg
                  width="24"
                  height="12"
                  viewBox="0 0 24 12"
                  fill="none"
                >
                  <path
                    d="M4 6h16"
                    stroke="currentColor"
                    stroke-width="4"
                    stroke-linecap="round"
                  />
                </svg>
              </button>
              <button 
                class="style-btn"
                :class="{ active: lineCap === 'square' }"
                title="Square cap"
                @click="$emit('update:line-cap', 'square')"
              >
                <svg
                  width="24"
                  height="12"
                  viewBox="0 0 24 12"
                  fill="none"
                >
                  <path
                    d="M4 6h16"
                    stroke="currentColor"
                    stroke-width="4"
                    stroke-linecap="square"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="divider" />

      <!-- Fill Section -->
      <div class="property-section">
        <div class="section-header">
          <span class="section-title">Fill</span>
        </div>
        
        <!-- Fill Color -->
        <div class="property-row">
          <label class="property-label">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <rect
                x="3"
                y="3"
                width="18"
                height="18"
                rx="2"
              />
            </svg>
            Color
          </label>
          <div class="property-controls">
            <div class="color-input-wrapper">
              <div 
                class="color-preview"
                :style="{ background: fillColor || 'transparent' }"
                @click="openFillPicker($event)"
              >
                <div
                  v-if="!fillColor"
                  class="no-fill"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M3 3l18 18"
                      stroke="#e5e7eb"
                      stroke-width="2"
                    />
                  </svg>
                </div>
              </div>
            </div>
            <button 
              class="property-btn"
              :class="{ active: !fillColor }"
              title="No fill"
              @click="updateFillColor(null)"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M3 3l18 18"
                  stroke="currentColor"
                  stroke-width="2"
                />
              </svg>
            </button>
          </div>
        </div>

        <!-- Quick Fill Colors -->
        <div class="property-row">
          <label class="property-label small">Presets</label>
          <div class="quick-colors-grid fill-colors">
            <div 
              class="quick-color transparent"
              :class="{ active: !fillColor }"
              title="Transparent"
              @click="updateFillColor(null)"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M3 3l18 18"
                  stroke="#999"
                  stroke-width="1.5"
                />
              </svg>
            </div>
            <div 
              v-for="color in fillPresets"
              :key="'fill-' + color"
              class="quick-color"
              :style="{ background: color }"
              :class="{ active: fillColor === color }"
              :title="color"
              @click="updateFillColor(color)"
            />
          </div>
        </div>

        <!-- Suggested Fill Colors Based on Stroke -->
        <div
          v-if="suggestedFills.length > 0"
          class="property-row"
        >
          <label class="property-label small">Suggested</label>
          <div class="quick-colors-grid suggested">
            <div 
              v-for="color in suggestedFills"
              :key="'suggested-' + color"
              class="quick-color suggested-color"
              :style="{ background: color }"
              :title="`Suggested fill for ${strokeColor}`"
              @click="updateFillColor(color)"
            >
              <div class="suggested-indicator" />
            </div>
          </div>
        </div>
      </div>


      <div class="divider" />

      <!-- Opacity Section -->
      <div class="property-section">
        <div class="section-header">
          <span class="section-title">Appearance</span>
        </div>

        <!-- Opacity -->
        <div class="property-row">
          <label class="property-label">Opacity</label>
          <div class="property-controls full-width">
            <div class="slider-with-input">
              <input 
                type="range"
                :value="opacity * 100"
                min="0"
                max="100"
                step="1"
                class="slider"
                @input="updateOpacity(Number($event.target.value) / 100)"
              >
              <div class="number-input">
                <input 
                  type="number"
                  :value="Math.round(opacity * 100)"
                  min="0"
                  max="100"
                  step="1"
                  @input="updateOpacity(Number($event.target.value) / 100)"
                >
                <span class="unit">%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Blend Mode -->
        <div class="property-row">
          <label class="property-label">Blend</label>
          <div class="property-controls">
            <select 
              class="blend-select"
              :value="blendMode"
              @change="$emit('update:blend-mode', $event.target.value)"
            >
              <option value="normal">
                Normal
              </option>
              <option value="multiply">
                Multiply
              </option>
              <option value="screen">
                Screen
              </option>
              <option value="overlay">
                Overlay
              </option>
              <option value="darken">
                Darken
              </option>
              <option value="lighten">
                Lighten
              </option>
            </select>
          </div>
        </div>
      </div>

      <div
        v-if="showTextProperties"
        class="divider"
      />

      <!-- Text Properties (shown when text is selected) -->
      <div
        v-if="showTextProperties"
        class="property-section"
      >
        <div class="section-header">
          <span class="section-title">Text</span>
        </div>

        <!-- Font Family -->
        <div class="property-row">
          <label class="property-label">Font</label>
          <div class="property-controls">
            <select 
              class="font-select"
              :value="fontFamily"
              @change="$emit('update:font-family', $event.target.value)"
            >
              <option value="Arial">
                Arial
              </option>
              <option value="Helvetica">
                Helvetica
              </option>
              <option value="Times New Roman">
                Times
              </option>
              <option value="Georgia">
                Georgia
              </option>
              <option value="Verdana">
                Verdana
              </option>
              <option value="Courier New">
                Courier
              </option>
              <option value="system-ui">
                System
              </option>
            </select>
          </div>
        </div>

        <!-- Font Size -->
        <div class="property-row">
          <label class="property-label">Size</label>
          <div class="property-controls">
            <div class="number-input">
              <input 
                type="number"
                :value="fontSize"
                min="8"
                max="200"
                step="1"
                @input="$emit('update:font-size', Number($event.target.value))"
              >
              <span class="unit">px</span>
            </div>
          </div>
        </div>

        <!-- Font Style -->
        <div class="property-row">
          <label class="property-label">Style</label>
          <div class="property-controls">
            <div class="button-group">
              <button 
                class="style-btn text-style"
                :class="{ active: fontBold }"
                title="Bold"
                @click="$emit('update:font-bold', !fontBold)"
              >
                <strong>B</strong>
              </button>
              <button 
                class="style-btn text-style"
                :class="{ active: fontItalic }"
                title="Italic"
                @click="$emit('update:font-italic', !fontItalic)"
              >
                <em>I</em>
              </button>
              <button 
                class="style-btn text-style"
                :class="{ active: fontUnderline }"
                title="Underline"
                @click="$emit('update:font-underline', !fontUnderline)"
              >
                <u>U</u>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Custom Color Picker Popover for Stroke -->
  <Teleport to="body">
    <div
      v-if="showStrokeColorPicker"
      class="color-picker-popover"
      :class="`placement-${strokeColorPickerPos.placement}`"
      :style="{
        left: strokeColorPickerPos.x + 'px',
        top: strokeColorPickerPos.y + 'px'
      }"
    >
      <div class="color-picker-header">
        <span>Choose Stroke Color</span>
        <button
          class="close-btn"
          @click="closeColorPickers"
        >
          ×
        </button>
      </div>
      <div class="color-picker-content">
        <input
          type="color"
          class="color-input-large"
          :value="tempStrokeColor"
          @input="tempStrokeColor = $event.target.value"
        >
        <div class="hex-input-group">
          <label>HEX:</label>
          <input
            type="text"
            class="hex-input"
            :value="tempStrokeColor"
            @input="tempStrokeColor = $event.target.value"
          >
        </div>
        <div class="color-picker-actions">
          <button
            class="cancel-btn"
            @click="closeColorPickers"
          >
            Cancel
          </button>
          <button
            class="apply-btn"
            @click="updateStrokeColor(tempStrokeColor); closeColorPickers()"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Custom Color Picker Popover for Fill -->
  <Teleport to="body">
    <div
      v-if="showFillColorPicker"
      class="color-picker-popover"
      :class="`placement-${fillColorPickerPos.placement}`"
      :style="{
        left: fillColorPickerPos.x + 'px',
        top: fillColorPickerPos.y + 'px'
      }"
    >
      <div class="color-picker-header">
        <span>Choose Fill Color</span>
        <button
          class="close-btn"
          @click="closeColorPickers"
        >
          ×
        </button>
      </div>
      <div class="color-picker-content">
        <input
          type="color"
          class="color-input-large"
          :value="tempFillColor"
          @input="tempFillColor = $event.target.value"
        >
        <div class="hex-input-group">
          <label>HEX:</label>
          <input
            type="text"
            class="hex-input"
            :value="tempFillColor"
            @input="tempFillColor = $event.target.value"
          >
        </div>
        <div class="color-picker-actions">
          <button
            class="cancel-btn"
            @click="closeColorPickers"
          >
            Cancel
          </button>
          <button
            class="apply-btn"
            @click="updateFillColor(tempFillColor); closeColorPickers()"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

interface Props {
  strokeColor: string;
  fillColor?: string | null;
  strokeWidth: number;
  strokeStyle?: 'solid' | 'dashed' | 'dotted';
  lineCap?: 'butt' | 'round' | 'square';
  opacity?: number;
  blendMode?: string;
  showTextProperties?: boolean;
  fontFamily?: string;
  fontSize?: number;
  fontBold?: boolean;
  fontItalic?: boolean;
  fontUnderline?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  strokeStyle: 'solid',
  lineCap: 'round',
  opacity: 1,
  blendMode: 'normal',
  showTextProperties: false,
  fontFamily: 'Arial',
  fontSize: 20,
  fontBold: false,
  fontItalic: false,
  fontUnderline: false,
});

const emit = defineEmits<{
  'update:stroke-color': [color: string];
  'update:fill-color': [color: string | null];
  'update:stroke-width': [width: number];
  'update:stroke-style': [style: 'solid' | 'dashed' | 'dotted'];
  'update:line-cap': [cap: 'butt' | 'round' | 'square'];
  'update:opacity': [opacity: number];
  'update:blend-mode': [mode: string];
  'update:font-family': [family: string];
  'update:font-size': [size: number];
  'update:font-bold': [bold: boolean];
  'update:font-italic': [italic: boolean];
  'update:font-underline': [underline: boolean];
}>();

const isCollapsed = ref(false);
const fillInput = ref<HTMLInputElement>();
const strokeInput = ref<HTMLInputElement>();

// Custom color picker state
const showStrokeColorPicker = ref(false);
const showFillColorPicker = ref(false);
const strokeColorPickerPos = ref({ x: 0, y: 0, placement: 'bottom' });
const fillColorPickerPos = ref({ x: 0, y: 0, placement: 'bottom' });
const tempStrokeColor = ref('');
const tempFillColor = ref('');

// Predefined color sets
const strokePresets = [
  '#000000', '#FFFFFF', '#FF3B30', '#FF9500', '#FFCC00',
  '#34C759', '#00C7BE', '#30B0C7', '#007AFF', '#5856D6',
  '#AF52DE', '#FF2D55', '#A2845E', '#8E8E93',
];

const fillPresets = [
  '#FFFFFF', '#F2F2F7', '#FFE5E5', '#FFF3E5', '#FFFAE5',
  '#E5F7E9', '#E5F7F6', '#E5F3F7', '#E5EFFF', '#EDECF9',
  '#F5E5F7', '#FFE5EC', '#F5F0E8', '#F2F2F2',
];

// Generate suggested fill colors based on stroke color
const suggestedFills = computed(() => {
  if (!props.strokeColor) return [];
  
  const suggestions: string[] = [];
  
  // Convert hex to RGB
  const hex = props.strokeColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Lighter version (20% opacity)
  suggestions.push(`rgba(${r}, ${g}, ${b}, 0.2)`);
  
  // Lighter version (10% opacity)
  suggestions.push(`rgba(${r}, ${g}, ${b}, 0.1)`);
  
  // Lighter tint
  const tintR = Math.min(255, r + (255 - r) * 0.8);
  const tintG = Math.min(255, g + (255 - g) * 0.8);
  const tintB = Math.min(255, b + (255 - b) * 0.8);
  suggestions.push(`rgb(${Math.round(tintR)}, ${Math.round(tintG)}, ${Math.round(tintB)})`);
  
  return suggestions.slice(0, 3);
});

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
};

const calculatePopoverPosition = (triggerElement: HTMLElement) => {
  const rect = triggerElement.getBoundingClientRect();
  const popoverWidth = 280; // min-width from CSS
  const popoverHeight = 240; // estimated height
  const margin = 12; // margin from viewport edges
  
  let x = rect.left;
  let y = rect.bottom + 8;
  let placement = 'bottom'; // track placement for arrow positioning
  
  // Center the popover horizontally relative to the trigger if possible
  const centerX = rect.left + (rect.width / 2) - (popoverWidth / 2);
  if (centerX >= margin && centerX + popoverWidth <= window.innerWidth - margin) {
    x = centerX;
  } else {
    // Check if popover would overflow right edge
    if (x + popoverWidth > window.innerWidth - margin) {
      x = window.innerWidth - popoverWidth - margin;
    }
    
    // Check if popover would overflow left edge
    if (x < margin) {
      x = margin;
    }
  }
  
  // Check if popover would overflow bottom edge
  if (y + popoverHeight > window.innerHeight - margin) {
    // Position above the trigger element instead
    y = rect.top - popoverHeight - 8;
    placement = 'top';
    
    // If it still overflows top, position it at the top with margin
    if (y < margin) {
      y = margin;
      placement = 'center';
    }
  }
  
  return { x, y, placement };
};

const openFillPicker = (event?: MouseEvent) => {
  if (event) {
    const pos = calculatePopoverPosition(event.currentTarget as HTMLElement);
    fillColorPickerPos.value = pos;
  }
  tempFillColor.value = props.fillColor || '#ffffff';
  showFillColorPicker.value = true;
  showStrokeColorPicker.value = false;
};

const openStrokePicker = (event?: MouseEvent) => {
  if (event) {
    const pos = calculatePopoverPosition(event.currentTarget as HTMLElement);
    strokeColorPickerPos.value = pos;
  }
  tempStrokeColor.value = props.strokeColor;
  showStrokeColorPicker.value = true;
  showFillColorPicker.value = false;
};

const closeColorPickers = () => {
  showStrokeColorPicker.value = false;
  showFillColorPicker.value = false;
};

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (!target.closest('.color-picker-popover') && !target.closest('.color-preview') && !target.closest('.add-color')) {
    closeColorPickers();
  }
};

const handleWindowResize = () => {
  // Close color pickers on window resize to avoid positioning issues
  if (showStrokeColorPicker.value || showFillColorPicker.value) {
    closeColorPickers();
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  window.addEventListener('resize', handleWindowResize);
  window.addEventListener('scroll', handleWindowResize);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  window.removeEventListener('resize', handleWindowResize);
  window.removeEventListener('scroll', handleWindowResize);
});

const updateFillColor = (color: string | null) => {
  emit('update:fill-color', color);
};

const updateStrokeColor = (color: string) => {
  emit('update:stroke-color', color);
};

const updateStrokeWidth = (width: number) => {
  if (width >= 0 && width <= 100) {
    emit('update:stroke-width', width);
  }
};

const updateStrokeStyle = (style: 'solid' | 'dashed' | 'dotted') => {
  emit('update:stroke-style', style);
};

const updateOpacity = (opacity: number) => {
  if (opacity >= 0 && opacity <= 1) {
    emit('update:opacity', opacity);
  }
};
</script>

<style scoped>
.property-panel {
  position: fixed;
  right: 16px;
  top: 72px;
  width: 340px; /* Increased from 280px */
  max-height: calc(100vh - 100px);
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(20px);
  z-index: 999;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.property-panel.collapsed {
  width: auto;
}

.panel-header {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
  flex-shrink: 0;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.panel-title svg {
  color: #6b7280;
}

.collapse-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s;
}

.collapse-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.collapse-btn svg {
  transition: transform 0.3s;
}

.panel-content {
  padding: 8px;
  overflow-y: auto;
  flex: 1;
}

.property-section {
  padding: 8px;
}

.section-header {
  margin-bottom: 12px;
}

.section-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b7280;
}

.property-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  min-height: 32px;
}

.property-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  min-width: 70px;
}

.property-label.small {
  font-size: 11px;
  color: #6b7280;
}

.property-label svg {
  color: #9ca3af;
}

.property-controls {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-end;
}

.property-controls.full-width {
  width: 100%;
}

.color-input-wrapper {
  position: relative;
}

.color-preview {
  width: 36px;
  height: 36px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
}

.color-preview:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border-color: #d1d5db;
}

.no-fill {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(45deg, #f9fafb 25%, transparent 25%, transparent 75%, #f9fafb 75%, #f9fafb),
              linear-gradient(45deg, #f9fafb 25%, transparent 25%, transparent 75%, #f9fafb 75%, #f9fafb);
  background-size: 8px 8px;
  background-position: 0 0, 4px 4px;
}

.property-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s;
}

.property-btn:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
  color: #374151;
}

.property-btn.active {
  background: #eff6ff;
  border-color: #3b82f6;
  color: #2563eb;
}

.quick-colors-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
  flex: 1;
}

.quick-colors-grid.fill-colors {
  grid-template-columns: repeat(7, 1fr);
}

.quick-colors-grid.suggested {
  grid-template-columns: repeat(3, 1fr);
}

.quick-color {
  width: 28px;
  height: 28px;
  border: 2px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
}

.quick-color:hover {
  transform: scale(1.15);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.quick-color.active {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.quick-color.transparent {
  background: linear-gradient(45deg, #e5e7eb 25%, transparent 25%, transparent 75%, #e5e7eb 75%, #e5e7eb),
              linear-gradient(45deg, #e5e7eb 25%, white 25%, white 75%, #e5e7eb 75%, #e5e7eb);
  background-size: 10px 10px;
  background-position: 0 0, 5px 5px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quick-color.add-color {
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
}

.quick-color.add-color:hover {
  background: #e5e7eb;
  color: #374151;
}

.quick-color.suggested-color {
  border: 1px solid #e5e7eb;
}

.suggested-indicator {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 6px;
  height: 6px;
  background: #10b981;
  border-radius: 50%;
  border: 1px solid white;
}

.divider {
  height: 1px;
  background: rgba(0, 0, 0, 0.06);
  margin: 8px 0;
}

.slider-with-input {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.number-input {
  display: flex;
  align-items: center;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 6px 10px;
  gap: 4px;
  min-width: 80px;
}

.number-input input {
  width: 48px;
  border: none;
  background: transparent;
  font-size: 13px;
  font-weight: 500;
  color: #111827;
  outline: none;
  text-align: center;
}

.unit {
  font-size: 11px;
  color: #9ca3af;
  font-weight: 500;
}

.slider {
  flex: 1;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: #e5e7eb;
  border-radius: 2px;
  outline: none;
  min-width: 100px;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: #3b82f6;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.slider::-webkit-slider-thumb:hover {
  background: #2563eb;
  transform: scale(1.1);
}

.button-group {
  display: flex;
  gap: 4px;
  background: #f3f4f6;
  padding: 2px;
  border-radius: 8px;
}

.style-btn {
  width: 40px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s;
  padding: 0;
}

.style-btn:hover {
  background: white;
  color: #374151;
}

.style-btn.active {
  background: white;
  color: #2563eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.style-btn.text-style {
  font-size: 14px;
  font-weight: 600;
  width: 36px;
}

.blend-select,
.font-select {
  width: 100%;
  padding: 8px 12px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 13px;
  color: #374151;
  outline: none;
  cursor: pointer;
  transition: all 0.2s;
}

.blend-select:hover,
.font-select:hover {
  border-color: #d1d5db;
}

.blend-select:focus,
.font-select:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Scrollbar styling */
.panel-content::-webkit-scrollbar {
  width: 6px;
}

.panel-content::-webkit-scrollbar-track {
  background: transparent;
}

.panel-content::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

/* Custom Color Picker Popover */
.color-picker-popover {
  position: fixed;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(20px);
  z-index: 10000;
  min-width: 280px;
  max-width: 320px;
  animation: fadeInScale 0.2s ease-out;
  transform-origin: center top;
}

.color-picker-popover.placement-top {
  transform-origin: center bottom;
}

.color-picker-popover.placement-center {
  transform-origin: center center;
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .color-picker-popover {
    min-width: 260px;
    max-width: calc(100vw - 24px);
  }
  
  .color-picker-content {
    padding: 12px;
  }
  
  .color-input-large {
    height: 100px;
  }
}

.color-picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #f3f4f6;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.close-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 4px;
  font-size: 20px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.color-picker-content {
  padding: 16px;
}

.color-input-large {
  width: 100%;
  height: 120px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 12px;
}

.hex-input-group {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.hex-input-group label {
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
}

.hex-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 13px;
  color: #111827;
  font-family: 'SF Mono', Consolas, monospace;
  text-transform: uppercase;
  outline: none;
  transition: all 0.2s;
}

.hex-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.color-picker-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.cancel-btn,
.apply-btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: white;
  border: 1px solid #e5e7eb;
  color: #6b7280;
}

.cancel-btn:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
  color: #374151;
}

.apply-btn {
  background: #3b82f6;
  border: 1px solid #3b82f6;
  color: white;
}

.apply-btn:hover {
  background: #2563eb;
  border-color: #2563eb;
}
</style>