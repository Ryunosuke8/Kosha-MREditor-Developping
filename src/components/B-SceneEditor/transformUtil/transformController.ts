import { Scene, TransformNode, Vector3, AbstractMesh } from '@babylonjs/core';
import { ObjectTransformManager, type TransformOptions } from './objectTransforms';
import type { TransformMode } from './objectTransforms';

export interface TransformControllerCallbacks {
  onTransformChanged?: (transform: {
    position: Vector3;
    rotation: Vector3;
    scale: Vector3;
    name: string;
  } | null) => void;
  onObjectSelected?: (object: TransformNode | null) => void;
  onModeChanged?: (mode: TransformMode) => void;
}

export class TransformController {
  private transformManager: ObjectTransformManager;
  private scene: Scene;
  private callbacks: TransformControllerCallbacks;

  constructor(scene: Scene, callbacks: TransformControllerCallbacks = {}, transformOptions?: TransformOptions) {
    this.scene = scene;
    this.callbacks = callbacks;
    this.transformManager = new ObjectTransformManager(scene, transformOptions);
    
    // キーボードイベントリスナーの設定
    this.setupKeyboardListeners();
  }

  /**
   * キーボードイベントリスナーの設定
   */
  private setupKeyboardListeners(): void {
    const handleKeyDown = (event: KeyboardEvent) => {
      // フォーカスがinput要素にある場合は無視
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      this.transformManager.handleKeyboardShortcut(event.key);
      const currentMode = this.transformManager.getCurrentMode();
      this.callbacks.onModeChanged?.(currentMode);
    };

    // イベントリスナーの追加
    document.addEventListener('keydown', handleKeyDown);

    // クリーンアップ用の関数を保存
    this.cleanup = () => {
      document.removeEventListener('keydown', handleKeyDown);
      this.transformManager.dispose();
    };
  }

  /**
   * マウスクリックでオブジェクトを選択
   * @param pickResult ピック結果
   */
  public handleObjectSelection(pickResult: { pickedMesh?: AbstractMesh }): TransformNode | null {
    const selectedObject = this.transformManager.selectObjectByClick(pickResult);
    this.callbacks.onObjectSelected?.(selectedObject);
    
    if (selectedObject) {
      const transform = this.transformManager.getSelectedObjectTransform();
      this.callbacks.onTransformChanged?.(transform);
    }
    
    return selectedObject;
  }

  /**
   * 変換モードを設定
   * @param mode 変換モード
   */
  public setTransformMode(mode: TransformMode): void {
    this.transformManager.setTransformMode(mode);
    this.callbacks.onModeChanged?.(mode);
  }

  /**
   * 現在の変換モードを取得
   */
  public getCurrentMode(): TransformMode {
    return this.transformManager.getCurrentMode();
  }

  /**
   * 選択されたオブジェクトを取得
   */
  public getSelectedObject(): TransformNode | null {
    return this.transformManager.getSelectedObject();
  }

  /**
   * 選択されたオブジェクトの変換情報を取得
   */
  public getSelectedObjectTransform() {
    return this.transformManager.getSelectedObjectTransform();
  }

  /**
   * オブジェクトの位置を設定
   * @param position 新しい位置
   */
  public setObjectPosition(position: Vector3): void {
    this.transformManager.setObjectPosition(position);
    const transform = this.transformManager.getSelectedObjectTransform();
    this.callbacks.onTransformChanged?.(transform);
  }

  /**
   * オブジェクトの回転を設定
   * @param rotation 新しい回転
   */
  public setObjectRotation(rotation: Vector3): void {
    this.transformManager.setObjectRotation(rotation);
    const transform = this.transformManager.getSelectedObjectTransform();
    this.callbacks.onTransformChanged?.(transform);
  }

  /**
   * オブジェクトのスケールを設定
   * @param scale 新しいスケール
   */
  public setObjectScale(scale: Vector3): void {
    this.transformManager.setObjectScale(scale);
    const transform = this.transformManager.getSelectedObjectTransform();
    this.callbacks.onTransformChanged?.(transform);
  }

  /**
   * 手動でスケールを一様に正規化
   * @param method 正規化方法 ('average' | 'max' | 'min')
   * @returns 正規化が実行されたかどうか
   */
  public normalizeScaleToUniform(method?: 'average' | 'max' | 'min'): boolean {
    const result = this.transformManager.normalizeScaleToUniform(method);
    if (result) {
      const transform = this.transformManager.getSelectedObjectTransform();
      this.callbacks.onTransformChanged?.(transform);
    }
    return result;
  }

  /**
   * リソースのクリーンアップ
   */
  public cleanup: () => void = () => {};
} 