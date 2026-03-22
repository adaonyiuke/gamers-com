"use client";

import { useCallback, useEffect, useRef } from "react";

export interface SessionDraft {
  meetupId: string;
  step: 1 | 2 | 3;
  selectedGameId: string | null;
  selectedParticipantIds: string[];
  rounds: Record<string, string>[];
  currentRound: number;
  placements: Record<string, number>;
  manualWinnerId: string | null;
  savedAt: number;
}

const STORAGE_PREFIX = "session_draft:";
const MAX_AGE_MS = 4 * 60 * 60 * 1000; // 4 hours

function getKey(meetupId: string) {
  return `${STORAGE_PREFIX}${meetupId}`;
}

export function loadSessionDraft(
  meetupId: string
): SessionDraft | null {
  try {
    const raw = localStorage.getItem(getKey(meetupId));
    if (!raw) return null;
    const draft: SessionDraft = JSON.parse(raw);
    if (Date.now() - draft.savedAt > MAX_AGE_MS) {
      localStorage.removeItem(getKey(meetupId));
      return null;
    }
    return draft;
  } catch {
    return null;
  }
}

export function saveSessionDraft(draft: SessionDraft) {
  try {
    localStorage.setItem(getKey(draft.meetupId), JSON.stringify(draft));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

export function clearSessionDraft(meetupId: string) {
  try {
    localStorage.removeItem(getKey(meetupId));
  } catch {
    // ignore
  }
}

/**
 * Hook that auto-saves recording wizard state to localStorage on every change.
 * Returns { restoreDraft, saveDraft, clearDraft }.
 */
export function useSessionDraft(meetupId: string) {
  const savedRef = useRef(false);

  const saveDraft = useCallback(
    (state: Omit<SessionDraft, "meetupId" | "savedAt">) => {
      saveSessionDraft({
        ...state,
        meetupId,
        savedAt: Date.now(),
      });
    },
    [meetupId]
  );

  const clearDraft = useCallback(() => {
    clearSessionDraft(meetupId);
  }, [meetupId]);

  const restoreDraft = useCallback((): SessionDraft | null => {
    if (savedRef.current) return null; // only restore once
    savedRef.current = true;
    return loadSessionDraft(meetupId);
  }, [meetupId]);

  // Clean up stale drafts for other meetups on mount
  useEffect(() => {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(STORAGE_PREFIX) && key !== getKey(meetupId)) {
          const raw = localStorage.getItem(key);
          if (raw) {
            try {
              const draft: SessionDraft = JSON.parse(raw);
              if (Date.now() - draft.savedAt > MAX_AGE_MS) {
                localStorage.removeItem(key);
              }
            } catch {
              localStorage.removeItem(key);
            }
          }
        }
      }
    } catch {
      // ignore
    }
  }, [meetupId]);

  return { restoreDraft, saveDraft, clearDraft };
}
