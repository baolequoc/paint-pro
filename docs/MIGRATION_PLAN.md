# Fabric.js to Konva.js Migration Plan
*Paint Pro Project - Implementation Roadmap*  
*Start Date: January 2025*

## Overview
This document outlines the step-by-step migration plan from Fabric.js v6 to Konva.js for the Paint Pro application.

---

## Pre-Migration Checklist

- [ ] Create feature branch `feature/konva-migration`
- [ ] Backup current working version
- [ ] Document all current features and behaviors
- [ ] Set up testing environment
- [ ] Review Konva.js documentation
- [ ] Install migration dependencies

---

## Phase 1: Setup and Core Infrastructure (Days 1-3)

### Day 1: Dependencies and Project Setup
```bash
# Install Konva and Vue integration
npm install konva vue-konva

# Remove Fabric.js (after migration complete)
# npm uninstall fabric
```

**Tasks:**
- [ ] Install Konva.js and vue-konva packages
- [ ] Keep Fabric.js temporarily for reference
- [ ] Create new directory structure: `src/composables/konva/`
- [ ] Set up TypeScript types for Konva
- [ ] Create migration feature flag system

**Files to Create:**
```
src/
├── composables/
│   ├── konva/
│   │   ├── useKonvaCanvas.ts
│   │   ├── useKonvaTools.ts
│   │   ├── useKonvaExport.ts
│   │   └── useKonvaHistory.ts
│   └── migration/
│       └── featureFlags.ts
```

### Day 2: Canvas Initialization
**Current (Fabric.js):**
```typescript
// src/components/CanvasEditor.vue
canvas = new FabricJSCanvas(canvasEl.value, {
  width: 3000,
  height: 3000,
  backgroundColor: 'white'
});
```

**New (Konva.js):**
```typescript
// src/components/KonvaCanvasEditor.vue
<template>
  <v-stage :config="stageConfig" @wheel="handleWheel">
    <v-layer ref="mainLayer">
      <!-- Dynamic shapes will be added here -->
    </v-layer>
    <v-layer ref="tempLayer">
      <!-- Temporary drawing layer -->
    </v-layer>
  </v-stage>
</template>

<script setup>
const stageConfig = {
  width: window.innerWidth,
  height: window.innerHeight,
  draggable: false
};
</script>
```

**Tasks:**
- [ ] Create KonvaCanvasEditor.vue component
- [ ] Set up stage and layer structure
- [ ] Implement viewport/canvas size management
- [ ] Add canvas background
- [ ] Set up event listeners

### Day 3: Basic Canvas Operations
**Tasks:**
- [ ] Implement canvas clearing
- [ ] Add render optimization
- [ ] Set up canvas context menu
- [ ] Implement basic object selection
- [ ] Add Transformer for object manipulation

---

## Phase 2: Migrate Drawing Tools (Days 4-7)

### Day 4: Selection and Transform Tools

**Current (Fabric.js):**
```typescript
canvas.setActiveObject(object);
canvas.getActiveObject();
```

**New (Konva.js):**
```typescript
// Create transformer
const transformer = new Konva.Transformer({
  nodes: [selectedNode],
  rotateEnabled: true,
  keepRatio: false
});
layer.add(transformer);
```

**Tasks:**
- [ ] Implement selection tool with Transformer
- [ ] Add multi-selection support
- [ ] Handle selection events
- [ ] Add rotation/resize handles
- [ ] Implement selection box styling

### Day 5: Drawing Tools (Brush, Line, Arrow)

**Brush Tool Migration:**
```typescript
// Fabric.js
canvas.freeDrawingBrush = new PencilBrush(canvas);

// Konva.js
let isDrawing = false;
let lastLine: Konva.Line;

stage.on('mousedown', () => {
  isDrawing = true;
  const pos = stage.getPointerPosition();
  lastLine = new Konva.Line({
    stroke: brushColor,
    strokeWidth: brushSize,
    points: [pos.x, pos.y],
    tension: 0.5,
    lineCap: 'round',
    lineJoin: 'round'
  });
  layer.add(lastLine);
});
```

**Tasks:**
- [ ] Migrate brush/pencil tool
- [ ] Implement line tool
- [ ] Implement arrow tool
- [ ] Add color picker integration
- [ ] Implement stroke width control

### Day 6: Shape Tools (Rectangle, Circle, Text)

**Rectangle Tool:**
```typescript
// Konva.js
const rect = new Konva.Rect({
  x: startX,
  y: startY,
  width: endX - startX,
  height: endY - startY,
  stroke: strokeColor,
  strokeWidth: 2,
  fill: fillColor
});
```

**Text Tool:**
```typescript
// Custom text editing since Konva doesn't have inline editing
const text = new Konva.Text({
  text: 'Edit me',
  fontSize: 20,
  fontFamily: 'Arial'
});

// On double-click, show HTML input overlay
text.on('dblclick', () => {
  showTextEditor(text);
});
```

**Tasks:**
- [ ] Implement rectangle tool
- [ ] Add circle/ellipse tool
- [ ] Create custom text editing solution
- [ ] Add shape fill/stroke options
- [ ] Implement shape property panel

### Day 7: Pan and Zoom

**Zoom Implementation:**
```typescript
// Konva zoom
const scaleBy = 1.1;
stage.on('wheel', (e) => {
  e.evt.preventDefault();
  const oldScale = stage.scaleX();
  const pointer = stage.getPointerPosition();
  
  const mousePointTo = {
    x: (pointer.x - stage.x()) / oldScale,
    y: (pointer.y - stage.y()) / oldScale
  };
  
  const newScale = e.evt.deltaY > 0 
    ? oldScale * scaleBy 
    : oldScale / scaleBy;
    
  stage.scale({ x: newScale, y: newScale });
  
  const newPos = {
    x: pointer.x - mousePointTo.x * newScale,
    y: pointer.y - mousePointTo.y * newScale
  };
  stage.position(newPos);
});
```

**Tasks:**
- [ ] Implement zoom with mouse wheel
- [ ] Add pan tool with hand cursor
- [ ] Implement zoom controls (buttons)
- [ ] Add fit-to-screen functionality
- [ ] Implement center view

---

## Phase 3: Image Features (Days 8-10)

### Day 8: Image Upload and Management

**Image Upload:**
```typescript
// Konva image loading
Konva.Image.fromURL(imageUrl, (imageNode) => {
  imageNode.setAttrs({
    x: 50,
    y: 50,
    draggable: true
  });
  layer.add(imageNode);
  
  // Add to transformer
  transformer.nodes([imageNode]);
});
```

**Tasks:**
- [ ] Implement image upload from file
- [ ] Add drag-and-drop support
- [ ] Implement paste from clipboard
- [ ] Add image replacement feature
- [ ] Handle image loading errors

### Day 9: Image Cropping

**Crop Tool:**
```typescript
// Create crop rectangle
const cropRect = new Konva.Rect({
  x: image.x() + 20,
  y: image.y() + 20,
  width: 100,
  height: 100,
  stroke: '#0056b3',
  dash: [5, 5],
  draggable: true
});

// Apply crop
const cropped = image.crop({
  x: cropRect.x() - image.x(),
  y: cropRect.y() - image.y(),
  width: cropRect.width(),
  height: cropRect.height()
});
```

**Tasks:**
- [ ] Implement crop rectangle overlay
- [ ] Add crop handles
- [ ] Implement crop application
- [ ] Add aspect ratio constraints
- [ ] Handle crop preview

### Day 10: Copy/Paste Operations

**Copy/Paste:**
```typescript
// Copy
const selectedNode = transformer.nodes()[0];
const cloned = selectedNode.clone();

// Store in clipboard
clipboard = {
  node: cloned,
  type: selectedNode.className
};

// Paste
if (clipboard) {
  const pasted = clipboard.node.clone({
    x: clipboard.node.x() + 10,
    y: clipboard.node.y() + 10
  });
  layer.add(pasted);
}
```

**Tasks:**
- [ ] Implement object copy
- [ ] Implement paste with offset
- [ ] Add clipboard management
- [ ] Support image copy/paste
- [ ] Handle external clipboard

---

## Phase 4: State Management (Days 11-12)

### Day 11: History/Undo System

**History Implementation:**
```typescript
class KonvaHistory {
  private history: string[] = [];
  private step = 0;
  
  save(stage: Konva.Stage) {
    this.history = this.history.slice(0, this.step + 1);
    this.history.push(stage.toJSON());
    this.step++;
  }
  
  undo(stage: Konva.Stage) {
    if (this.step > 0) {
      this.step--;
      stage.destroy();
      Konva.Node.create(this.history[this.step], container);
    }
  }
  
  redo(stage: Konva.Stage) {
    if (this.step < this.history.length - 1) {
      this.step++;
      stage.destroy();
      Konva.Node.create(this.history[this.step], container);
    }
  }
}
```

**Tasks:**
- [ ] Implement history manager
- [ ] Add undo functionality (Cmd/Ctrl+Z)
- [ ] Add redo functionality (Cmd/Ctrl+Shift+Z)
- [ ] Optimize history storage
- [ ] Add history limit

### Day 12: Export and Save

**Export Implementation:**
```typescript
// Export to PNG
const dataURL = stage.toDataURL({
  pixelRatio: 2,
  mimeType: 'image/png'
});

// Export selection only
const selectedNode = transformer.nodes()[0];
const dataURL = selectedNode.toDataURL({
  pixelRatio: 2
});

// Copy to clipboard
const blob = await (await fetch(dataURL)).blob();
await navigator.clipboard.write([
  new ClipboardItem({ 'image/png': blob })
]);
```

**Tasks:**
- [ ] Implement PNG export
- [ ] Add JPEG export with quality
- [ ] Implement clipboard export
- [ ] Add selected object export
- [ ] Handle export errors

---

## Phase 5: UI Integration (Days 13-14)

### Day 13: Toolbar and Properties Panel

**Tasks:**
- [ ] Update Toolbox.vue for Konva tools
- [ ] Migrate PropertiesPanel.vue
- [ ] Update tool icons and tooltips
- [ ] Implement tool switching logic
- [ ] Add tool-specific options

### Day 14: Keyboard Shortcuts

**Shortcuts to Implement:**
```typescript
const shortcuts = {
  'cmd+z': () => history.undo(),
  'cmd+shift+z': () => history.redo(),
  'cmd+a': () => selectAll(),
  'cmd+c': () => copySelection(),
  'cmd+v': () => paste(),
  'cmd+x': () => cut(),
  'delete': () => deleteSelection(),
  'escape': () => deselectAll()
};
```

**Tasks:**
- [ ] Migrate keyboard shortcuts
- [ ] Add new Konva-specific shortcuts
- [ ] Handle key conflicts
- [ ] Add shortcut help dialog
- [ ] Test all shortcuts

---

## Phase 6: Testing and Optimization (Days 15-18)

### Day 15: Feature Testing

**Test Checklist:**
- [ ] Selection tool works correctly
- [ ] All drawing tools function
- [ ] Image upload/paste works
- [ ] Crop tool functions properly
- [ ] Copy/paste operations work
- [ ] Zoom/pan smooth and accurate
- [ ] Export produces correct output
- [ ] Undo/redo maintains state
- [ ] Keyboard shortcuts work
- [ ] Touch events (if applicable)

### Day 16: Performance Optimization

**Optimization Tasks:**
- [ ] Implement layer caching
- [ ] Add shape batching
- [ ] Optimize redraw calls
- [ ] Implement viewport culling
- [ ] Add lazy loading for images
- [ ] Profile and fix memory leaks

**Performance Improvements:**
```typescript
// Enable caching for complex shapes
shape.cache();

// Batch draw calls
layer.batchDraw();

// Use offscreen canvas for complex operations
const offscreenLayer = new Konva.Layer();
```

### Day 17: Bug Fixes and Polish

**Common Issues to Address:**
- [ ] Selection box alignment
- [ ] Zoom center point
- [ ] Text editing position
- [ ] Image aspect ratio
- [ ] Export quality
- [ ] History state corruption
- [ ] Memory leaks
- [ ] Event handler cleanup

### Day 18: Migration Completion

**Final Tasks:**
- [ ] Remove Fabric.js dependencies
- [ ] Clean up old code
- [ ] Update documentation
- [ ] Update README
- [ ] Create migration notes
- [ ] Performance benchmarks
- [ ] Final testing

---

## Phase 7: Deployment (Day 19-20)

### Day 19: Pre-deployment

**Checklist:**
- [ ] All tests passing
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Build size optimized
- [ ] Documentation updated
- [ ] Team review completed

### Day 20: Deployment

**Steps:**
1. [ ] Merge to development branch
2. [ ] Deploy to staging
3. [ ] User acceptance testing
4. [ ] Fix any issues
5. [ ] Deploy to production
6. [ ] Monitor for issues

---

## Rollback Plan

If critical issues arise:

1. **Immediate Rollback:**
   ```bash
   git checkout main
   git revert [migration-commit]
   npm install fabric@5.3.0
   ```

2. **Feature Flag Disable:**
   ```typescript
   // featureFlags.ts
   export const USE_KONVA = false; // Revert to Fabric
   ```

3. **Hybrid Approach:**
   - Keep both libraries temporarily
   - Use feature flags per component
   - Gradually migrate features

---

## Success Criteria

### Performance Metrics
- [ ] Canvas operations 30% faster
- [ ] Memory usage reduced by 20%
- [ ] Bundle size reduced to <150KB
- [ ] 60 FPS during drawing

### Quality Metrics
- [ ] Zero critical bugs
- [ ] All features working
- [ ] No data loss
- [ ] Smooth user experience

### Code Metrics
- [ ] 90% test coverage
- [ ] No TypeScript errors
- [ ] Clean console (no warnings)
- [ ] Documentation complete

---

## Resources

### Documentation
- [Konva.js Docs](https://konvajs.org/docs/)
- [Vue-Konva Guide](https://konvajs.org/docs/vue/)
- [Migration Examples](https://konvajs.org/docs/sandbox/)

### Support
- GitHub Issues: Track migration issues
- Team Slack: #konva-migration
- Weekly sync: Tuesdays 2pm

---

## Notes

### Key Differences to Remember

1. **Object Model:**
   - Fabric: `canvas.add(object)`
   - Konva: `layer.add(node)`

2. **Selection:**
   - Fabric: Built-in selection
   - Konva: Use Transformer

3. **Text Editing:**
   - Fabric: Native inline editing
   - Konva: Custom HTML overlay

4. **Events:**
   - Fabric: `object:modified`
   - Konva: `dragend`, `transformend`

5. **Export:**
   - Fabric: `canvas.toDataURL()`
   - Konva: `stage.toDataURL()`

---

## Post-Migration Tasks

- [ ] Monitor user feedback
- [ ] Collect performance metrics
- [ ] Document lessons learned
- [ ] Plan future enhancements
- [ ] Update team knowledge base
- [ ] Consider contributing to Konva

---

*Last Updated: January 2025*  
*Status: Ready to Execute*