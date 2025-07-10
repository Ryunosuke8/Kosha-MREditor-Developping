import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders';

export class SceneManager {
  private scene: BABYLON.Scene | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private engine: BABYLON.Engine | null = null;

  initialize(canvas: HTMLCanvasElement): BABYLON.Scene {
    this.canvas = canvas;
    this.engine = new BABYLON.Engine(canvas, true);
    
    // シーンの作成
    this.scene = new BABYLON.Scene(this.engine);
    
    // カメラの設定
    const camera = new BABYLON.ArcRotateCamera(
      'camera',
      0,
      Math.PI / 3,
      10,
      BABYLON.Vector3.Zero(),
      this.scene
    );
    camera.attachControl(canvas, true);
    camera.lowerRadiusLimit = 1;
    camera.upperRadiusLimit = 50;
    
    // ライティングの設定
    const light = new BABYLON.HemisphericLight(
      'light',
      new BABYLON.Vector3(0, 1, 0),
      this.scene
    );
    light.intensity = 0.7;
    
    const directionalLight = new BABYLON.DirectionalLight(
      'directionalLight',
      new BABYLON.Vector3(-1, -2, -1),
      this.scene
    );
    directionalLight.intensity = 0.5;
    
    // グリッドの追加
    const grid = BABYLON.MeshBuilder.CreateGround(
      'grid',
      { width: 20, height: 20, subdivisions: 20 },
      this.scene
    );
    const gridMaterial = new BABYLON.StandardMaterial('gridMaterial', this.scene);
    gridMaterial.wireframe = true;
    gridMaterial.alpha = 0.3;
    grid.material = gridMaterial;
    
    // レンダリングループの開始
    this.engine.runRenderLoop(() => {
      this.scene?.render();
    });
    
    // リサイズハンドラー
    window.addEventListener('resize', () => {
      this.engine?.resize();
    });
    
    return this.scene;
  }

  getScene(): BABYLON.Scene | null {
    return this.scene;
  }

  dispose(): void {
    this.scene?.dispose();
    this.engine?.dispose();
  }
} 