import { ref, shallowRef, type Ref } from 'vue';
import Konva from 'konva';
import type { KonvaStage, KonvaLayer, KonvaNode, KonvaTransformer } from '@/types/konva';

export function useKonvaSelection(
  stage: Ref<KonvaStage | null>,
  mainLayer: Ref<KonvaLayer | null>,
  transformerLayer: Ref<KonvaLayer | null>,
  getPointerPosition?: () => { x: number; y: number } | null
) {
  const selectedNodes = shallowRef<KonvaNode[]>([]);
  const transformer = shallowRef<KonvaTransformer | null>(null);
  const selectionRectangle = shallowRef<Konva.Rect | null>(null);
  const dragHandle = shallowRef<Konva.Group | null>(null);
  const isSelecting = ref(false);
  const startPos = ref({ x: 0, y: 0 });

  const initTransformer = () => {
    if (!transformerLayer.value) return;

    // Create transformer
    const tr = new Konva.Transformer({
      nodes: [],
      rotateEnabled: true,
      borderStroke: '#0066ff',
      borderStrokeWidth: 2,
      borderDash: [4, 4],
      anchorFill: '#ffffff',
      anchorStroke: '#0066ff',
      anchorStrokeWidth: 2,
      anchorSize: 10,
      anchorCornerRadius: 2,
      keepRatio: false,
      centeredScaling: false,
      shouldOverdrawWholeArea: false, // Allow clicking through transformer
      boundBoxFunc: (oldBox, newBox) => {
        // Limit resize to prevent negative dimensions
        if (newBox.width < 5 || newBox.height < 5) {
          return oldBox;
        }
        return newBox;
      },
    });

    // Update drag handles during and after transformation
    tr.on('transform', () => {
      updateDragHandle();
    });

    tr.on('transformend', () => {
      updateDragHandle();
    });

    transformerLayer.value.add(tr);
    transformer.value = tr;
  };

  const updateDragHandle = () => {
    if (!transformerLayer.value || !transformer.value) return;

    // Don't show drag handles if nothing is selected
    if (selectedNodes.value.length === 0) {
      if (dragHandle.value) {
        dragHandle.value.destroy();
        dragHandle.value = null;
      }
      transformerLayer.value.batchDraw();
      return;
    }

    // Get the bounding box of selected elements
    const box = transformer.value.getClientRect();
    
    // Don't create handle if box is invalid
    if (!box || box.width === 0 || box.height === 0) {
      if (dragHandle.value) {
        dragHandle.value.destroy();
        dragHandle.value = null;
      }
      return;
    }
    
    // If handles already exist, just update their positions
    if (dragHandle.value) {
      const handles = dragHandle.value.getChildren();
      handles.forEach((handle: any) => {
        const position = handle.getAttr('data-position');
        if (position) {
          switch(position) {
            case 'top':
              handle.x(box.x + box.width / 2);
              handle.y(box.y - 15);
              break;
            case 'bottom':
              handle.x(box.x + box.width / 2);
              handle.y(box.y + box.height + 15);
              break;
            case 'left':
              handle.x(box.x - 15);
              handle.y(box.y + box.height / 2);
              break;
            case 'right':
              handle.x(box.x + box.width + 15);
              handle.y(box.y + box.height / 2);
              break;
          }
        }
      });
      transformerLayer.value.batchDraw();
      return;
    }
    
    // Create main drag handle group to hold all handles
    const handleGroup = new Konva.Group({
      name: 'drag-handle-container',
      listening: true,
    });

    // Helper function to create a single handle
    const createHandle = (position: 'top' | 'bottom' | 'left' | 'right') => {
      let x = 0, y = 0, width = 80, height = 24;
      
      switch(position) {
        case 'top':
          x = box.x + box.width / 2;
          y = box.y - 15;
          break;
        case 'bottom':
          x = box.x + box.width / 2;
          y = box.y + box.height + 15;
          break;
        case 'left':
          x = box.x - 15;
          y = box.y + box.height / 2;
          width = 24;
          height = 80;
          break;
        case 'right':
          x = box.x + box.width + 15;
          y = box.y + box.height / 2;
          width = 24;
          height = 80;
          break;
      }

      const handle = new Konva.Group({
        x: x,
        y: y,
        draggable: true,
        name: 'drag-handle',
        'data-position': position,
      });

      // Create handle background
      const handleBg = new Konva.Rect({
        x: position === 'left' || position === 'right' ? -12 : -40,
        y: position === 'left' || position === 'right' ? -40 : -12,
        width: width,
        height: height,
        fill: '#0066ff',
        cornerRadius: 12,
        shadowColor: 'black',
        shadowBlur: 5,
        shadowOpacity: 0.3,
        shadowOffset: { x: 0, y: 2 },
      });

      // Create handle icon (drag dots)
      const dotRadius = 2;
      const dotSpacing = 8;
      const dotsGroup = new Konva.Group({
        x: position === 'left' || position === 'right' ? -4 : -12,
        y: position === 'left' || position === 'right' ? -12 : 0,
      });

      const rows = position === 'left' || position === 'right' ? 4 : 2;
      const cols = position === 'left' || position === 'right' ? 2 : 4;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const dot = new Konva.Circle({
            x: col * dotSpacing,
            y: row * dotSpacing - (rows === 2 ? 4 : 12),
            radius: dotRadius,
            fill: 'white',
            opacity: 0.8,
          });
          dotsGroup.add(dot);
        }
      }

      handle.add(handleBg);
      handle.add(dotsGroup);
      
      return { handle, handleBg };
    };

    // Create handles for all four sides
    const handles: any[] = [];
    ['top', 'bottom', 'left', 'right'].forEach((position) => {
      const { handle, handleBg } = createHandle(position as any);
      handles.push({ handle, handleBg, position });
      handleGroup.add(handle);
    });

    // Track initial positions for dragging
    let nodeStartPositions: Map<any, { x: number, y: number }> = new Map();

    // Add events to each handle
    handles.forEach(({ handle, handleBg, position }) => {
      // Hover effects
      handle.on('mouseenter', () => {
        handleBg.fill('#0056d3');
        transformerLayer.value?.batchDraw();
        document.body.style.cursor = 'move';
      });

      handle.on('mouseleave', () => {
        handleBg.fill('#0066ff');
        transformerLayer.value?.batchDraw();
        document.body.style.cursor = 'default';
      });

      // Track initial positions when drag starts
      let dragStartPos = { x: 0, y: 0 };

      handle.on('dragstart', () => {
        dragStartPos = { x: handle.x(), y: handle.y() };
        
        // Store initial positions of all selected nodes
        nodeStartPositions.clear();
        selectedNodes.value.forEach(node => {
          nodeStartPositions.set(node, { x: node.x(), y: node.y() });
        });
      });

      // Handle dragging
      handle.on('dragmove', () => {
        // Calculate total offset from start
        const dx = handle.x() - dragStartPos.x;
        const dy = handle.y() - dragStartPos.y;

        // Move all selected nodes by the offset from their start positions
        selectedNodes.value.forEach(node => {
          const startPos = nodeStartPositions.get(node);
          if (startPos) {
            node.x(startPos.x + dx);
            node.y(startPos.y + dy);
          }
        });

        // Update transformer
        if (transformer.value) {
          transformer.value.forceUpdate();
        }

        // Update all handles positions to match new selection position
        const newBox = transformer.value?.getClientRect();
        if (newBox) {
          handles.forEach(({ handle: h, position: p }) => {
            if (h !== handle) { // Don't update the handle being dragged
              switch(p) {
                case 'top':
                  h.x(newBox.x + newBox.width / 2);
                  h.y(newBox.y - 15);
                  break;
                case 'bottom':
                  h.x(newBox.x + newBox.width / 2);
                  h.y(newBox.y + newBox.height + 15);
                  break;
                case 'left':
                  h.x(newBox.x - 15);
                  h.y(newBox.y + newBox.height / 2);
                  break;
                case 'right':
                  h.x(newBox.x + newBox.width + 15);
                  h.y(newBox.y + newBox.height / 2);
                  break;
              }
            }
          });
        }

        mainLayer.value?.batchDraw();
        transformerLayer.value?.batchDraw();
      });

      handle.on('dragend', () => {
        // Update handle position to match new selection position
        const newBox = transformer.value?.getClientRect();
        if (newBox) {
          switch(position) {
            case 'top':
              handle.x(newBox.x + newBox.width / 2);
              handle.y(newBox.y - 15);
              break;
            case 'bottom':
              handle.x(newBox.x + newBox.width / 2);
              handle.y(newBox.y + newBox.height + 15);
              break;
            case 'left':
              handle.x(newBox.x - 15);
              handle.y(newBox.y + newBox.height / 2);
              break;
            case 'right':
              handle.x(newBox.x + newBox.width + 15);
              handle.y(newBox.y + newBox.height / 2);
              break;
          }
        }
        
        nodeStartPositions.clear();
        transformerLayer.value?.batchDraw();
      });
    });
    transformerLayer.value.add(handleGroup);
    dragHandle.value = handleGroup;
    transformerLayer.value.batchDraw();
  };

  const selectNodes = (nodes: KonvaNode[]) => {
    if (!transformer.value) {
      initTransformer();
    }

    // Remove highlight from previously selected nodes
    selectedNodes.value.forEach(node => {
      // Remove selection highlight
      if ('shadowColor' in node && typeof node.shadowColor === 'function') {
        node.shadowColor('');
        if ('shadowBlur' in node && typeof node.shadowBlur === 'function') {
          node.shadowBlur(0);
        }
        if ('shadowOffset' in node && typeof node.shadowOffset === 'function') {
          node.shadowOffset({ x: 0, y: 0 });
        }
      }
    });

    selectedNodes.value = nodes;
    
    // Move selected nodes to top and add highlight
    nodes.forEach(node => {
      // Move to top (bring to front)
      node.moveToTop();
      
      // Add blue shadow as selection indicator
      if ('shadowColor' in node && typeof node.shadowColor === 'function') {
        node.shadowColor('#0066ff');
        if ('shadowBlur' in node && typeof node.shadowBlur === 'function') {
          node.shadowBlur(5);
        }
        if ('shadowOffset' in node && typeof node.shadowOffset === 'function') {
          node.shadowOffset({ x: 0, y: 0 });
        }
        if ('shadowOpacity' in node && typeof node.shadowOpacity === 'function') {
          node.shadowOpacity(0.8);
        }
      }
    });
    
    if (transformer.value) {
      transformer.value.nodes(nodes);
      transformerLayer.value?.batchDraw();
    }
    
    // Update drag handle for multi-selection
    updateDragHandle();
    
    mainLayer.value?.batchDraw();
  };

  const clearSelection = () => {
    // Remove highlight from all selected nodes
    selectedNodes.value.forEach(node => {
      if ('shadowColor' in node && typeof node.shadowColor === 'function') {
        node.shadowColor('');
        if ('shadowBlur' in node && typeof node.shadowBlur === 'function') {
          node.shadowBlur(0);
        }
        if ('shadowOffset' in node && typeof node.shadowOffset === 'function') {
          node.shadowOffset({ x: 0, y: 0 });
        }
      }
    });
    
    // Remove drag handle
    if (dragHandle.value) {
      dragHandle.value.destroy();
      dragHandle.value = null;
    }
    
    selectedNodes.value = [];
    if (transformer.value) {
      transformer.value.nodes([]);
      transformerLayer.value?.batchDraw();
    }
    
    mainLayer.value?.batchDraw();
  };

  const startSelection = (_e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!stage.value || !mainLayer.value) return;

    // Use the provided getPointerPosition or fallback to stage method
    const pos = getPointerPosition ? getPointerPosition() : stage.value.getPointerPosition();
    if (!pos) return;

    // Don't clear selection immediately - wait to see if user drags
    // This allows clicking on empty space to deselect, but dragging to multi-select
    startPos.value = { x: pos.x, y: pos.y };
    isSelecting.value = true;

    // Create selection rectangle
    if (!selectionRectangle.value) {
      selectionRectangle.value = new Konva.Rect({
        x: pos.x,
        y: pos.y,
        width: 0,
        height: 0,
        fill: 'rgba(0, 102, 255, 0.1)',
        stroke: '#0066ff',
        strokeWidth: 1,
        dash: [5, 5],
        visible: false, // Start hidden
      });
      mainLayer.value.add(selectionRectangle.value);
    } else {
      selectionRectangle.value.setAttrs({
        x: pos.x,
        y: pos.y,
        width: 0,
        height: 0,
        visible: false, // Start hidden
      });
    }
  };

  const updateSelection = (_e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isSelecting.value || !stage.value || !selectionRectangle.value) return;

    // Use the provided getPointerPosition or fallback to stage method
    const pos = getPointerPosition ? getPointerPosition() : stage.value.getPointerPosition();
    if (!pos) return;

    const width = pos.x - startPos.value.x;
    const height = pos.y - startPos.value.y;

    // Show selection rectangle immediately when dragging
    // Clear selection when starting to drag (only once)
    if (!selectionRectangle.value.visible()) {
      clearSelection();
      selectionRectangle.value.visible(true);
    }

    selectionRectangle.value.setAttrs({
      x: width < 0 ? pos.x : startPos.value.x,
      y: height < 0 ? pos.y : startPos.value.y,
      width: Math.abs(width),
      height: Math.abs(height),
    });

    mainLayer.value?.batchDraw();
  };

  const endSelection = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isSelecting.value || !stage.value || !mainLayer.value || !selectionRectangle.value) return;

    isSelecting.value = false;

    // Check if selection rectangle was actually shown (user dragged)
    if (selectionRectangle.value.visible()) {
      // Hide selection rectangle
      selectionRectangle.value.visible(false);

      // Only select if the rectangle has some size (not just a click)
      const width = selectionRectangle.value.width();
      const height = selectionRectangle.value.height();
      
      if (width > 2 || height > 2) {
        // Get the selection rectangle bounds
        const selectionBox = {
          x: selectionRectangle.value.x(),
          y: selectionRectangle.value.y(),
          width: width,
          height: height,
        };

        // Find all selectable shapes
        const shapes = mainLayer.value.find('.selectable');
        
        // Filter shapes that intersect with the selection box
        const selected = shapes.filter((shape) => {
          // Get the bounding box of the shape in stage coordinates
          const shapeBox = shape.getClientRect();
          
          // Check if shape intersects with selection box
          const intersects = !(
            selectionBox.x + selectionBox.width < shapeBox.x ||
            shapeBox.x + shapeBox.width < selectionBox.x ||
            selectionBox.y + selectionBox.height < shapeBox.y ||
            shapeBox.y + shapeBox.height < selectionBox.y
          );
          
          return intersects;
        });

        if (selected.length > 0) {
          selectNodes(selected);
        }
      } else {
        // User just clicked - clear selection if on empty space
        if (e.target === stage.value) {
          clearSelection();
        }
      }
    } else {
      // User just clicked without dragging - clear selection if clicked on empty space
      if (e.target === stage.value) {
        clearSelection();
      }
    }

    mainLayer.value.batchDraw();
  };

  const handleNodeClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const clickedNode = e.target;
    
    // Clear selection if clicking on stage
    if (clickedNode === stage.value) {
      clearSelection();
      return;
    }

    // Ignore clicks on drag handles
    if (clickedNode.hasName('drag-handle') || clickedNode.getParent()?.hasName('drag-handle')) {
      return;
    }

    // Only handle clicks on selectable nodes
    if (!clickedNode.hasName('selectable')) {
      // If clicking on transformer or other non-selectable elements, ignore
      if (clickedNode.getParent()?.className === 'Transformer') {
        return;
      }
      // Clear selection when clicking on non-selectable area
      clearSelection();
      return;
    }

    // Check if shift/ctrl is pressed for multi-selection
    const metaPressed = e.evt?.shiftKey || e.evt?.ctrlKey || e.evt?.metaKey;
    
    // Check if the clicked node is already selected
    const isAlreadySelected = selectedNodes.value.includes(clickedNode);
    
    if (!metaPressed) {
      // Single selection mode
      if (!isAlreadySelected) {
        // Select only this node
        selectNodes([clickedNode]);
      }
      // If already selected, keep it selected (don't deselect)
      // This allows for potential dragging
    } else {
      // Multi-selection mode with meta key
      const nodes = [...selectedNodes.value];
      const index = nodes.indexOf(clickedNode);
      
      if (index >= 0) {
        // Deselect if already selected
        nodes.splice(index, 1);
        selectNodes(nodes);
      } else {
        // Add to selection
        nodes.push(clickedNode);
        selectNodes(nodes);
      }
    }
  };

  const deleteSelected = () => {
    selectedNodes.value.forEach((node) => {
      // Remove highlight before destroying
      if ('shadowColor' in node && typeof node.shadowColor === 'function') {
        node.shadowColor('');
        if ('shadowBlur' in node && typeof node.shadowBlur === 'function') {
          node.shadowBlur(0);
        }
        if ('shadowOffset' in node && typeof node.shadowOffset === 'function') {
          node.shadowOffset({ x: 0, y: 0 });
        }
      }
      node.destroy();
    });
    clearSelection();
    mainLayer.value?.batchDraw();
  };

  const selectAll = () => {
    if (!mainLayer.value) return;
    
    const shapes = mainLayer.value.find('.selectable');
    selectNodes(shapes);
  };

  return {
    selectedNodes,
    transformer,
    selectionRectangle,
    isSelecting,
    initTransformer,
    selectNodes,
    clearSelection,
    startSelection,
    updateSelection,
    endSelection,
    handleNodeClick,
    deleteSelected,
    selectAll,
  };
}