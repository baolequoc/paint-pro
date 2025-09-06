import { vi } from 'vitest';

export function createMockStage(config: any = {}) {
  return {
    width: vi.fn(() => config.width || 800),
    height: vi.fn(() => config.height || 600),
    add: vi.fn(),
    toDataURL: vi.fn(() => 'data:image/png;base64,mock'),
    toJSON: vi.fn(() => ({ ...config })),
    getPointerPosition: vi.fn(() => ({ x: 100, y: 100 })),
    setPointersPositions: vi.fn(),
    getLayers: vi.fn(() => [createMockLayer()]),
    findOne: vi.fn(),
    find: vi.fn(() => []),
    destroy: vi.fn(),
    scale: vi.fn(),
    scaleX: vi.fn(() => 1),
    scaleY: vi.fn(() => 1),
    position: vi.fn(),
    x: vi.fn(() => 0),
    y: vi.fn(() => 0),
    on: vi.fn(),
    off: vi.fn(),
    getContainer: vi.fn(() => document.createElement('div')),
    ...config,
  };
}

export function createMockLayer(config: any = {}) {
  return {
    add: vi.fn(),
    draw: vi.fn(),
    batchDraw: vi.fn(),
    getChildren: vi.fn(() => []),
    findOne: vi.fn(),
    find: vi.fn(() => []),
    destroy: vi.fn(),
    cache: vi.fn(),
    clearCache: vi.fn(),
    ...config,
  };
}

export function createMockTransformer(config: any = {}) {
  return {
    nodes: vi.fn(() => config.nodes || []),
    getNodes: vi.fn(() => config.nodes || []),
    setNodes: vi.fn(),
    attachTo: vi.fn(),
    detach: vi.fn(),
    forceUpdate: vi.fn(),
    destroy: vi.fn(),
    ...config,
  };
}

export function createMockShape(type = 'rect', config: any = {}) {
  const baseShape = {
    type: () => type,
    x: vi.fn(() => config.x || 0),
    y: vi.fn(() => config.y || 0),
    setX: vi.fn(),
    setY: vi.fn(),
    destroy: vi.fn(),
    clone: vi.fn(() => createMockShape(type, config)),
    toJSON: vi.fn(() => ({ type, ...config })),
    toDataURL: vi.fn(() => 'data:image/png;base64,shape'),
    cache: vi.fn(),
    clearCache: vi.fn(),
    draggable: vi.fn(() => config.draggable !== false),
    setDraggable: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    fire: vi.fn(),
    getLayer: vi.fn(() => createMockLayer()),
    getStage: vi.fn(() => createMockStage()),
    getParent: vi.fn(),
    moveToTop: vi.fn(),
    moveToBottom: vi.fn(),
    moveUp: vi.fn(),
    moveDown: vi.fn(),
    setAttrs: vi.fn(),
    getAttrs: vi.fn(() => config),
    ...config,
  };

  // Add type-specific properties
  switch (type) {
    case 'rect':
      return {
        ...baseShape,
        width: vi.fn(() => config.width || 100),
        height: vi.fn(() => config.height || 100),
        setWidth: vi.fn(),
        setHeight: vi.fn(),
        fill: vi.fn(() => config.fill || 'transparent'),
        stroke: vi.fn(() => config.stroke || '#000'),
        strokeWidth: vi.fn(() => config.strokeWidth || 1),
      };
    case 'circle':
      return {
        ...baseShape,
        radius: vi.fn(() => config.radius || 50),
        setRadius: vi.fn(),
        fill: vi.fn(() => config.fill || 'transparent'),
        stroke: vi.fn(() => config.stroke || '#000'),
      };
    case 'line':
      return {
        ...baseShape,
        points: vi.fn(() => config.points || [0, 0, 100, 100]),
        setPoints: vi.fn(),
        stroke: vi.fn(() => config.stroke || '#000'),
        strokeWidth: vi.fn(() => config.strokeWidth || 2),
        tension: vi.fn(() => config.tension || 0),
      };
    case 'text':
      return {
        ...baseShape,
        text: vi.fn(() => config.text || 'Sample Text'),
        setText: vi.fn(),
        fontSize: vi.fn(() => config.fontSize || 16),
        setFontSize: vi.fn(),
        fontFamily: vi.fn(() => config.fontFamily || 'Arial'),
        fill: vi.fn(() => config.fill || '#000'),
      };
    case 'image':
      return {
        ...baseShape,
        width: vi.fn(() => config.width || 200),
        height: vi.fn(() => config.height || 200),
        setWidth: vi.fn(),
        setHeight: vi.fn(),
        image: vi.fn(() => config.image || new Image()),
        setImage: vi.fn(),
        crop: vi.fn(),
        setCrop: vi.fn(),
      };
    default:
      return baseShape;
  }
}

export function createMockGroup(config: any = {}) {
  const children: any[] = config.children || [];
  return {
    type: () => 'Group',
    add: vi.fn((child) => children.push(child)),
    getChildren: vi.fn(() => children),
    removeChildren: vi.fn(),
    destroyChildren: vi.fn(),
    findOne: vi.fn(),
    find: vi.fn(() => []),
    x: vi.fn(() => config.x || 0),
    y: vi.fn(() => config.y || 0),
    setX: vi.fn(),
    setY: vi.fn(),
    destroy: vi.fn(),
    clone: vi.fn(() => createMockGroup(config)),
    toJSON: vi.fn(() => ({ type: 'Group', ...config })),
    ...config,
  };
}

export function createMockImage(config: any = {}) {
  return createMockShape('image', {
    width: 400,
    height: 300,
    ...config,
  });
}

export function createMockEvent(type: string, options: any = {}) {
  return {
    type,
    target: options.target || createMockShape(),
    currentTarget: options.currentTarget,
    evt: {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      clientX: options.clientX || 100,
      clientY: options.clientY || 100,
      offsetX: options.offsetX || 100,
      offsetY: options.offsetY || 100,
      button: options.button || 0,
      ctrlKey: options.ctrlKey || false,
      shiftKey: options.shiftKey || false,
      metaKey: options.metaKey || false,
      altKey: options.altKey || false,
      ...options.evt,
    },
    cancelBubble: false,
    ...options,
  };
}