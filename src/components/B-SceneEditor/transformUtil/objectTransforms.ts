import { 
  Scene, 
  TransformNode, 
  Vector3, 
  GizmoManager, 
  PositionGizmo, 
  RotationGizmo, 
  ScaleGizmo,
  AbstractMesh
} from '@babylonjs/core';

export type TransformMode = 'position' | 'rotation' | 'scale' | 'none';

export interface TransformState {
  mode: TransformMode;
  selectedObject: TransformNode | null;
  gizmoManager: GizmoManager | null;
}

export class ObjectTransformManager {
  private scene: Scene;
  private gizmoManager!: GizmoManager;
  private currentMode: TransformMode = 'none';
  private selectedObject: TransformNode | null = null;
  private positionGizmo!: PositionGizmo;
  private rotationGizmo!: RotationGizmo;
  private scaleGizmo!: ScaleGizmo;

  constructor(scene: Scene) {
    this.scene = scene;
    this.initializeGizmoManager();
  }

  private initializeGizmoManager(): void {
    // GizmoManagerの初期化
    this.gizmoManager = new GizmoManager(this.scene);
    this.gizmoManager.usePointerToAttachGizmos = false;

    // 各Gizmoの初期化
    this.positionGizmo = new PositionGizmo();
    this.rotationGizmo = new RotationGizmo();
    this.scaleGizmo = new ScaleGizmo();

    // 回転Gizmoの設定 - 非一様スケーリングに対応
    this.rotationGizmo.updateGizmoRotationToMatchAttachedMesh = false;

    // 移動Gizmoの設定 - ワールド座標系での移動
    this.positionGizmo.xGizmo.dragBehavior.useObjectOrientationForDragging = false;
    this.positionGizmo.yGizmo.dragBehavior.useObjectOrientationForDragging = false;
    this.positionGizmo.zGizmo.dragBehavior.useObjectOrientationForDragging = false;
    
    // 移動Gizmoの向きをワールド座標系に固定
    this.positionGizmo.xGizmo.updateGizmoRotationToMatchAttachedMesh = false;
    this.positionGizmo.yGizmo.updateGizmoRotationToMatchAttachedMesh = false;
    this.positionGizmo.zGizmo.updateGizmoRotationToMatchAttachedMesh = false;
    
    // 移動Gizmoをワールド座標系に完全に固定
    this.positionGizmo.xGizmo.attachedMesh = null;
    this.positionGizmo.yGizmo.attachedMesh = null;
    this.positionGizmo.zGizmo.attachedMesh = null;
    
    // 移動Gizmo全体の向きをワールド座標系に設定
    this.positionGizmo.updateGizmoRotationToMatchAttachedMesh = false;

    // Gizmoの設定
    this.setupGizmoCallbacks();

    // 初期状態では全てのGizmoを無効化
    this.gizmoManager.positionGizmoEnabled = false;
    this.gizmoManager.rotationGizmoEnabled = false;
    this.gizmoManager.scaleGizmoEnabled = false;
  }

  private setupGizmoCallbacks(): void {
    // Position Gizmoのコールバック設定
    this.positionGizmo.onDragEndObservable.add(() => {
      if (this.selectedObject) {
        this.onTransformChanged();
      }
    });

    // Rotation Gizmoのコールバック設定
    this.rotationGizmo.onDragEndObservable.add(() => {
      if (this.selectedObject) {
        this.onTransformChanged();
      }
    });

    // Scale Gizmoのコールバック設定
    this.scaleGizmo.onDragEndObservable.add(() => {
      if (this.selectedObject) {
        this.onTransformChanged();
      }
    });
  }

  /**
   * 変換モードを設定
   * @param mode 'position' | 'rotation' | 'scale' | 'none'
   */
  public setTransformMode(mode: TransformMode): void {
    this.currentMode = mode;
    
    // 回転モードで非一様スケーリングの警告を表示
    if (mode === 'rotation' && this.selectedObject) {
      const scale = this.selectedObject.scaling;
      if (this.isNonUniformScaling(scale)) {
        console.warn(
          'Warning: Rotation gizmo with non-uniform scaling may behave unexpectedly. ' +
          'Consider using uniform scaling for better rotation control.'
        );
      }
    }
    
    this.updateGizmoVisibility();
  }

  /**
   * オブジェクトを選択
   * @param object 選択するTransformNode
   */
  public selectObject(object: TransformNode | null): void {
    this.selectedObject = object;
    
    // 選択されたオブジェクトの非一様スケーリングをチェック
    if (object && this.currentMode === 'rotation') {
      const scale = object.scaling;
      if (this.isNonUniformScaling(scale)) {
        console.warn(
          'Warning: Selected object has non-uniform scaling. ' +
          'Rotation gizmo may behave unexpectedly.'
        );
      }
    }
    
    this.updateGizmoVisibility();
  }

  /**
   * クリックでオブジェクトを選択
   * @param pickResult ピック結果
   */
  public selectObjectByClick(pickResult: { pickedMesh?: AbstractMesh }): TransformNode | null {
    if (pickResult && pickResult.pickedMesh) {
      const selectedNode = pickResult.pickedMesh.parent || pickResult.pickedMesh;
      if (selectedNode instanceof TransformNode) {
        this.selectObject(selectedNode);
        return selectedNode;
      }
    }
    return null;
  }

  /**
   * Gizmoの表示/非表示を更新
   */
  private updateGizmoVisibility(): void {
    // 全てのGizmoを無効化
    this.gizmoManager.positionGizmoEnabled = false;
    this.gizmoManager.rotationGizmoEnabled = false;
    this.gizmoManager.scaleGizmoEnabled = false;

    if (!this.selectedObject) {
      return;
    }

    // 選択されたオブジェクトにGizmoをアタッチ
    if (this.selectedObject instanceof AbstractMesh) {
      this.gizmoManager.attachToMesh(this.selectedObject);
    }

    // 現在のモードに応じてGizmoを有効化
    switch (this.currentMode) {
      case 'position':
        this.gizmoManager.positionGizmoEnabled = true;
        // 移動Gizmoをワールド座標系に強制設定
        this.setupWorldSpacePositionGizmo();
        break;
      case 'rotation':
        this.gizmoManager.rotationGizmoEnabled = true;
        break;
      case 'scale':
        this.gizmoManager.scaleGizmoEnabled = true;
        break;
      case 'none':
      default:
        // Gizmoは表示しない
        break;
    }
  }

  /**
   * 移動Gizmoをワールド座標系に設定
   */
  private setupWorldSpacePositionGizmo(): void {
    if (!this.selectedObject) return;

    // 移動Gizmoの向きをワールド座標系に強制設定
    this.positionGizmo.xGizmo.updateGizmoRotationToMatchAttachedMesh = false;
    this.positionGizmo.yGizmo.updateGizmoRotationToMatchAttachedMesh = false;
    this.positionGizmo.zGizmo.updateGizmoRotationToMatchAttachedMesh = false;

    // ドラッグ動作をワールド座標系に設定
    this.positionGizmo.xGizmo.dragBehavior.useObjectOrientationForDragging = false;
    this.positionGizmo.yGizmo.dragBehavior.useObjectOrientationForDragging = false;
    this.positionGizmo.zGizmo.dragBehavior.useObjectOrientationForDragging = false;

    // 移動Gizmo全体の向きをワールド座標系に設定
    this.positionGizmo.updateGizmoRotationToMatchAttachedMesh = false;
  }

  /**
   * キーボードショートカットでモード切り替え
   * @param key 押されたキー
   */
  public handleKeyboardShortcut(key: string): void {
    switch (key.toLowerCase()) {
      case 'g':
        this.setTransformMode('position');
        break;
      case 'r':
        this.setTransformMode('rotation');
        break;
      case 's':
        this.setTransformMode('scale');
        break;
      case 'escape':
        this.setTransformMode('none');
        break;
    }
  }

  /**
   * オブジェクトの位置を設定
   * @param position 新しい位置
   */
  public setObjectPosition(position: Vector3): void {
    if (this.selectedObject) {
      this.selectedObject.position = position;
      this.onTransformChanged();
    }
  }

  /**
   * オブジェクトの回転を設定
   * @param rotation 新しい回転（オイラー角）
   */
  public setObjectRotation(rotation: Vector3): void {
    if (this.selectedObject) {
      this.selectedObject.rotation = rotation;
      this.onTransformChanged();
    }
  }

  /**
   * オブジェクトのスケールを設定
   * @param scale 新しいスケール
   */
  public setObjectScale(scale: Vector3): void {
    if (this.selectedObject) {
      this.selectedObject.scaling = scale;
      this.onTransformChanged();
    }
  }

  /**
   * 選択されたオブジェクトの現在の変換情報を取得
   */
  public getSelectedObjectTransform(): {
    position: Vector3;
    rotation: Vector3;
    scale: Vector3;
    name: string;
  } | null {
    if (!this.selectedObject) {
      return null;
    }

    return {
      position: this.selectedObject.position.clone(),
      rotation: this.selectedObject.rotation.clone(),
      scale: this.selectedObject.scaling.clone(),
      name: this.selectedObject.name
    };
  }

  /**
   * 非一様スケーリングかどうかをチェック
   * @param scale スケール値
   * @returns 非一様スケーリングの場合true
   */
  private isNonUniformScaling(scale: Vector3): boolean {
    const tolerance = 0.001; // 許容誤差
    return Math.abs(scale.x - scale.y) > tolerance || 
           Math.abs(scale.y - scale.z) > tolerance || 
           Math.abs(scale.x - scale.z) > tolerance;
  }

  /**
   * 変換が変更された時のコールバック
   */
  private onTransformChanged(): void {
    // ここでプロパティ同期やアセット同期の処理を呼び出す
    // 実際の実装では、コールバック関数を外部から注入する
    console.log('Transform changed:', this.getSelectedObjectTransform());
  }

  /**
   * 現在の変換モードを取得
   */
  public getCurrentMode(): TransformMode {
    return this.currentMode;
  }

  /**
   * 選択されたオブジェクトを取得
   */
  public getSelectedObject(): TransformNode | null {
    return this.selectedObject;
  }

  /**
   * リソースのクリーンアップ
   */
  public dispose(): void {
    if (this.gizmoManager) {
      this.gizmoManager.dispose();
    }
    if (this.positionGizmo) {
      this.positionGizmo.dispose();
    }
    if (this.rotationGizmo) {
      this.rotationGizmo.dispose();
    }
    if (this.scaleGizmo) {
      this.scaleGizmo.dispose();
    }
  }
} 