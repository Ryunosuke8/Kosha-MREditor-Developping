import { useCallback } from 'react';
import { validateFiles } from './importUtil/dragDropHandler';

interface FileDropzoneProps {
  onFileDrop: (files: File[]) => void;
  children: React.ReactNode;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({ onFileDrop, children }) => {
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const files = Array.from(e.dataTransfer.files);
      const validFiles = validateFiles(files);
      
      if (validFiles.length > 0) {
        onFileDrop(validFiles);
      } else {
        alert('Please drop valid .glb, .gltf, or .ply files');
      }
    },
    [onFileDrop]
  );

  return (
    <div 
      className="relative w-full h-full"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {children}
    </div>
  );
}; 