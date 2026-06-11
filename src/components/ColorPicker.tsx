import React, { useState } from 'react';

const DEFAULT_COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16',
  '#6366f1', '#d946ef', '#0ea5e9', '#eab308', '#a855f7',
  '#10b981', '#f43f5e', '#64748b', '#78716c', '#2dd4bf',
];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange }) => {
  const [showCustom, setShowCustom] = useState(false);
  const [customColor, setCustomColor] = useState('#3b82f6');

  const handleCustomAdd = () => {
    onChange(customColor);
    setShowCustom(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {DEFAULT_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${
              value === color ? 'border-gray-900 dark:border-white scale-110 ring-2 ring-blue-500' : 'border-transparent'
            }`}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
        <button
          type="button"
          onClick={() => setShowCustom(!showCustom)}
          className="h-7 w-7 rounded-full border-2 border-dashed border-gray-400 flex items-center justify-center text-xs text-gray-500 hover:border-gray-600 dark:hover:border-gray-300"
          title="Color personalizado"
        >
          +
        </button>
      </div>
      {showCustom && (
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={customColor}
            onChange={(e) => setCustomColor(e.target.value)}
            className="h-8 w-10 cursor-pointer rounded border border-gray-300 dark:border-dark-tertiary"
          />
          <span className="text-xs font-mono text-gray-500">{customColor}</span>
          <button
            type="button"
            onClick={handleCustomAdd}
            className="rounded bg-blue-500 px-2 py-0.5 text-xs text-white hover:bg-blue-600"
          >
            Usar
          </button>
        </div>
      )}
      <div className="flex items-center gap-2">
        <span className="text-sm">Color seleccionado:</span>
        <span className="inline-block h-5 w-5 rounded-full border" style={{ backgroundColor: value }} />
        <span className="text-xs font-mono text-gray-500">{value}</span>
      </div>
    </div>
  );
};

export default ColorPicker;
