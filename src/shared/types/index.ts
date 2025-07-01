export interface Transform {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
}

export interface Asset {
  id: string;
  name: string;
  fileName: string;
  fileType: 'glb' | 'ply';
  fileSize: number;
  fileUrl: string;
  transform: Transform;
  createdAt: string;
  isSelected?: boolean;
}

export interface SceneState {
  assets: Asset[];
  selectedAssetId: string | null;
  scene: unknown; // Babylon.js Scene
  meshMap: Map<string, unknown>; // assetId -> Babylon.js Mesh
}

export interface PropertyPanelData {
  name: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
} 