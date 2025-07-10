import { useEffect, useRef, useCallback } from 'react';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders';
import { handleFileDrop } from './importUtil/dragDropHandler';
import { FileDropzone } from './DragDropZone';
import { TransformController } from './transformUtil';
import type { Asset, PropertyPanelData } from '../../shared/types';
import type { TransformMode } from './transformUtil';

interface SceneEditorProps {
  onAssetAdd?: (asset: Asset) => void;
  onAssetSelect?: (assetId: string | null) => void;
  onPropertyUpdate?: (data: PropertyPanelData | null) => void;
  onTransformModeChange?: (mode: TransformMode) => void;
}

export default function SceneEditor({
  onAssetAdd,
  onPropertyUpdate,
  onTransformModeChange
}: SceneEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<BABYLON.Scene | null>(null);
  const engineRef = useRef<BABYLON.Engine | null>(null);
  const meshMapRef = useRef<Map<string, BABYLON.Mesh>>(new Map());
  const transformControllerRef = useRef<TransformController | null>(null);

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
        0,
        Math.PI / 3,
        10,
        BABYLON.Vector3.Zero(),
        scene
      );
      camera.attachControl(canvasRef.current, true);

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
      });

      // マウスクリックイベントの設定
      scene.onPointerDown = () => {
        const pickResult = scene.pick(scene.pointerX, scene.pointerY);
        if (pickResult && pickResult.pickedMesh) {
          transformControllerRef.current?.handleObjectSelection(pickResult);
        }
      };

      /*BABYLON.SceneLoader.ImportMeshAsync("", "/", "kadincheOfficeOne.glb", scene).then((result) => {
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
}
