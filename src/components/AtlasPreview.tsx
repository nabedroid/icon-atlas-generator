import React, { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';

import { PackedRect } from '../utils/packer';
import './AtlasPreview.css';

interface AtlasPreviewProps {
  packedData: PackedRect[];
  width: number;
  height: number;
  circular?: boolean;
  border?: boolean;
  borderWidth?: number;
  borderColor?: string;
}

export const AtlasPreview: React.FC<AtlasPreviewProps> = ({
  packedData,
  width,
  height,
  circular,
  border,
  borderWidth = 1,
  borderColor = '#000000'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [openImageDialog, setOpenImageDialog] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    packedData.forEach(item => {
      ctx.save();

      if (circular) {
        ctx.beginPath();
        const centerX = item.x + item.width / 2;
        const centerY = item.y + item.height / 2;
        const radius = Math.min(item.width, item.height) / 2;
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
      }

      ctx.drawImage(item.image, item.x, item.y, item.width, item.height);
      ctx.restore();

      if (border) {
        ctx.save();
        ctx.lineWidth = borderWidth;
        ctx.strokeStyle = borderColor;

        if (circular) {
          ctx.beginPath();
          const centerX = item.x + item.width / 2;
          const centerY = item.y + item.height / 2;
          const radius = Math.min(item.width, item.height) / 2;
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.strokeRect(item.x, item.y, item.width, item.height);
        }
        ctx.restore();
      }
    });
  }, [packedData, width, height, circular, border, borderWidth, borderColor]);

  const handleDownloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'atlas.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    setOpenImageDialog(false);
  };

  return (
    <Box sx={{ height: '100%', width: '100%', position: 'relative' }}>
      {/* Canvas Area */}
      <Box
        sx={{
          height: '100%',
          width: '100%',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#fff',
          borderRadius: 1,
          border: 1,
          borderColor: 'divider',
          cursor: 'pointer',
          background: `
            conic-gradient(#eee 0.25turn, transparent 0.25turn 0.5turn, #eee 0.5turn 0.75turn, transparent 0.75turn) top left / 20px 20px repeat,
            #fff
          `,
          position: 'relative',
          '&:hover::after': {
            content: '"クリックして保存"',
            position: 'absolute',
            bottom: 10,
            right: 10,
            bgcolor: 'rgba(0,0,0,0.7)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '0.8rem'
          }
        }}
        onClick={() => setOpenImageDialog(true)}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
        />
      </Box>

      {/* Image Save Dialog */}
      <Dialog open={openImageDialog} onClose={() => setOpenImageDialog(false)}>
        <DialogTitle>画像を保存</DialogTitle>
        <DialogContent>
          <Typography>アトラス画像をダウンロードしますか？</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenImageDialog(false)}>キャンセル</Button>
          <Button onClick={handleDownloadImage} variant="contained" autoFocus>保存</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
