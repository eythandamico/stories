import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getHearts, spendHeart as _spendHeart, addHearts as _addHearts,
  getNextHeartTime, regenerateHearts, getEndingsFound,
  addEnding as _addEnding, getStreak, recordPlay as _recordPlay,
  getPerks, usePerk as _usePerk, addPerks as _addPerks,
} from './game-state';
import { api } from './api.js';
import { isFirebaseConfigured } from './firebase.js';
import { cancelInactivityReminder } from './notifications.js';

const MAX_HEARTS = 5;

// Sync streak to server (server calculates, fire-and-forget)
async function syncStreak() {
  if (!isFirebaseConfigured) return;
  try {
    await api.recordStreak();
  } catch {}
}

async function syncFromServer(setters) {
  if (!isFirebaseConfigured) return;
  try {
    const data = await api.getMe();
    if (!data) return;
    // Server data overrides local if server has higher values
    if (data.streak_best > getStreak().best) {
      // Server has better streak, keep it
    }
    if (data.endings?.length) {
      setters.setEndingsFound(data.endings.map(e => ({
        storyId: e.story_id, endingId: e.ending_id,
        endingTitle: e.ending_title, foundAt: e.found_at,
      })));
    }
  } catch {}
}

export function useGameState() {
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [nextHeartTime, setNextHeartTime] = useState(null);
  const [endingsFound, setEndingsFound] = useState([]);
  const [streak, setStreak] = useState({ current: 0, best: 0, lastPlayDate: null });
  const [perks, setPerks] = useState({ freeze: 0, hint: 0, rewind: 0 });
  const synced = useRef(false);

  const refresh = useCallback(() => {
    setHearts(getHearts());
    setNextHeartTime(getNextHeartTime());
    setEndingsFound(getEndingsFound());
    setStreak(getStreak());
    setPerks(getPerks());
  }, []);

  // Initial load + server sync
  useEffect(() => {
    regenerateHearts();
    refresh();
    if (!synced.current) {
      synced.current = true;
      syncFromServer({ setEndingsFound });
    }
  }, [refresh]);

  // Periodic heart regen — only when tab is visible
  useEffect(() => {
    let interval = null;
    const start = () => {
      if (!interval) interval = setInterval(() => { regenerateHearts(); refresh(); }, 30_000);
    };
    const stop = () => { clearInterval(interval); interval = null; };
    const onVisibility = () => document.hidden ? stop() : start();

    start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => { stop(); document.removeEventListener('visibilitychange', onVisibility); };
  }, [refresh]);

  const spendHeart = useCallback(() => {
    const result = _spendHeart();
    refresh();
    if (result && isFirebaseConfigured) api.spendHeart().catch(() => {});
    return result;
  }, [refresh]);

  const purchaseHearts = useCallback((count) => {
    _addHearts(count);
    refresh();
  }, [refresh]);

  const addEnding = useCallback((storyId, endingId, endingTitle) => {
    const isNew = _addEnding(storyId, endingId, endingTitle);
    refresh();
    if (isNew && isFirebaseConfigured) {
      api.recordEnding(storyId, endingId, endingTitle).catch(() => {});
    }
    return isNew;
  }, [refresh]);

  const recordPlay = useCallback(() => {
    _recordPlay();
    refresh();
    syncStreak();
    cancelInactivityReminder();
  }, [refresh]);

  const usePerk = useCallback((type) => {
    const result = _usePerk(type);
    refresh();
    if (result && isFirebaseConfigured) api.usePerk(type).catch(() => {});
    return result;
  }, [refresh]);

  const purchasePerks = useCallback((type, count) => {
    _addPerks(type, count);
    refresh();
  }, [refresh]);

  return {
    hearts, maxHearts: MAX_HEARTS, nextHeartTime,
    spendHeart, purchaseHearts,
    streak, endingsFound, addEnding, recordPlay,
    perks, usePerk, purchasePerks,
  };
}
