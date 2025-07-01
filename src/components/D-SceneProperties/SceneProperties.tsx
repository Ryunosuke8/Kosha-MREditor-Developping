import React from 'react';
import { PropertyPanel } from './PropertyPanel';
import type { PropertyPanelData } from '../../shared/types';

interface ScenePropertiesProps {
  propertyData: PropertyPanelData | null;
}

export default function SceneProperties({ propertyData }: ScenePropertiesProps) {
  return (
    <div className="bg-white border-r border-gray-200 h-full overflow-y-auto">
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-700">Scene Properties</h2>
      </div>
      <PropertyPanel data={propertyData} />
    </div>
  );
}
