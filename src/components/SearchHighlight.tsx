import React from 'react';

interface SearchHighlightProps {
  text: string;
  query: string;
  className?: string;
  highlightClassName?: string;
}

const SearchHighlight: React.FC<SearchHighlightProps> = ({
  text,
  query,
  className = '',
  highlightClassName = 'rounded bg-yellow-200 px-0.5 text-gray-900 dark:bg-yellow-300 dark:text-gray-900',
}) => {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return <span className={className}>{text}</span>;
  }

  const lowerText = text.toLowerCase();
  const lowerQuery = normalizedQuery.toLowerCase();
  const matchIndex = lowerText.indexOf(lowerQuery);

  if (matchIndex < 0) {
    return <span className={className}>{text}</span>;
  }

  const before = text.slice(0, matchIndex);
  const match = text.slice(matchIndex, matchIndex + normalizedQuery.length);
  const after = text.slice(matchIndex + normalizedQuery.length);

  return (
    <span className={className}>
      {before}
      <mark className={highlightClassName}>{match}</mark>
      {after}
    </span>
  );
};

export default SearchHighlight;
