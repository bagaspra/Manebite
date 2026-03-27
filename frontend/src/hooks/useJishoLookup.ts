"use client";

import { useState } from 'react';
import { API_URL } from '@/lib/api';

export interface JishoResult {
  word: string;
  reading: string;
  meanings: string[];
  partOfSpeech: string;
}

export function useJishoLookup() {
  const [result, setResult] = useState<JishoResult | null>(null);
  const [loading, setLoading] = useState(false);

  const lookup = async (word: string) => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(
        `${API_URL}/proxy/jisho?keyword=${encodeURIComponent(word)}`
      );
      if (!res.ok) throw new Error('Lookup failed');
      const data = await res.json();
      const entry = data.data?.[0];
      if (entry) {
        setResult({
          word: entry.japanese?.[0]?.word ?? word,
          reading: entry.japanese?.[0]?.reading ?? '',
          meanings: entry.senses?.[0]?.english_definitions ?? [],
          partOfSpeech: entry.senses?.[0]?.parts_of_speech?.[0] ?? '',
        });
      }
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return { result, loading, lookup };
}
