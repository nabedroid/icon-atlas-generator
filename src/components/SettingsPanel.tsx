import React from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';

interface SettingsPanelProps {
  width: number;
  height: number;
  autoSize: boolean;
  trimming: boolean;
  padding: number;
  circular: boolean;
  border: boolean;
  borderWidth: number;
  borderColor: string;
  onSettingChange: (name: string, value: any) => void;
  onReset: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  width,
  height,
  autoSize,
  trimming,
  padding,
  circular,
  border,
  borderWidth,
  borderColor,
  onSettingChange,
  onReset
}) => {
  return (
    <Box sx={{ p: 2, overflowY: 'auto' }}>
      <Stack
        direction="row"
        spacing={3}
        alignItems="center"
        flexWrap="wrap"
        useFlexGap
      >

        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={autoSize}
              onChange={(e) => onSettingChange('autoSize', e.target.checked)}
            />
          }
          label={<Typography variant="body2" noWrap>自動サイズ</Typography>}
          sx={{ m: 0 }}
        />

        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={trimming}
              onChange={(e) => onSettingChange('trimming', e.target.checked)}
            />
          }
          label={<Typography variant="body2" noWrap>トリミング</Typography>}
          sx={{ m: 0 }}
        />

        {!autoSize && (
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              label="幅"
              type="number"
              value={width}
              onChange={(e) => onSettingChange('width', parseInt(e.target.value))}
              size="small"
              sx={{ width: 120 }}
            />
            <Typography variant="body2">x</Typography>
            <TextField
              label="高さ"
              type="number"
              value={height}
              onChange={(e) => onSettingChange('height', parseInt(e.target.value))}
              size="small"
              sx={{ width: 120 }}
            />
          </Stack>
        )}

        <TextField
          label="パディング"
          type="number"
          value={padding}
          onChange={(e) => onSettingChange('padding', parseInt(e.target.value) || 0)}
          size="small"
          InputProps={{ inputProps: { min: 0 } }}
          sx={{ width: 120 }}
        />

        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={circular}
              onChange={(e) => onSettingChange('circular', e.target.checked)}
            />
          }
          label={<Typography variant="body2" noWrap>円形</Typography>}
          sx={{ m: 0 }}
        />

        <Stack direction="row" spacing={1} alignItems="center">
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={border}
                onChange={(e) => onSettingChange('border', e.target.checked)}
              />
            }
            label={<Typography variant="body2" noWrap>枠線</Typography>}
            sx={{ m: 0 }}
          />

          {border && (
            <>
              <TextField
                label="太さ"
                type="number"
                value={borderWidth}
                onChange={(e) => onSettingChange('borderWidth', parseInt(e.target.value))}
                size="small"
                InputProps={{ inputProps: { min: 1 } }}
                sx={{ width: 60 }}
              />
              <input
                type="color"
                value={borderColor}
                onChange={(e) => onSettingChange('borderColor', e.target.value)}
                style={{ width: 30, height: 30, padding: 0, border: 'none', cursor: 'pointer', backgroundColor: 'transparent' }}
                title="枠線の色"
              />
            </>
          )}
        </Stack>

        <Button
          variant="contained"
          color="error"
          size="small"
          onClick={onReset}
          sx={{ ml: 'auto' }}
        >
          リセット
        </Button>
      </Stack>
    </Box>
  );
};
