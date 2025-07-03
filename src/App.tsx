import { useState, useEffect } from 'react';
import Header from './components/A-Header/Header';
import EditorToolbar from './components/C-EditorToolbar/EditorToolbar';
import SceneEditor from './components/B-SceneEditor/SceneEditor';
import SceneProperties from './components/D-SceneProperties/SceneProperties';
import AssetList from './components/E-AssetList/AssetList';
import { useSceneState } from './shared/hooks/useSceneState';
import type { Asset, PropertyPanelData } from './shared/types';

function App() {
  const {
    assets,
    selectedAssetId,
    addAsset,
    removeAsset
  } = useSceneState();

  const [propertyData, setPropertyData] = useState<PropertyPanelData | null>(null);

  // 選択されたアセットのプロパティを更新
  useEffect(() => {
    if (selectedAssetId) {
      const selectedAsset = assets.find(asset => asset.id === selectedAssetId);
      if (selectedAsset) {
        setPropertyData({
          name: selectedAsset.name,
          position: selectedAsset.transform.position,
          rotation: selectedAsset.transform.rotation,
          scale: selectedAsset.transform.scale
        });
      }
    } else {
      setPropertyData(null);
    }
  }, [selectedAssetId, assets]);

  const handleAssetAdd = (asset: Asset) => {
    addAsset(asset);
  };

  const handleDeleteAsset = (assetId: string) => {
    removeAsset(assetId);
  };

  return (
    <div className="flex flex-col h-screen">
      {/* A: ヘッダー */}
      <Header />

      {/* 中央部分 */}
      <div className="flex flex-1 overflow-hidden">
        {/* D: 左側 */}
        <div className="w-90 flex-shrink-0 flex flex-col h-full">
          <SceneProperties propertyData={propertyData} />
        </div>

        {/* 中央 B + C */}
        <div className="flex flex-col flex-1 overflow-hidden h-full">
          <EditorToolbar />
          <SceneEditor 
            onAssetAdd={handleAssetAdd}
          />
        </div>

        {/* E: 右側 */}
        <div className="w-120 flex-shrink-0 flex flex-col h-full">
          <AssetList assets={assets} onDeleteAsset={handleDeleteAsset} />
        </div>
      </div>
    </div>
  );
}

export default App;
