const STORAGE_KEY = 'habit-checklist-v1';
const THEME_STORAGE_KEY = 'habit-checklist-theme';
const REMINDER_HOUR = 21;
const REMINDER_MINUTE = 0;
const SYNC_DEBOUNCE_MS = 400;
const PRIORITY_OPTIONS = ['low', 'medium', 'high'];
const ATTRIBUTE_OPTIONS = ['None', 'Strength', 'Dexterity', 'Wisdom', 'Intelligence', 'Charisma', 'Constitution'];
const XP_PER_LEVEL = 10000;
const ATTRIBUTE_XP_PER_POINT = 1000;
const ATTRIBUTE_NAMES = ['Strength', 'Dexterity', 'Wisdom', 'Intelligence', 'Charisma', 'Constitution'];

const defaultUnconditionals = [
  { id: 'steps', text: 'Get your steps', done: false, attribute: 'Constitution' },
  { id: 'weight', text: 'Log weight', done: false, attribute: 'Constitution' },
  { id: 'mood', text: 'Record mood', done: false, attribute: 'Wisdom' },
  { id: 'dogs', text: 'Give the dogs attention', done: false, attribute: 'Wisdom' },
  { id: 'affirmation', text: 'Give words of affirmation', done: false, attribute: 'Charisma' },
];

const defaultConditionals = [
  { id: 'rucking', text: 'Rucking', done: false, attribute: 'Constitution', baseXp: 20 },
  { id: 'workout', text: 'Workout', done: false, attribute: 'Strength', baseXp: 22 },
  { id: 'reading', text: 'Reading', done: false, attribute: 'Wisdom', baseXp: 18 },
  { id: 'outside', text: 'Outside time', done: false, attribute: 'Dexterity', baseXp: 18 },
  { id: 'journaling', text: 'Journaling', done: false, attribute: 'Intelligence', baseXp: 16 },
  { id: 'distraction-free', text: 'Distraction free time', done: false, attribute: 'Wisdom', baseXp: 16 },
  { id: 'service', text: 'Acts of service', done: false, attribute: 'Charisma', baseXp: 16 },
  { id: 'app-building', text: 'App building', done: false, attribute: 'Intelligence', baseXp: 24 },
  { id: 'diet', text: 'Diet adherence', done: false, attribute: 'Constitution', baseXp: 20 },
  { id: 'hydration', text: 'Hydration milestone', done: false, attribute: 'Constitution', baseXp: 14 },
  { id: 'sleep', text: 'Sleep quality', done: false, attribute: 'Constitution', baseXp: 18 },
  { id: 'mobility', text: 'Mobility/stretching', done: false, attribute: 'Dexterity', baseXp: 16 },
  { id: 'agility', text: 'Agility/footwork', done: false, attribute: 'Dexterity', baseXp: 18 },
  { id: 'craft', text: 'Fine motor/craft work', done: false, attribute: 'Dexterity', baseXp: 16 },
];

const defaultChecklistSections = {
  weekly: [],
  quarterly: [],
  yearly: [],
  fiveYear: [],
};

function createDefaultState() {
  return {
    unconditionals: [...defaultUnconditionals].map(normalizeUnconditionalItem),
    conditionals: [...defaultConditionals].map(normalizeConditionalItem),
    xp: 0,
    attributes: {},
    history: [],
    lastSeenDate: getTodayKey(),
    reminderEnabled: false,
    checklists: {
      weekly: [],
      quarterly: [],
      yearly: [],
      fiveYear: [],
    },
    mood: '',
    weightLog: [],
    currentWeight: '',
    updatedAt: new Date().toISOString(),
  };
}

function getStorageKeyForUser(user = currentUser) {
  return user?.id ? `${STORAGE_KEY}:${user.id}` : STORAGE_KEY;
}

let syncStatusMessage = 'Supabase sync is not configured.';
let lastSyncedUpdatedAt = '';
let syncSaveTimer = null;
let currentUser = null;
let state = createDefaultState();
let reminderTimer = null;
let midnightTimer = null;

function persistLocalState() {
  if (!currentUser?.id) return;
  localStorage.setItem(getStorageKeyForUser(currentUser), JSON.stringify(state));
}

function updateStateTimestamp() {
  state.updatedAt = new Date().toISOString();
}

function ensureStateShape() {
  state.unconditionals = Array.isArray(state.unconditionals) && state.unconditionals.length > 0
    ? state.unconditionals.map(normalizeUnconditionalItem)
    : [...defaultUnconditionals].map(normalizeUnconditionalItem);

  state.conditionals = Array.isArray(state.conditionals) && state.conditionals.length > 0
    ? state.conditionals.map(normalizeConditionalItem)
    : [...defaultConditionals].map(normalizeConditionalItem);

  state.xp = Number.isFinite(Number(state.xp)) ? Number(state.xp) : 0;
  state.attributes = state.attributes && typeof state.attributes === 'object' ? state.attributes : {};

  if (!state.checklists || typeof state.checklists !== 'object') {
    state.checklists = { ...defaultChecklistSections };
  }

  state.checklists.weekly = Array.isArray(state.checklists.weekly) ? state.checklists.weekly.map((item) => normalizeChecklistItem(item, 'weekly')) : [];
  state.checklists.quarterly = Array.isArray(state.checklists.quarterly) ? state.checklists.quarterly.map((item) => normalizeChecklistItem(item, 'quarterly')) : [];
  state.checklists.yearly = Array.isArray(state.checklists.yearly) ? state.checklists.yearly.map((item) => normalizeChecklistItem(item, 'yearly')) : [];
  state.checklists.fiveYear = Array.isArray(state.checklists.fiveYear) ? state.checklists.fiveYear.map((item) => normalizeChecklistItem(item, 'fiveYear')) : [];

  state.mood = state.mood || '';
  state.weightLog = Array.isArray(state.weightLog) ? state.weightLog : [];
  state.currentWeight = state.currentWeight || '';
  state.updatedAt = state.updatedAt || new Date().toISOString();
  persistLocalState();
}

const appShell = document.getElementById('appShell');
const appBootStatusEl = document.getElementById('appBootStatus');
const taskList = document.getElementById('taskList');
const themeButtons = Array.from(document.querySelectorAll('.theme-option'));
const completedCountEl = document.getElementById('completedCount');
const progressPercentEl = document.getElementById('progressPercent');
const streakCountEl = document.getElementById('streakCount');
const xpCountEl = document.getElementById('xpCount');
const levelCountEl = document.getElementById('levelCount');
const todayStatusEl = document.getElementById('todayStatus');
const heroLevelEl = document.getElementById('heroLevel');
const resetButton = document.getElementById('resetButton');
const notificationsButton = document.getElementById('notificationsButton');
const reminderStatusEl = document.getElementById('reminderStatus');
const syncStatusEl = document.getElementById('syncStatus');
const accountEmailEl = document.getElementById('accountEmail');
const logoutButton = document.getElementById('logoutButton');
const checklistSections = document.getElementById('checklistSections');
const moodSelect = document.getElementById('moodSelect');
const weightInput = document.getElementById('weightInput');
const weightSaveButton = document.getElementById('weightSaveButton');

function getSyncAdapter() {
  return window.supabaseSync || null;
}

function setSyncStatus(message) {
  syncStatusMessage = message;
  if (syncStatusEl) {
    syncStatusEl.textContent = message;
  }
}

function setBootStatus(message) {
  if (appBootStatusEl) {
    appBootStatusEl.textContent = message;
  }
}

function showAppShell() {
  if (appBootStatusEl) {
    appBootStatusEl.hidden = true;
  }

  if (appShell) {
    appShell.hidden = false;
  }
}

function redirectToLogin() {
  const nextPath = window.location.pathname === '/' ? '/index.html' : window.location.pathname;
  const query = new URLSearchParams({ next: nextPath }).toString();
  window.location.replace(`/login.html?${query}`);
}

function updateAccountUi() {
  if (accountEmailEl) {
    accountEmailEl.textContent = currentUser?.email ? `Signed in as ${currentUser.email}` : 'Not signed in';
  }
}

function getComparableTimestamp(value) {
  const parsed = Date.parse(value || '');
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatSyncTime(value) {
  if (!value) return 'just now';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'just now';
  return parsed.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

async function persistStateToSupabase(force = false) {
  const syncAdapter = getSyncAdapter();
  if (!syncAdapter?.enabled || !currentUser?.id) {
    setSyncStatus('Log in to sync your checklist.');
    return false;
  }

  if (!force && state.updatedAt && state.updatedAt === lastSyncedUpdatedAt) {
    setSyncStatus(`Supabase synced at ${formatSyncTime(lastSyncedUpdatedAt)}.`);
    return true;
  }

  setSyncStatus('Syncing to Supabase...');
  const result = await syncAdapter.saveState(state);

  if (!result.ok) {
    setSyncStatus(result.message);
    return false;
  }

  lastSyncedUpdatedAt = result.updatedAt || state.updatedAt || '';
  setSyncStatus(`Supabase synced at ${formatSyncTime(lastSyncedUpdatedAt)}.`);
  return true;
}

function queueSupabaseSave() {
  const syncAdapter = getSyncAdapter();
  if (!syncAdapter?.enabled) return;

  clearTimeout(syncSaveTimer);
  syncSaveTimer = window.setTimeout(() => {
    persistStateToSupabase();
  }, SYNC_DEBOUNCE_MS);
}

async function hydrateStateFromSupabase() {
  const syncAdapter = getSyncAdapter();
  if (!syncAdapter?.enabled || !currentUser?.id) {
    setSyncStatus('Log in to sync your checklist.');
    return;
  }

  setSyncStatus('Checking Supabase...');
  const result = await syncAdapter.loadState();
  if (!result.ok) {
    setSyncStatus(result.message);
    return;
  }

  if (!result.state) {
    setSyncStatus('Connected to Supabase. Saving this device state...');
    await persistStateToSupabase(true);
    return;
  }

  const localUpdatedAt = getComparableTimestamp(state.updatedAt);
  const remoteUpdatedAt = getComparableTimestamp(result.state.updatedAt || result.updatedAt);

  if (remoteUpdatedAt > localUpdatedAt) {
    state = result.state;
    ensureStateShape();
    lastSyncedUpdatedAt = result.updatedAt || result.state.updatedAt || '';
    render();
    setSyncStatus(`Loaded Supabase data from ${formatSyncTime(lastSyncedUpdatedAt)}.`);
    return;
  }

  if (localUpdatedAt > remoteUpdatedAt) {
    setSyncStatus('Connected to Supabase. Uploading newer local changes...');
    await persistStateToSupabase(true);
    return;
  }

  lastSyncedUpdatedAt = result.updatedAt || result.state.updatedAt || state.updatedAt || '';
  setSyncStatus(`Supabase synced at ${formatSyncTime(lastSyncedUpdatedAt)}.`);
}

function normalizePriority(priority) {
  return PRIORITY_OPTIONS.includes(priority) ? priority : 'medium';
}

function createId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36)}`;
}

function getFixedAttribute(text, sectionKey = '') {
  const normalized = (text || '').toLowerCase().trim();
  const attributeByText = {
    workout: 'Strength',
    'get your steps': 'Constitution',
    'give words of affirmation': 'Charisma',
    'give the dogs attention': 'Wisdom',
    'log weight': 'Constitution',
    'record mood': 'Wisdom',
    'steps': 'Constitution',
    affirmation: 'Charisma',
    'dogs attention': 'Wisdom',
    'outside time': 'Dexterity',
    'rucking': 'Constitution',
    reading: 'Wisdom',
    journaling: 'Intelligence',
    'distraction free time': 'Wisdom',
    'acts of service': 'Charisma',
    'app building': 'Intelligence',
    'diet adherence': 'Constitution',
    'hydration milestone': 'Constitution',
    'sleep quality': 'Constitution',
    'mobility/stretching': 'Dexterity',
    'agility/footwork': 'Dexterity',
    'fine motor/craft work': 'Dexterity',
  };

  if (attributeByText[normalized]) {
    return attributeByText[normalized];
  }

  const sectionAttributeMap = {
    weekly: 'Wisdom',
    quarterly: 'Intelligence',
    yearly: 'Constitution',
    fiveYear: 'Strength',
  };

  return sectionAttributeMap[sectionKey] || 'None';
}

function normalizeChecklistItem(item, sectionKey = '') {
  return {
    text: item?.text || '',
    done: Boolean(item?.done),
    priority: normalizePriority(item?.priority),
    attribute: getFixedAttribute(item?.text, sectionKey),
  };
}

function normalizeUnconditionalItem(item) {
  return {
    id: item?.id || createId('unconditional'),
    text: item?.text || '',
    done: Boolean(item?.done),
    attribute: getFixedAttribute(item?.text),
  };
}

function normalizeConditionalItem(item) {
  return {
    id: item?.id || createId('conditional'),
    text: item?.text || '',
    done: Boolean(item?.done),
    attribute: getFixedAttribute(item?.text),
    baseXp: Number.isFinite(Number(item?.baseXp)) ? Number(item?.baseXp) : 20,
    completedDate: item?.completedDate || '',
    xpEarned: Number.isFinite(Number(item?.xpEarned)) ? Number(item?.xpEarned) : 0,
  };
}

function normalizeTask(task) {
  return {
    text: task?.text || '',
    done: Boolean(task?.done),
    attribute: getFixedAttribute(task?.text),
  };
}

function loadLocalState(user = currentUser) {
  try {
    const userStorageKey = getStorageKeyForUser(user);
    const rawState = localStorage.getItem(userStorageKey) || (user?.id ? localStorage.getItem(STORAGE_KEY) : null);
    const parsed = rawState ? JSON.parse(rawState) : null;
    if (!parsed) {
      return createDefaultState();
    }

    const checklists = parsed.checklists && typeof parsed.checklists === 'object' ? parsed.checklists : {};

    return {
      unconditionals: Array.isArray(parsed.unconditionals) && parsed.unconditionals.length > 0
        ? parsed.unconditionals.map(normalizeUnconditionalItem)
        : (Array.isArray(parsed.tasks) && parsed.tasks.length > 0 ? parsed.tasks.map((task) => normalizeUnconditionalItem({ ...task, text: task.text || 'Task' })) : [...defaultUnconditionals].map(normalizeUnconditionalItem)),
      conditionals: Array.isArray(parsed.conditionals) && parsed.conditionals.length > 0
        ? parsed.conditionals.map(normalizeConditionalItem)
        : [...defaultConditionals].map(normalizeConditionalItem),
      xp: Number.isFinite(Number(parsed.xp)) ? Number(parsed.xp) : 0,
      attributes: parsed.attributes && typeof parsed.attributes === 'object' ? parsed.attributes : {},
      history: Array.isArray(parsed.history) ? parsed.history : [],
      lastSeenDate: parsed.lastSeenDate || getTodayKey(),
      reminderEnabled: Boolean(parsed.reminderEnabled),
      checklists: {
        weekly: Array.isArray(checklists.weekly) ? checklists.weekly.map((item) => normalizeChecklistItem(item, 'weekly')) : [],
        quarterly: Array.isArray(checklists.quarterly) ? checklists.quarterly.map((item) => normalizeChecklistItem(item, 'quarterly')) : [],
        yearly: Array.isArray(checklists.yearly) ? checklists.yearly.map((item) => normalizeChecklistItem(item, 'yearly')) : [],
        fiveYear: Array.isArray(checklists.fiveYear) ? checklists.fiveYear.map((item) => normalizeChecklistItem(item, 'fiveYear')) : [],
      },
      mood: parsed.mood || '',
      weightLog: Array.isArray(parsed.weightLog) ? parsed.weightLog : [],
      currentWeight: parsed.currentWeight || '',
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
  } catch {
    return createDefaultState();
  }
}

function saveState() {
  updateStateTimestamp();
  persistLocalState();
  queueSupabaseSave();
}

function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function ensureTodayState() {
  const today = getTodayKey();
  if (state.lastSeenDate === today) return false;

  ensureStateShape();
  state.unconditionals = state.unconditionals.map((task) => ({ ...task, done: false, attribute: getFixedAttribute(task.text) }));
  state.conditionals = state.conditionals.map((task) => ({ ...task, done: false, completedDate: '', xpEarned: 0, attribute: getFixedAttribute(task.text) }));
  state.attributes = state.attributes || {};
  state.lastSeenDate = today;
  saveState();
  return true;
}

function updateHistoryFromCompletion() {
  const today = getTodayKey();
  const allDone = state.unconditionals.length > 0 && state.unconditionals.every((task) => task.done);

  if (allDone) {
    if (!state.history.includes(today)) {
      state.history = [...state.history, today].sort();
    }
  } else {
    state.history = state.history.filter((day) => day !== today);
  }
}

function addXp(amount) {
  state.xp = (Number(state.xp) || 0) + amount;
  saveState();
}

function addAttributeXp(attribute, amount) {
  if (!attribute || attribute === 'None') return;
  state.attributes = state.attributes || {};
  state.attributes[attribute] = (Number(state.attributes[attribute]) || 0) + amount;
  saveState();
}

function getLevelFromXp(xp) {
  return Math.floor(xp / XP_PER_LEVEL);
}

function getAttributeLevel(xp) {
  return Math.floor(xp / ATTRIBUTE_XP_PER_POINT);
}

function getXpProgressPercent(xp) {
  const levelStart = getLevelFromXp(xp) * XP_PER_LEVEL;
  const progressInLevel = xp - levelStart;
  return Math.min(100, Math.round((progressInLevel / XP_PER_LEVEL) * 100));
}

function getAttributeProgressPercent(xp) {
  const remainder = xp % ATTRIBUTE_XP_PER_POINT;
  const progress = remainder === 0 && xp > 0 ? 100 : Math.round((remainder / ATTRIBUTE_XP_PER_POINT) * 100);
  return Math.min(100, progress);
}

function showNotification(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  new Notification(title, {
    body,
    tag: 'habit-check',
  });
}

function launchConfetti() {
  const layer = document.createElement('div');
  layer.id = 'confetti-layer';
  document.body.appendChild(layer);

  const colors = ['#4f46e5', '#16a34a', '#f59e0b', '#ec4899', '#f43f5e'];
  for (let index = 0; index < 24; index += 1) {
    const piece = document.createElement('span');
    piece.className = 'confetti-piece';
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[index % colors.length];
    piece.style.setProperty('--drift', `${(Math.random() - 0.5) * 220}px`);
    piece.style.setProperty('--rotation', `${Math.random() * 360}deg`);
    piece.style.animationDelay = `${Math.random() * 80}ms`;
    layer.appendChild(piece);
  }

  window.setTimeout(() => {
    layer.remove();
  }, 1600);
}

function scheduleReminders() {
  clearTimeout(reminderTimer);
  clearTimeout(midnightTimer);

  if (!state.reminderEnabled || !('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  const now = new Date();

  const eveningTime = new Date(now);
  eveningTime.setHours(REMINDER_HOUR, REMINDER_MINUTE, 0, 0);
  if (eveningTime <= now) {
    eveningTime.setDate(eveningTime.getDate() + 1);
  }

  reminderTimer = window.setTimeout(() => {
    const remaining = state.unconditionals.filter((task) => !task.done).length;
    showNotification(
      'Daily check-in',
      remaining > 0 ? `You still have ${remaining} item${remaining === 1 ? '' : 's'} left today.` : 'Everything is done for the day.'
    );
    scheduleReminders();
  }, eveningTime - now);

  const midnightTime = new Date(now);
  midnightTime.setHours(24, 0, 0, 0);
  midnightTimer = window.setTimeout(() => {
    state.unconditionals = state.unconditionals.map((task) => ({ ...task, done: false, attribute: getFixedAttribute(task.text) }));
    state.lastSeenDate = getTodayKey();
    saveState();
    render();
    showNotification('New day started', 'Your checklist has been reset for today.');
    scheduleReminders();
  }, midnightTime - now);
}

function calculateStreak(history) {
  if (!history.length) return 0;

  const uniqueDays = [...new Set(history)].sort();
  const today = new Date();
  let streak = 0;
  let cursor = new Date(today);

  while (true) {
    const key = toDateKey(cursor);
    if (!uniqueDays.includes(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function updateDailyMeta() {
  moodSelect.value = state.mood || '';
  weightInput.value = state.currentWeight || '';
}

function saveWeightEntry() {
  const value = weightInput.value.trim();
  if (!value) return;

  const parsed = Number(value);
  if (Number.isNaN(parsed)) return;

  const today = getTodayKey();
  const entry = { date: today, weight: parsed };
  const existingIndex = state.weightLog.findIndex((item) => item.date === today);
  if (existingIndex >= 0) {
    state.weightLog[existingIndex] = entry;
  } else {
    state.weightLog.push(entry);
  }

  state.currentWeight = value;
  saveState();
  updateDailyMeta();
  render();
  launchConfetti();
}

function renderDailyChecklist() {
  const total = state.unconditionals.length;
  const completed = state.unconditionals.filter((task) => task.done).length;
  taskList.innerHTML = '';

  if (total === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty-state';
    empty.textContent = 'No daily tasks are available right now.';
    taskList.appendChild(empty);
    return;
  }

  const dailyMetaItems = [
    {
      key: 'mood',
      label: `Mood: ${state.mood || 'Not set'}`,
      done: Boolean(state.mood),
    },
    {
      key: 'weight',
      label: `Weight: ${state.currentWeight || 'Not set'}`,
      done: Boolean(state.currentWeight),
    },
  ];

  const baseTaskCount = state.unconditionals.length;
  const dailyTaskItems = [...state.unconditionals.map((task) => ({ ...task, meta: null })), ...dailyMetaItems.map((item) => ({
    text: item.label,
    done: item.done,
    meta: item,
  }))];

  dailyTaskItems.forEach((task, index) => {
    const item = document.createElement('li');
    item.className = `task-item${task.done ? ' done' : ''}`;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'checkbox';
    checkbox.checked = task.done;
    checkbox.addEventListener('change', () => {
      if (task.meta) {
        if (task.meta.key === 'mood') {
          state.mood = checkbox.checked ? state.mood || '😐' : '';
          if (!state.mood) {
            moodSelect.value = '';
          } else {
            moodSelect.value = state.mood;
          }
        } else if (task.meta.key === 'weight') {
          if (!checkbox.checked) {
            state.currentWeight = '';
            weightInput.value = '';
          }
        }
        saveState();
        render();
        if (checkbox.checked) {
          launchConfetti();
        }
        return;
      }

      const taskIndex = index < baseTaskCount ? index : -1;
      if (taskIndex >= 0) {
        const task = state.unconditionals[taskIndex];
        const today = getTodayKey();
        const isCompletedToday = task.completedDate === today;
        if (checkbox.checked && !isCompletedToday) {
          const xpGain = 120;
          addXp(xpGain);
          addAttributeXp(task.attribute, xpGain);
          state.unconditionals[taskIndex].completedDate = today;
        } else if (!checkbox.checked) {
          state.unconditionals[taskIndex].completedDate = '';
        }
        state.unconditionals[taskIndex].done = checkbox.checked;
      }
      updateHistoryFromCompletion();
      saveState();
      render();
      if (checkbox.checked) {
        launchConfetti();
      }
    });

    const label = document.createElement('span');
    label.className = 'task-label';
    label.textContent = task.text;

    let attributeBadge = null;
    if (!task.meta) {
      attributeBadge = document.createElement('span');
      attributeBadge.className = 'attribute-badge';
      attributeBadge.textContent = `Attr: ${task.attribute || 'None'}`;
    }

    let badge = null;
    if (task.meta) {
      badge = document.createElement('span');
      badge.className = 'completion-badge';
      badge.textContent = task.done ? 'Completed' : 'Required';
    }

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'icon-button';
    deleteButton.textContent = '×';
    deleteButton.setAttribute('aria-label', `Delete ${task.text}`);
    deleteButton.addEventListener('click', () => {
      if (task.meta) return;
      const taskIndex = index < baseTaskCount ? index : -1;
      if (taskIndex >= 0) {
        state.unconditionals.splice(taskIndex, 1);
      }
      saveState();
      render();
    });

    item.appendChild(checkbox);
    item.appendChild(label);
    if (attributeBadge) {
      item.appendChild(attributeBadge);
    }
    if (badge) {
      item.appendChild(badge);
    }
    if (!task.meta) {
      item.appendChild(deleteButton);
    }
    taskList.appendChild(item);
  });

  const totalCompleted = dailyTaskItems.filter((task) => task.done).length;
  const effectiveTotal = dailyTaskItems.length;

  if (totalCompleted === effectiveTotal && effectiveTotal > 0) {
    taskList.parentElement?.classList.add('celebrate');
  } else {
    taskList.parentElement?.classList.remove('celebrate');
  }
}

function renderAttributeSummary() {
  const container = document.getElementById('attributeSummary');
  if (!container) return;

  container.innerHTML = '';
  ATTRIBUTE_NAMES.forEach((attribute) => {
    const xp = Number(state.attributes?.[attribute]) || 0;
    const points = getAttributeLevel(xp);
    const progress = getAttributeProgressPercent(xp);

    const row = document.createElement('div');
    row.className = 'attribute-row';

    const label = document.createElement('div');
    label.className = 'attribute-label';
    label.textContent = `${attribute} • ${points} pts`;

    const bar = document.createElement('div');
    bar.className = 'attribute-bar';

    const fill = document.createElement('div');
    fill.className = 'attribute-fill';
    fill.style.width = `${progress}%`;

    bar.appendChild(fill);
    row.appendChild(label);
    row.appendChild(bar);
    container.appendChild(row);
  });
}

function renderConditionalChecklist() {
  const container = document.getElementById('conditionalList');
  if (!container) return;

  container.innerHTML = '';

  if (state.conditionals.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty-state';
    empty.textContent = 'No conditionals yet.';
    container.appendChild(empty);
    return;
  }

  state.conditionals.forEach((item, index) => {
    const li = document.createElement('li');
    li.className = `task-item${item.done ? ' done' : ''}`;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'checkbox';
    checkbox.checked = item.done;
    checkbox.addEventListener('change', () => {
      const today = getTodayKey();
      const isCompletedToday = item.completedDate === today;
      if (checkbox.checked && !isCompletedToday) {
        const xpGain = Math.max(120, item.baseXp * 6 + 20);
        addXp(xpGain);
        addAttributeXp(item.attribute, xpGain);
        state.conditionals[index].completedDate = today;
        state.conditionals[index].xpEarned = (Number(state.conditionals[index].xpEarned) || 0) + xpGain;
      } else if (!checkbox.checked) {
        state.conditionals[index].completedDate = '';
      }
      state.conditionals[index].done = checkbox.checked;
      saveState();
      render();
      if (checkbox.checked) {
        launchConfetti();
      }
    });

    const label = document.createElement('span');
    label.className = 'task-label';
    label.textContent = item.text;

    const attributeBadge = document.createElement('span');
    attributeBadge.className = 'attribute-badge';
    attributeBadge.textContent = `Attr: ${item.attribute || 'None'}`;

    const xpBadge = document.createElement('span');
    xpBadge.className = 'completion-badge';
    xpBadge.textContent = `${item.baseXp} XP`;

    li.appendChild(checkbox);
    li.appendChild(label);
    li.appendChild(attributeBadge);
    li.appendChild(xpBadge);
    container.appendChild(li);
  });
}

function renderLongTermChecklists() {
  ensureStateShape();

  checklistSections.innerHTML = '';
  const sections = [
    { key: 'weekly', title: 'Weekly Quest Log', subtitle: 'Custom habits for this week.' },
    { key: 'quarterly', title: 'Quarterly Campaign', subtitle: 'Custom goals for the next 3 months.' },
    { key: 'yearly', title: 'Yearly Arc', subtitle: 'Custom goals for the year.' },
    { key: 'fiveYear', title: 'Five-Year Legend', subtitle: 'Longer-term life goals.' },
  ];

  sections.forEach((section) => {
    const card = document.createElement('section');
    card.className = 'card checklist-card';

    const header = document.createElement('div');
    header.className = 'card-header';
    const title = document.createElement('h2');
    title.textContent = section.title;

    const actions = document.createElement('div');
    actions.className = 'card-actions';

    const addButton = document.createElement('button');
    addButton.type = 'button';
    addButton.textContent = 'Add item';
    addButton.addEventListener('click', () => {
      const text = window.prompt(`Add an item to ${section.title}`);
      if (!text) return;
      state.checklists[section.key].push({ text: text.trim(), done: false, priority: 'medium' });
      saveState();
      render();
    });

    if (section.key === 'quarterly') {
      const resetButton = document.createElement('button');
      resetButton.type = 'button';
      resetButton.className = 'secondary-button';
      resetButton.textContent = 'Reset this quarter';
      resetButton.addEventListener('click', () => {
        state.checklists.quarterly = state.checklists.quarterly.map((item) => ({ ...item, done: false }));
        saveState();
        render();
      });
      actions.appendChild(resetButton);
    }

    if (section.key === 'yearly') {
      const resetButton = document.createElement('button');
      resetButton.type = 'button';
      resetButton.className = 'secondary-button';
      resetButton.textContent = 'Reset this year';
      resetButton.addEventListener('click', () => {
        state.checklists.yearly = state.checklists.yearly.map((item) => ({ ...item, done: false }));
        saveState();
        render();
      });
      actions.appendChild(resetButton);
    }

    actions.appendChild(addButton);
    header.appendChild(title);
    header.appendChild(actions);

    const subtitle = document.createElement('p');
    subtitle.className = 'status-text';
    subtitle.textContent = section.subtitle;

    const summary = document.createElement('p');
    summary.className = 'progress-summary';
    const items = state.checklists[section.key] || [];
    const completed = items.filter((item) => item.done).length;
    const percent = items.length ? Math.round((completed / items.length) * 100) : 0;
    summary.textContent = `${completed}/${items.length} done • ${percent}%`;

    const list = document.createElement('ul');
    list.className = 'task-list';

    if (items.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'empty-state';
      empty.textContent = 'No items yet.';
      list.appendChild(empty);
    } else {
      items.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = `task-item${item.done ? ' done' : ''}`;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'checkbox';
        checkbox.checked = item.done;
        checkbox.addEventListener('change', () => {
          state.checklists[section.key][index].done = checkbox.checked;
          saveState();
          render();
          if (checkbox.checked) {
            launchConfetti();
          }
        });

        const label = document.createElement('span');
        label.className = 'task-label';
        label.textContent = item.text;

        const attributeBadge = document.createElement('span');
        attributeBadge.className = 'attribute-badge';
        attributeBadge.textContent = `Attr: ${item.attribute || 'None'}`;

        const priorityControl = document.createElement('div');
        priorityControl.className = 'priority-control';

        const priorityLabel = document.createElement('span');
        priorityLabel.className = 'priority-label';
        priorityLabel.textContent = 'Priority';

        const prioritySelect = document.createElement('select');
        prioritySelect.className = 'priority-select';
        prioritySelect.value = item.priority || 'medium';
        PRIORITY_OPTIONS.forEach((optionValue) => {
          const option = document.createElement('option');
          option.value = optionValue;
          option.textContent = optionValue.charAt(0).toUpperCase() + optionValue.slice(1);
          prioritySelect.appendChild(option);
        });
        prioritySelect.addEventListener('change', () => {
          state.checklists[section.key][index].priority = prioritySelect.value;
          saveState();
          render();
        });

        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'icon-button';
        deleteButton.textContent = '×';
        deleteButton.setAttribute('aria-label', `Delete ${item.text}`);
        deleteButton.addEventListener('click', () => {
          state.checklists[section.key].splice(index, 1);
          saveState();
          render();
        });

        priorityControl.appendChild(priorityLabel);
        priorityControl.appendChild(prioritySelect);

        li.appendChild(checkbox);
        li.appendChild(label);
        li.appendChild(attributeBadge);
        li.appendChild(priorityControl);
        li.appendChild(deleteButton);
        list.appendChild(li);
      });
    }

    card.appendChild(header);
    card.appendChild(subtitle);
    card.appendChild(summary);
    card.appendChild(list);
    checklistSections.appendChild(card);
  });
}

themeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const nextTheme = button.dataset.theme;
    document.body.dataset.theme = nextTheme;
    themeButtons.forEach((option) => option.classList.toggle('active', option === button));
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  });
});

const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'fantasy';
document.body.dataset.theme = savedTheme;
themeButtons.forEach((button) => button.classList.toggle('active', button.dataset.theme === savedTheme));

function render() {
  const dayChanged = ensureTodayState();
  const total = state.unconditionals.length;
  const completed = state.unconditionals.filter((task) => task.done).length;
  const percent = total ? Math.round((completed / total) * 100) : 0;
  const streak = calculateStreak(state.history);
  const level = getLevelFromXp(Number(state.xp) || 0);
  const xpProgress = getXpProgressPercent(Number(state.xp) || 0);
  const overallXp = Number(state.xp) || 0;

  const dailyMetaRequirementCount = 2;
  const requiredDailyCount = state.unconditionals.length + dailyMetaRequirementCount;
  const completedRequiredCount = completed + (state.mood ? 1 : 0) + (state.currentWeight ? 1 : 0);
  const dailyPercent = requiredDailyCount ? Math.round((completedRequiredCount / requiredDailyCount) * 100) : 0;

  completedCountEl.textContent = `${completedRequiredCount}`;
  progressPercentEl.textContent = `${dailyPercent}%`;
  streakCountEl.textContent = `${streak}`;
  xpCountEl.textContent = `${overallXp}`;
  levelCountEl.textContent = `${level}`;
  if (heroLevelEl) {
    heroLevelEl.textContent = `${level}`;
  }

  const allDone = total > 0 && completed === total;
  todayStatusEl.textContent = dayChanged
    ? 'A fresh day has started — your checklist is reset.'
    : allDone
      ? 'Nice work — you hit everything today.'
      : total === 0
        ? 'Your daily checklist is ready for today.'
        : `${total - completed} left to go today.`;

  if ('Notification' in window) {
    const permission = Notification.permission;
    reminderStatusEl.textContent = state.reminderEnabled
      ? permission === 'granted'
        ? 'Reminders are on.'
        : 'Notification permission is needed.'
      : 'Reminders are off.';
    notificationsButton.textContent = state.reminderEnabled ? 'Reminders on' : 'Enable reminders';
    notificationsButton.disabled = !('Notification' in window) || state.reminderEnabled;
  } else {
    reminderStatusEl.textContent = 'Notifications are not supported here.';
    notificationsButton.textContent = 'Enable reminders';
    notificationsButton.disabled = true;
  }

  if (syncStatusEl) {
    syncStatusEl.textContent = syncStatusMessage;
  }

  updateDailyMeta();
  renderAttributeSummary();
  renderDailyChecklist();
  renderConditionalChecklist();
  renderLongTermChecklists();
}

resetButton.addEventListener('click', () => {
  state.unconditionals = state.unconditionals.map((task) => ({ ...task, done: false, attribute: getFixedAttribute(task.text) }));
  state.conditionals = state.conditionals.map((task) => ({ ...task, done: false, completedDate: '', xpEarned: 0, attribute: getFixedAttribute(task.text) }));
  state.history = state.history.filter((day) => day !== getTodayKey());
  saveState();
  render();
});

logoutButton?.addEventListener('click', async () => {
  const syncAdapter = getSyncAdapter();
  if (!syncAdapter?.enabled) {
    redirectToLogin();
    return;
  }

  logoutButton.disabled = true;
  const result = await syncAdapter.signOut();
  logoutButton.disabled = false;

  if (!result.ok) {
    setSyncStatus(result.message);
    return;
  }

  redirectToLogin();
});

notificationsButton.addEventListener('click', async () => {
  if (!('Notification' in window)) {
    reminderStatusEl.textContent = 'Notifications are not supported here.';
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    state.reminderEnabled = true;
    saveState();
    scheduleReminders();
    render();
  } else {
    reminderStatusEl.textContent = 'Notification permission was not granted.';
  }
});

moodSelect.addEventListener('change', () => {
  state.mood = moodSelect.value;
  saveState();
  render();
});

weightSaveButton.addEventListener('click', () => {
  saveWeightEntry();
});

weightInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    saveWeightEntry();
  }
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js').catch(() => {});
}

window.addEventListener('online', () => {
  if (currentUser?.id) {
    persistStateToSupabase(true);
  }
});

async function initializeApp() {
  try {
    const syncAdapter = getSyncAdapter();

    if (!syncAdapter?.enabled) {
      setBootStatus('Supabase auth is not configured.');
      setSyncStatus('Supabase auth is not configured.');
      showAppShell();
      render();
      return;
    }

    if (typeof syncAdapter.getSession !== 'function') {
      setBootStatus('Auth module is outdated. Hard refresh this page and redeploy if needed.');
      return;
    }

    setBootStatus('Checking your account...');

    if (typeof syncAdapter.consumeAuthRedirect === 'function') {
      const authRedirectResult = await syncAdapter.consumeAuthRedirect();
      if (!authRedirectResult.ok) {
        setBootStatus(authRedirectResult.message);
        setSyncStatus(authRedirectResult.message);
        return;
      }

      if (authRedirectResult.session?.user && typeof syncAdapter.clearAuthParamsFromUrl === 'function') {
        syncAdapter.clearAuthParamsFromUrl();
      }
    }

    const sessionResult = await syncAdapter.getSession();

    if (!sessionResult.ok) {
      setBootStatus(sessionResult.message);
      return;
    }

    if (!sessionResult.session?.user) {
      redirectToLogin();
      return;
    }

    currentUser = sessionResult.session.user;
    state = loadLocalState(currentUser);
    ensureStateShape();
    updateAccountUi();
    showAppShell();
    scheduleReminders();
    render();
    await hydrateStateFromSupabase();
    await syncAdapter.logReadWriteTest();

    syncAdapter.onAuthStateChange((session) => {
      if (!session?.user) {
        redirectToLogin();
        return;
      }

      if (session.user.id !== currentUser?.id) {
        window.location.reload();
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected auth initialization error.';
    setBootStatus(`Could not initialize account session. ${message}`);
    setSyncStatus(`Could not initialize account session. ${message}`);
  }
}

initializeApp();
