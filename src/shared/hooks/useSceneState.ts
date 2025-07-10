import { useState, useCallback } from 'react';
import type { Asset, SceneState } from '../types';

export const useSceneState = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [scene, setScene] = useState<unknown>(null);
  const [meshMap, setMeshMap] = useState<Map<string, unknown>>(new Map());

  const addAsset = useCallback((asset: Asset) => {
    setAssets(prev => [...prev, asset]);
  }, []);

  const removeAsset = useCallback((assetId: string) => {
    setAssets(prev => prev.filter(asset => asset.id !== assetId));
    setMeshMap(prev => {
      const newMap = new Map(prev);
      newMap.delete(assetId);
      return newMap;
    });
    if (selectedAssetId === assetId) {
      setSelectedAssetId(null);
    }
  }, [selectedAssetId]);

  const updateAsset = useCallback((assetId: string, updates: Partial<Asset>) => {
    setAssets(prev => prev.map(asset => 
      asset.id === assetId ? { ...asset, ...updates } : asset
    ));
  }, []);

  const selectAsset = useCallback((assetId: string | null) => {
    setSelectedAssetId(assetId);
  }, []);

  const getSceneState = useCallback((): SceneState => ({
    assets,
    selectedAssetId,
    scene,
    meshMap
  }), [assets, selectedAssetId, scene, meshMap]);

  return {
    assets,
    selectedAssetId,
    scene,
    meshMap,
    addAsset,
    removeAsset,
    updateAsset,
    selectAsset,
    setScene,
    setMeshMap,
    getSceneState
  };
}; 