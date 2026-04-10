import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  FiAlignCenter,
  FiAlignJustify,
  FiAlignLeft,
  FiAlignRight,
  FiBold,
  FiItalic,
  FiImage,
  FiRefreshCw,
  FiTrash2,
  FiX,
} from 'react-icons/fi';
import {
  clipboardImageFilesFromEvent,
  generateId,
  readFileAsBase64,
} from '../utils/helpers';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export interface RichTextEditorHandle {
  search: (query: string) => boolean;
}

const allowedImageWidth = {
  min: 120,
  max: 900,
  default: 320,
};

const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(({ 
  value,
  onChange,
  placeholder = 'Empieza a escribir...',
  className = '',
}, ref) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  const [selectedImageWidth, setSelectedImageWidth] = useState(allowedImageWidth.default);
  const [selectedImageRotation, setSelectedImageRotation] = useState(0);
  const lastSearchStateRef = useRef<{ query: string; index: number }>({ query: '', index: 0 });

  useEffect(() => {
    if (!editorRef.current) {
      return;
    }

    if (editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  useEffect(() => {
    const onSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        return;
      }

      const range = selection.getRangeAt(0);
      if (editorRef.current && editorRef.current.contains(range.commonAncestorContainer)) {
        savedRangeRef.current = range.cloneRange();
      }
    };

    document.addEventListener('selectionchange', onSelectionChange);
    return () => document.removeEventListener('selectionchange', onSelectionChange);
  }, []);

  const commitChange = () => {
    onChange(editorRef.current?.innerHTML ?? '');
  };

  const selectTextRange = (range: Range) => {
    const selection = window.getSelection();
    if (!selection) {
      return;
    }

    selection.removeAllRanges();
    selection.addRange(range);
    savedRangeRef.current = range.cloneRange();
  };

  const getTextNodes = () => {
    const textNodes: Array<{ node: Text; start: number; end: number }> = [];
    if (!editorRef.current) {
      return textNodes;
    }

    const walker = document.createTreeWalker(editorRef.current, NodeFilter.SHOW_TEXT);
    let currentNode = walker.nextNode() as Text | null;
    let index = 0;

    while (currentNode) {
      const text = currentNode.textContent || '';
      if (text.length > 0) {
        textNodes.push({ node: currentNode, start: index, end: index + text.length });
        index += text.length;
      }
      currentNode = walker.nextNode() as Text | null;
    }

    return textNodes;
  };

  const locateMatchRange = (query: string, fromIndex = 0) => {
    if (!editorRef.current) {
      return null;
    }

    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return null;
    }

    const textContent = getTextNodes()
      .map((item) => item.node.textContent || '')
      .join('');
    const normalizedText = textContent.toLowerCase();
    const matchIndex = normalizedText.indexOf(normalizedQuery, fromIndex);

    if (matchIndex < 0) {
      return null;
    }

    const textNodes = getTextNodes();
    const startNodeInfo = textNodes.find((item) => matchIndex >= item.start && matchIndex < item.end);
    const endIndex = matchIndex + normalizedQuery.length;
    const endNodeInfo = textNodes.find((item) => endIndex > item.start && endIndex <= item.end);

    if (!startNodeInfo || !endNodeInfo) {
      return null;
    }

    const range = document.createRange();
    range.setStart(startNodeInfo.node, matchIndex - startNodeInfo.start);
    range.setEnd(endNodeInfo.node, endIndex - endNodeInfo.start);
    return { range, matchIndex };
  };

  const restoreSelection = () => {
    const selection = window.getSelection();
    if (!selection) {
      return;
    }

    selection.removeAllRanges();
    if (savedRangeRef.current) {
      selection.addRange(savedRangeRef.current);
    }
  };

  const focusEditor = () => {
    editorRef.current?.focus();
  };

  const insertHtmlAtCursor = (html: string) => {
    focusEditor();
    restoreSelection();

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);
    range.deleteContents();

    const fragment = range.createContextualFragment(html);
    const lastNode = fragment.lastChild;
    range.insertNode(fragment);

    if (lastNode) {
      const newRange = document.createRange();
      newRange.setStartAfter(lastNode);
      newRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newRange);
      savedRangeRef.current = newRange.cloneRange();
    }

    commitChange();
  };

  const applyCommand = (command: string, value?: string) => {
    focusEditor();
    restoreSelection();
    document.execCommand(command, false, value);
    commitChange();
  };

  const insertImageElement = (src: string, alt: string) => {
    const safeAlt = alt.replaceAll('"', '&quot;');
    insertHtmlAtCursor(
      `<img src="${src}" alt="${safeAlt}" data-qn-image-id="${generateId()}" style="width:${allowedImageWidth.default}px; max-width:100%; height:auto; display:block; margin:1rem 0; border-radius:0.75rem;" />`
    );
  };

  const handlePaste = async (event: React.ClipboardEvent<HTMLDivElement>) => {
    const imageFiles = clipboardImageFilesFromEvent(event.clipboardData);

    if (imageFiles.length === 0) {
      return;
    }

    event.preventDefault();

    const imageTags = await Promise.all(
      imageFiles.map(async (file) => {
        const base64 = await readFileAsBase64(file);
        const safeAlt = file.name.replaceAll('"', '&quot;');
        return `<img src="${base64}" alt="${safeAlt}" data-qn-image-id="${generateId()}" style="width:${allowedImageWidth.default}px; max-width:100%; height:auto; display:block; margin:1rem 0; border-radius:0.75rem;" />`;
      })
    );

    insertHtmlAtCursor(imageTags.join('<br />'));
  };

  const handleEditorInput = () => {
    commitChange();
  };

  const handleEditorClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.tagName === 'IMG') {
      const imageElement = target as HTMLImageElement;
      setSelectedImage(imageElement);
      setSelectedImageWidth(
        Number.parseInt(imageElement.style.width || '', 10) || allowedImageWidth.default
      );
      setSelectedImageRotation(Number.parseInt(imageElement.dataset.qnRotation || '0', 10) || 0);
      return;
    }

    setSelectedImage(null);
  };

  const updateSelectedImageWidth = (width: number) => {
    if (!selectedImage) {
      return;
    }

    const nextWidth = Math.max(allowedImageWidth.min, Math.min(allowedImageWidth.max, width));
    selectedImage.style.width = `${nextWidth}px`;
    selectedImage.style.maxWidth = '100%';
    setSelectedImageWidth(nextWidth);
    commitChange();
  };

  const deleteSelectedImage = () => {
    if (!selectedImage) {
      return;
    }

    selectedImage.remove();
    setSelectedImage(null);
    setSelectedImageWidth(allowedImageWidth.default);
    setSelectedImageRotation(0);
    commitChange();
  };

  const rotateSelectedImage = () => {
    if (!selectedImage) {
      return;
    }

    const nextRotation = (selectedImageRotation + 90) % 360;
    selectedImage.dataset.qnRotation = String(nextRotation);
    selectedImage.style.transform = `rotate(${nextRotation}deg)`;
    selectedImage.style.transformOrigin = 'center center';
    setSelectedImageRotation(nextRotation);
    commitChange();
  };

  const toggleFileDialog = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const base64 = await readFileAsBase64(file);
    insertImageElement(base64, file.name);
    event.target.value = '';
  };

  const ToolbarButton = ({
    icon,
    label,
    onClick,
    active = false,
  }: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    active?: boolean;
  }) => (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border transition-colors ${
        active
          ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-200'
          : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-dark-tertiary dark:bg-dark-secondary dark:hover:bg-dark-tertiary'
      }`}
    >
      {icon}
    </button>
  );

  const search = (query: string) => {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      lastSearchStateRef.current = { query: '', index: 0 };
      return false;
    }

    const previousQuery = lastSearchStateRef.current.query;
    const startingIndex = previousQuery === normalizedQuery ? lastSearchStateRef.current.index + normalizedQuery.length : 0;
    const firstMatch = locateMatchRange(normalizedQuery, startingIndex) ?? locateMatchRange(normalizedQuery, 0);

    if (!firstMatch) {
      lastSearchStateRef.current = { query: normalizedQuery, index: 0 };
      return false;
    }

    selectTextRange(firstMatch.range);
    firstMatch.range.startContainer.parentElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    lastSearchStateRef.current = { query: normalizedQuery, index: firstMatch.matchIndex };
    return true;
  };

  useImperativeHandle(ref, () => ({
    search,
  }));

  return (
    <div className={`rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-dark-tertiary dark:bg-dark-secondary ${className}`}>
      <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 px-2 py-1.5 dark:border-dark-tertiary">
        <ToolbarButton icon={<FiBold size={15} />} label="Negrita" onClick={() => applyCommand('bold')} />
        <ToolbarButton icon={<FiItalic size={15} />} label="Cursiva" onClick={() => applyCommand('italic')} />
        <ToolbarButton icon={<FiAlignLeft size={15} />} label="Alinear a la izquierda" onClick={() => applyCommand('justifyLeft')} />
        <ToolbarButton icon={<FiAlignCenter size={15} />} label="Centrar" onClick={() => applyCommand('justifyCenter')} />
        <ToolbarButton icon={<FiAlignRight size={15} />} label="Alinear a la derecha" onClick={() => applyCommand('justifyRight')} />
        <ToolbarButton icon={<FiAlignJustify size={15} />} label="Justificar" onClick={() => applyCommand('justifyFull')} />
        <ToolbarButton icon={<FiImage size={15} />} label="Imagen" onClick={toggleFileDialog} />
        <ToolbarButton icon={<FiX size={15} />} label="Limpiar formato" onClick={() => applyCommand('removeFormat')} />
      </div>

      {selectedImage && (
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-dark-tertiary dark:bg-dark-tertiary/60">
          <span className="font-medium text-gray-600 dark:text-gray-300">Imagen</span>
          <label className="flex items-center gap-2">
            <span>Ancho</span>
            <input
              type="range"
              min={allowedImageWidth.min}
              max={allowedImageWidth.max}
              value={selectedImageWidth}
              onChange={(event) => updateSelectedImageWidth(Number(event.target.value))}
              className="w-40"
            />
          </label>
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => updateSelectedImageWidth(allowedImageWidth.default)}
            className="rounded-lg border border-gray-200 px-3 py-1 hover:bg-white dark:border-dark-tertiary dark:hover:bg-dark-secondary"
          >
            Tamaño normal
          </button>
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={rotateSelectedImage}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1 hover:bg-white dark:border-dark-tertiary dark:hover:bg-dark-secondary"
            title="Rotar imagen"
          >
            <FiRefreshCw size={14} /> Rotar
          </button>
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={deleteSelectedImage}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-1 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950"
            title="Eliminar imagen"
          >
            <FiTrash2 size={14} /> Quitar
          </button>
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => setSelectedImage(null)}
            className="rounded-lg border border-gray-200 px-3 py-1 hover:bg-white dark:border-dark-tertiary dark:hover:bg-dark-secondary"
          >
            Cerrar
          </button>
        </div>
      )}

      <div className="relative">
        {!value && (
          <div className="pointer-events-none absolute left-4 top-4 text-gray-400">
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleEditorInput}
          onPaste={handlePaste}
          onMouseUp={() => {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
              savedRangeRef.current = selection.getRangeAt(0).cloneRange();
            }
          }}
          onKeyUp={() => {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
              savedRangeRef.current = selection.getRangeAt(0).cloneRange();
            }
          }}
          onClick={handleEditorClick}
          className="min-h-[420px] rounded-b-2xl px-4 py-4 text-base leading-7 outline-none dark:text-gray-100"
          style={{ whiteSpace: 'pre-wrap' }}
        />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />
    </div>
  );
});

export default RichTextEditor;
