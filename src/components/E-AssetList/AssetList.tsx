import { useState } from 'react';
import type { Asset } from '../../shared/types';
import { formatAssetForDisplay, getAssetIcon } from './utils/assetDisplayUtils';
import { uploadGLBFilesToServer, type UploadProgress } from './utils/uploadUtils';

interface AssetListProps {
  assets: Asset[];
  onDeleteAsset: (assetId: string) => void;
}

export default function AssetList({ assets, onDeleteAsset }: AssetListProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);

  const handleUploadAllGLB = async () => {
    const glbAssets = assets.filter(asset => asset.fileType === 'glb');

    if (glbAssets.length === 0) {
      alert('No GLB files found to upload');
      return;
    }

    setIsUploading(true);
    setUploadProgress(null);

    try {
      // アップロードURLを環境変数から取得（デフォルトは/api/upload-glb）
      const uploadUrl = import.meta.env.VITE_UPLOAD_URL || '/api/upload-glb';

      const result = await uploadGLBFilesToServer(glbAssets, (progress) => {
        setUploadProgress(progress);
      }, uploadUrl);

      if (result.success) {
        alert(result.message);
        if (result.errors && result.errors.length > 0) {
          console.warn('Upload completed with errors:', result.errors);
        }
      } else {
        alert(`Upload failed: ${result.message}`);
        if (result.errors) {
          console.error('Upload errors:', result.errors);
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('An unexpected error occurred during upload');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

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
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${displayAsset.isSelected
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

      {/* アップロードボタン - 右下に配置 */}
      <div className="p-4 border-t border-gray-200">
        {uploadProgress && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Uploading {uploadProgress.currentFile}/{uploadProgress.totalFiles}</span>
              <span>{Math.round(uploadProgress.progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress.progress}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {uploadProgress.fileName}
            </div>
          </div>
        )}

        <button
          onClick={handleUploadAllGLB}
          disabled={isUploading || assets.filter(asset => asset.fileType === 'glb').length === 0}
          className={`w-full py-2 px-4 rounded-lg font-medium text-sm transition-colors ${isUploading || assets.filter(asset => asset.fileType === 'glb').length === 0
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
            }`}
        >
          {isUploading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Uploading...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Upload All GLB Files</span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
