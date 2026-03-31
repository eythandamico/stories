const STORAGE_KEY = 'narrative-game-state';
const MAX_HEARTS = 5;
const HEART_REGEN_MS = 30 * 60 * 1000; // 30 minutes

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // corrupted state, start fresh
  }
  return getDefaultState();
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getDefaultState() {
  return {
    hearts: MAX_HEARTS,
    lastHeartLoss: null,
    endings: [],
    streak: { current: 0, best: 0, lastPlayDate: null },
    perks: { freeze: 2, hint: 2, rewind: 1 },
  };
}

function ensurePerks(state) {
  if (!state.perks) state.perks = { freeze: 2, hint: 2, rewind: 1 };
  return state;
}

// ── Hearts ──

export function getHearts() {
  return loadState().hearts;
}

export function spendHeart() {
  const state = loadState();
  if (state.hearts <= 0) return false;
  state.hearts -= 1;
  if (state.hearts < MAX_HEARTS && !state.lastHeartLoss) {
    state.lastHeartLoss = Date.now();
  }
  saveState(state);
  return true;
}

export function addHeart() {
  const state = loadState();
  if (state.hearts >= MAX_HEARTS) return;
  state.hearts = Math.min(state.hearts + 1, MAX_HEARTS);
  if (state.hearts >= MAX_HEARTS) {
    state.lastHeartLoss = null;
  }
  saveState(state);
}

export function addHearts(count) {
  const state = loadState();
  state.hearts += count;
  state.lastHeartLoss = null;
  saveState(state);
}

export function getNextHeartTime() {
  const state = loadState();
  if (state.hearts >= MAX_HEARTS || !state.lastHeartLoss) return null;
  return state.lastHeartLoss + HEART_REGEN_MS;
}

export function regenerateHearts() {
  const state = loadState();
  if (state.hearts >= MAX_HEARTS || !state.lastHeartLoss) return;

  const now = Date.now();
  const elapsed = now - state.lastHeartLoss;
  const heartsToAdd = Math.floor(elapsed / HEART_REGEN_MS);

  if (heartsToAdd > 0) {
    state.hearts = Math.min(state.hearts + heartsToAdd, MAX_HEARTS);
    if (state.hearts >= MAX_HEARTS) {
      state.lastHeartLoss = null;
    } else {
      state.lastHeartLoss = state.lastHeartLoss + heartsToAdd * HEART_REGEN_MS;
    }
    saveState(state);
  }
}

// ── Endings ──

export function getEndingsFound() {
  return loadState().endings;
}

export function addEnding(storyId, endingId, endingTitle) {
  const state = loadState();
  const exists = state.endings.some(
    (e) => e.storyId === storyId && e.endingId === endingId
  );
  if (exists) return false;
  state.endings.push({ storyId, endingId, endingTitle, foundAt: Date.now() });
  // Reward a heart for discovering a new ending
  state.hearts = Math.min(state.hearts + 1, MAX_HEARTS);
  if (state.hearts >= MAX_HEARTS) {
    state.lastHeartLoss = null;
  }
  saveState(state);
  return true;
}

export function getEndingsForStory(storyId) {
  return loadState().endings.filter((e) => e.storyId === storyId);
}

export function getTotalEndingsFound() {
  return loadState().endings.length;
}

// ── Perks ──

export function getPerks() {
  const state = ensurePerks(loadState());
  return { ...state.perks };
}

export function usePerk(type) {
  const state = ensurePerks(loadState());
  if (!state.perks[type] || state.perks[type] <= 0) return false;
  state.perks[type] -= 1;
  saveState(state);
  return true;
}

export function addPerks(type, count) {
  const state = ensurePerks(loadState());
  state.perks[type] = (state.perks[type] || 0) + count;
  saveState(state);
}

// ── Streaks ──

function toDateString(ts) {
  return new Date(ts).toISOString().slice(0, 10);
}

export function getStreak() {
  const { streak } = loadState();
  return { current: streak.current, best: streak.best, lastPlayDate: streak.lastPlayDate };
}

export function recordPlay() {
  const state = loadState();
  const today = toDateString(Date.now());

  if (state.streak.lastPlayDate === today) return;

  if (state.streak.lastPlayDate) {
    const lastDate = new Date(state.streak.lastPlayDate);
    const nextDay = new Date(lastDate);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDayStr = toDateString(nextDay.getTime());

    if (today === nextDayStr) {
      state.streak.current += 1;
    } else {
      state.streak.current = 1;
    }
  } else {
    state.streak.current = 1;
  }

  state.streak.best = Math.max(state.streak.best, state.streak.current);
  state.streak.lastPlayDate = today;
  saveState(state);
}
