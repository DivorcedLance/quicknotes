# Guía Rápida - QuickNotes

## 🚀 Comenzar

### Instalar como PWA
1. Abre `http://localhost:5173` en tu navegador
2. Haz clic en el icono de instalación (en la barra de direcciones)
3. ¡Listo! Ahora puedes usar QuickNotes sin internet

### O Ejecutar en Desarrollo
```bash
npm install
npm run dev
```

---

## 📝 Notas

### Crear/Editar Nota
- Haz clic en **"Nueva Nota"** en la barra lateral
- Escribe el título (opcional pero recomendado)
- Usa **Markdown** para el contenido:
  - `# Título`, `## Subtítulo`
  - `**negrita**`, `*cursiva*`
  - `- Item 1` para listas
  - `` `código` `` para código inline
  - `[link](url)`

### Añadir Imágenes
- En el editor, usa el botón **"Añadir imagen"**
- O copia/pega imágenes directamente
- Se guardan en base64 en LocalStorage

### Organizar con Carpetas
- Crea carpetas en la barra lateral
- Mueve notas entre carpetas seleccionándolas en el editor
- Puedes crear subcarpetas

---

## ✅ Tareas

### Crear Tarea
- Haz clic en **"Nueva Tarea"**
- Escribe título (obligatorio) y descripción (opcional)
- Añade etiquetas para filtrar

### Filtrar Tareas
- Usa **"Solo pendientes"** para ver solo tareas incompletas
- Filtra por etiquetas
- Agrupa por día automáticamente

### Ordenar
- Por fecha de creación
- Por fecha de modificación
- Por nombre alfabético

---

## 🏷️ Etiquetas

### Gestionar Etiquetas
1. Ve a **Configuración → Etiquetas**
2. Haz clic en **"Nueva Etiqueta"**
3. Personaliza:
   - Nombre (ej: "Urgente", "Compras")
   - Color (elige de presets o color custom)
   - Descripción

### Usar Etiquetas
- Al crear/editar nota o tarea
- Aparecen como badges de colores
- Filtra por etiquetas en el header

---

## 🌙 Tema

- **Claro**: Interfaz clara (predeterminado)
- **Oscuro**: Modo nocturno
- **Sistema**: Sigue la preferencia del OS

Botón en el header (☀️ / 🌙)

---

## 💾 Copias de Seguridad

### Exportar (Descargar)
1. Configuración → Base de Datos
2. "Exportar Base de Datos"
3. Se descargará un archivo JSON

### Importar (Restaurar)
1. Configuración → Base de Datos
2. "Importar Base de Datos"
3. Selecciona tu archivo JSON

⚠️ **Nota**: Importar sobrescribe tus datos actuales

---

## 🔍 Buscar

- **Header**: Barra de búsqueda visible en Notas y Tareas
- Busca en:
  - Título de notas
  - Contenido de notas
  - Título de tareas
  - Descripción de tareas

---

## 📱 Características PWA

### Obras sin Internet
- Todas las notas y tareas se guardan localmente
- El Service Worker cachea la aplicación
- Acceso total offline después de la instalación

### Ícono en Pantalla de Inicio
- iOS/Android/Windows: Instala como app nativa
- Acceso rápido sin abrir navegador

---

## 🎨 Atajos Útiles

| Acción | Cómo |
|--------|------|
| Crear nota | Sidebar: "Nueva Nota" |
| Crear tarea | "Nueva Tarea" en Tareas |
| Editar | Click en nota/tarea + "Editar" |
| Eliminar | Click en 🗑️ rojo |
| Guardar | Botón "Guardar" en editor |
| Buscar | Barra en el header |
| Cambiar tema | ☀️/🌙 en header |

---

## ⚙️ Configuración

### General
- **Tema**: Light, Dark, System
- **Idioma**: Español (ES), English (EN)
- **Tamaño de fuente**: 12px - 24px

### Base de Datos
- Exportar en JSON
- Importar desde JSON
- Limpiar todo (¡cuidado!)

---

## 🐛 Troubleshooting

### ¿Se borraron mis notas?
1. Abre DevTools (F12)
2. Console → Verififica LocalStorage
3. Si tienes backup: Configuración → Importar

### ¿No funciona el Service Worker?
1. En DevTools → Application → Service Workers
2. Verifica que esté registrado
3. Recarga la página

### ¿Las imágenes no se guardan?
1. Verifica el tamaño (LocalStorage límite ~5MB)
2. Intenta imágenes más pequeñas
3. Comprime las imágenes antes

---

## 📊 Límites de Almacenamiento

- **LocalStorage**: ~5MB por navegador
- **Máximo teórico**: ~1000 notas o ~2000 tareas (sin imágenes grandes)
- **Recom**: Exporta backup regularmente

---

## 💡 Tips

1. **Usa Markdown**: Los títulos en `# Markdown` se renderizan correctamente
2. **Etiquetas organizadas**: Crea etiquetas por categoría (Proyecto, Prioridad, etc)
3. **Backups periódicos**: Descarga JSON mensualmente
4. **Búsqueda rápida**: Los filtros de etiquetas se aplican al instante
5. **Modo oscuro**: Mejor para los ojos por la noche

---

## 🔐 Privacidad

- **Todo local**: Nada de datos se envía a servidores
- **Sin tracking**: Sin analítica, sin cookies de terceros
- **Datos tuyo**: Solo tú tienes acceso a tus notas

---

¡Disfruta creando notas rápidas! 🚀
