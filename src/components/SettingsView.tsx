import React, { useState } from 'react';
import {
  FiDownload,
  FiUpload,
  FiRefreshCw,
} from 'react-icons/fi';
import { useSettingsStore } from '../stores/settingsStore';
import { useDatabaseStore } from '../stores/databaseStore';
import { downloadJson, readFileAsText } from '../utils/helpers';

const SettingsView: React.FC = () => {
  const { settings, updateSettings } = useSettingsStore();
  const { exportDatabase, importDatabase, resetDatabase } = useDatabaseStore();
  const [activeTab, setActiveTab] = useState<'general' | 'database'>('general');
  const [showReset, setShowReset] = useState(false);

  const handleExport = () => {
    const data = exportDatabase();
    downloadJson(data, `quicknotes-backup-${new Date().toISOString().split('T')[0]}.json`);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const content = await readFileAsText(file);
        const success = importDatabase(content);
        if (success) {
          alert('Base de datos importada correctamente');
        } else {
          alert('Error al importar la base de datos');
        }
      } catch (error) {
        console.error('Error importing:', error);
        alert('Error al leer el archivo');
      }
    }
  };

  const handleReset = () => {
    resetDatabase();
    setShowReset(false);
    alert('Base de datos reiniciada');
  };

  return (
    <div className="p-6">
      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-dark-tertiary">
        {(['general', 'database'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            {tab === 'general' && 'General'}
            {tab === 'database' && 'Base de Datos'}
          </button>
        ))}
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <div className="max-w-2xl space-y-6">
          <div>
            <label className="block">
              <span className="block text-sm font-medium mb-2">Tema</span>
              <select
                value={settings.theme}
                onChange={(e) =>
                  updateSettings({
                    theme: e.target.value as 'light' | 'dark' | 'system',
                  })
                }
                className="input-field"
              >
                <option value="light">Claro</option>
                <option value="dark">Oscuro</option>
              </select>
            </label>
          </div>

          <div>
            <label className="block">
              <span className="block text-sm font-medium mb-2">
                Tamaño de fuente
              </span>
              <input
                type="range"
                min="12"
                max="24"
                value={settings.fontSize}
                onChange={(e) =>
                  updateSettings({ fontSize: parseInt(e.target.value) })
                }
                className="w-full"
              />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {settings.fontSize}px
              </span>
            </label>
          </div>

          <div className="card bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-800">
            <p className="text-sm">
              📱 QuickNotes es una PWA y puede ser instalada en tu dispositivo
              para usarla sin conexión a internet.
            </p>
          </div>
        </div>
      )}

      {/* Database Management */}
      {activeTab === 'database' && (
        <div className="max-w-2xl space-y-6">
          <div className="card bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-800">
            <p className="text-sm font-medium mb-2">💾 Crear Copia de Seguridad</p>
            <p className="text-sm mb-4">
              Descarga un archivo JSON con todas tus notas, tareas y configuración.
              Puedes importarlo después en otro dispositivo.
            </p>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <FiDownload /> Exportar Base de Datos
            </button>
          </div>

          <div className="card bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-800">
            <p className="text-sm font-medium mb-2">📥 Restaurar Copia de Seguridad</p>
            <p className="text-sm mb-4">
              Importa un archivo de copia de seguridad. Tus datos actuales serán
              reemplazados.
            </p>
            <label className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors cursor-pointer w-fit">
              <FiUpload /> Importar Base de Datos
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
          </div>

          <div className="card bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800">
            <p className="text-sm font-medium mb-2">⚠️ Zona de Peligro</p>
            <p className="text-sm mb-4">
              Esta acción eliminará todas tus notas, tareas y etiquetas. No se puede
              deshacer.
            </p>

            {showReset ? (
              <div className="space-y-3">
                <p className="text-sm font-medium">¿Estás seguro?</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <FiRefreshCw /> Eliminar Todo
                  </button>
                  <button
                    onClick={() => setShowReset(false)}
                    className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowReset(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <FiRefreshCw /> Reiniciar Base de Datos
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView;
