import { FabricObject, TEvent } from 'fabric';

declare module 'fabric' {
  interface CanvasEvents {
    'custom:added': Partial<TEvent> & {
      target: FabricObject;
    };
  }
} 