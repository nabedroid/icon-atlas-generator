import { useState, useEffect, useMemo } from 'react';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';

import { Dropzone } from './components/Dropzone';
import { AtlasPreview } from './components/AtlasPreview';
import { Packer, PackedRect } from './utils/packer';
import { SettingsPanel } from './components/SettingsPanel';
import { trimImage } from './utils/imageProcessor';

interface SourceImage {
  name: string;
  fullname: string;
  image: HTMLImageElement;
  width: number;
  height: number;
}

interface ProcessedSourceImage {
  name: string;
  fullname: string;
  image: CanvasImageSource; // Can be HTMLImageElement or HTMLCanvasElement
  width: number;
  height: number;
}

interface Settings {
  width: number;
  height: number;
  autoSize: boolean;
  trimming: boolean;
  padding: number;
  circular: boolean;
  border: boolean;
  borderWidth: number;
  borderColor: string;
}

const theme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: '#ffffff',
      paper: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
  },
});

function App() {
  const [sourceImages, setSourceImages] = useState<SourceImage[]>([]);
  const [packedData, setPackedData] = useState<PackedRect[]>([]);
  const [settings, setSettings] = useState<Settings>({
    width: 1024,
    height: 1024,
    autoSize: false,
    trimming: false,
    padding: 0,
    circular: false,
    border: false,
    borderWidth: 2,
    borderColor: '#000000'
  });
  const [effectiveSize, setEffectiveSize] = useState({ width: 1024, height: 1024 });

  // Notification state
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  // JSON Save Dialog State
  const [openJsonDialog, setOpenJsonDialog] = useState(false);

  // Memoized processed images (Trimming logic)
  // We use useMemo but since trimImage is sync and potentially heavy for many images,
  // in a real app we might want async or worker. For now sync is fine for reasonable counts.
  const processedImages = useMemo<ProcessedSourceImage[]>(() => {
    return sourceImages.map(img => {
      if (settings.trimming) {
        const trimmed = trimImage(img.image);
        return {
          name: img.name,
          fullname: img.fullname,
          image: trimmed.element,
          width: trimmed.width,
          height: trimmed.height
        };
      } else {
        return {
          name: img.name,
          fullname: img.fullname,
          image: img.image,
          width: img.width,
          height: img.height
        };
      }
    });
  }, [sourceImages, settings.trimming]);

  const handleImagesLoaded = (newImages: SourceImage[]) => {
    setSourceImages(prev => {
      const existingNames = new Set(prev.map(img => img.fullname));
      const uniqueNewImages: SourceImage[] = [];
      let duplicateCount = 0;

      newImages.forEach(img => {
        if (!existingNames.has(img.fullname)) {
          uniqueNewImages.push(img);
          existingNames.add(img.fullname); // Add to set to prevent dups within new batch if any
        } else {
          duplicateCount++;
        }
      });

      if (duplicateCount > 0) {
        setSnackbar({
          open: true,
          message: `${duplicateCount} 件の重複ファイルをスキップしました`
        });
      }

      return [...prev, ...uniqueNewImages];
    });
  };

  const handleSettingChange = (name: string, value: any) => {
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setSourceImages([]);
    setPackedData([]);
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  useEffect(() => {
    if (processedImages.length === 0) {
      setPackedData([]);
      return;
    }

    // Apply Padding to dimensions for packing
    const itemsToPack = processedImages.map(img => ({
      ...img,
      width: img.width + settings.padding,
      height: img.height + settings.padding
    }));

    const runPacker = (w: number, h: number) => {
      const packer = new Packer(w, h);
      return packer.pack(itemsToPack);
    };

    let finalPacked: PackedRect[] = [];
    let finalSize = { width: settings.width, height: settings.height };

    if (settings.autoSize) {
      const maxImgDim = Math.max(...itemsToPack.map(img => Math.max(img.width, img.height)));
      let size = Math.ceil(maxImgDim / 256) * 256;
      if (size < 256) size = 256;

      let packed = runPacker(size, size);

      while (packed.length < itemsToPack.length && size <= 8192) {
        size += 256;
        packed = runPacker(size, size);
      }

      finalPacked = packed;
      finalSize = { width: size, height: size };
    } else {
      finalPacked = runPacker(settings.width, settings.height);
      finalSize = { width: settings.width, height: settings.height };
    }

    // Remove padding from visualization rects so images are drawn at correct size
    // The x/y positions remain as calculated (with padding gaps)
    const displayPacked = finalPacked.map(item => ({
      ...item,
      width: item.width - settings.padding,
      height: item.height - settings.padding
    }));

    setPackedData(displayPacked);
    setEffectiveSize(finalSize);

  }, [processedImages, settings.width, settings.height, settings.autoSize, settings.padding]);

  // JSON Data Calculation
  const jsonContent = packedData.reduce((acc, { name, fullname, x, y, width, height }) => {
    acc[name] = { name, fullname, x, y, width, height };
    return acc;
  }, {} as Record<string, any>);

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(jsonContent, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.download = 'atlas.json';
    link.href = URL.createObjectURL(blob);
    link.click();
    setOpenJsonDialog(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>

        {/* Top Panel: Settings */}
        <Box sx={{ flexShrink: 0, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <SettingsPanel
            {...settings}
            onSettingChange={handleSettingChange}
            onReset={handleReset}
          />
        </Box>

        {/* Bottom Area */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>

          {/* Bottom Left: JSON */}
          <Box sx={{ width: 300, borderRight: 1, borderColor: 'divider', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
            <Paper
              square
              elevation={0}
              sx={{
                flex: 1,
                overflow: 'auto',
                p: 2,
                cursor: 'pointer',
                position: 'relative',
                '&:hover::after': {
                  content: '"クリックしてJSONを保存"',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  bgcolor: 'rgba(0,0,0,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'primary.main',
                  fontWeight: 'bold',
                  backdropFilter: 'blur(1px)'
                }
              }}
              onClick={() => sourceImages.length > 0 && setOpenJsonDialog(true)}
            >
              {sourceImages.length > 0 ? (
                <pre style={{ margin: 0, fontSize: '0.75rem', fontFamily: 'monospace' }}>
                  {JSON.stringify(jsonContent, null, 2)}
                </pre>
              ) : (
                <Typography variant="caption" color="text.secondary">画像を追加するとここにJSONが表示されます</Typography>
              )}
            </Paper>
          </Box>

          {/* Bottom Right: Image Preview */}
          <Box sx={{ flex: 1, p: 2, overflow: 'hidden', bgcolor: 'background.default' }}>
            <Dropzone onImagesLoaded={handleImagesLoaded}>
              {sourceImages.length > 0 ? (
                <AtlasPreview
                  packedData={packedData}
                  width={effectiveSize.width}
                  height={effectiveSize.height}
                  circular={settings.circular}
                  border={settings.border}
                  borderWidth={settings.borderWidth}
                  borderColor={settings.borderColor}
                />
              ) : null}
            </Dropzone>
          </Box>
        </Box>
      </Box>

      {/* Snackbar for duplicates */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="info" sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* JSON Save Dialog */}
      <Dialog open={openJsonDialog} onClose={() => setOpenJsonDialog(false)}>
        <DialogTitle>JSONを保存</DialogTitle>
        <DialogContent>
          <Typography>アトラスの定義データ(JSON)をダウンロードしますか？</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenJsonDialog(false)}>キャンセル</Button>
          <Button onClick={handleDownloadJson} variant="contained" autoFocus>保存</Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}

export default App;
