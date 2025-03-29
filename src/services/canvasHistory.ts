/* eslint-disable no-underscore-dangle */
import { cloneDeep } from "lodash";
import { Canvas as FabricJSCanvas } from "fabric";

// "custom:added" is a custom event that is fired when an object is added to the canvas
export default class CanvasHistory {
  private canvas: FabricJSCanvas;

  private history: any[] = [];

  private redoStack: any[] = [];

  private isClearing = false;

  constructor(canvas: FabricJSCanvas) {
    this.canvas = canvas;
  }

  init() {
    this._saveState();
    this._attachListeners();
  }

  private _saveState() {
    const snapshot = cloneDeep(this.canvas.toJSON());
    const last = this.history[this.history.length - 1];

    if (JSON.stringify(snapshot) === JSON.stringify(last)) return;

    this.history.push(snapshot);
    this._saveToLocal(snapshot);
  }

  private _saveToLocal(state: any) {
    localStorage.setItem("canvasState", JSON.stringify(state));
  }

  private _clearCanvas() {
    this.isClearing = true;
    this.canvas.remove(...this.canvas.getObjects());
    this.isClearing = false;
  }

  async undo() {
    if (this.history.length <= 1) return;
    this._clearCanvas();

    const last = this.history.pop();
    this.redoStack.push(last);

    const prev = this.history[this.history.length - 1];
    this._applyState(prev);
  }

  async redo() {
    if (this.redoStack.length === 0) return;
    this._clearCanvas();

    const next = this.redoStack.pop();
    this.history.push(next);
    this._applyState(next);
  }

  private async _applyState(state: any) {
    this.canvas.off("custom:added");
    this.canvas.off("object:modified");
    this.canvas.off("object:removed");
    this.canvas.off("path:created");

    await this.canvas.loadFromJSON(state);
    await this.canvas.renderAll();
    this._attachListeners();
  }

  private _attachListeners() {
    this.canvas.on("custom:added", () => {
      this._saveState();
    });
    this.canvas.on("object:modified", () => this._saveState());
    this.canvas.on("object:removed", () => {
      if (!this.isClearing) this._saveState();
    });

    // Fix for brush strokes
    this.canvas.on("path:created", () => {
      requestAnimationFrame(() => {
        this.canvas.requestRenderAll();
        this.canvas.fire("custom:added");
      });
    });
  }

  triggerSave() {
    this.canvas.fire("custom:added");
  }
}
