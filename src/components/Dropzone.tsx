import React, { useCallback, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

import CloudUploadIcon from '@mui/icons-material/CloudUpload';

interface DropzoneProps {
  onImagesLoaded: (images: { name: string; fullname: string; image: HTMLImageElement; width: number; height: number }[]) => void;
  children?: React.ReactNode;
}

export const Dropzone: React.FC<DropzoneProps> = ({ onImagesLoaded, children }) => {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);

    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));

    if (files.length === 0) return;

    const loadedImages: { name: string; fullname: string; image: HTMLImageElement; width: number; height: number }[] = [];
    let loadedCount = 0;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          loadedImages.push({
            name: file.name.substring(0, file.name.lastIndexOf('.')) || file.name,
            fullname: file.name,
            image: img,
            width: img.width,
            height: img.height
          });
          loadedCount++;

          if (loadedCount === files.length) {
            onImagesLoaded(loadedImages);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  }, [onImagesLoaded]);

  return (
    <Box
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px dashed',
        borderColor: isDragActive ? 'primary.main' : 'grey.300',
        borderRadius: 2,
        bgcolor: isDragActive ? alpha('#1976d2', 0.08) : 'transparent',
        transition: 'all 0.2s',
      }}
    >
      {isDragActive && (
        <Box sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'rgba(255,255,255,0.8)',
          zIndex: 10,
          pointerEvents: 'none'
        }}>
          <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
          <Typography variant="h6" color="primary">画像をここにドロップ</Typography>
        </Box>
      )}

      {children ? children : (
        <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
          <CloudUploadIcon sx={{ fontSize: 48, mb: 1, color: 'grey.400' }} />
          <Typography>画像をドラッグ＆ドロップしてください (JPG, PNG)</Typography>
        </Box>
      )}
    </Box>
  );
};
