import type Konva from 'konva';

export type Tool = 'select' | 'brush' | 'line' | 'arrow' | 'rectangle' | 'text' | 'pan';

export interface StageConfig {
  width: number;
  height: number;
  container?: string;
}

export interface DrawingConfig {
  stroke: string;
  strokeWidth: number;
  fill?: string;
}

export interface ShapeConfig extends DrawingConfig {
  x: number;
  y: number;
  id?: string;
  draggable?: boolean;
}

export interface RectConfig extends ShapeConfig {
  width: number;
  height: number;
}

export interface CircleConfig extends ShapeConfig {
  radius: number;
}

export interface LineConfig extends ShapeConfig {
  points: number[];
  tension?: number;
  lineCap?: 'butt' | 'round' | 'square';
  lineJoin?: 'round' | 'bevel' | 'miter';
}

export interface TextConfig extends ShapeConfig {
  text: string;
  fontSize: number;
  fontFamily: string;
  align?: 'left' | 'center' | 'right';
}

export interface ImageConfig extends ShapeConfig {
  image?: HTMLImageElement;
  width?: number;
  height?: number;
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ExportConfig {
  mimeType?: string;
  quality?: number;
  pixelRatio?: number;
}

export interface HistoryState {
  json: string;
  timestamp: number;
}

export interface Point {
  x: number;
  y: number;
}

export type KonvaNode = Konva.Node;
export type KonvaStage = Konva.Stage;
export type KonvaLayer = Konva.Layer;
export type KonvaShape = Konva.Shape;
export type KonvaTransformer = Konva.Transformer;
export type KonvaGroup = Konva.Group;