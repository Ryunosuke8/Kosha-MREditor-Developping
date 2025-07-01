import * as BABYLON from '@babylonjs/core';
import type { Asset } from '../../../shared/types';
import { validateFile, getFileType, generateAssetId } from '../../../shared/utils/fileUtils';

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
    const fileUrl = URL.createObjectURL(file);
    
    try {
      console.log('Starting import for:', file.name);
      
      const result = await BABYLON.SceneLoader.ImportMeshAsync(
        '',
        '',
        fileUrl,
        scene,
        null,
        '.glb'
      );

      console.log('Import result:', result);
      console.log('Meshes found:', result.meshes.length);

      const rootMesh = result.meshes[0];
      if (rootMesh && rootMesh instanceof BABYLON.Mesh) {
        console.log('Setting mesh ID:', assetId);
        rootMesh.id = assetId;
        meshMap.set(assetId, rootMesh);

        const newAsset: Asset = {
          id: assetId,
          name: file.name.replace(/\.[^/.]+$/, ''),
          fileName: file.name,
          fileType: getFileType(file.name),
          fileSize: file.size,
          fileUrl: fileUrl,
          transform: {
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
          },
          createdAt: new Date().toISOString(),
        };

        console.log('Adding asset:', newAsset);
        addAsset(newAsset);
        console.log('Successfully loaded:', file.name);
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