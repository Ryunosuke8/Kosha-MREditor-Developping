import type { Asset } from '../../../shared/types';
import { formatFileSize } from '../../../shared/utils/fileUtils';

export interface AssetListItem {
  id: string;
  name: string;
  type: string;
  fileName: string;
  fileSize: string;
  isSelected: boolean;
  createdAt: string;
}

export const formatAssetForDisplay = (asset: Asset): AssetListItem => {
  return {
    id: asset.id,
    name: asset.name,
    type: asset.fileType.toUpperCase(),
    fileName: asset.fileName,
    fileSize: formatFileSize(asset.fileSize),
    isSelected: asset.isSelected || false,
    createdAt: new Date(asset.createdAt).toLocaleDateString()
  };
};

export const getAssetIcon = (fileType: string): string => {
  switch (fileType.toLowerCase()) {
    case 'glb':
      return '📦';
    case 'ply':
      return '🔷';
    default:
      return '📄';
  }
}; 