"use client";

import { useEffect, useRef } from 'react';

interface Props {
  text: string;
  onWordSelect: (word: string, rect: DOMRect) => void;
}

export function SelectableSentence({ text, onWordSelect }: Props) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection();
      if (!selection) return;
      const selected = selection.toString().trim();
      if (selected.length === 0 || selected.length > 20) return;

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      onWordSelect(selected, rect);
    };

    const el = ref.current;
    if (el) el.addEventListener('mouseup', handleMouseUp);
    return () => { if (el) el.removeEventListener('mouseup', handleMouseUp); };
  }, [onWordSelect]);

  return (
    <span ref={ref} style={{ userSelect: 'text', cursor: 'text' }}>
      {text}
    </span>
  );
}
