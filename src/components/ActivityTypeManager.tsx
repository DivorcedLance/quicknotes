import React, { useState } from 'react';
import { FiPlus, FiX, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { useActivitiesStore } from '../stores/activitiesStore';

const ActivityTypeManager: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { types, addType, updateType, deleteType } = useActivitiesStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6');

  const reset = () => { setName(''); setColor('#3b82f6'); setEditingId(null); };

  const handleSave = () => {
    if (!name.trim()) return;
    if (editingId) {
      updateType(editingId, { name: name.trim(), color });
    } else {
      addType({ name: name.trim(), color });
    }
    reset();
  };

  const handleEdit = (id: string) => {
    const t = types.find((x) => x.id === id);
    if (!t) return;
    setEditingId(id); setName(t.name); setColor(t.color);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl dark:bg-dark-secondary" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Gestor de Tipos</h2>
          <button onClick={onClose} className="rounded p-1 hover:bg-gray-200 dark:hover:bg-dark-tertiary"><FiX /></button>
        </div>

        <div className="mb-4 flex gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del tipo"
            className="input-field flex-1 text-sm" />
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 w-9 cursor-pointer rounded border" />
          <button onClick={handleSave} className="flex items-center gap-1 rounded-lg bg-blue-500 px-3 py-2 text-sm text-white hover:bg-blue-600">
            {editingId ? <FiEdit2 size={14} /> : <FiPlus size={14} />} {editingId ? 'Actualizar' : 'Añadir'}
          </button>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {types.map((t) => (
            <div key={t.id} className="flex items-center gap-3 rounded-lg border p-3 dark:border-dark-tertiary">
              <span className="h-5 w-5 rounded-full" style={{ backgroundColor: t.color }} />
              <span className="flex-1 text-sm font-medium">{t.name}</span>
              <button onClick={() => handleEdit(t.id)} className="rounded p-1 text-gray-500 hover:bg-gray-200 dark:hover:bg-dark-tertiary"><FiEdit2 size={14} /></button>
              <button onClick={() => deleteType(t.id)} className="rounded p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30"><FiTrash2 size={14} /></button>
            </div>
          ))}
          {types.length === 0 && <p className="text-center text-sm text-gray-500">Sin tipos</p>}
        </div>
      </div>
    </div>
  );
};

export default ActivityTypeManager;
