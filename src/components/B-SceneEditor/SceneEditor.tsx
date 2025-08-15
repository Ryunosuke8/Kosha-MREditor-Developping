import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders';
import { handleFileDrop } from './importUtil/dragDropHandler';
import { loadPLYAsPointCloud, SceneManager } from './importUtil/sceneManager';
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
  showMap?: boolean;
  assets?: Asset[];
  pointSize?: number;
  lodDistance?: number;
}

export interface SceneEditorRef {
  deleteAsset: (assetId: string) => void;
  resetCamera: () => void;
  exportGLBDataAsJSON: () => void;
  addEye: () => Promise<string | null>;
  selectEye: (eyeId: string) => void;
  toggleWireframeBox: (eyeId: string, visible: boolean) => void;
}

const SceneEditor = forwardRef<SceneEditorRef, SceneEditorProps>(({
  onAssetAdd,
  onPropertyUpdate,
  onTransformModeChange,
  showGrid = true,
  showPointCloud = true,
  showMap = true,
  assets = [],
  pointSize = 2,
  lodDistance = 50
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<BABYLON.Scene | null>(null);
  const engineRef = useRef<BABYLON.Engine | null>(null);
  const meshMapRef = useRef<Map<string, BABYLON.Mesh>>(new Map());
  const wireframeBoxMapRef = useRef<Map<string, BABYLON.Mesh>>(new Map());
  const transformControllerRef = useRef<TransformController | null>(null);
  const gridRef = useRef<BABYLON.Mesh | null>(null);
  const pointCloudRef = useRef<BABYLON.Mesh | null>(null);
  const cameraRef = useRef<BABYLON.ArcRotateCamera | null>(null);
  const sceneManagerRef = useRef<SceneManager | null>(null);
  const mapPlaneRef = useRef<BABYLON.Mesh | null>(null);

  // カメラの初期設定（useRefで管理して依存関係の問題を回避）
  const initialCameraSettings = useRef({
    alpha: 0,
    beta: Math.PI / 3,
    radius: 10,
    target: BABYLON.Vector3.Zero()
  });

  // マップ画像の設定（後でコードで調整可能）
  const mapSettings = useRef({
    position: { x: -2.3, y: 0, z: 0 },
    rotation: { x: Math.PI/2, y: 0, z: -Math.PI/2 },
    scale: { x: 30, y: 15, z: 1 },
    visible: true
  });

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
      
      // ワイヤーフレームボックスも削除
      const wireframeBox = wireframeBoxMapRef.current.get(assetId);
      if (wireframeBox) {
        wireframeBox.dispose();
        wireframeBoxMapRef.current.delete(assetId);
      }
      
      // メッシュをシーンから削除
      mesh.dispose();
      
      // meshMapから削除
      meshMapRef.current.delete(assetId);
      
      console.log(`Asset ${assetId} deleted successfully`);
    } else {
      console.warn(`Asset ${assetId} not found in meshMap`);
    }
  }, [onPropertyUpdate]);

  // カメラリセット関数
  const resetCamera = useCallback(() => {
    console.log('Resetting camera to initial position');
    
    // SceneManagerのカメラリセット機能を使用
    if (sceneManagerRef.current) {
      sceneManagerRef.current.resetCamera();
    }
    
    // 直接カメラリセットも実行（バックアップ）
    if (cameraRef.current) {
      // カメラを初期設定に戻す
      cameraRef.current.alpha = initialCameraSettings.current.alpha;
      cameraRef.current.beta = initialCameraSettings.current.beta;
      cameraRef.current.radius = initialCameraSettings.current.radius;
      cameraRef.current.setTarget(initialCameraSettings.current.target.clone());
      
      // カメラの更新を強制
      cameraRef.current.inertia = 0;
      cameraRef.current.angularSensibilityX = 1000;
      cameraRef.current.angularSensibilityY = 1000;
      
      // 次のフレームでカメラの状態を確実に更新
      if (sceneRef.current) {
        sceneRef.current.onBeforeRenderObservable.addOnce(() => {
          if (cameraRef.current) {
            cameraRef.current.inertia = 0.9;
            cameraRef.current.angularSensibilityX = 1000;
            cameraRef.current.angularSensibilityY = 1000;
          }
        });
      }
    }
    
    console.log('Camera reset completed');
  }, []);

  // ワイヤーフレームボックスを作成する関数
  const createWireframeBox = useCallback((mesh: BABYLON.Mesh, eyeId: string) => {
    if (!sceneRef.current) return null;

    // メッシュのバウンディングボックスを計算
    mesh.computeWorldMatrix(true);
    const boundingInfo = mesh.getBoundingInfo();
    const min = boundingInfo.minimum;
    const max = boundingInfo.maximum;
    
    // ボックスのサイズを計算
    const size = max.subtract(min);
    const center = min.add(max).scale(0.5);
    
    // ベースサイズでボックスを作成
    const wireframeBox = BABYLON.MeshBuilder.CreateBox(`wireframe_${eyeId}`, {
      width: size.x,
      height: size.y,
      depth: size.z
    }, sceneRef.current);
    
    // スケール調整（XYZ個別にスケーリング）
    const sizeScaleX = 0.8; // X軸方向のスケール
    const sizeScaleY = 0.4; // Y軸方向のスケール  
    const sizeScaleZ = 0.8; // Z軸方向のスケール
    
    wireframeBox.scaling.x = sizeScaleX;
    wireframeBox.scaling.y = sizeScaleY;
    wireframeBox.scaling.z = sizeScaleZ;
    
    // ワイヤーフレームマテリアルを作成
    const wireframeMaterial = new BABYLON.StandardMaterial(`wireframeMat_${eyeId}`, sceneRef.current);
    wireframeMaterial.wireframe = true;
    wireframeMaterial.emissiveColor = new BABYLON.Color3(0, 1, 1); // シアン色
    wireframeMaterial.alpha = 0.8;
    wireframeMaterial.backFaceCulling = false;
    
    wireframeBox.material = wireframeMaterial;
    
    // ボックスの位置調整（必要に応じてオフセットを適用）
    const positionOffset = new BABYLON.Vector3(0, 1, 0); // X, Y, Z オフセット
    wireframeBox.position = center.add(positionOffset);
    
    // メッシュの親に設定（メッシュと一緒に移動するように）
    wireframeBox.setParent(mesh);
    
    // ピック不可に設定（選択の邪魔にならないように）
    wireframeBox.isPickable = false;
    
    // 初期状態では表示
    wireframeBox.setEnabled(true);
    
    console.log(`Wireframe box created for ${eyeId}`);
    return wireframeBox;
  }, []);

  // ワイヤーフレームボックスの表示/非表示を切り替える関数
  const toggleWireframeBox = useCallback((eyeId: string, visible: boolean) => {
    const wireframeBox = wireframeBoxMapRef.current.get(eyeId);
    if (wireframeBox) {
      wireframeBox.setEnabled(visible);
      console.log(`Wireframe box for ${eyeId} set to ${visible ? 'visible' : 'hidden'}`);
    }
  }, []);

  // Origin.glbを読み込んでシーンに配置する関数
  const addEye = useCallback(async (): Promise<string | null> => {
    if (!sceneRef.current) {
      console.error('Scene not initialized');
      return null;
    }

    try {
      console.log('Loading Origin.glb...');
      
      // ユニークなIDを生成
      const eyeId = `eye_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Origin.glbを読み込み
      const result = await BABYLON.SceneLoader.ImportMeshAsync("", "/", "Origin.glb", sceneRef.current);
      
      if (result.meshes.length > 0) {
        console.log(`Loaded ${result.meshes.length} meshes:`, result.meshes.map(m => m.name));
        
        // 親メッシュを作成してすべてのメッシュをまとめる
        const parentMesh = new BABYLON.Mesh(eyeId, sceneRef.current);
        parentMesh.name = eyeId;
        parentMesh.id = eyeId;
        
        // すべてのメッシュを親の下に配置し、ピック可能に設定
        result.meshes.forEach((mesh) => {
          if (mesh) {
            mesh.setParent(parentMesh);
            mesh.isPickable = true;
            console.log(`Setting mesh ${mesh.name} as pickable and parented to ${eyeId}`);
          }
        });
        
        // デフォルト位置に配置（シーンの中央付近）
        parentMesh.position.x = 0;
        parentMesh.position.y = 1;
        parentMesh.position.z = 0;
        
        // デフォルトスケールを設定
        parentMesh.scaling.x = 0.35;
        parentMesh.scaling.y = 0.35;
        parentMesh.scaling.z = 0.35;
        
        // 親メッシュもピック可能に設定
        parentMesh.isPickable = true;
        
        // メッシュマップに登録
        meshMapRef.current.set(eyeId, parentMesh);
        
        // ワイヤーフレームボックスを作成
        setTimeout(() => {
          const wireframeBox = createWireframeBox(parentMesh, eyeId);
          if (wireframeBox) {
            wireframeBoxMapRef.current.set(eyeId, wireframeBox);
          }
        }, 50);
        
        console.log(`Origin.glb loaded successfully with ID: ${eyeId}, parent mesh created`);
        
        // TransformControllerに登録して移動可能にする
        if (transformControllerRef.current) {
          console.log('Selecting newly loaded eye mesh...');
          // 少し遅延させて確実に選択されるようにする
          setTimeout(() => {
            if (transformControllerRef.current) {
              transformControllerRef.current.handleObjectSelection({
                pickedMesh: parentMesh
              });
              console.log('Eye mesh selection completed');
            }
          }, 100);
        }
        
        return eyeId;
      } else {
        console.error('No meshes found in Origin.glb');
        return null;
      }
    } catch (error) {
      console.error('Failed to load Origin.glb:', error);
      return null;
    }
  }, [createWireframeBox]);

  // 指定されたEyeオブジェクトを選択する関数
  const selectEye = useCallback((eyeId: string) => {
    const mesh = meshMapRef.current.get(eyeId);
    if (mesh && transformControllerRef.current) {
      console.log(`Selecting eye object: ${eyeId}`);
      transformControllerRef.current.handleObjectSelection({
        pickedMesh: mesh
      });
    } else {
      console.warn(`Eye object ${eyeId} not found in meshMap`);
    }
  }, []);

  // GLBデータをJSONでエクスポートする関数
  const exportGLBDataAsJSON = useCallback(() => {
    // 点群PLYのデフォルト位置（オリジン）
    const plyOrigin = {
      position: { x: 3, y: 0, z: 5 },
      rotation: { x: Math.PI, y: Math.PI * 0.93, z: 0 },
      scale: { x: 1.2, y: 1.2, z: 1.2 }
    };

    const glbData: Array<{
      name: string;
      relativePosition: { x: number; y: number; z: number };
      rotation: { x: number; y: number; z: number };
      scale: { x: number; y: number; z: number };
    }> = [];

    // meshMapをイテレートしてGLBファイルのデータを取得
    meshMapRef.current.forEach((mesh, assetId) => {
      // 点群は除外（デフォルトのPLYと追加されたPLY）
      if (assetId === 'defaultOfficePointCloud' || mesh.name.includes('pointCloud')) {
        return;
      }

      // assets配列からassetIdに対応するAsset情報を取得
      const asset = assets.find(a => a.id === assetId);
      const assetName = asset ? asset.name : mesh.name || `asset_${assetId}`;

      // メッシュの現在のtransform情報を取得
      const position = mesh.position;
      const rotation = mesh.rotation;
      const scaling = mesh.scaling;

      // 点群PLYからの相対位置を計算
      const relativePosition = {
        x: position.x - plyOrigin.position.x,
        y: position.y - plyOrigin.position.y,
        z: position.z - plyOrigin.position.z
      };

      // 相対回転を計算（ラジアンをそのまま使用）
      const relativeRotation = {
        x: rotation.x - plyOrigin.rotation.x,
        y: rotation.y - plyOrigin.rotation.y,
        z: rotation.z - plyOrigin.rotation.z
      };

      // 相対スケールを計算
      const relativeScale = {
        x: scaling.x / plyOrigin.scale.x,
        y: scaling.y / plyOrigin.scale.y,
        z: scaling.z / plyOrigin.scale.z
      };

      glbData.push({
        name: assetName,
        relativePosition,
        rotation: relativeRotation,
        scale: relativeScale
      });
    });

    if (glbData.length === 0) {
      alert('No GLB files found to export');
      return;
    }

    // JSONデータを作成
    const exportData = {
      exportedAt: new Date().toISOString(),
      plyOrigin,
      glbAssets: glbData
    };

    // JSONファイルとしてダウンロード
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `glb_assets_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    console.log('GLB data exported as JSON:', exportData);
  }, [assets]);

  // refを通じて関数を公開
  useImperativeHandle(ref, () => ({
    deleteAsset,
    resetCamera,
    exportGLBDataAsJSON,
    addEye,
    selectEye,
    toggleWireframeBox
  }), [deleteAsset, resetCamera, exportGLBDataAsJSON, addEye, selectEye, toggleWireframeBox]);

  // グリッドの表示/非表示を制御
  useEffect(() => {
    if (gridRef.current) {
      gridRef.current.setEnabled(showGrid);
    }
  }, [showGrid]);

  // 点群の表示/非表示を制御
  useEffect(() => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setAllPointCloudsVisibility(showPointCloud);
    }
  }, [showPointCloud]);

  // ポイントサイズの制御
  useEffect(() => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setPointSize(pointSize);
    }
  }, [pointSize]);

  // LOD距離の制御
  useEffect(() => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setPointCloudLOD(lodDistance);
    }
  }, [lodDistance]);

  // マップの表示/非表示を制御
  useEffect(() => {
    if (mapPlaneRef.current) {
      mapPlaneRef.current.setEnabled(showMap);
    }
  }, [showMap]);

  // シーンの初期化
  useEffect(() => {
    if (!canvasRef.current) return;

    try {
      // SceneManagerを使用してシーンを初期化
      sceneManagerRef.current = new SceneManager();
      const scene = sceneManagerRef.current.initialize(canvasRef.current);
      sceneRef.current = scene;
      
      // エンジンの参照を保存（後方互換性のため）
      engineRef.current = (scene.getEngine() as BABYLON.Engine);

      // SceneManagerから作成されたカメラの参照を取得
      const camera = scene.getCameraByName('camera') as BABYLON.ArcRotateCamera;
      if (camera) {
        cameraRef.current = camera;
        // 初期設定を適用
        camera.alpha = initialCameraSettings.current.alpha;
        camera.beta = initialCameraSettings.current.beta;
        camera.radius = initialCameraSettings.current.radius;
        camera.setTarget(initialCameraSettings.current.target.clone());
      }

      // SceneManagerから作成されたグリッドの参照を取得
      const grid = scene.getMeshByName('grid');
      if (grid) {
        gridRef.current = grid as BABYLON.Mesh;
        // 初期表示状態は別のuseEffectで制御されるため、ここでは設定しない
      }

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
        console.log('Click detected:', {
          hit: !!pickResult?.hit,
          pickedMesh: pickResult?.pickedMesh?.name,
          isPickable: pickResult?.pickedMesh?.isPickable
        });
        
        if (pickResult && pickResult.pickedMesh && pickResult.pickedMesh.isPickable) {
          console.log(`Selecting mesh: ${pickResult.pickedMesh.name}`);
          // オブジェクトがクリックされた場合
          transformControllerRef.current?.handleObjectSelection({
            pickedMesh: pickResult.pickedMesh
          });
        } else {
          console.log('Deselecting - no pickable mesh clicked');
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
            // SceneManagerに登録（自動的に初期設定が適用される）
            if (sceneManagerRef.current) {
              sceneManagerRef.current.registerPointCloud('defaultOfficePointCloud', mesh);
            }
          }
        } catch (error) {
          console.error('Failed to load default PLY file:', error);
        }
      };

      // マップ画像を読み込んで表示する関数
      const loadMapImage = async () => {
        try {
          console.log('Loading map image...');
          
          // テクスチャを読み込み
          const mapTexture = new BABYLON.Texture('/map.png', scene);
          
          // 平面メッシュを作成
          const mapPlane = BABYLON.MeshBuilder.CreatePlane('mapPlane', { size: 1 }, scene);
          
          // マテリアルを作成
          const mapMaterial = new BABYLON.StandardMaterial('mapMaterial', scene);
          mapMaterial.diffuseTexture = mapTexture;
          mapMaterial.emissiveTexture = mapTexture; // 少し光らせる
          mapMaterial.emissiveColor = new BABYLON.Color3(0.3, 0.3, 0.3); // 薄い光
          mapMaterial.backFaceCulling = false; // 両面表示
          
          // 光の反射を無効化
          mapMaterial.specularColor = new BABYLON.Color3(0, 0, 0); // スペキュラー反射を無効
          mapMaterial.roughness = 1.0; // 完全にラフ（マット）な質感
          
          // 黒い部分を透過させる設定
          mapMaterial.useAlphaFromDiffuseTexture = true; // テクスチャのアルファチャンネルを使用
          mapMaterial.alpha = 1.0; // アルファ値を設定
          mapMaterial.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND; // アルファブレンドモード
          
          // 黒い部分をより透明にするためのアルファテスト（オプション）
          // mapMaterial.alphaTest = 0.1; // この値以下のアルファ値は完全に透明にする
          
          // マテリアルを適用
          mapPlane.material = mapMaterial;
          
          // 位置・回転・スケールを設定
          mapPlane.position.x = mapSettings.current.position.x;
          mapPlane.position.y = mapSettings.current.position.y;
          mapPlane.position.z = mapSettings.current.position.z;
          mapPlane.rotation.x = mapSettings.current.rotation.x;
          mapPlane.rotation.y = mapSettings.current.rotation.y;
          mapPlane.rotation.z = mapSettings.current.rotation.z;
          mapPlane.scaling.x = mapSettings.current.scale.x;
          mapPlane.scaling.y = mapSettings.current.scale.y;
          mapPlane.scaling.z = mapSettings.current.scale.z;
          
          // unpickableに設定（選択不可）
          mapPlane.isPickable = false;
          
          // 初期表示状態は別のuseEffectで制御されるため、ここでは常に有効で作成
          
          // 参照を保存
          mapPlaneRef.current = mapPlane;
          
          console.log('Map image loaded and displayed successfully');
        } catch (error) {
          console.error('Failed to load map image:', error);
        }
      };

      // シーンの準備ができたらPLYファイルとマップ画像を読み込み
      scene.executeWhenReady(() => {
        loadDefaultPLY();
        loadMapImage();
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

      // リサイズハンドラー（SceneManagerで既にレンダリングループは開始されている）
      window.addEventListener('resize', () => {
        engineRef.current?.resize();
      });

      console.log('Scene initialized successfully');
    } catch (error) {
      console.error('Failed to initialize scene:', error);
    }

    return () => {
      if (transformControllerRef.current) {
        transformControllerRef.current.cleanup();
      }
      if (mapPlaneRef.current) {
        mapPlaneRef.current.dispose();
      }
      if (sceneManagerRef.current) {
        sceneManagerRef.current.dispose();
      }
    };
  }, [onPropertyUpdate, onTransformModeChange]); // showGridとshowMapを依存関係から除去

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
