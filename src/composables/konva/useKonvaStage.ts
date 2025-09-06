import { ref, shallowRef, onMounted, onUnmounted, type Ref } from 'vue';
import Konva from 'konva';
import type { StageConfig, KonvaStage, KonvaLayer } from '@/types/konva';

export function useKonvaStage(containerRef: Ref<HTMLDivElement | null>) {
  const stage = shallowRef<KonvaStage | null>(null);
  const mainLayer = shallowRef<KonvaLayer | null>(null);
  const tempLayer = shallowRef<KonvaLayer | null>(null);
  const transformerLayer = shallowRef<KonvaLayer | null>(null);
  const isReady = ref(false);

  const initStage = (config?: Partial<StageConfig>) => {
    if (!containerRef.value) {
      console.error('Container element not found');
      return;
    }

    // Clean up existing stage
    if (stage.value) {
      stage.value.destroy();
    }

    // Create new stage
    const newStage = new Konva.Stage({
      container: containerRef.value,
      width: config?.width || window.innerWidth,
      height: config?.height || window.innerHeight,
      draggable: false,
    });

    // Create layers
    const newMainLayer = new Konva.Layer();
    const newTempLayer = new Konva.Layer();
    const newTransformerLayer = new Konva.Layer();

    // Add layers to stage
    newStage.add(newMainLayer);
    newStage.add(newTempLayer);
    newStage.add(newTransformerLayer);

    // Update refs
    stage.value = newStage;
    mainLayer.value = newMainLayer;
    tempLayer.value = newTempLayer;
    transformerLayer.value = newTransformerLayer;
    isReady.value = true;

    // Handle window resize
    handleResize();
  };

  const handleResize = () => {
    if (!stage.value || !containerRef.value) return;

    const container = containerRef.value;
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;

    stage.value.width(containerWidth);
    stage.value.height(containerHeight);
  };

  const clearStage = () => {
    if (!mainLayer.value) return;
    
    mainLayer.value.destroyChildren();
    mainLayer.value.draw();
    
    if (tempLayer.value) {
      tempLayer.value.destroyChildren();
      tempLayer.value.draw();
    }
  };

  const toDataURL = (config?: { pixelRatio?: number; mimeType?: string }) => {
    if (!stage.value) return null;
    
    return stage.value.toDataURL({
      pixelRatio: config?.pixelRatio || 2,
      mimeType: config?.mimeType || 'image/png',
    });
  };

  const toJSON = () => {
    if (!stage.value) return null;
    return stage.value.toJSON();
  };

  const loadFromJSON = (json: string) => {
    if (!stage.value || !containerRef.value) return;
    
    stage.value.destroy();
    
    const container = containerRef.value;
    stage.value = Konva.Node.create(json, container) as KonvaStage;
    
    // Re-assign layers
    const layers = stage.value.getLayers();
    mainLayer.value = layers[0] || null;
    tempLayer.value = layers[1] || null;
    transformerLayer.value = layers[2] || null;
  };

  const getPointerPosition = () => {
    if (!stage.value) return null;
    const transform = stage.value.getAbsoluteTransform().copy();
    transform.invert();
    const pos = stage.value.getPointerPosition();
    if (!pos) return null;
    return transform.point(pos);
  };

  const batchDraw = () => {
    mainLayer.value?.batchDraw();
    tempLayer.value?.batchDraw();
    transformerLayer.value?.batchDraw();
  };

  onMounted(() => {
    window.addEventListener('resize', handleResize);
  });

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
    if (stage.value) {
      stage.value.destroy();
    }
  });

  return {
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
    handleResize,
  };
}