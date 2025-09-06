import { config } from '@vue/test-utils';
import { vi } from 'vitest';

// Mock Canvas API
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(() => ({
    data: new Uint8ClampedArray(4),
  })),
  putImageData: vi.fn(),
  createImageData: vi.fn(() => []),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  translate: vi.fn(),
  transform: vi.fn(),
  beginPath: vi.fn(),
  closePath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  bezierCurveTo: vi.fn(),
  quadraticCurveTo: vi.fn(),
  arc: vi.fn(),
  arcTo: vi.fn(),
  ellipse: vi.fn(),
  rect: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  clip: vi.fn(),
  isPointInPath: vi.fn(() => true),
  isPointInStroke: vi.fn(() => true),
  strokeStyle: '',
  fillStyle: '',
  globalAlpha: 1,
  lineWidth: 1,
  lineCap: 'butt',
  lineJoin: 'miter',
  miterLimit: 10,
  globalCompositeOperation: 'source-over',
  font: '10px sans-serif',
  textAlign: 'start',
  textBaseline: 'alphabetic',
}));

// Mock Konva for unit tests
vi.mock('konva', () => ({
  Stage: vi.fn().mockImplementation((config) => ({
    add: vi.fn(),
    getLayers: vi.fn(() => []),
    getPointerPosition: vi.fn(() => ({ x: 0, y: 0 })),
    toDataURL: vi.fn(() => 'data:image/png;base64,mock'),
    toJSON: vi.fn(() => ({})),
    destroy: vi.fn(),
    width: vi.fn(() => config?.width || 800),
    height: vi.fn(() => config?.height || 600),
    scale: vi.fn(),
    position: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  })),
  Layer: vi.fn().mockImplementation(() => ({
    add: vi.fn(),
    draw: vi.fn(),
    getChildren: vi.fn(() => []),
    destroy: vi.fn(),
    batchDraw: vi.fn(),
  })),
  Transformer: vi.fn().mockImplementation(() => ({
    nodes: vi.fn(),
    getNodes: vi.fn(() => []),
    destroy: vi.fn(),
  })),
  Line: vi.fn().mockImplementation((config) => ({
    ...config,
    destroy: vi.fn(),
    clone: vi.fn(),
    toJSON: vi.fn(() => config),
  })),
  Rect: vi.fn().mockImplementation((config) => ({
    ...config,
    destroy: vi.fn(),
    clone: vi.fn(),
    toJSON: vi.fn(() => config),
  })),
  Circle: vi.fn().mockImplementation((config) => ({
    ...config,
    destroy: vi.fn(),
    clone: vi.fn(),
    toJSON: vi.fn(() => config),
  })),
  Text: vi.fn().mockImplementation((config) => ({
    ...config,
    destroy: vi.fn(),
    clone: vi.fn(),
    toJSON: vi.fn(() => config),
  })),
  Image: vi.fn().mockImplementation((config) => ({
    ...config,
    destroy: vi.fn(),
    clone: vi.fn(),
    toJSON: vi.fn(() => config),
    crop: vi.fn(),
  })),
  Group: vi.fn().mockImplementation(() => ({
    add: vi.fn(),
    destroy: vi.fn(),
    getChildren: vi.fn(() => []),
  })),
  Arrow: vi.fn().mockImplementation((config) => ({
    ...config,
    destroy: vi.fn(),
    clone: vi.fn(),
    toJSON: vi.fn(() => config),
  })),
}));

// Mock vue-konva
vi.mock('vue-konva', () => ({
  default: {
    install: vi.fn(),
  },
}));

// Global test utilities
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn(),
    readText: vi.fn(),
    write: vi.fn(),
    read: vi.fn(),
  },
  writable: true,
  configurable: true,
});

// Mock File API
global.File = class File {
  constructor(bits: any[], name: string, options?: any) {
    Object.assign(this, {
      bits,
      name,
      ...options,
    });
  }
};

global.FileReader = vi.fn().mockImplementation(() => ({
  readAsDataURL: vi.fn(),
  onload: vi.fn(),
  onerror: vi.fn(),
  result: 'data:image/png;base64,mock',
}));

// Configure Vue Test Utils
config.global.stubs = {
  teleport: true,
  transition: false,
};

config.global.mocks = {
  $t: (key: string) => key,
};