"use client";

import { useState } from "react";

interface ExampleCarouselProps {
  examplesJa: string[];
  examplesJaRuby?: string[] | null;
  examplesEn: string[];
  examplesId: string[];
  lang: "en" | "id";
  showFurigana?: boolean;
}

export default function ExampleCarousel({
  examplesJa,
  examplesJaRuby,
  examplesEn,
  examplesId,
  lang,
  showFurigana = false,
}: ExampleCarouselProps) {
  const [index, setIndex] = useState(0);

  const total = examplesJa.length;
  if (total === 0) return null;

  const jaPlain = examplesJa[index] ?? "";
  const jaRuby  = examplesJaRuby?.[index] ?? "";
  const translated = (lang === "en" ? examplesEn : examplesId)[index] ?? "";

  function prev() { setIndex((i) => (i - 1 + total) % total); }
  function next() { setIndex((i) => (i + 1) % total); }

  return (
    <div className="mt-2 space-y-1">
      {/* Example text */}
      <div className="min-h-[3.5rem] rounded-lg bg-gray-50 px-3 py-2.5">
        {showFurigana && jaRuby ? (
          <p
            className="text-sm leading-loose text-gray-800"
            style={{ fontFamily: "var(--font-noto-serif-jp, serif)" }}
            dangerouslySetInnerHTML={{ __html: jaRuby }}
          />
        ) : (
          <p
            className="text-sm text-gray-800"
            style={{ fontFamily: "var(--font-noto-serif-jp, serif)" }}
          >
            {jaPlain}
          </p>
        )}
        {translated && (
          <p className="mt-0.5 text-xs text-gray-400">{translated}</p>
        )}
      </div>

      {/* Navigation */}
      {total > 1 && (
        <div className="flex items-center justify-between px-1">
          <button
            onClick={prev}
            className="rounded p-1 text-xs text-gray-400 transition-colors hover:text-gray-700"
            aria-label="Previous example"
          >
            ◂
          </button>

          <div className="flex gap-1.5">
            {Array.from({ length: total }).map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Example ${i + 1}`}
                className="h-1.5 w-1.5 rounded-full transition-colors"
                style={{
                  background: i === index ? "var(--accent, #374151)" : "transparent",
                  border: "1.5px solid",
                  borderColor: i === index ? "var(--accent, #374151)" : "#D1D5DB",
                }}
              />
            ))}
          </div>

          <button
            onClick={next}
            className="rounded p-1 text-xs text-gray-400 transition-colors hover:text-gray-700"
            aria-label="Next example"
          >
            ▸
          </button>
        </div>
      )}
    </div>
  );
}
