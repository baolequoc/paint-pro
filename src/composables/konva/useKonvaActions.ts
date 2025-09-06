import { type Ref } from 'vue';
import Konva from 'konva';
import type { KonvaNode, KonvaLayer } from '@/types/konva';

export function useKonvaActions(
  _stage: Ref<any | null>,
  mainLayer: Ref<KonvaLayer | null>,
  selectedNodes: Ref<KonvaNode[]>
) {
  // Clipboard for copy/cut/paste
  let clipboard: any[] = [];

  // Layer Management Actions
  const bringToFront = () => {
    selectedNodes.value.forEach(node => {
      node.moveToTop();
    });
    mainLayer.value?.batchDraw();
  };

  const sendToBack = () => {
    selectedNodes.value.forEach(node => {
      node.moveToBottom();
    });
    mainLayer.value?.batchDraw();
  };

  const bringForward = () => {
    selectedNodes.value.forEach(node => {
      node.moveUp();
    });
    mainLayer.value?.batchDraw();
  };

  const sendBackward = () => {
    selectedNodes.value.forEach(node => {
      node.moveDown();
    });
    mainLayer.value?.batchDraw();
  };

  // Color Management
  const changeColor = (color: string, type: 'stroke' | 'fill' | 'both' = 'both') => {
    selectedNodes.value.forEach(node => {
      if ((type === 'stroke' || type === 'both') && 'stroke' in node && typeof node.stroke === 'function') {
        node.stroke(color);
      }
      if ((type === 'fill' || type === 'both') && 'fill' in node && typeof node.fill === 'function') {
        // Don't fill lines and arrows with solid color
        if (node.className !== 'Line' && node.className !== 'Arrow') {
          node.fill(color);
        }
      }
    });
    mainLayer.value?.batchDraw();
  };

  const changeStrokeWidth = (width: number) => {
    selectedNodes.value.forEach(node => {
      if ('strokeWidth' in node && typeof node.strokeWidth === 'function') {
        node.strokeWidth(width);
      }
    });
    mainLayer.value?.batchDraw();
  };

  const changeOpacity = (opacity: number) => {
    selectedNodes.value.forEach(node => {
      node.opacity(opacity);
    });
    mainLayer.value?.batchDraw();
  };

  // Clipboard Actions
  const copySelected = () => {
    clipboard = [];
    selectedNodes.value.forEach(node => {
      clipboard.push(node.toObject());
    });
    return clipboard.length > 0;
  };

  const cutSelected = () => {
    copySelected();
    deleteSelected();
  };

  const paste = () => {
    if (clipboard.length === 0 || !mainLayer.value) return;
    
    const pastedNodes: KonvaNode[] = [];
    clipboard.forEach(obj => {
      const node = Konva.Node.create(obj);
      // Offset pasted items slightly
      node.x(node.x() + 20);
      node.y(node.y() + 20);
      node.setAttr('name', 'selectable');
      node.setAttr('draggable', false);
      mainLayer.value?.add(node);
      pastedNodes.push(node);
    });
    
    mainLayer.value.batchDraw();
    return pastedNodes;
  };

  const deleteSelected = () => {
    selectedNodes.value.forEach(node => {
      node.destroy();
    });
    selectedNodes.value = [];
    mainLayer.value?.batchDraw();
  };

  // Duplicate Action
  const duplicateSelected = () => {
    const duplicatedNodes: KonvaNode[] = [];
    
    selectedNodes.value.forEach(node => {
      const clone = node.clone();
      // Offset duplicated items
      clone.x(clone.x() + 20);
      clone.y(clone.y() + 20);
      clone.setAttr('draggable', false);
      mainLayer.value?.add(clone);
      duplicatedNodes.push(clone);
    });
    
    mainLayer.value?.batchDraw();
    return duplicatedNodes;
  };

  // Transform Actions
  const flipHorizontal = () => {
    selectedNodes.value.forEach(node => {
      const scaleX = node.scaleX();
      node.scaleX(-scaleX);
    });
    mainLayer.value?.batchDraw();
  };

  const flipVertical = () => {
    selectedNodes.value.forEach(node => {
      const scaleY = node.scaleY();
      node.scaleY(-scaleY);
    });
    mainLayer.value?.batchDraw();
  };

  const rotate = (degrees: number) => {
    selectedNodes.value.forEach(node => {
      node.rotation(node.rotation() + degrees);
    });
    mainLayer.value?.batchDraw();
  };

  // Group/Ungroup Actions
  const groupSelected = () => {
    if (selectedNodes.value.length < 2) return null;
    
    const group = new Konva.Group({
      name: 'selectable',
      draggable: false,
    });
    
    // Calculate the group's position based on the bounding box
    let minX = Infinity, minY = Infinity;
    selectedNodes.value.forEach(node => {
      minX = Math.min(minX, node.x());
      minY = Math.min(minY, node.y());
    });
    
    group.x(minX);
    group.y(minY);
    
    // Move nodes to group and adjust their positions
    selectedNodes.value.forEach(node => {
      const x = node.x();
      const y = node.y();
      node.x(x - minX);
      node.y(y - minY);
      node.moveTo(group);
    });
    
    mainLayer.value?.add(group);
    mainLayer.value?.batchDraw();
    
    return group;
  };

  const ungroupSelected = () => {
    const ungroupedNodes: KonvaNode[] = [];
    
    selectedNodes.value.forEach(node => {
      if (node.className === 'Group') {
        const groupX = node.x();
        const groupY = node.y();
        // Type cast to access getChildren
        const group = node as any;
        const children = group.getChildren ? group.getChildren().toArray() : [];
        
        children.forEach((child: any) => {
          // Restore absolute position
          child.x(child.x() + groupX);
          child.y(child.y() + groupY);
          child.moveTo(mainLayer.value);
          ungroupedNodes.push(child);
        });
        
        node.destroy();
      }
    });
    
    mainLayer.value?.batchDraw();
    return ungroupedNodes;
  };

  // Alignment Actions
  const alignLeft = () => {
    if (selectedNodes.value.length < 2) return;
    
    let minX = Infinity;
    selectedNodes.value.forEach(node => {
      const box = node.getClientRect();
      minX = Math.min(minX, box.x);
    });
    
    selectedNodes.value.forEach(node => {
      const box = node.getClientRect();
      const currentX = node.x();
      node.x(currentX + (minX - box.x));
    });
    
    mainLayer.value?.batchDraw();
  };

  const alignRight = () => {
    if (selectedNodes.value.length < 2) return;
    
    let maxX = -Infinity;
    selectedNodes.value.forEach(node => {
      const box = node.getClientRect();
      maxX = Math.max(maxX, box.x + box.width);
    });
    
    selectedNodes.value.forEach(node => {
      const box = node.getClientRect();
      const currentX = node.x();
      node.x(currentX + (maxX - (box.x + box.width)));
    });
    
    mainLayer.value?.batchDraw();
  };

  const alignTop = () => {
    if (selectedNodes.value.length < 2) return;
    
    let minY = Infinity;
    selectedNodes.value.forEach(node => {
      const box = node.getClientRect();
      minY = Math.min(minY, box.y);
    });
    
    selectedNodes.value.forEach(node => {
      const box = node.getClientRect();
      const currentY = node.y();
      node.y(currentY + (minY - box.y));
    });
    
    mainLayer.value?.batchDraw();
  };

  const alignBottom = () => {
    if (selectedNodes.value.length < 2) return;
    
    let maxY = -Infinity;
    selectedNodes.value.forEach(node => {
      const box = node.getClientRect();
      maxY = Math.max(maxY, box.y + box.height);
    });
    
    selectedNodes.value.forEach(node => {
      const box = node.getClientRect();
      const currentY = node.y();
      node.y(currentY + (maxY - (box.y + box.height)));
    });
    
    mainLayer.value?.batchDraw();
  };

  const alignCenterHorizontal = () => {
    if (selectedNodes.value.length < 2) return;
    
    let totalCenterX = 0;
    selectedNodes.value.forEach(node => {
      const box = node.getClientRect();
      totalCenterX += box.x + box.width / 2;
    });
    const avgCenterX = totalCenterX / selectedNodes.value.length;
    
    selectedNodes.value.forEach(node => {
      const box = node.getClientRect();
      const currentX = node.x();
      const currentCenterX = box.x + box.width / 2;
      node.x(currentX + (avgCenterX - currentCenterX));
    });
    
    mainLayer.value?.batchDraw();
  };

  const alignCenterVertical = () => {
    if (selectedNodes.value.length < 2) return;
    
    let totalCenterY = 0;
    selectedNodes.value.forEach(node => {
      const box = node.getClientRect();
      totalCenterY += box.y + box.height / 2;
    });
    const avgCenterY = totalCenterY / selectedNodes.value.length;
    
    selectedNodes.value.forEach(node => {
      const box = node.getClientRect();
      const currentY = node.y();
      const currentCenterY = box.y + box.height / 2;
      node.y(currentY + (avgCenterY - currentCenterY));
    });
    
    mainLayer.value?.batchDraw();
  };

  // Distribute Actions
  const distributeHorizontal = () => {
    if (selectedNodes.value.length < 3) return;
    
    const sorted = [...selectedNodes.value].sort((a, b) => {
      const boxA = a.getClientRect();
      const boxB = b.getClientRect();
      return boxA.x - boxB.x;
    });
    
    const first = sorted[0].getClientRect();
    const last = sorted[sorted.length - 1].getClientRect();
    const totalWidth = last.x + last.width - first.x;
    const spacing = totalWidth / (sorted.length - 1);
    
    sorted.forEach((node, index) => {
      if (index === 0 || index === sorted.length - 1) return;
      
      const targetX = first.x + spacing * index;
      const box = node.getClientRect();
      const currentX = node.x();
      node.x(currentX + (targetX - box.x));
    });
    
    mainLayer.value?.batchDraw();
  };

  const distributeVertical = () => {
    if (selectedNodes.value.length < 3) return;
    
    const sorted = [...selectedNodes.value].sort((a, b) => {
      const boxA = a.getClientRect();
      const boxB = b.getClientRect();
      return boxA.y - boxB.y;
    });
    
    const first = sorted[0].getClientRect();
    const last = sorted[sorted.length - 1].getClientRect();
    const totalHeight = last.y + last.height - first.y;
    const spacing = totalHeight / (sorted.length - 1);
    
    sorted.forEach((node, index) => {
      if (index === 0 || index === sorted.length - 1) return;
      
      const targetY = first.y + spacing * index;
      const box = node.getClientRect();
      const currentY = node.y();
      node.y(currentY + (targetY - box.y));
    });
    
    mainLayer.value?.batchDraw();
  };

  return {
    // Layer Management
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    
    // Color & Style
    changeColor,
    changeStrokeWidth,
    changeOpacity,
    
    // Clipboard
    copySelected,
    cutSelected,
    paste,
    deleteSelected,
    
    // Transform
    duplicateSelected,
    flipHorizontal,
    flipVertical,
    rotate,
    
    // Grouping
    groupSelected,
    ungroupSelected,
    
    // Alignment
    alignLeft,
    alignRight,
    alignTop,
    alignBottom,
    alignCenterHorizontal,
    alignCenterVertical,
    
    // Distribution
    distributeHorizontal,
    distributeVertical,
  };
}