import { useState, useEffect, useCallback } from 'react';
import {
  getHearts,
  spendHeart as _spendHeart,
  addHearts as _addHearts,
  getNextHeartTime,
  regenerateHearts,
  getEndingsFound,
  addEnding as _addEnding,
  getStreak,
  recordPlay as _recordPlay,
  getPerks,
  usePerk as _usePerk,
  addPerks as _addPerks,
} from './game-state';

const MAX_HEARTS = 5;

export function useGameState() {
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [nextHeartTime, setNextHeartTime] = useState(null);
  const [endingsFound, setEndingsFound] = useState([]);
  const [streak, setStreak] = useState({ current: 0, best: 0, lastPlayDate: null });
  const [perks, setPerks] = useState({ freeze: 0, hint: 0, rewind: 0 });

  const refresh = useCallback(() => {
    setHearts(getHearts());
    setNextHeartTime(getNextHeartTime());
    setEndingsFound(getEndingsFound());
    setStreak(getStreak());
    setPerks(getPerks());
  }, []);

  useEffect(() => {
    regenerateHearts();
    refresh();
  }, [refresh]);

  useEffect(() => {
    const interval = setInterval(() => {
      regenerateHearts();
      refresh();
    }, 30_000);
    return () => clearInterval(interval);
  }, [refresh]);

  const spendHeart = useCallback(() => {
    const result = _spendHeart();
    refresh();
    return result;
  }, [refresh]);

  const purchaseHearts = useCallback((count) => {
    _addHearts(count);
    refresh();
  }, [refresh]);

  const addEnding = useCallback((storyId, endingId, endingTitle) => {
    const isNew = _addEnding(storyId, endingId, endingTitle);
    refresh();
    return isNew;
  }, [refresh]);

  const recordPlay = useCallback(() => {
    _recordPlay();
    refresh();
  }, [refresh]);

  const usePerk = useCallback((type) => {
    const result = _usePerk(type);
    refresh();
    return result;
  }, [refresh]);

  const purchasePerks = useCallback((type, count) => {
    _addPerks(type, count);
    refresh();
  }, [refresh]);

  return {
    hearts,
    maxHearts: MAX_HEARTS,
    nextHeartTime,
    spendHeart,
    purchaseHearts,
    streak,
    endingsFound,
    addEnding,
    recordPlay,
    perks,
    usePerk,
    purchasePerks,
  };
}
