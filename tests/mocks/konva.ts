import { vi } from 'vitest';

export const createMockStage = (config: any = {}) => ({
  add: vi.fn(),
  getLayers: vi.fn(() => [createMockLayer()]),
  getPointerPosition: vi.fn(() => ({ x: 100, y: 100 })),
  getAbsoluteTransform: vi.fn(() => ({
    copy: vi.fn(() => ({
      invert: vi.fn(),
      point: vi.fn((pos: any) => pos),
    })),
  })),
  toDataURL: vi.fn(() => 'data:image/png;base64,mock'),
  toJSON: vi.fn(() => JSON.stringify({ mock: true })),
  destroy: vi.fn(),
  width: vi.fn((val?: number) => val !== undefined ? undefined : config.width || 800),
  height: vi.fn((val?: number) => val !== undefined ? undefined : config.height || 600),
  scale: vi.fn(),
  scaleX: vi.fn(() => 1),
  scaleY: vi.fn(() => 1),
  position: vi.fn(),
  x: vi.fn(() => 0),
  y: vi.fn(() => 0),
  on: vi.fn(),
  off: vi.fn(),
  fire: vi.fn(),
  container: vi.fn(() => document.createElement('div')),
  batchDraw: vi.fn(),
  draggable: vi.fn(),
  findOne: vi.fn(),
  find: vi.fn(() => []),
  ...config,
});

export const createMockLayer = (config: any = {}) => ({
  add: vi.fn(),
  draw: vi.fn(),
  batchDraw: vi.fn(),
  getChildren: vi.fn(() => []),
  destroyChildren: vi.fn(),
  find: vi.fn(() => []),
  findOne: vi.fn(),
  destroy: vi.fn(),
  ...config,
});

export const createMockTransformer = (config: any = {}) => ({
  nodes: vi.fn((nodes?: any[]) => nodes ? undefined : config.nodes || []),
  getNodes: vi.fn(() => config.nodes || []),
  visible: vi.fn((val?: boolean) => val !== undefined ? undefined : true),
  destroy: vi.fn(),
  ...config,
});

export const createMockLine = (config: any = {}) => ({
  points: vi.fn((points?: number[]) => points ? undefined : config.points || [0, 0, 100, 100]),
  stroke: vi.fn((color?: string) => color ? undefined : config.stroke || '#000000'),
  strokeWidth: vi.fn((width?: number) => width ? undefined : config.strokeWidth || 2),
  destroy: vi.fn(),
  hide: vi.fn(),
  show: vi.fn(),
  setAttrs: vi.fn(),
  className: 'Line',
  on: vi.fn(),
  off: vi.fn(),
  ...config,
});

export const createMockArrow = (config: any = {}) => ({
  points: vi.fn((points?: number[]) => points ? undefined : config.points || [0, 0, 100, 100]),
  stroke: vi.fn((color?: string) => color ? undefined : config.stroke || '#000000'),
  strokeWidth: vi.fn((width?: number) => width ? undefined : config.strokeWidth || 2),
  fill: vi.fn((color?: string) => color ? undefined : config.fill || '#000000'),
  destroy: vi.fn(),
  setAttrs: vi.fn(),
  className: 'Arrow',
  ...config,
});

export const createMockRect = (config: any = {}) => ({
  x: vi.fn((val?: number) => val !== undefined ? undefined : config.x || 0),
  y: vi.fn((val?: number) => val !== undefined ? undefined : config.y || 0),
  width: vi.fn((val?: number) => val !== undefined ? undefined : config.width || 100),
  height: vi.fn((val?: number) => val !== undefined ? undefined : config.height || 100),
  stroke: vi.fn((color?: string) => color ? undefined : config.stroke || '#000000'),
  strokeWidth: vi.fn((width?: number) => width ? undefined : config.strokeWidth || 2),
  fill: vi.fn((color?: string) => color ? undefined : config.fill || 'transparent'),
  destroy: vi.fn(),
  setAttrs: vi.fn(),
  getClientRect: vi.fn(() => ({
    x: config.x || 0,
    y: config.y || 0,
    width: config.width || 100,
    height: config.height || 100,
  })),
  className: 'Rect',
  ...config,
});

export const createMockText = (config: any = {}) => ({
  text: vi.fn((val?: string) => val !== undefined ? undefined : config.text || 'Test Text'),
  fontSize: vi.fn((val?: number) => val !== undefined ? undefined : config.fontSize || 16),
  fontFamily: vi.fn((val?: string) => val !== undefined ? undefined : config.fontFamily || 'Arial'),
  fill: vi.fn((color?: string) => color ? undefined : config.fill || '#000000'),
  x: vi.fn(() => config.x || 0),
  y: vi.fn(() => config.y || 0),
  width: vi.fn(() => config.width || 100),
  height: vi.fn(() => config.height || 30),
  absolutePosition: vi.fn(() => ({ x: config.x || 0, y: config.y || 0 })),
  hide: vi.fn(),
  show: vi.fn(),
  destroy: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  className: 'Text',
  ...config,
});

export const createMockImage = (config: any = {}) => ({
  x: vi.fn((val?: number) => val !== undefined ? undefined : config.x || 0),
  y: vi.fn((val?: number) => val !== undefined ? undefined : config.y || 0),
  width: vi.fn(() => config.width || 200),
  height: vi.fn(() => config.height || 200),
  scaleX: vi.fn(() => config.scaleX || 1),
  scaleY: vi.fn(() => config.scaleY || 1),
  scale: vi.fn((val?: any) => val !== undefined ? undefined : { x: config.scaleX || 1, y: config.scaleY || 1 }),
  image: vi.fn(() => config.image || new Image()),
  destroy: vi.fn(),
  setAttrs: vi.fn(),
  className: 'Image',
  draggable: vi.fn(),
  name: config.name || 'selectable',
  ...config,
});

export const createMockCircle = (config: any = {}) => ({
  x: vi.fn((val?: number) => val !== undefined ? undefined : config.x || 0),
  y: vi.fn((val?: number) => val !== undefined ? undefined : config.y || 0),
  radius: vi.fn((val?: number) => val !== undefined ? undefined : config.radius || 5),
  fill: vi.fn((color?: string) => color ? undefined : config.fill || '#0056b3'),
  stroke: vi.fn((color?: string) => color ? undefined : config.stroke || '#ffffff'),
  strokeWidth: vi.fn((width?: number) => width ? undefined : config.strokeWidth || 1),
  position: vi.fn((pos?: any) => pos ? undefined : { x: config.x || 0, y: config.y || 0 }),
  destroy: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  draggable: vi.fn(),
  className: 'Circle',
  ...config,
});

export const createMockEvent = (type: string, target: any = null, options: any = {}) => ({
  type,
  target: target || createMockStage(),
  evt: {
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    clientX: options.clientX || 100,
    clientY: options.clientY || 100,
    shiftKey: options.shiftKey || false,
    ctrlKey: options.ctrlKey || false,
    metaKey: options.metaKey || false,
    deltaY: options.deltaY || 0,
    ...options.evt,
  },
  ...options,
});