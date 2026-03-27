"use client";

import { useEffect, useRef } from 'react';

interface Props {
  word: string;
  reading: string;
  meanings: string[];
  partOfSpeech: string;
  loading: boolean;
  position: { x: number; y: number } | null;
  onClose: () => void;
}

function katakanaToHiragana(str: string): string {
  return str.replace(/[\u30A1-\u30F6]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  );
}

export default function WordPopup({
  word,
  reading,
  meanings,
  partOfSpeech,
  loading,
  position,
  onClose,
}: Props) {
  const popupRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!position) return null;

  const POPUP_W = 240;
  const POPUP_H = 180; // approximate
  const OFFSET = 12;

  const vw = typeof window !== 'undefined' ? window.innerWidth : 800;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 600;

  let left = position.x - POPUP_W / 2;
  let top = position.y - POPUP_H - OFFSET;

  // Flip right if overflowing left
  if (left < 8) left = 8;
  // Flip left if overflowing right
  if (left + POPUP_W > vw - 8) left = vw - POPUP_W - 8;
  // If overflowing top, show below instead
  if (top < 8) top = position.y + OFFSET;

  const hiragana = reading ? katakanaToHiragana(reading) : '';

  return (
    <div
      ref={popupRef}
      style={{
        position: 'fixed',
        left,
        top,
        width: POPUP_W,
        zIndex: 9999,
        background: '#1A1A1C',
        border: '1px solid #2A2A2E',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
        fontSize: '0.875rem',
        color: '#F0F0F0',
      }}
    >
      {/* Header */}
      <div style={{ padding: '0.625rem 0.75rem 0.5rem', borderBottom: '1px solid #2A2A2E' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: "'Noto Serif JP', serif" }}>
            {word}
          </span>
          {hiragana && hiragana !== word && (
            <span style={{ fontSize: '0.75rem', color: '#888890' }}>{hiragana}</span>
          )}
        </div>
        {partOfSpeech && (
          <span
            style={{
              display: 'inline-block',
              marginTop: '0.25rem',
              padding: '0 0.375rem',
              fontSize: '0.65rem',
              fontWeight: 600,
              borderRadius: '0.25rem',
              background: 'rgba(196,30,58,0.18)',
              color: '#C41E3A',
              border: '1px solid rgba(196,30,58,0.3)',
            }}
          >
            {partOfSpeech}
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '0.5rem 0.75rem' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <div style={{ height: '0.75rem', borderRadius: '0.25rem', background: '#2A2A2E', width: '80%' }} />
            <div style={{ height: '0.75rem', borderRadius: '0.25rem', background: '#2A2A2E', width: '60%' }} />
          </div>
        ) : meanings.length > 0 ? (
          <ul style={{ margin: 0, paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            {meanings.slice(0, 3).map((m, i) => (
              <li key={i} style={{ color: '#D0D0D8', fontSize: '0.8125rem' }}>{m}</li>
            ))}
          </ul>
        ) : (
          <p style={{ color: '#888890', fontSize: '0.8rem', margin: 0 }}>No results found.</p>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '0.375rem 0.75rem 0.5rem', borderTop: '1px solid #2A2A2E' }}>
        <a
          href={`https://jisho.org/search/${encodeURIComponent(word)}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: '0.75rem', color: '#888890', textDecoration: 'none' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#C41E3A')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#888890')}
        >
          Open in Jisho →
        </a>
      </div>
    </div>
  );
}
