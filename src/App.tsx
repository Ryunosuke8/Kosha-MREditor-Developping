import { useState, useEffect, useRef } from 'react';
import Header from './components/A-Header/Header';
import EditorToolbar from './components/C-EditorToolbar/EditorToolbar';
import SceneEditor, { type SceneEditorRef } from './components/B-SceneEditor/SceneEditor';
import SceneProperties, { type EyeObject } from './components/D-SceneProperties/SceneProperties';
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
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showPointCloud, setShowPointCloud] = useState<boolean>(true);
  const [showMap, setShowMap] = useState<boolean>(true);
  const [pointSize, setPointSize] = useState<number>(2);
  const [lodDistance, setLodDistance] = useState<number>(50);
  const [eyeObjects, setEyeObjects] = useState<EyeObject[]>([]);
  const [editingEyeId, setEditingEyeId] = useState<string | null>(null);
  const sceneEditorRef = useRef<SceneEditorRef>(null);

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
    // SceneEditorからメッシュを削除
    sceneEditorRef.current?.deleteAsset(assetId);
    // ステートからアセットを削除
    removeAsset(assetId);
  };

  const handleGridToggle = () => {
    setShowGrid(!showGrid);
  };

  const handlePointCloudToggle = () => {
    setShowPointCloud(!showPointCloud);
  };

  const handleMapToggle = () => {
    setShowMap(!showMap);
  };

  const handleCameraReset = () => {
    sceneEditorRef.current?.resetCamera();
  };

  const handlePointSizeChange = (size: number) => {
    setPointSize(size);
  };

  const handleLodDistanceChange = (distance: number) => {
    setLodDistance(distance);
  };

  const handleExportGLBDataAsJSON = () => {
    sceneEditorRef.current?.exportGLBDataAsJSON();
  };

  // Eyeオブジェクトの管理関数
  const handleAddEye = async () => {
    const newEyeId = await sceneEditorRef.current?.addEye();
    if (newEyeId) {
      const eyeNumber = eyeObjects.length + 1;
      const newEye = {
        id: newEyeId,
        name: `Origin${eyeNumber}`,
        selected: false,
        wireframeVisible: true
      };
      
      // 他のEyeオブジェクトの選択を解除し、新しいものを選択状態にする
      setEyeObjects(prev => [
        ...prev.map(eye => ({ ...eye, selected: false })),
        { ...newEye, selected: true }
      ]);
    }
  };

  const handleEyeSelect = (eyeId: string) => {
    // 選択状態を更新
    setEyeObjects(prev => prev.map(eye => ({
      ...eye,
      selected: eye.id === eyeId
    })));
    
    // SceneEditorで該当オブジェクトを選択
    sceneEditorRef.current?.selectEye(eyeId);
  };

  const handleEyeDelete = (eyeId: string) => {
    // SceneEditorからメッシュを削除
    sceneEditorRef.current?.deleteAsset(eyeId);
    
    // 状態からEyeオブジェクトを削除
    setEyeObjects(prev => prev.filter(eye => eye.id !== eyeId));
  };

  const handleToggleWireframe = (eyeId: string, visible: boolean) => {
    // SceneEditorでワイヤーフレーム表示を切り替え
    sceneEditorRef.current?.toggleWireframeBox(eyeId, visible);
    
    // 状態を更新
    setEyeObjects(prev => prev.map(eye => 
      eye.id === eyeId ? { ...eye, wireframeVisible: visible } : eye
    ));
  };

  const handleStartEdit = (eyeId: string) => {
    setEditingEyeId(eyeId);
  };

  const handleFinishEdit = (eyeId: string, newName: string) => {
    if (newName.trim()) {
      setEyeObjects(prev => prev.map(eye => 
        eye.id === eyeId ? { ...eye, name: newName.trim() } : eye
      ));
    }
    setEditingEyeId(null);
  };

  const handleCancelEdit = () => {
    setEditingEyeId(null);
  };

  return (
    <div className="flex flex-col h-screen">
      {/* A: ヘッダー */}
      <Header />

      {/* 中央部分 */}
      <div className="flex flex-1 overflow-hidden">
        {/* D: 左側 */}
        <div className="w-90 flex-shrink-0 flex flex-col h-full">
          <SceneProperties 
            propertyData={propertyData} 
            onAddEye={handleAddEye}
            eyeObjects={eyeObjects}
            onEyeSelect={handleEyeSelect}
            onEyeDelete={handleEyeDelete}
            onToggleWireframe={handleToggleWireframe}
            editingEyeId={editingEyeId}
            onStartEdit={handleStartEdit}
            onFinishEdit={handleFinishEdit}
            onCancelEdit={handleCancelEdit}
          />
        </div>

        {/* 中央 B + C */}
        <div className="flex flex-col flex-1 overflow-hidden h-full">
          <EditorToolbar 
            showGrid={showGrid}
            onGridToggle={handleGridToggle}
            showPointCloud={showPointCloud}
            onPointCloudToggle={handlePointCloudToggle}
            showMap={showMap}
            onMapToggle={handleMapToggle}
            onCameraReset={handleCameraReset}
            pointSize={pointSize}
            onPointSizeChange={handlePointSizeChange}
            lodDistance={lodDistance}
            onLodDistanceChange={handleLodDistanceChange}
          />
          <SceneEditor 
            ref={sceneEditorRef}
            onAssetAdd={handleAssetAdd}
            showGrid={showGrid}
            showPointCloud={showPointCloud}
            showMap={showMap}
            assets={assets}
            pointSize={pointSize}
            lodDistance={lodDistance}
          />
        </div>

        {/* E: 右側 */}
        <div className="w-120 flex-shrink-0 flex flex-col h-full">
          <AssetList 
            assets={assets} 
            onDeleteAsset={handleDeleteAsset}
            onExportGLBDataAsJSON={handleExportGLBDataAsJSON}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
