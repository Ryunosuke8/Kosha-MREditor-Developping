import type { PropertyPanelData } from '../../shared/types';
import { formatPosition, formatRotation, formatScale } from './utils/formatters';

interface PropertyPanelProps {
  data: PropertyPanelData | null;
}

export const PropertyPanel: React.FC<PropertyPanelProps> = ({ data }) => {
  if (!data) {
    return (
      <div className="p-4 text-gray-500 text-center">
        No object selected
      </div>
    );
  }

  return (
    <div className="p-4">
      <h3 className="text-lg font-bold mb-4 text-gray-800">
        {data.name}
      </h3>
      
      <div className="space-y-4">
        {/* Position */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Position</h4>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <span className="text-gray-500">X:</span>
              <span className="ml-1 font-mono">{formatPosition(data.position.x)}</span>
            </div>
            <div>
              <span className="text-gray-500">Y:</span>
              <span className="ml-1 font-mono">{formatPosition(data.position.y)}</span>
            </div>
            <div>
              <span className="text-gray-500">Z:</span>
              <span className="ml-1 font-mono">{formatPosition(data.position.z)}</span>
            </div>
          </div>
        </div>

        {/* Rotation */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Rotation</h4>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <span className="text-gray-500">X:</span>
              <span className="ml-1 font-mono">{formatRotation(data.rotation.x)}</span>
            </div>
            <div>
              <span className="text-gray-500">Y:</span>
              <span className="ml-1 font-mono">{formatRotation(data.rotation.y)}</span>
            </div>
            <div>
              <span className="text-gray-500">Z:</span>
              <span className="ml-1 font-mono">{formatRotation(data.rotation.z)}</span>
            </div>
          </div>
        </div>

        {/* Scale */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Scale</h4>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <span className="text-gray-500">X:</span>
              <span className="ml-1 font-mono">{formatScale(data.scale.x)}</span>
            </div>
            <div>
              <span className="text-gray-500">Y:</span>
              <span className="ml-1 font-mono">{formatScale(data.scale.y)}</span>
            </div>
            <div>
              <span className="text-gray-500">Z:</span>
              <span className="ml-1 font-mono">{formatScale(data.scale.z)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 