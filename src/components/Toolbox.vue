<template>
  <div class="toolbar">
    <div class="tool-group">
      <IconButton
        icon-class="fas fa-mouse-pointer"
        :active="activeTool === 'select'"
        tooltip="Select Tool"
        @click="setTool('select')"
      />
      <IconButton
        icon-class="fas fa-paint-brush"
        :active="activeTool === 'brush'"
        tooltip="Brush Tool"
        @click="setTool('brush')"
      />
      <IconButton
        icon-class="fas fa-slash"
        :active="activeTool === 'line'"
        tooltip="Line Tool"
        @click="setTool('line')"
      />
      <input
        v-if="activeTool === 'line'"
        :model-value="brushColor"
        type="color"
        class="color-picker"
        @input="$emit('update:brushColor', $event.target.value)"
      />
      <input
        v-if="activeTool === 'brush'"
        :model-value="brushColor"
        type="color"
        class="color-picker"
        @input="$emit('update:brushColor', $event.target.value)"
      />
      <IconButton
        icon-class="fas fa-square"
        :active="activeTool === 'rectangle'"
        tooltip="Rectangle Tool"
        @click="setTool('rectangle')"
      />
      <IconButton
        icon-class="fas fa-font"
        :active="activeTool === 'text'"
        tooltip="Text Tool"
        @click="setTool('text')"
      />
      <div v-if="activeTool === 'rectangle' || activeTool === 'text'" class="shape-options">
        <input :model-value="shapeColor" type="color" class="color-picker" @input="$emit('update:shapeColor', $event.target.value)" />
      </div>
    </div>

    <div class="tool-group">
      <IconButton icon-class="fas fa-exchange-alt" tooltip="Replace Image" @click="$emit('triggerImageUpload')" />
      <IconButton icon-class="fas fa-file-image" tooltip="Add File" @click="$emit('triggerNewImageUpload')" />
      <IconButton icon-class="fas fa-crop-alt" tooltip="Crop" @click="$emit('startCrop')" />
      <IconButton v-if="isCropping" icon-class="fas fa-check" tooltip="Apply Crop" @click="$emit('applyCrop')" />
    </div>

    <div class="tool-group actions">
      <button class="btn-export" @click="$emit('export')">
        <i class="fas fa-download"></i>
      </button>
      <button class="btn-clear" @click="$emit('clear')">
        <i class="fas fa-trash-alt"></i>
      </button>
    </div>
  </div>
</template>

<script setup>
  import { defineProps, defineEmits } from "vue";
  import IconButton from "./IconButton.vue";

  const props = defineProps({
    activeTool: String,
    brushColor: String,
    shapeColor: String,
    strokeWidth: Number,
    isCropping: Boolean
  });

  const emit = defineEmits([
    "setTool",
    "update:brushColor",
    "update:shapeColor",
    "update:strokeWidth",
    "triggerImageUpload",
    "triggerNewImageUpload",
    "startCrop",
    "applyCrop",
    "export",
    "clear"
  ]);

  const setTool = (tool) => {
    emit("setTool", tool);
  };
</script>

<style scoped>
  .toolbar {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    padding: 8px;
    background: rgba(18, 38, 46, 0.95);
    border-radius: 8px;
    display: flex;
    flex-wrap: nowrap;
    gap: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    z-index: 1000;
    backdrop-filter: blur(8px);
  }

  .tool-group {
    display: flex;
    gap: 4px;
    align-items: center;
    padding: 0 4px;
    border-right: 1px solid rgba(255, 255, 255, 0.1);
  }

  .tool-group:last-child {
    border-right: none;
  }

  .toolbar button {
    padding: 8px;
    cursor: pointer;
    border: none;
    border-radius: 4px;
    background-color: transparent;
    color: #ffffff;
    font-size: 14px;
    transition: background-color 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 32px;
    min-height: 32px;
  }

  .toolbar button:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .toolbar button.active {
    background-color: rgba(255, 255, 255, 0.2);
    color: #4fd1c5;
  }

  .color-picker {
    width: 24px;
    height: 24px;
    padding: 0;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    background: transparent;
  }

  .color-picker::-webkit-color-swatch-wrapper {
    padding: 0;
  }

  .color-picker::-webkit-color-swatch {
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 4px;
  }
</style>
