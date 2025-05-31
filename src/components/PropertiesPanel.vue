<template>
  <div
    class="properties-panel"
    :class="{ 'collapsed': isCollapsed }"
  >
    <!-- Header -->
    <div class="panel-header">
      <h2
        v-show="!isCollapsed"
        class="panel-title"
      >
        Properties
      </h2>
      <button 
        class="collapse-button"
        @click="toggleCollapse"
      >
        <svg 
          class="collapse-icon"
          :class="{ 'rotated': isCollapsed }"
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
    </div>

    <!-- Panel Content -->
    <div 
      v-show="!isCollapsed"
      class="panel-content"
    >
      <!-- Stroke Properties -->
      <div class="section">
        <h3 class="section-title">
          Stroke
        </h3>
        <div class="section-content">
          <div class="property-group">
            <label class="property-label">Color</label>
            <PickColors
              v-model="strokeColorProxy"
              :colors="[strokeColor]"
              :show-input="true"
              :show-palette="true"
              :show-recent="false"
              :show-favorites="false"
              :show-history="false"
              :show-alpha="false"
              class="color-picker"
            />
          </div>
          <div class="property-group">
            <label class="property-label">Width</label>
            <input 
              type="range" 
              :value="strokeWidth"
              min="1"
              max="20"
              class="range-input"
              @input="updateStrokeWidth"
            >
            <span class="range-value">{{ strokeWidth }}px</span>
          </div>
          <div class="property-group">
            <label class="property-label">Style</label>
            <select 
              :value="strokeStyle"
              class="select-input"
              @change="updateStrokeStyle"
            >
              <option value="solid">
                Solid
              </option>
              <option value="dashed">
                Dashed
              </option>
              <option value="dotted">
                Dotted
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Fill Properties -->
      <div class="section">
        <h3 class="section-title">
          Fill
        </h3>
        <div class="section-content">
          <div class="property-group">
            <label class="property-label">Color</label>
            <PickColors
              v-model="fillColorProxy"
              :colors="[fillColor]"
              :show-input="true"
              :show-palette="true"
              :show-recent="false"
              :show-favorites="false"
              :show-history="false"
              :show-alpha="false"
              class="color-picker"
            />
          </div>
          <div class="property-group">
            <label class="property-label">Opacity</label>
            <input 
              type="range" 
              :value="fillOpacity"
              min="0"
              max="100"
              class="range-input"
              @input="updateFillOpacity"
            >
            <span class="range-value">{{ fillOpacity }}%</span>
          </div>
        </div>
      </div>

      <!-- Background Properties -->
      <div class="section">
        <h3 class="section-title">
          Background
        </h3>
        <div class="section-content">
          <div class="property-group">
            <label class="property-label">Color</label>
            <PickColors
              v-model="backgroundColorProxy"
              :colors="[backgroundColor]"
              :show-input="true"
              :show-palette="true"
              :show-recent="false"
              :show-favorites="false"
              :show-history="false"
              :show-alpha="false"
              class="color-picker"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import PickColors from 'vue-pick-colors';

const props = defineProps<{
  strokeColor: string;
  strokeWidth: number;
  strokeStyle: string;
  fillColor: string;
  fillOpacity: number;
  backgroundColor: string;
}>();

const emit = defineEmits<{
  (e: 'update:strokeColor', value: string): void;
  (e: 'update:strokeWidth', value: number): void;
  (e: 'update:strokeStyle', value: string): void;
  (e: 'update:fillColor', value: string): void;
  (e: 'update:fillOpacity', value: number): void;
  (e: 'update:backgroundColor', value: string): void;
}>();

const isCollapsed = ref(false);

// Proxy for v-model with PickColors
const strokeColorProxy = ref(props.strokeColor);
watch(() => props.strokeColor, (val) => { strokeColorProxy.value = val; });
watch(strokeColorProxy, (val) => { emit('update:strokeColor', val); });

const fillColorProxy = ref(props.fillColor);
watch(() => props.fillColor, (val) => { fillColorProxy.value = val; });
watch(fillColorProxy, (val) => { emit('update:fillColor', val); });

const backgroundColorProxy = ref(props.backgroundColor);
watch(() => props.backgroundColor, (val) => { backgroundColorProxy.value = val; });
watch(backgroundColorProxy, (val) => { emit('update:backgroundColor', val); });

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value;
}

function updateStrokeWidth(e: Event) {
  const target = e.target as HTMLInputElement;
  emit('update:strokeWidth', parseInt(target.value));
}

function updateStrokeStyle(e: Event) {
  const target = e.target as HTMLSelectElement;
  emit('update:strokeStyle', target.value);
}

function updateFillOpacity(e: Event) {
  const target = e.target as HTMLInputElement;
  emit('update:fillOpacity', parseInt(target.value));
}
</script>

<style scoped>
.properties-panel {
  background-color: white;
  height: 100vh;
  width: 300px;
  border-right: 1px solid #e5e7eb;
  position: fixed;
  left: 0;
  top: 0;
  display: flex;
  flex-direction: column;
  z-index: 1000;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  transition: width 0.3s ease;
}

.properties-panel.collapsed {
  width: 40px;
}

.panel-header {
  background-color: #f9fafb;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 40px;
}

.properties-panel.collapsed .panel-header {
  padding: 0.5rem;
  justify-content: center;
}

.panel-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.collapse-button {
  color: #9ca3af;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  transition: background-color 0.2s;
}

.collapse-button:hover {
  color: #4b5563;
  background-color: #f3f4f6;
}

.collapse-icon {
  width: 1rem;
  height: 1rem;
  transform: rotate(0deg);
  transition: transform 0.2s;
}

.collapse-icon.rotated {
  transform: rotate(180deg);
}

.panel-content {
  padding: 1rem;
  flex: 1;
  overflow-y: auto;
}

.section {
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.section-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.property-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.property-label {
  font-size: 0.875rem;
  color: #4b5563;
  margin-bottom: 0.25rem;
}

.color-picker {
  width: 100%;
}

.range-input {
  width: 100%;
  height: 0.25rem;
  background-color: #e5e7eb;
  border-radius: 0.5rem;
  appearance: none;
  cursor: pointer;
}

.range-input::-webkit-slider-thumb {
  appearance: none;
  width: 0.75rem;
  height: 0.75rem;
  background-color: #3b82f6;
  border-radius: 9999px;
  cursor: pointer;
}

.range-input::-moz-range-thumb {
  appearance: none;
  width: 0.75rem;
  height: 0.75rem;
  background-color: #3b82f6;
  border-radius: 9999px;
  cursor: pointer;
  border: 0;
}

.range-value {
  font-size: 0.75rem;
  color: #6b7280;
}

.select-input {
  width: 100%;
  padding: 0.25rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.25rem;
  font-size: 0.875rem;
}
</style> 