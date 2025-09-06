# Paint Pro Testing Strategy
*Comprehensive Testing Plan with Vitest*

## Testing Infrastructure Setup

### 1. Install Dependencies

```bash
# Core testing dependencies
npm install -D vitest @vue/test-utils happy-dom @vitest/ui

# Additional testing utilities
npm install -D @testing-library/vue @testing-library/user-event
npm install -D vitest-canvas-mock
npm install -D msw @mswjs/data faker

# Coverage tools
npm install -D @vitest/coverage-v8

# Konva testing utilities
npm install -D konva-node canvas
```

### 2. Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '*.config.ts',
        'dist/',
        '.eslintrc.js'
      ],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80
      }
    },
    deps: {
      inline: ['vue-konva', 'konva']
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
});
```

### 3. Test Setup File

```typescript
// tests/setup.ts
import { config } from '@vue/test-utils';
import { vi } from 'vitest';
import 'vitest-canvas-mock';

// Mock Konva for unit tests
vi.mock('konva', () => ({
  Stage: vi.fn(() => ({
    add: vi.fn(),
    getLayer: vi.fn(),
    toDataURL: vi.fn(),
    destroy: vi.fn()
  })),
  Layer: vi.fn(() => ({
    add: vi.fn(),
    draw: vi.fn(),
    getChildren: vi.fn(() => [])
  })),
  Transformer: vi.fn(),
  Line: vi.fn(),
  Rect: vi.fn(),
  Circle: vi.fn(),
  Text: vi.fn(),
  Image: vi.fn()
}));

// Global test utilities
global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// Configure Vue Test Utils
config.global.stubs = {
  teleport: true,
  transition: false
};
```

---

## Test Architecture

### Directory Structure

```
tests/
├── unit/
│   ├── components/
│   │   ├── CanvasEditor.spec.ts
│   │   ├── Toolbox.spec.ts
│   │   ├── PropertiesPanel.spec.ts
│   │   └── IconButton.spec.ts
│   ├── composables/
│   │   ├── useKonvaCanvas.spec.ts
│   │   ├── useKonvaTools.spec.ts
│   │   ├── useKonvaExport.spec.ts
│   │   ├── useKonvaHistory.spec.ts
│   │   └── useKonvaCrop.spec.ts
│   └── services/
│       └── canvasHistory.spec.ts
├── integration/
│   ├── drawing.spec.ts
│   ├── imageManipulation.spec.ts
│   └── exportImport.spec.ts
├── e2e/
│   └── userWorkflows.spec.ts
├── fixtures/
│   ├── mockCanvas.ts
│   └── testImages.ts
└── utils/
    ├── testHelpers.ts
    └── konvaMocks.ts
```

---

## Test Specifications

### Core Canvas Operations

```typescript
// tests/unit/components/CanvasEditor.spec.ts
describe('CanvasEditor Component', () => {
  describe('Initialization', () => {
    it('should create canvas with correct dimensions');
    it('should initialize with white background');
    it('should set up stage and layers correctly');
    it('should handle window resize');
    it('should register event listeners');
  });

  describe('Canvas State', () => {
    it('should maintain canvas state across operations');
    it('should clear canvas when requested');
    it('should center view correctly');
    it('should handle empty canvas state');
  });
});
```

### Drawing Tools Tests

```typescript
// tests/unit/composables/useKonvaTools.spec.ts
describe('Drawing Tools', () => {
  describe('Selection Tool', () => {
    it('should select single object on click');
    it('should select multiple objects with shift+click');
    it('should show transformer on selection');
    it('should deselect on empty area click');
    it('should handle nested selections');
  });

  describe('Brush Tool', () => {
    it('should start drawing on mousedown');
    it('should create continuous line on mousemove');
    it('should finish line on mouseup');
    it('should apply correct color and stroke width');
    it('should handle rapid movements');
  });

  describe('Line Tool', () => {
    it('should create straight line from point A to B');
    it('should show preview while drawing');
    it('should snap to angles with shift key');
    it('should apply stroke properties');
  });

  describe('Arrow Tool', () => {
    it('should create arrow with head');
    it('should orient arrow head correctly');
    it('should group arrow components');
    it('should maintain proportions on resize');
  });

  describe('Rectangle Tool', () => {
    it('should create rectangle with drag');
    it('should support fill and stroke');
    it('should create square with shift key');
    it('should handle negative dimensions');
  });

  describe('Text Tool', () => {
    it('should create text object');
    it('should open editor on double-click');
    it('should save text changes');
    it('should handle multiline text');
    it('should apply font properties');
  });

  describe('Pan Tool', () => {
    it('should pan canvas on drag');
    it('should change cursor to grab hand');
    it('should maintain object positions');
    it('should work with zoom levels');
  });
});
```

### Image Operations Tests

```typescript
// tests/unit/composables/useKonvaImage.spec.ts
describe('Image Operations', () => {
  describe('Image Upload', () => {
    it('should load image from file input');
    it('should handle drag and drop');
    it('should validate image formats');
    it('should handle upload errors');
    it('should resize large images');
  });

  describe('Image Paste', () => {
    it('should paste image from clipboard');
    it('should position pasted image correctly');
    it('should handle paste errors');
    it('should support multiple formats');
  });

  describe('Image Crop', () => {
    it('should show crop overlay on selected image');
    it('should update crop area on drag');
    it('should apply crop correctly');
    it('should maintain aspect ratio when locked');
    it('should cancel crop operation');
  });

  describe('Image Manipulation', () => {
    it('should rotate image');
    it('should flip image horizontally');
    it('should flip image vertically');
    it('should scale image proportionally');
    it('should reset transformations');
  });
});
```

### Copy/Paste Tests

```typescript
// tests/unit/composables/useKonvaClipboard.spec.ts
describe('Clipboard Operations', () => {
  describe('Copy', () => {
    it('should copy selected object');
    it('should copy multiple objects');
    it('should preserve object properties');
    it('should handle complex shapes');
  });

  describe('Paste', () => {
    it('should paste at cursor position');
    it('should offset multiple pastes');
    it('should maintain object hierarchy');
    it('should generate unique IDs');
  });

  describe('Cut', () => {
    it('should copy and remove object');
    it('should update canvas after cut');
    it('should handle undo after cut');
  });
});
```

### Zoom/Pan Tests

```typescript
// tests/unit/composables/useKonvaZoom.spec.ts
describe('Zoom and Pan', () => {
  describe('Zoom', () => {
    it('should zoom in on scroll up');
    it('should zoom out on scroll down');
    it('should zoom to mouse position');
    it('should respect min/max zoom limits');
    it('should handle zoom reset');
    it('should update UI on zoom change');
  });

  describe('Pan', () => {
    it('should pan with middle mouse button');
    it('should pan with space+drag');
    it('should update stage position');
    it('should handle pan limits');
  });

  describe('Viewport', () => {
    it('should fit content to screen');
    it('should center specific object');
    it('should maintain aspect ratio');
  });
});
```

### History/Undo Tests

```typescript
// tests/unit/services/KonvaHistory.spec.ts
describe('History Management', () => {
  describe('State Tracking', () => {
    it('should save state after each operation');
    it('should limit history size');
    it('should handle state serialization');
    it('should track selection state');
  });

  describe('Undo', () => {
    it('should undo last operation');
    it('should restore previous state');
    it('should handle multiple undos');
    it('should disable when at beginning');
  });

  describe('Redo', () => {
    it('should redo undone operation');
    it('should clear redo stack on new operation');
    it('should handle multiple redos');
    it('should disable when at end');
  });
});
```

### Export Tests

```typescript
// tests/unit/composables/useKonvaExport.spec.ts
describe('Export Operations', () => {
  describe('PNG Export', () => {
    it('should export full canvas as PNG');
    it('should export selected area');
    it('should handle quality settings');
    it('should trigger download');
  });

  describe('Clipboard Export', () => {
    it('should copy canvas to clipboard');
    it('should copy selection to clipboard');
    it('should handle clipboard API errors');
    it('should show success notification');
  });

  describe('JSON Export', () => {
    it('should serialize canvas to JSON');
    it('should include all object properties');
    it('should be importable');
  });
});
```

### Keyboard Shortcuts Tests

```typescript
// tests/unit/composables/useKonvaKeyboard.spec.ts
describe('Keyboard Shortcuts', () => {
  it('should undo with Ctrl+Z');
  it('should redo with Ctrl+Shift+Z');
  it('should select all with Ctrl+A');
  it('should copy with Ctrl+C');
  it('should paste with Ctrl+V');
  it('should cut with Ctrl+X');
  it('should delete with Delete key');
  it('should duplicate with Ctrl+D');
  it('should save with Ctrl+S');
  it('should handle key combinations');
});
```

---

## Test Implementation Examples

### Component Test Example

```typescript
// tests/unit/components/Toolbox.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import Toolbox from '@/components/Toolbox.vue';

describe('Toolbox Component', () => {
  let wrapper;
  
  beforeEach(() => {
    wrapper = mount(Toolbox, {
      props: {
        activeTool: 'select',
        brushColor: '#000000',
        strokeWidth: 2
      }
    });
  });

  describe('Tool Selection', () => {
    it('should emit setTool event when tool is clicked', async () => {
      const brushButton = wrapper.find('[data-testid="tool-brush"]');
      await brushButton.trigger('click');
      
      expect(wrapper.emitted('setTool')).toBeTruthy();
      expect(wrapper.emitted('setTool')[0]).toEqual(['brush']);
    });

    it('should highlight active tool', () => {
      const selectButton = wrapper.find('[data-testid="tool-select"]');
      expect(selectButton.classes()).toContain('active');
    });

    it('should show color picker for brush tool', async () => {
      await wrapper.setProps({ activeTool: 'brush' });
      const colorPicker = wrapper.find('input[type="color"]');
      expect(colorPicker.exists()).toBe(true);
    });
  });

  describe('Tool Actions', () => {
    it('should emit export event with PNG format', async () => {
      const exportButton = wrapper.find('[data-testid="export-png"]');
      await exportButton.trigger('click');
      
      expect(wrapper.emitted('export')).toBeTruthy();
      expect(wrapper.emitted('export')[0]).toEqual(['png']);
    });

    it('should emit clear event', async () => {
      const clearButton = wrapper.find('[data-testid="clear-canvas"]');
      await clearButton.trigger('click');
      
      expect(wrapper.emitted('clear')).toBeTruthy();
    });
  });
});
```

### Composable Test Example

```typescript
// tests/unit/composables/useKonvaCanvas.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useKonvaCanvas } from '@/composables/useKonvaCanvas';

describe('useKonvaCanvas', () => {
  let canvas;
  
  beforeEach(() => {
    canvas = useKonvaCanvas();
  });

  describe('Canvas Initialization', () => {
    it('should initialize with default values', () => {
      expect(canvas.stage.value).toBeNull();
      expect(canvas.selectedShapes.value).toEqual([]);
      expect(canvas.isDrawing.value).toBe(false);
    });

    it('should create stage with config', () => {
      const config = {
        width: 800,
        height: 600,
        container: 'container'
      };
      
      canvas.initStage(config);
      
      expect(canvas.stage.value).toBeDefined();
      expect(canvas.stage.value.width()).toBe(800);
      expect(canvas.stage.value.height()).toBe(600);
    });
  });

  describe('Shape Management', () => {
    it('should add shape to layer', () => {
      const shape = { type: 'rect', x: 10, y: 10 };
      const result = canvas.addShape(shape);
      
      expect(result).toBeDefined();
      expect(canvas.shapes.value).toContain(result);
    });

    it('should delete selected shapes', () => {
      const shape1 = canvas.addShape({ type: 'rect' });
      const shape2 = canvas.addShape({ type: 'circle' });
      
      canvas.selectShapes([shape1, shape2]);
      canvas.deleteSelected();
      
      expect(canvas.shapes.value).toHaveLength(0);
      expect(canvas.selectedShapes.value).toHaveLength(0);
    });

    it('should clear all shapes', () => {
      canvas.addShape({ type: 'rect' });
      canvas.addShape({ type: 'circle' });
      canvas.addShape({ type: 'line' });
      
      canvas.clearCanvas();
      
      expect(canvas.shapes.value).toHaveLength(0);
    });
  });
});
```

### Integration Test Example

```typescript
// tests/integration/drawing.spec.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import CanvasEditor from '@/components/CanvasEditor.vue';

describe('Drawing Integration', () => {
  let wrapper;
  
  beforeEach(async () => {
    wrapper = mount(CanvasEditor);
    await nextTick();
  });

  it('should complete brush drawing workflow', async () => {
    // Select brush tool
    await wrapper.vm.setTool('brush');
    expect(wrapper.vm.activeTool).toBe('brush');
    
    // Simulate drawing
    const canvas = wrapper.find('canvas');
    await canvas.trigger('mousedown', { clientX: 100, clientY: 100 });
    await canvas.trigger('mousemove', { clientX: 150, clientY: 150 });
    await canvas.trigger('mouseup');
    
    // Verify line was created
    expect(wrapper.vm.shapes).toHaveLength(1);
    expect(wrapper.vm.shapes[0].type).toBe('line');
  });

  it('should complete shape creation workflow', async () => {
    // Select rectangle tool
    await wrapper.vm.setTool('rectangle');
    
    // Draw rectangle
    const canvas = wrapper.find('canvas');
    await canvas.trigger('mousedown', { clientX: 50, clientY: 50 });
    await canvas.trigger('mousemove', { clientX: 200, clientY: 200 });
    await canvas.trigger('mouseup');
    
    // Verify rectangle
    expect(wrapper.vm.shapes).toHaveLength(1);
    expect(wrapper.vm.shapes[0].type).toBe('rect');
    expect(wrapper.vm.shapes[0].width).toBe(150);
    expect(wrapper.vm.shapes[0].height).toBe(150);
  });
});
```

---

## Test Utilities

### Mock Helpers

```typescript
// tests/utils/konvaMocks.ts
import { vi } from 'vitest';

export function createMockStage(config = {}) {
  return {
    width: vi.fn(() => config.width || 800),
    height: vi.fn(() => config.height || 600),
    add: vi.fn(),
    toDataURL: vi.fn(() => 'data:image/png;base64,mock'),
    getPointerPosition: vi.fn(() => ({ x: 100, y: 100 })),
    setPointersPositions: vi.fn(),
    getLayers: vi.fn(() => [createMockLayer()]),
    findOne: vi.fn(),
    find: vi.fn(() => []),
    destroy: vi.fn(),
    ...config
  };
}

export function createMockLayer() {
  return {
    add: vi.fn(),
    draw: vi.fn(),
    getChildren: vi.fn(() => []),
    findOne: vi.fn(),
    destroy: vi.fn()
  };
}

export function createMockShape(type = 'rect', config = {}) {
  return {
    type: () => type,
    x: vi.fn(() => config.x || 0),
    y: vi.fn(() => config.y || 0),
    width: vi.fn(() => config.width || 100),
    height: vi.fn(() => config.height || 100),
    destroy: vi.fn(),
    clone: vi.fn(() => createMockShape(type, config)),
    toJSON: vi.fn(() => ({ type, ...config })),
    ...config
  };
}
```

### Test Data Fixtures

```typescript
// tests/fixtures/testData.ts
export const mockImage = {
  src: 'data:image/png;base64,iVBORw0KGgoAAAANS...',
  width: 400,
  height: 300,
  type: 'image/png'
};

export const mockShapes = [
  {
    id: 'shape-1',
    type: 'rect',
    x: 100,
    y: 100,
    width: 200,
    height: 150,
    fill: '#ff0000',
    stroke: '#000000',
    strokeWidth: 2
  },
  {
    id: 'shape-2',
    type: 'circle',
    x: 300,
    y: 200,
    radius: 50,
    fill: '#00ff00'
  },
  {
    id: 'shape-3',
    type: 'text',
    x: 150,
    y: 300,
    text: 'Sample Text',
    fontSize: 24,
    fontFamily: 'Arial'
  }
];

export const mockCanvasState = {
  version: '1.0.0',
  stage: {
    width: 800,
    height: 600
  },
  layers: [
    {
      children: mockShapes
    }
  ]
};
```

---

## NPM Scripts

```json
// package.json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:watch": "vitest watch",
    "test:coverage": "vitest run --coverage",
    "test:unit": "vitest run tests/unit",
    "test:integration": "vitest run tests/integration",
    "test:debug": "vitest --inspect-brk --threads=false"
  }
}
```

---

## Coverage Requirements

### Minimum Coverage Thresholds
- **Statements**: 80%
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%

### Critical Path Coverage
These features must have 100% coverage:
- Canvas initialization
- Tool selection
- Shape creation
- Image upload
- Export functionality
- Undo/Redo
- Save/Load

---

## CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run tests
      run: npm run test:coverage
      
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/coverage-final.json
```

---

## Test Checklist for Migration

### Pre-Migration Tests (Fabric.js)
- [ ] Document current behavior
- [ ] Create baseline tests
- [ ] Record performance metrics
- [ ] Export test data

### During Migration Tests
- [ ] Test each component after migration
- [ ] Verify feature parity
- [ ] Check performance improvements
- [ ] Validate data compatibility

### Post-Migration Tests
- [ ] Full regression testing
- [ ] Performance benchmarks
- [ ] User acceptance testing
- [ ] Production smoke tests

---

## Success Metrics

### Test Quality
- [ ] 80%+ code coverage
- [ ] All critical paths tested
- [ ] No flaky tests
- [ ] Tests run in < 60 seconds

### Migration Validation
- [ ] All Fabric.js features work in Konva
- [ ] No regression in functionality
- [ ] Performance improvements verified
- [ ] Zero critical bugs

---

*Last Updated: January 2025*