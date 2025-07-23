import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders';

// PLYファイルを点群として読み込む関数（改良版）
export const loadPLYAsPointCloud = async (
  filePath: string,
  scene: BABYLON.Scene,
  meshId: string = 'defaultPointCloud',
  options: {
    position?: { x: number; y: number; z: number };
    rotation?: { x: number; y: number; z: number };
    scale?: { x: number; y: number; z: number };
    pointSize?: number;
    glowIntensity?: number;
    color?: { r: number; g: number; b: number };
    useHeightBasedColors?: boolean; // 高さベースの色を使用するかどうか
  } = {}
): Promise<BABYLON.Mesh | null> => {
  try {
    console.log('Loading PLY file as point cloud:', filePath);
    
    const result = await BABYLON.SceneLoader.ImportMeshAsync('', '', filePath, scene, null, '.ply');
    
    if (result.meshes.length === 0) {
      throw new Error('No meshes found in PLY file');
    }

    const mesh = result.meshes[0] as BABYLON.Mesh;
    if (!mesh) {
      throw new Error('Invalid mesh data');
    }

    // デフォルト値の設定
    const {
      position = { x: 0, y: 0, z: 0 },
      rotation = { x: 0, y: 0, z: 0 },
      scale = { x: 1, y: 1, z: 1 },
      pointSize = 5,
      glowIntensity = 0.8,
      color = { r: 0, g: 0.8, b: 0 },
      useHeightBasedColors = false
    } = options;

    // 高さベースの色を適用する場合
    if (useHeightBasedColors) {
      const positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
      if (positions) {
        // Y座標の最小値と最大値を計算
        let minY = Infinity;
        let maxY = -Infinity;
        
        for (let i = 1; i < positions.length; i += 3) { // Y座標は1, 4, 7, ...のインデックス
          const y = positions[i];
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
        
        console.log(`Height range: ${minY} to ${maxY}`);
        
        // 頂点カラー配列を作成
        const colors: number[] = [];
        for (let i = 0; i < positions.length; i += 3) {
          const y = positions[i + 1]; // Y座標
          
          // 高さを0-1の範囲に正規化
          const normalizedHeight = (y - minY) / (maxY - minY);
          
          // 高さに応じた色を計算（青→緑→赤のグラデーション）
          let r, g, b;
          if (normalizedHeight < 0.5) {
            // 下半分: 青→緑
            const t = normalizedHeight * 2; // 0-1の範囲
            r = 0;
            g = t;
            b = 1 - t;
          } else {
            // 上半分: 緑→赤
            const t = (normalizedHeight - 0.5) * 2; // 0-1の範囲
            r = t;
            g = 1 - t;
            b = 0;
          }
          
          colors.push(r, g, b, 1); // RGBA
        }
        
        // 頂点カラーをメッシュに設定
        mesh.setVerticesData(BABYLON.VertexBuffer.ColorKind, colors);
        console.log('Applied height-based colors to point cloud');
      }
    }

    // 改良された点群用マテリアルを作成
    let pointMaterial: BABYLON.Material;
    
    if (useHeightBasedColors) {
      // 頂点カラーを使用する場合はPBRMaterialを使用
      const pbrMaterial = new BABYLON.PBRMaterial('pointCloudMaterial_' + meshId, scene);
      pbrMaterial.unlit = true; // ライティングを無効化
      pbrMaterial.albedoColor = new BABYLON.Color3(1, 1, 1); // 白で頂点カラーをそのまま表示
      pbrMaterial.metallic = 0;
      pbrMaterial.roughness = 1;
      pbrMaterial.alpha = 0.95;
      pointMaterial = pbrMaterial;
    } else {
      // 単色を使用する場合はStandardMaterialを継続使用
      const standardMaterial = new BABYLON.StandardMaterial('pointCloudMaterial_' + meshId, scene);
      standardMaterial.disableLighting = true;
      standardMaterial.emissiveColor = new BABYLON.Color3(color.r, color.g, color.b);
      standardMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
      standardMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
      standardMaterial.alpha = 0.95;
      pointMaterial = standardMaterial;
    }
    
    // 点群設定（型アサーションを使用）
    (pointMaterial as unknown as { pointsCloud: boolean; pointSize: number }).pointsCloud = true;
    (pointMaterial as unknown as { pointsCloud: boolean; pointSize: number }).pointSize = pointSize;
    
    // メッシュに点群マテリアルを適用
    mesh.material = pointMaterial;
    mesh.id = meshId;
    
    // 点群をピック不可にして、選択・変形操作の対象から除外
    mesh.isPickable = false;
    
    // 位置、回転、スケールの調整
    mesh.position.x = position.x;
    mesh.position.y = position.y;
    mesh.position.z = position.z;
    
    mesh.rotation.x = rotation.x;
    mesh.rotation.y = rotation.y;
    mesh.rotation.z = rotation.z;
    
    mesh.scaling.x = scale.x;
    mesh.scaling.y = scale.y;
    mesh.scaling.z = scale.z;

    // グロー効果のためのレイヤーを追加（頂点カラー使用時は無効化）
    if (!useHeightBasedColors) {
      try {
        const glowLayer = new BABYLON.GlowLayer('glow_' + meshId, scene);
        glowLayer.intensity = glowIntensity;
      } catch (error) {
        console.log('GlowLayer not available, using standard material only:', error);
      }
    }

    console.log('PLY mesh configured as enhanced point cloud with glow effect');
    console.log('Position:', mesh.position);
    console.log('Rotation:', mesh.rotation);
    console.log('Scale:', mesh.scaling);
    
    return mesh;
  } catch (error) {
    console.error('Failed to load PLY as point cloud:', error);
    throw error;
  }
};

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