import React from 'react';
import { FiSearch, FiMenu, FiSidebar } from 'react-icons/fi';
import { useAppStore } from '../stores/appStore';
import { useSettingsStore } from '../stores/settingsStore';

const Header: React.FC = () => {
  const {
    currentTab,
    setSearchQuery,
    searchQuery,
    showMainSidebar,
    setShowMainSidebar,
    showInspectorPanel,
    setShowInspectorPanel,
  } = useAppStore();
  const { toggleTheme, getTheme } = useSettingsStore();

  const getTitle = () => {
    switch (currentTab) {
      case 'notes':
        return 'Notas';
      case 'todos':
        return 'Mi Lista de Tareas';
      case 'settings':
        return 'Configuración';
      default:
        return 'QuickNotes';
    }
  };

  return (
    <header className="bg-light-secondary dark:bg-dark-secondary border-b border-gray-200 dark:border-dark-tertiary p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={() => setShowMainSidebar(!showMainSidebar)}
            className="p-2 hover:bg-gray-200 dark:hover:bg-dark-tertiary rounded-lg hidden sm:inline-flex"
            title={showMainSidebar ? 'Ocultar panel lateral' : 'Mostrar panel lateral'}
          >
            <FiMenu size={20} />
          </button>
          {/* Mobile menu opened via swipe gesture - no button */}
          <h1 className="text-xl sm:text-2xl font-bold truncate">{getTitle()}</h1>
        </div>

        {currentTab !== 'settings' && currentTab !== 'todos' && (
          <div className="hidden md:flex items-center gap-2 flex-1 max-w-md mx-4">
            <FiSearch className="text-gray-500" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field"
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          {(currentTab === 'notes' || currentTab === 'todos') && (
            <button
              onClick={() => setShowInspectorPanel(!showInspectorPanel)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50 dark:border-dark-tertiary dark:hover:bg-dark-tertiary"
              title={showInspectorPanel ? 'Ocultar panel de edición' : 'Mostrar panel de edición'}
            >
              <FiSidebar className="inline-block" /> <span className="ml-2 hidden sm:inline">Panel</span>
            </button>
          )}
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-gray-200 dark:hover:bg-dark-tertiary rounded-lg transition-colors"
            title="Cambiar tema"
          >
            {getTheme() === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      {/* Mobile search */}
      {currentTab !== 'settings' && currentTab !== 'todos' && (
        <div className="md:hidden mt-3 flex items-center gap-2">
          <FiSearch className="text-gray-500" />
          <input
            type="text"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field"
          />
        </div>
      )}
    </header>
  );
};

export default Header;
