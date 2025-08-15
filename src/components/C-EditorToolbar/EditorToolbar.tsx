interface EditorToolbarProps {
  showGrid: boolean;
  onGridToggle: () => void;
  showPointCloud: boolean;
  onPointCloudToggle: () => void;
  showMap: boolean;
  onMapToggle: () => void;
  onCameraReset: () => void;
  pointSize: number;
  onPointSizeChange: (size: number) => void;
  lodDistance: number;
  onLodDistanceChange: (distance: number) => void;
}

export default function EditorToolbar({ 
  showGrid, 
  onGridToggle, 
  showPointCloud, 
  onPointCloudToggle,
  showMap,
  onMapToggle,
  onCameraReset,
  pointSize,
  onPointSizeChange,
  lodDistance,
  onLodDistanceChange
}: EditorToolbarProps) {
  return (
    <div className="bg-gray-700 p-2 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-white min-h-0">
      <div className="text-sm font-medium whitespace-nowrap">
        編集画面の設定調整
      </div>
      
      <div className="flex flex-wrap items-center gap-2 sm:gap-4 lg:gap-6 overflow-x-auto w-full sm:w-auto min-w-0">
        {/* グリッド表示トグル */}
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="text-xs sm:text-sm">グリッド表示</span>
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
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="text-xs sm:text-sm">点群表示</span>
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

        {/* マップ表示トグル */}
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="text-xs sm:text-sm">マップ表示</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showMap}
              onChange={onMapToggle}
              className="sr-only"
            />
            <div className={`w-11 h-6 rounded-full relative transition-colors duration-200 ease-in-out ${
              showMap ? 'bg-purple-600' : 'bg-gray-400'
            }`}>
              <div className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-transform duration-200 ease-in-out ${
                showMap ? 'translate-x-5' : 'translate-x-0'
              }`}></div>
            </div>
          </label>
        </div>

        {/* ポイントサイズ調整 */}
        <div className="hidden sm:flex items-center gap-2 whitespace-nowrap">
          <span className="text-xs sm:text-sm">ポイントサイズ</span>
          <input
            type="range"
            min="1"
            max="7"
            step="0.1"
            value={pointSize}
            onChange={(e) => onPointSizeChange(Number(e.target.value))}
            className="w-12 sm:w-16 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
          />
          <span className="text-xs w-6 sm:w-8 text-center">{pointSize.toFixed(1)}</span>
        </div>

        {/* LOD距離調整 */}
        <div className="hidden lg:flex items-center gap-2 whitespace-nowrap">
          <span className="text-xs sm:text-sm">LOD距離</span>
          <input
            type="range"
            min="10"
            max="100"
            step="5"
            value={lodDistance}
            onChange={(e) => onLodDistanceChange(Number(e.target.value))}
            className="w-12 sm:w-16 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
          />
          <span className="text-xs w-6 sm:w-8 text-center">{lodDistance}</span>
        </div>

        {/* カメラリセットボタン */}
        <button
          onClick={onCameraReset}
          className="px-2 sm:px-3 py-1 sm:py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs sm:text-sm rounded-md transition-colors duration-200 ease-in-out whitespace-nowrap flex-shrink-0"
        >
          カメラリセット
        </button>
      </div>
    </div>
  );
}
