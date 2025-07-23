import * as BABYLON from '@babylonjs/core';
import type { Asset } from '../../../shared/types';
import { validateFile, getFileType, generateAssetId } from '../../../shared/utils/fileUtils';

// PLYファイルを点群として処理する関数
const loadPLYAsPointCloud = async (
  file: File,
  scene: BABYLON.Scene,
  assetId: string
): Promise<BABYLON.Mesh | null> => {
  return new Promise((resolve, reject) => {
    const fileUrl = URL.createObjectURL(file);
    
    BABYLON.SceneLoader.ImportMeshAsync('', '', fileUrl, scene, null, '.ply')
      .then((result) => {
        console.log('PLY import result:', result);
        
        if (result.meshes.length === 0) {
          reject(new Error('No meshes found in PLY file'));
          return;
        }

        const mesh = result.meshes[0] as BABYLON.Mesh;
        if (!mesh) {
          reject(new Error('Invalid mesh data'));
          return;
        }

        // 高さベースの色を適用
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

        // 頂点カラーを使用する点群用マテリアルを作成
        const pbrMaterial = new BABYLON.PBRMaterial('pointCloudMaterial_' + assetId, scene);
        pbrMaterial.unlit = true; // ライティングを無効化
        pbrMaterial.albedoColor = new BABYLON.Color3(1, 1, 1); // 白で頂点カラーをそのまま表示
        pbrMaterial.metallic = 0;
        pbrMaterial.roughness = 1;
        pbrMaterial.alpha = 0.95;

        // 点群設定
        (pbrMaterial as unknown as { pointsCloud: boolean; pointSize: number }).pointsCloud = true;
        (pbrMaterial as unknown as { pointsCloud: boolean; pointSize: number }).pointSize = 3;

        // メッシュに点群マテリアルを適用
        mesh.material = pbrMaterial;
        mesh.id = assetId;

        // 点群をピック不可にして、選択・変形操作の対象から除外
        mesh.isPickable = false;

        console.log('PLY mesh configured as point cloud with height-based colors');
        resolve(mesh);
      })
      .catch((error) => {
        console.error('PLY import failed:', error);
        reject(error);
      });
  });
};

// GLBファイルを通常のメッシュとして処理する関数
const loadGLBAsModel = async (
  file: File,
  scene: BABYLON.Scene,
  assetId: string
): Promise<BABYLON.Mesh | null> => {
  return new Promise((resolve, reject) => {
    const fileUrl = URL.createObjectURL(file);
    
    BABYLON.SceneLoader.ImportMeshAsync('', '', fileUrl, scene, null, '.glb')
      .then((result) => {
        console.log('GLB import result:', result);
        
        if (result.meshes.length === 0) {
          reject(new Error('No meshes found in GLB file'));
          return;
        }

        const rootMesh = result.meshes[0];
        if (rootMesh && rootMesh instanceof BABYLON.Mesh) {
          rootMesh.id = assetId;
          resolve(rootMesh);
        } else {
          reject(new Error('Invalid mesh data'));
        }
      })
      .catch((error) => {
        console.error('GLB import failed:', error);
        reject(error);
      });
  });
};

export const handleFileDrop = async (
  files: File[],
  scene: BABYLON.Scene,
  meshMap: Map<string, BABYLON.Mesh>,
  addAsset: (asset: Asset) => void
): Promise<void> => {
  if (!scene) {
    console.error('Scene is null');
    return;
  }

  console.log('Processing files:', files.length);

  for (const file of files) {
    console.log('Processing file:', file.name);
    const assetId = generateAssetId();
    const fileType = getFileType(file.name);
    
    try {
      console.log('Starting import for:', file.name, 'Type:', fileType);
      
      let mesh: BABYLON.Mesh | null = null;

      // ファイルタイプ別に処理を分岐
      if (fileType === 'ply') {
        mesh = await loadPLYAsPointCloud(file, scene, assetId);
      } else {
        mesh = await loadGLBAsModel(file, scene, assetId);
      }

      if (mesh) {
        console.log('Setting mesh ID:', assetId);
        meshMap.set(assetId, mesh);

        const newAsset: Asset = {
          id: assetId,
          name: file.name.replace(/\.[^/.]+$/, ''),
          fileName: file.name,
          fileType: fileType,
          fileSize: file.size,
          fileUrl: URL.createObjectURL(file),
          transform: {
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
          },
          createdAt: new Date().toISOString(),
        };

        console.log('Adding asset:', newAsset);
        addAsset(newAsset);
        console.log('Successfully loaded:', file.name, 'as', fileType);
      } else {
        console.error('No valid mesh found in file:', file.name);
      }
    } catch (error) {
      console.error('Failed to load model:', error);
      alert(`Failed to load ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};

export const validateFiles = (files: File[]): File[] => {
  return files.filter(validateFile);
}; 