export const validateFile = (file: File): boolean => {
  const validExtensions = ['.glb', '.gltf', '.ply'];
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  return validExtensions.includes(fileExtension);
};

export const getFileType = (fileName: string): 'glb' | 'ply' => {
  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  if (extension === '.ply') return 'ply';
  if (extension === '.gltf') return 'glb'; // GLTFもGLBとして扱う
  return 'glb';
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const generateAssetId = (): string => {
  return `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const getFileExtension = (fileName: string): string => {
  return fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
}; 