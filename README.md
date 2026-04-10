# QuickNotes

Una aplicación web progresiva (PWA) para tomar notas rápidas con soporte para Markdown, imágenes, y gestión de tareas.

## Características

- 📝 **Notas con Markdown**: Escribe notas con formato usando Markdown completo
- 📷 **Soporte de Imágenes**: Pega imágenes directamente en tus notas
- 📁 **Carpetas**: Organiza tus notas en carpetas y subcarpetas
- ✅ **Lista de Tareas**: Crea y gestiona tareas con etiquetas y filtros
- 🏷️ **Etiquetas Personalizables**: Crea etiquetas con colores personalizados
- 🌙 **Modo Oscuro**: Interfaz oscura para trabajar cómodamente en cualquier momento
- 📱 **PWA Instalable**: Instala como aplicación nativa en tu dispositivo
- 💾 **Sincronización Local**: Todo se guarda automáticamente en LocalStorage
- 📤 **Exportar/Importar**: Descarga y restaura tus datos en cualquier momento

## Tecnología

- **React 18** - Interfaz de usuario moderna
- **TypeScript** - Tipado seguro
- **Vite** - Build tool ultrarrápido
- **Tailwind CSS** - Estilos utility-first
- **Zustand** - Gestión de estado ligera
- **React Markdown** - Renderizado de Markdown

## Instalación

### Desarrollo

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build

# Vista previa de la compilación
npm run preview
```

### Como PWA

1. Abre la aplicación en tu navegador
2. Haz clic en el icono de instalación (generalmente en la barra de direcciones)
3. Sigue las instrucciones de tu navegador

## Uso

### Notas

1. Haz clic en "Nueva Nota" para crear una nota
2. Escribe el título y contenido en Markdown
3. Usa el editor visual o vista previa para ver el resultado
4. Añade imágenes haciendo clic en "Añadir imagen"
5. Asigna etiquetas a tu nota
6. Guarda cuando termines

### Tareas

1. Haz clic en "Nueva Tarea" en la vista de tareas
2. Escribe el título y descripción de la tarea
3. Añade etiquetas si lo necesitas
4. Marca como completada cuando termines
5. Filtra por "Solo pendientes" para ver solo las tareas activas

### Etiquetas

1. Ve a Configuración → Etiquetas
2. Haz clic en "Nueva Etiqueta"
3. Personaliza el nombre, color y descripción
4. Usa las etiquetas en notas y tareas para organizarlas mejor

### Copias de Seguridad

1. Ve a Configuración → Base de Datos
2. Usa "Exportar Base de Datos" para descargar un backup
3. Usa "Importar Base de Datos" para restaurar desde un backup
4. En caso de error, usa "Reiniciar Base de Datos" (¡cuidado!)

## Estructura del Proyecto

```
src/
  ├── components/       # Componentes React
  ├── stores/          # Zustand stores para estado global
  ├── types/           # Definiciones de TypeScript
  ├── utils/           # Funciones auxiliares
  ├── hooks/           # Custom hooks
  ├── App.tsx          # Componente principal
  ├── main.tsx         # Punto de entrada
  └── index.css        # Estilos con Tailwind

public/
  ├── manifest.json    # Configuración PWA
  ├── sw.js            # Service Worker
  └── icons/           # Iconos PWA
```

## Almacenamiento

- **Notas**: `quicknotes_notes`
- **Tareas**: `quicknotes_todos`
- **Carpetas**: `quicknotes_folders`
- **Etiquetas**: `quicknotes_tags`
- **Configuración**: `quicknotes_settings`

## Configuración

### Temas

- **Claro**: Fondo blanco, texto oscuro
- **Oscuro**: Fondo oscuro, texto claro
- **Sistema**: Sigue la preferencia del sistema operativo

### Idiomas

- Español (predeterminado)
- Inglés (experimental)

## Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la licencia MIT. Ver el archivo `LICENSE` para más detalles.

## Changelog

### v0.1.0
- Versión inicial del proyecto
- Funcionalidad completa de notas
- Sistema de tareas
- Gestión de etiquetas
- Exportar/importar datos
- Soporte PWA
- Modo oscuro

## Soporte

Para reportar bugs o sugerir mejoras, abre un issue en GitHub.

---

Hecho con ❤️ por DivorcedLance
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
