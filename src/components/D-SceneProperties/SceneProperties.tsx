import React from 'react';
import { PropertyPanel } from './PropertyPanel';
import type { PropertyPanelData } from '../../shared/types';

export interface EyeObject {
  id: string;
  name: string;
  selected: boolean;
  wireframeVisible?: boolean;
}

export interface ScenePropertiesProps {
  propertyData: PropertyPanelData | null;
  onAddEye?: () => Promise<void> | void;
  eyeObjects?: EyeObject[];
  onEyeSelect?: (eyeId: string) => void;
  onEyeDelete?: (eyeId: string) => void;
  onToggleWireframe?: (eyeId: string, visible: boolean) => void;
  editingEyeId?: string | null;
  onStartEdit?: (eyeId: string) => void;
  onFinishEdit?: (eyeId: string, newName: string) => void;
  onCancelEdit?: () => void;
}

export default function SceneProperties({ 
  propertyData, 
  onAddEye, 
  eyeObjects = [], 
  onEyeSelect, 
  onEyeDelete,
  onToggleWireframe,
  editingEyeId,
  onStartEdit,
  onFinishEdit,
  onCancelEdit
}: ScenePropertiesProps) {
  return (
    <div className="bg-white border-r border-gray-200 h-full overflow-y-auto">
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-700">Scene Properties</h2>
      </div>
      
      {/* Add Eye Button */}
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={onAddEye}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors"
        >
          目を追加
        </button>
      </div>

      {/* Eye Objects Hierarchy */}
      {eyeObjects.length > 0 && (
        <div className="border-b border-gray-200">
          <div className="bg-gray-50 px-4 py-2">
            <h3 className="text-sm font-semibold text-gray-700">Hierarchy</h3>
          </div>
          <div className="p-2">
            {eyeObjects.map((eye) => (
              <div
                key={eye.id}
                className={`flex items-center justify-between p-2 rounded cursor-pointer hover:bg-gray-100 ${
                  eye.selected ? 'bg-blue-100 border border-blue-300' : ''
                }`}
                onClick={() => onEyeSelect?.(eye.id)}
              >
                <div className="flex items-center">
                  <div className="w-4 h-4 mr-2 flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  </div>
                  {editingEyeId === eye.id ? (
                    <input
                      type="text"
                      defaultValue={eye.name}
                      className="text-sm text-gray-800 bg-white border border-blue-300 rounded px-1 py-0.5 min-w-0 flex-1"
                      autoFocus
                      onBlur={(e) => onFinishEdit?.(eye.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          onFinishEdit?.(eye.id, e.currentTarget.value);
                        } else if (e.key === 'Escape') {
                          onCancelEdit?.();
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span 
                      className="text-sm text-gray-800 cursor-pointer hover:text-blue-600"
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        onStartEdit?.(eye.id);
                      }}
                    >
                      {eye.name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleWireframe?.(eye.id, !eye.wireframeVisible);
                    }}
                    className={`p-1 rounded transition-colors ${
                      eye.wireframeVisible 
                        ? 'text-cyan-500 hover:text-cyan-700 bg-cyan-50' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                    title="ワイヤーフレーム表示"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEyeDelete?.(eye.id);
                    }}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="削除"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <PropertyPanel data={propertyData} />
    </div>
  );
}
