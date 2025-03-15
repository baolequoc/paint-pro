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
      <input
        v-if="activeTool === 'brush'"
        :model-value="brushColor"
        type="color"
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
        <input :model-value="shapeColor" type="color" @input="$emit('update:shapeColor', $event.target.value)" />
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
    padding: 16px;
    background: #ffffff;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    z-index: 10;
  }

  .tool-group {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    align-items: center;
  }

  .toolbar button {
    padding: 10px 14px;
    cursor: pointer;
    border: none;
    border-radius: 8px; /* Rounded corners */
    background-color: #ffffff;
    color: #555;
    font-size: 14px;
    transition: background-color 0.3s, transform 0.2s;
  }

  .toolbar button:hover {
    background-color: #e7f1ff; /* Light hover effect */
    transform: scale(1.05);
  }

  .toolbar button.active {
    background-color: #bee3f8; /* Active button color */
    color: #3182ce;
  }
</style>
