import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders';
import { handleFileDrop } from './importUtil/dragDropHandler';
import { loadPLYAsPointCloud } from './importUtil/sceneManager';
import { FileDropzone } from './DragDropZone';
import { TransformController } from './transformUtil';
import type { Asset, PropertyPanelData } from '../../shared/types';
import type { TransformMode } from './transformUtil';

interface SceneEditorProps {
  onAssetAdd?: (asset: Asset) => void;
  onAssetSelect?: (assetId: string | null) => void;
  onPropertyUpdate?: (data: PropertyPanelData | null) => void;
  onTransformModeChange?: (mode: TransformMode) => void;
  showGrid?: boolean;
  showPointCloud?: boolean;
}

export interface SceneEditorRef {
  deleteAsset: (assetId: string) => void;
  resetCamera: () => void;
}

const SceneEditor = forwardRef<SceneEditorRef, SceneEditorProps>(({
  onAssetAdd,
  onPropertyUpdate,
  onTransformModeChange,
  showGrid = true,
  showPointCloud = true
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<BABYLON.Scene | null>(null);
  const engineRef = useRef<BABYLON.Engine | null>(null);
  const meshMapRef = useRef<Map<string, BABYLON.Mesh>>(new Map());
  const transformControllerRef = useRef<TransformController | null>(null);
  const gridRef = useRef<BABYLON.Mesh | null>(null);
  const pointCloudRef = useRef<BABYLON.Mesh | null>(null);
  const cameraRef = useRef<BABYLON.ArcRotateCamera | null>(null);

  // カメラの初期設定
  const initialCameraSettings = {
    alpha: 0,
    beta: Math.PI / 3,
    radius: 10,
    target: BABYLON.Vector3.Zero()
  };

  // アセット削除関数
  const deleteAsset = useCallback((assetId: string) => {
    const mesh = meshMapRef.current.get(assetId);
    if (mesh && sceneRef.current) {
      console.log(`Deleting asset: ${assetId}`);
      
      // 現在選択されているオブジェクトが削除対象の場合、プロパティを更新して選択を解除
      const selectedObject = transformControllerRef.current?.getSelectedObject();
      if (selectedObject && selectedObject.name === mesh.name) {
        // プロパティパネルをクリアして選択を解除した状態にする
        onPropertyUpdate?.(null);
      }
      
      // メッシュをシーンから削除
      mesh.dispose();
      
      // meshMapから削除
      meshMapRef.current.delete(assetId);
      
      console.log(`Asset ${assetId} deleted successfully`);
    } else {
      console.warn(`Asset ${assetId} not found in meshMap`);
    }
  }, []);

  // カメラリセット関数
  const resetCamera = useCallback(() => {
    if (cameraRef.current) {
      console.log('Resetting camera to initial position');
      
      // カメラを初期設定に戻す
      cameraRef.current.alpha = initialCameraSettings.alpha;
      cameraRef.current.beta = initialCameraSettings.beta;
      cameraRef.current.radius = initialCameraSettings.radius;
      cameraRef.current.setTarget(initialCameraSettings.target.clone());
      
      console.log('Camera reset completed');
    }
  }, []);

  // refを通じて関数を公開
  useImperativeHandle(ref, () => ({
    deleteAsset,
    resetCamera
  }), [deleteAsset, resetCamera]);

  // グリッドの表示/非表示を制御
  useEffect(() => {
    if (gridRef.current) {
      gridRef.current.setEnabled(showGrid);
    }
  }, [showGrid]);

  // 点群の表示/非表示を制御
  useEffect(() => {
    if (pointCloudRef.current) {
      pointCloudRef.current.setEnabled(showPointCloud);
    }
  }, [showPointCloud]);

  // シーンの初期化
  useEffect(() => {
    if (!canvasRef.current) return;

    try {
      // エンジンの初期化
      const engine = new BABYLON.Engine(canvasRef.current, true);
      engineRef.current = engine;

      // シーンの作成
      const scene = new BABYLON.Scene(engine);
      sceneRef.current = scene;

      // カメラの設定
      const camera = new BABYLON.ArcRotateCamera(
        'camera',
        initialCameraSettings.alpha,
        initialCameraSettings.beta,
        initialCameraSettings.radius,
        initialCameraSettings.target,
        scene
      );
      camera.attachControl(canvasRef.current, true);
      
      // カメラの参照を保存
      cameraRef.current = camera;
      cameraRef.current = camera; // カメラを保存

      // ライティングの設定
      const light = new BABYLON.HemisphericLight(
        'light',
        new BABYLON.Vector3(0, 1, 0),
        scene
      );
      light.intensity = 0.7;

      // グリッドの追加
      const grid = BABYLON.MeshBuilder.CreateGround(
        'grid',
        { width: 20, height: 20, subdivisions: 20 },
        scene
      );
      const gridMaterial = new BABYLON.StandardMaterial('gridMaterial', scene);
      gridMaterial.wireframe = true;
      gridMaterial.alpha = 0.3;
      grid.material = gridMaterial;

      // グリッドをunpickableにして、移動・拡縮・回転の対象から除外
      grid.isPickable = false;
      
      // グリッドの参照を保存
      gridRef.current = grid;
      
      // 初期状態でのグリッド表示設定
      grid.setEnabled(showGrid);

      // TransformControllerの初期化
      transformControllerRef.current = new TransformController(scene, {
        onTransformChanged: (transform) => {
          if (transform && onPropertyUpdate) {
            onPropertyUpdate({
              name: transform.name,
              position: {
                x: transform.position.x,
                y: transform.position.y,
                z: transform.position.z
              },
              rotation: {
                x: transform.rotation.x,
                y: transform.rotation.y,
                z: transform.rotation.z
              },
              scale: {
                x: transform.scale.x,
                y: transform.scale.y,
                z: transform.scale.z
              }
            });
          } else if (onPropertyUpdate) {
            onPropertyUpdate(null);
          }
        },
        onModeChanged: (mode) => {
          onTransformModeChange?.(mode);
        }
      }, {
        // 非一様スケーリング問題を自動的に解決（オフにして回転時の向き変更を防ぐ）
        autoNormalizeScaleForRotation: false,
        scaleNormalizationMethod: 'max',
        showScaleWarnings: false
      });

      // マウスクリックイベントの設定
      scene.onPointerDown = () => {
        const pickResult = scene.pick(scene.pointerX, scene.pointerY);
        if (pickResult && pickResult.pickedMesh && pickResult.pickedMesh.isPickable) {
          // オブジェクトがクリックされた場合
          transformControllerRef.current?.handleObjectSelection({
            pickedMesh: pickResult.pickedMesh
          });
        } else {
          // 空の場所がクリックされた場合、選択を解除
          transformControllerRef.current?.handleObjectSelection({});
        }
      };

      // PLYファイルをデフォルトで読み込み
      const loadDefaultPLY = async () => {
        try {
          console.log('Loading default PLY file...');
          const mesh = await loadPLYAsPointCloud(
            '/Assets/125429-KadincheOffice20250508-dense (1).ply',
            scene,
            'defaultOfficePointCloud',
            {
              position: { x: 3, y: 0, z: 5 }, // 中央に配置Math.PI
              rotation: { x: Math.PI, y: Math.PI * 0.93, z: 0 }, // 回転なし
              scale: { x: 1.2, y: 1.2, z: 1.2 }, // 通常サイズ
              pointSize: 2, // 点のサイズを少し大きく
              glowIntensity: 8.0, // 光の強度を最大に
              color: { r: 0, g: 1, b: 0.5 },
              useHeightBasedColors: true // 高さベースの色を有効化
            }
          );
          
          if (mesh) {
            console.log('Default PLY file loaded successfully as point cloud');
            meshMapRef.current.set('defaultOfficePointCloud', mesh);
            pointCloudRef.current = mesh; // メッシュを保存
            // 初期状態での点群表示設定
            mesh.setEnabled(showPointCloud);
          }
        } catch (error) {
          console.error('Failed to load default PLY file:', error);
        }
      };

      // シーンの準備ができたらPLYファイルを読み込み
      scene.executeWhenReady(() => {
        loadDefaultPLY();
      });

      /*BABYLON.SceneLoader.ImportMeshAsync("", "/", "kadincheOffice.glb", scene).then((result) => {
        console.log("Office model loaded");
        console.log(result);
        result.meshes.forEach((mesh) => {
          mesh.position.y = 0;
          mesh.position.x = 5;
          mesh.position.z = -5;
        });
      });*/

      // レンダリングループの開始
      engine.runRenderLoop(() => {
        scene.render();
      });

      // リサイズハンドラー
      window.addEventListener('resize', () => {
        engine.resize();
      });

      console.log('Scene initialized successfully');
    } catch (error) {
      console.error('Failed to initialize scene:', error);
    }

    return () => {
      if (transformControllerRef.current) {
        transformControllerRef.current.cleanup();
      }
      if (sceneRef.current) {
        sceneRef.current.dispose();
      }
      if (engineRef.current) {
        engineRef.current.dispose();
      }
    };
  }, []);

  // ファイルドロップ処理
  const handleFileDropCallback = useCallback(async (files: File[]) => {
    if (!sceneRef.current) {
      console.error('Scene not initialized');
      return;
    }

    console.log('Dropping files:', files);

    try {
      await handleFileDrop(files, sceneRef.current, meshMapRef.current, (asset) => {
        console.log('Asset added:', asset);
        onAssetAdd?.(asset);
      });
    } catch (error) {
      console.error('Error in file drop callback:', error);
    }
  }, [onAssetAdd]);

  return (
    <FileDropzone onFileDrop={handleFileDropCallback}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ touchAction: 'none' }}
      />
    </FileDropzone>
  );
});

export default SceneEditor;
