<template>
  <button
    :class="{ active, 'btn-tooltip': tooltip }"
    :title="tooltip"
    @click="onClick"
    @mouseover="showTooltip"
    @mouseout="hideTooltip"
  >
    <i :class="iconClass">{{ title }}</i>
  </button>
</template>

<script setup>
  import { defineProps } from "vue";

  const props = defineProps({
    iconClass: {
      type: String,
      required: true
    },
    active: {
      type: Boolean,
      default: false
    },
    tooltip: {
      type: String,
      default: ""
    },
    onClick: {
      type: Function,
      required: true
    },
    title: {
      type: String,
      default: ""
    }
  });

  function showTooltip() {
    // Logic to show tooltip (if using custom tooltip)
  }

  function hideTooltip() {
    // Logic to hide tooltip (if using custom tooltip)
  }
</script>

<style scoped>
  button {
    padding: 10px 14px;
    cursor: pointer;
    border: none;
    border-radius: 8px;
    background-color: #ffffff;
    color: #555;
    font-size: 14px;
    transition: background-color 0.3s, transform 0.2s;
  }

  button:hover {
    background-color: #e7f1ff;
    transform: scale(1.05);
  }

  button.active {
    background-color: #bee3f8;
    color: #3182ce;
  }

  .btn-tooltip {
    position: relative;
  }
</style>
