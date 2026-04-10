import React from 'react';
import type { Tag as TagType } from '../types';

interface TagProps {
  tag: TagType;
  removable?: boolean;
  onRemove?: () => void;
}

const Tag: React.FC<TagProps> = ({ tag, removable = false, onRemove }) => {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white"
      style={{ backgroundColor: tag.color }}
    >
      {tag.name}
      {removable && (
        <button
          onClick={onRemove}
          className="ml-1 hover:opacity-75 transition-opacity"
        >
          ×
        </button>
      )}
    </span>
  );
};

export default Tag;
