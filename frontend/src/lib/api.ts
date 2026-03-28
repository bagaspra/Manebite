const API_URL =
  typeof window === "undefined"
    ? process.env.API_URL || "http://backend:8000"
    : process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, options);

  if (!response.ok) {
    let message = `API error: ${response.status} ${response.statusText}`;
    try {
      const body = await response.json();
      if (body?.detail) {
        message = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
      }
    } catch {
      // response body was not JSON — keep the status message
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type Sentence = {
  id: number;
  sequence_no: number | null;
  text_ja: string;
  text_romaji: string | null;
  start_time: number;
  end_time: number;
  duration: number | null;
};

export type Video = {
  id: number;
  youtube_id: string;
  title: string | null;
  channel: string | null;
  language: string | null;
  is_public: boolean | null;
  submitted_by: string | null;
  created_at: string | null;
  sentence_count: number;
};

export type VideoDetail = Video & { sentences: Sentence[] };

export type SubmitVideoResponse = {
  video: Video;
  sentences_count: number;
  message: string;
};

// ─── API functions ────────────────────────────────────────────────────────────

export function submitVideo(youtube_url: string, userId?: string): Promise<SubmitVideoResponse> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (userId) headers["X-User-Id"] = userId;
  return apiFetch<SubmitVideoResponse>("/videos", {
    method: "POST",
    headers,
    body: JSON.stringify({ youtube_url }),
  });
}

export function getVideos(filter: "mine" | "public" | "all" = "public", userId?: string): Promise<Video[]> {
  const headers: Record<string, string> = {};
  if (userId) headers["X-User-Id"] = userId;
  return apiFetch<Video[]>(`/videos?filter=${filter}`, { headers });
}

export function toggleVisibility(videoId: number, isPublic: boolean, userId: string): Promise<Video> {
  return apiFetch<Video>(`/videos/${videoId}/visibility`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "X-User-Id": userId },
    body: JSON.stringify({ is_public: isPublic }),
  });
}

export function getVideoDetail(id: number): Promise<VideoDetail> {
  return apiFetch<VideoDetail>(`/videos/${id}`);
}

export async function deleteVideo(id: number): Promise<void> {
  await apiFetch<unknown>(`/videos/${id}`, { method: "DELETE" });
}

// ─── Progress types ───────────────────────────────────────────────────────────

export type Progress = {
  sentence_id: number;
  replays: number;
  completed: boolean;
};

export type SessionProgress = {
  video_id: number;
  last_sentence_id: number | null;
  completed_count: number;
  total_sentences: number;
  sentences: Progress[];
};

// ─── Progress API functions ───────────────────────────────────────────────────

export function updateProgress(
  videoId: number,
  data: { sentence_id: number; replays: number; completed: boolean },
  userId: string,
): Promise<Progress> {
  return apiFetch<Progress>(`/session/${videoId}/progress`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-User-Id": userId },
    body: JSON.stringify(data),
  });
}

export function getSessionProgress(videoId: number, userId: string): Promise<SessionProgress> {
  return apiFetch<SessionProgress>(`/session/${videoId}/progress`, {
    headers: { "X-User-Id": userId },
  });
}

// ─── Keigo Translator types ───────────────────────────────────────────────────

export type KeigoRequest = {
  text: string;
  input_mode: "en" | "ja";
  target_level?: "business" | "polite" | "very_formal";
};

export type KeigoResult = {
  output_ja: string;
  explanation: string;
  levels_used: string[];
  input_mode: string;
};

export type KeigoHistoryItem = {
  id: number;
  input_text: string;
  input_mode: string;
  output_ja: string;
  explanation: string | null;
  levels_used: string[];
  created_at: string;
};

export type LocalKeigoHistoryItem = Omit<KeigoHistoryItem, "id" | "created_at">;

// ─── Keigo API functions ──────────────────────────────────────────────────────

export function translateKeigo(data: KeigoRequest, userId?: string): Promise<KeigoResult> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (userId) headers["X-User-Id"] = userId;
  return apiFetch<KeigoResult>("/keigo/translate", {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
}

export function getKeigoHistory(userId: string): Promise<KeigoHistoryItem[]> {
  return apiFetch<KeigoHistoryItem[]>("/keigo/history", {
    headers: { "X-User-Id": userId },
  });
}

export function deleteKeigoHistoryItem(id: number, userId: string): Promise<void> {
  return apiFetch<void>(`/keigo/history/${id}`, {
    method: "DELETE",
    headers: { "X-User-Id": userId },
  });
}

export function importKeigoHistory(
  items: LocalKeigoHistoryItem[],
  userId: string
): Promise<void> {
  return apiFetch<void>("/keigo/history/import", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-User-Id": userId },
    body: JSON.stringify({ items }),
  });
}

export { apiFetch, API_URL };
