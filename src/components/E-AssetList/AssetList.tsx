import type { Asset } from '../../shared/types';
import { formatAssetForDisplay, getAssetIcon } from './utils/assetDisplayUtils';

interface AssetListProps {
  assets: Asset[];
  onDeleteAsset: (assetId: string) => void;
}

export default function AssetList({ assets, onDeleteAsset }: AssetListProps) {
  return (
    <div className="bg-white border-l border-gray-200 h-full flex flex-col">
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-700">Asset List</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {assets.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No assets loaded</p>
            <p className="text-sm">Drop .glb or .ply files to add assets</p>
          </div>
        ) : (
          <div className="space-y-2">
            {assets.map(asset => {
              const displayAsset = formatAssetForDisplay(asset);
              return (
                <div
                  key={asset.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    displayAsset.isSelected
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getAssetIcon(asset.fileType)}</span>
                      <div>
                        <div className="font-medium text-sm">{displayAsset.name}</div>
                        <div className="text-xs text-gray-500">
                          {displayAsset.type} • {displayAsset.fileSize}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteAsset(asset.id);
                      }}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
