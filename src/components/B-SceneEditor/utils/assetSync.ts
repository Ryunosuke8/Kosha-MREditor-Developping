import type { Asset } from '../../../shared/types';

export const getAssetListData = (assets: Asset[]) => {
  return assets.map(asset => ({
    id: asset.id,
    name: asset.name,
    type: asset.fileType,
    fileName: asset.fileName,
    fileSize: asset.fileSize,
    isSelected: asset.isSelected || false,
    createdAt: asset.createdAt
  }));
};

export const updateAssetSelection = (
  assets: Asset[],
  selectedAssetId: string | null
): Asset[] => {
  return assets.map(asset => ({
    ...asset,
    isSelected: asset.id === selectedAssetId
  }));
}; 