import React, { useState } from 'react';
import { FiArrowLeft, FiCheck } from 'react-icons/fi';
import { useTagsStore } from '../stores/tagsStore';
import Tag from './Tag';

interface TagManagerProps {
  tagId: string;
  onClose: () => void;
}

const TagManager: React.FC<TagManagerProps> = ({ tagId, onClose }) => {
  const { tags, updateTag } = useTagsStore();
  const tag = tags.find((t) => t.id === tagId);

  const [name, setName] = useState(tag?.name ?? '');
  const [color, setColor] = useState(tag?.color ?? '#4ECDC4');
  const [description, setDescription] = useState(tag?.description ?? '');

  if (!tag) return null;

  const presetColors = [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#FFA07A',
    '#98D8C8',
    '#F7DC6F',
    '#BB8FCE',
    '#85C1E2',
    '#F8B88B',
    '#B2EBF2',
    '#DDA0DD',
    '#F0E68C',
    '#90EE90',
    '#87CEEB',
    '#FFB6C1',
  ];

  const handleSave = () => {
    updateTag(tagId, {
      name,
      color,
      description,
    });
    onClose();
  };

  return (
    <div className="max-w-2xl">
      <button
        onClick={onClose}
        className="flex items-center gap-2 px-3 py-2 mb-6 hover:bg-gray-300 dark:hover:bg-dark-tertiary rounded-lg transition-colors"
      >
        <FiArrowLeft /> Volver
      </button>

      <div className="space-y-6">
        <div>
          <label className="block">
            <span className="block text-sm font-medium mb-2">Nombre*</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              autoFocus
            />
          </label>
        </div>

        <div>
          <label className="block">
            <span className="block text-sm font-medium mb-2">Descripción</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe para qué se usa esta etiqueta"
              className="w-full p-3 border border-gray-300 dark:border-dark-tertiary bg-light-primary dark:bg-dark-tertiary rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 h-20"
            />
          </label>
        </div>

        <div>
          <label className="block">
            <span className="block text-sm font-medium mb-3">Color</span>
            <div className="flex gap-2 flex-wrap mb-4">
              {presetColors.map((presetColor) => (
                <button
                  key={presetColor}
                  onClick={() => setColor(presetColor)}
                  className={`w-10 h-10 rounded-lg transition-transform ${
                    color === presetColor ? 'scale-110 ring-2 ring-offset-2' : ''
                  }`}
                  style={{
                    backgroundColor: presetColor,
                  }}
                />
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-12 h-12 rounded cursor-pointer border-2 border-gray-300 dark:border-dark-tertiary"
              />
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="input-field flex-1"
                placeholder="#FF6B6B"
              />
            </div>
          </label>
        </div>

        <div>
          <p className="text-sm font-medium mb-3">Vista Previa</p>
          <div className="p-4 bg-gray-100 dark:bg-dark-tertiary rounded-lg">
            <Tag tag={{ id: tagId, name, color, description }} />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            disabled={!name.trim()}
          >
            <FiCheck /> Guardar Cambios
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 dark:bg-dark-tertiary text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-400 dark:hover:bg-dark-secondary transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default TagManager;
