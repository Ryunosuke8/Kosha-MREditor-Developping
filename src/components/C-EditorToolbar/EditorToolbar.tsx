interface EditorToolbarProps {
  showGrid: boolean;
  onGridToggle: () => void;
  showPointCloud: boolean;
  onPointCloudToggle: () => void;
  onCameraReset: () => void;
}

export default function EditorToolbar({ 
  showGrid, 
  onGridToggle, 
  showPointCloud, 
  onPointCloudToggle,
  onCameraReset
}: EditorToolbarProps) {
  return (
    <div className="bg-gray-700 p-4 flex items-center justify-between text-white">
      <div className="text-sm font-medium">
        編集画面の設定調整
      </div>
      
      <div className="flex items-center space-x-6">
        {/* グリッド表示トグル */}
        <div className="flex items-center space-x-2">
          <span className="text-sm">グリッド表示</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showGrid}
              onChange={onGridToggle}
              className="sr-only"
            />
            <div className={`w-11 h-6 rounded-full relative transition-colors duration-200 ease-in-out ${
              showGrid ? 'bg-blue-600' : 'bg-gray-400'
            }`}>
              <div className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-transform duration-200 ease-in-out ${
                showGrid ? 'translate-x-5' : 'translate-x-0'
              }`}></div>
            </div>
          </label>
        </div>

        {/* 点群表示トグル */}
        <div className="flex items-center space-x-2">
          <span className="text-sm">点群表示</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showPointCloud}
              onChange={onPointCloudToggle}
              className="sr-only"
            />
            <div className={`w-11 h-6 rounded-full relative transition-colors duration-200 ease-in-out ${
              showPointCloud ? 'bg-green-600' : 'bg-gray-400'
            }`}>
              <div className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-transform duration-200 ease-in-out ${
                showPointCloud ? 'translate-x-5' : 'translate-x-0'
              }`}></div>
            </div>
          </label>
        </div>

        {/* カメラリセットボタン */}
        <button
          onClick={onCameraReset}
          className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded-md transition-colors duration-200 ease-in-out"
        >
          カメラリセット
        </button>
      </div>
    </div>
  );
}
