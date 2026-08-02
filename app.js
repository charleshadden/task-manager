const STORAGE_KEY = 'habit-checklist-v1';
const THEME_STORAGE_KEY = 'habit-checklist-theme';
const REMINDER_HOUR = 21;
const REMINDER_MINUTE = 0;
const SYNC_DEBOUNCE_MS = 400;
const PRIORITY_OPTIONS = ['low', 'medium', 'high'];
const ATTRIBUTE_OPTIONS = ['None', 'Strength', 'Dexterity', 'Wisdom', 'Intelligence', 'Charisma', 'Constitution'];
const LEVEL_XP_TIERS = [
  { maxLevel: 5, xpPerLevel: 10000 },
  { maxLevel: 10, xpPerLevel: 15000 },
  { maxLevel: 15, xpPerLevel: 20000 },
  { maxLevel: 20, xpPerLevel: 30000 },
];
const ATTRIBUTE_XP_PER_POINT = 10000;
const DAILY_QUEST_XP = 1;
const DAILY_STREAK_BONUS_XP = 1000;
const ATTRIBUTE_NAMES = ['Strength', 'Dexterity', 'Wisdom', 'Intelligence', 'Charisma', 'Constitution'];
const DEFAULT_PLAYER_CLASS = 'Fighter';
const DEFAULT_ARCHETYPE = 'Champion';
const FOOD_SEARCH_LIMIT = 8;

const LOCAL_FOOD_LIBRARY = [
  { name: 'Banana (1 medium)', calories: 105, protein: 1, carbs: 27, fat: 0 },
  { name: 'Apple (1 medium)', calories: 95, protein: 0, carbs: 25, fat: 0 },
  { name: 'Blueberries (1 cup)', calories: 84, protein: 1, carbs: 21, fat: 0 },
  { name: 'Egg (1 large)', calories: 72, protein: 6, carbs: 0, fat: 5 },
  { name: 'Egg Whites (100g)', calories: 52, protein: 11, carbs: 1, fat: 0 },
  { name: 'Chicken Breast, cooked (100g)', calories: 165, protein: 31, carbs: 0, fat: 4 },
  { name: 'Ground Beef 90/10, cooked (100g)', calories: 217, protein: 26, carbs: 0, fat: 12 },
  { name: 'Salmon, cooked (100g)', calories: 206, protein: 22, carbs: 0, fat: 12 },
  { name: 'Greek Yogurt, nonfat (170g)', calories: 100, protein: 17, carbs: 6, fat: 0 },
  { name: 'Cottage Cheese 2% (1/2 cup)', calories: 90, protein: 12, carbs: 4, fat: 2 },
  { name: 'White Rice, cooked (1 cup)', calories: 205, protein: 4, carbs: 45, fat: 0 },
  { name: 'Brown Rice, cooked (1 cup)', calories: 216, protein: 5, carbs: 45, fat: 2 },
  { name: 'Oats, dry (1/2 cup)', calories: 150, protein: 5, carbs: 27, fat: 3 },
  { name: 'Bread, whole wheat (1 slice)', calories: 80, protein: 4, carbs: 14, fat: 1 },
  { name: 'Sweet Potato, baked (1 medium)', calories: 112, protein: 2, carbs: 26, fat: 0 },
  { name: 'Potato, baked (1 medium)', calories: 161, protein: 4, carbs: 37, fat: 0 },
  { name: 'Avocado (1/2 medium)', calories: 120, protein: 2, carbs: 6, fat: 11 },
  { name: 'Almonds (28g)', calories: 164, protein: 6, carbs: 6, fat: 14 },
  { name: 'Peanut Butter (1 tbsp)', calories: 95, protein: 4, carbs: 3, fat: 8 },
  { name: 'Olive Oil (1 tbsp)', calories: 119, protein: 0, carbs: 0, fat: 14 },
  { name: 'Broccoli, cooked (1 cup)', calories: 55, protein: 4, carbs: 11, fat: 1 },
  { name: 'Spinach, raw (2 cups)', calories: 14, protein: 2, carbs: 2, fat: 0 },
  { name: 'Black Beans, cooked (1/2 cup)', calories: 114, protein: 8, carbs: 20, fat: 0 },
  { name: 'Lentils, cooked (1/2 cup)', calories: 115, protein: 9, carbs: 20, fat: 0 },
  { name: 'Protein Shake (1 scoop)', calories: 120, protein: 24, carbs: 3, fat: 1 },
];

const defaultUnconditionals = [
  { id: 'steps', text: 'Get your steps', done: false, attribute: 'Constitution' },
  { id: 'hydration', text: 'Hydration milestone', done: false, attribute: 'Constitution' },
  { id: 'dogs', text: 'Give the dogs attention', done: false, attribute: 'Wisdom' },
  { id: 'affirmation', text: 'Give words of affirmation', done: false, attribute: 'Charisma' },
];

const defaultConditionals = [
  {
    id: 'rucking',
    text: 'Rucking',
    done: false,
    attribute: 'Constitution',
    baseXp: 20,
    characteristics: [
      { key: 'distanceMiles', label: 'Distance', type: 'number', unit: 'mi', min: 0 },
      { key: 'weightLbs', label: 'Weight carried', type: 'number', unit: 'lb', min: 0 },
      { key: 'hills', label: 'Hills', type: 'boolean' },
    ],
  },
  { id: 'workout', text: 'Workout', done: false, attribute: 'Strength', baseXp: 22 },
  {
    id: 'reading',
    text: 'Reading',
    done: false,
    attribute: 'Wisdom',
    baseXp: 18,
    characteristics: [
      { key: 'minutes', label: 'Time', type: 'number', unit: 'min', min: 0 },
    ],
  },
  { id: 'outside', text: 'Outside time', done: false, attribute: 'Dexterity', baseXp: 18 },
  { id: 'journaling', text: 'Journaling', done: false, attribute: 'Intelligence', baseXp: 16 },
  { id: 'distraction-free', text: 'Distraction free time', done: false, attribute: 'Wisdom', baseXp: 16 },
  { id: 'service', text: 'Acts of service', done: false, attribute: 'Charisma', baseXp: 16 },
  { id: 'app-building', text: 'App building', done: false, attribute: 'Intelligence', baseXp: 24 },
  { id: 'diet', text: 'Diet adherence', done: false, attribute: 'Constitution', baseXp: 20 },
  { id: 'sleep', text: 'Sleep quality', done: false, attribute: 'Constitution', baseXp: 18 },
  { id: 'mobility', text: 'Mobility/stretching', done: false, attribute: 'Dexterity', baseXp: 16 },
  { id: 'agility', text: 'Agility/footwork', done: false, attribute: 'Dexterity', baseXp: 18 },
  { id: 'craft', text: 'Fine motor/craft work', done: false, attribute: 'Dexterity', baseXp: 16 },
];

const defaultConditionalsById = Object.fromEntries(defaultConditionals.map((item) => [item.id, item]));

const defaultChecklistSections = {
  weekly: [],
  quarterly: [],
  yearly: [],
  fiveYear: [],
};

function createDefaultAttributes() {
  return ATTRIBUTE_NAMES.reduce((acc, name) => {
    acc[name] = 0;
    return acc;
  }, {});
}

function createDefaultBaseAttributes() {
  return ATTRIBUTE_NAMES.reduce((acc, name) => {
    acc[name] = 0;
    return acc;
  }, {});
}

function createEmptyMacroValues() {
  return {
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
  };
}

function createEmptyMacroGoalValues() {
  return {
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
  };
}

function createDefaultTotals() {
  const dailyTaskCompletions = {};
  const dailyTaskXpEarned = {};
  const adventureCompletions = {};
  const adventureXpEarned = {};

  defaultUnconditionals.forEach((item) => {
    dailyTaskCompletions[item.id] = 0;
    dailyTaskXpEarned[item.id] = 0;
  });

  defaultConditionals.forEach((item) => {
    adventureCompletions[item.id] = 0;
    adventureXpEarned[item.id] = 0;
  });

  return {
    dailyCompletions: 0,
    dailyXpEarned: 0,
    adventureCompletions,
    adventureXpEarned,
    dailyTaskCompletions,
    dailyTaskXpEarned,
  };
}

function createDefaultState() {
  return {
    unconditionals: [...defaultUnconditionals].map(normalizeUnconditionalItem),
    conditionals: [...defaultConditionals].map(normalizeConditionalItem),
    xp: 0,
    attributes: createDefaultAttributes(),
    baseAttributes: createDefaultBaseAttributes(),
    history: [],
    streakBonusesAwarded: [],
    totals: createDefaultTotals(),
    playerClass: DEFAULT_PLAYER_CLASS,
    playerArchetype: DEFAULT_ARCHETYPE,
    achievements: [],
    assessmentApplied: false,
    lastSeenDate: getTodayKey(),
    reminderEnabled: false,
    lastNotifiedLevel: 0,
    lastAllTasksNotificationDate: '',
    checklists: {
      weekly: [],
      quarterly: [],
      yearly: [],
      fiveYear: [],
    },
    mood: '',
    moodLog: [],
    stepsLog: [],
    weightLog: [],
    currentWeight: '',
    mealLog: [],
    savedFoods: [],
    macroLog: [],
    currentMacros: createEmptyMacroValues(),
    macroGoals: createEmptyMacroGoalValues(),
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
let communityFoodLibrary = [];
const socialHub = {
  profile: { userId: '', displayName: '', photoUrl: '' },
  following: [],
  followers: [],
  parties: [],
  searchResults: [],
};

function persistLocalState() {
  if (!currentUser?.id) return;
  localStorage.setItem(getStorageKeyForUser(currentUser), JSON.stringify(state));
}

function updateStateTimestamp() {
  state.updatedAt = new Date().toISOString();
}

function ensureTotalsShape() {
  if (!state.totals || typeof state.totals !== 'object') {
    state.totals = createDefaultTotals();
    return;
  }

  state.totals.dailyCompletions = Number.isFinite(Number(state.totals.dailyCompletions)) ? Number(state.totals.dailyCompletions) : 0;
  state.totals.dailyXpEarned = Number.isFinite(Number(state.totals.dailyXpEarned)) ? Number(state.totals.dailyXpEarned) : 0;
  state.totals.adventureCompletions = state.totals.adventureCompletions && typeof state.totals.adventureCompletions === 'object' ? state.totals.adventureCompletions : {};
  state.totals.adventureXpEarned = state.totals.adventureXpEarned && typeof state.totals.adventureXpEarned === 'object' ? state.totals.adventureXpEarned : {};
  state.totals.dailyTaskCompletions = state.totals.dailyTaskCompletions && typeof state.totals.dailyTaskCompletions === 'object' ? state.totals.dailyTaskCompletions : {};
  state.totals.dailyTaskXpEarned = state.totals.dailyTaskXpEarned && typeof state.totals.dailyTaskXpEarned === 'object' ? state.totals.dailyTaskXpEarned : {};

  state.unconditionals.forEach((task) => {
    if (!task?.id) return;
    const countValue = state.totals.dailyTaskCompletions[task.id];
    const xpValue = state.totals.dailyTaskXpEarned[task.id];
    state.totals.dailyTaskCompletions[task.id] = Number.isFinite(Number(countValue)) ? Number(countValue) : 0;
    state.totals.dailyTaskXpEarned[task.id] = Number.isFinite(Number(xpValue)) ? Number(xpValue) : 0;
  });

  state.conditionals.forEach((task) => {
    if (!task?.id) return;
    const countValue = state.totals.adventureCompletions[task.id];
    const xpValue = state.totals.adventureXpEarned[task.id];
    state.totals.adventureCompletions[task.id] = Number.isFinite(Number(countValue)) ? Number(countValue) : 0;
    state.totals.adventureXpEarned[task.id] = Number.isFinite(Number(xpValue)) ? Number(xpValue) : 0;
  });
}

function updateLifetimeTotals(group, taskId, completionDelta, xpDelta) {
  ensureTotalsShape();

  if (group === 'daily') {
    state.totals.dailyCompletions = Math.max(0, (Number(state.totals.dailyCompletions) || 0) + completionDelta);
    state.totals.dailyXpEarned = Math.max(0, (Number(state.totals.dailyXpEarned) || 0) + xpDelta);
    const prevCount = Number(state.totals.dailyTaskCompletions[taskId]) || 0;
    const prevXp = Number(state.totals.dailyTaskXpEarned[taskId]) || 0;
    state.totals.dailyTaskCompletions[taskId] = Math.max(0, prevCount + completionDelta);
    state.totals.dailyTaskXpEarned[taskId] = Math.max(0, prevXp + xpDelta);
    return;
  }

  if (group === 'adventure') {
    const prevCount = Number(state.totals.adventureCompletions[taskId]) || 0;
    const prevXp = Number(state.totals.adventureXpEarned[taskId]) || 0;
    state.totals.adventureCompletions[taskId] = Math.max(0, prevCount + completionDelta);
    state.totals.adventureXpEarned[taskId] = Math.max(0, prevXp + xpDelta);
  }
}

function ensureStateShape() {
  state.unconditionals = Array.isArray(state.unconditionals) && state.unconditionals.length > 0
    ? state.unconditionals.map(normalizeUnconditionalItem)
    : [...defaultUnconditionals].map(normalizeUnconditionalItem);

  // Remove legacy daily tasks now covered by daily meta rows.
  state.unconditionals = state.unconditionals.filter((task) => task?.id !== 'weight' && task?.id !== 'mood');

  defaultUnconditionals.forEach((defaultTask) => {
    if (!defaultTask?.id) return;
    const exists = state.unconditionals.some((task) => task?.id === defaultTask.id);
    if (!exists) {
      state.unconditionals.push(normalizeUnconditionalItem(defaultTask));
    }
  });

  state.conditionals = Array.isArray(state.conditionals) && state.conditionals.length > 0
    ? state.conditionals.map(normalizeConditionalItem)
    : [...defaultConditionals].map(normalizeConditionalItem);

  const legacyHydration = state.conditionals.find((task) => task?.id === 'hydration') || null;
  state.conditionals = state.conditionals.filter((task) => task?.id !== 'hydration');

  const hydrationDailyIndex = state.unconditionals.findIndex((task) => task?.id === 'hydration');
  if (legacyHydration && hydrationDailyIndex >= 0) {
    const legacyCups = getConditionalCharacteristicNumber(legacyHydration, 'cups');
    const existingCups = Number(state.unconditionals[hydrationDailyIndex].hydrationCups) || 0;
    state.unconditionals[hydrationDailyIndex].hydrationCups = Math.max(0, Math.min(10, Math.round(Math.max(existingCups, legacyCups))));

    if (!state.unconditionals[hydrationDailyIndex].done && legacyHydration.done) {
      state.unconditionals[hydrationDailyIndex].done = true;
      state.unconditionals[hydrationDailyIndex].completedDate = legacyHydration.completedDate || state.unconditionals[hydrationDailyIndex].completedDate;
      state.unconditionals[hydrationDailyIndex].lastAwardedXp = Number(legacyHydration.lastAwardedXp) || state.unconditionals[hydrationDailyIndex].lastAwardedXp;
    }
  }

  state.xp = Number.isFinite(Number(state.xp)) ? Number(state.xp) : 0;
  state.attributes = state.attributes && typeof state.attributes === 'object'
    ? { ...createDefaultAttributes(), ...state.attributes }
    : createDefaultAttributes();
  state.baseAttributes = state.baseAttributes && typeof state.baseAttributes === 'object'
    ? { ...createDefaultBaseAttributes(), ...state.baseAttributes }
    : createDefaultBaseAttributes();
  state.streakBonusesAwarded = Array.isArray(state.streakBonusesAwarded) ? state.streakBonusesAwarded : [];
  state.playerClass = typeof state.playerClass === 'string' && state.playerClass.trim()
    ? state.playerClass.trim()
    : DEFAULT_PLAYER_CLASS;
  state.playerArchetype = typeof state.playerArchetype === 'string' && state.playerArchetype.trim()
    ? state.playerArchetype.trim()
    : DEFAULT_ARCHETYPE;
  state.achievements = Array.isArray(state.achievements)
    ? state.achievements.filter((entry) => entry && typeof entry === 'object' && entry.id && entry.title)
    : [];
  state.assessmentApplied = Boolean(state.assessmentApplied);
  state.lastNotifiedLevel = Number.isFinite(Number(state.lastNotifiedLevel))
    ? Number(state.lastNotifiedLevel)
    : getLevelFromXp(state.xp);
  state.lastAllTasksNotificationDate = typeof state.lastAllTasksNotificationDate === 'string'
    ? state.lastAllTasksNotificationDate
    : '';

  if (!state.checklists || typeof state.checklists !== 'object') {
    state.checklists = { ...defaultChecklistSections };
  }

  state.checklists.weekly = Array.isArray(state.checklists.weekly) ? state.checklists.weekly.map((item) => normalizeChecklistItem(item, 'weekly')) : [];
  state.checklists.quarterly = Array.isArray(state.checklists.quarterly) ? state.checklists.quarterly.map((item) => normalizeChecklistItem(item, 'quarterly')) : [];
  state.checklists.yearly = Array.isArray(state.checklists.yearly) ? state.checklists.yearly.map((item) => normalizeChecklistItem(item, 'yearly')) : [];
  state.checklists.fiveYear = Array.isArray(state.checklists.fiveYear) ? state.checklists.fiveYear.map((item) => normalizeChecklistItem(item, 'fiveYear')) : [];

  state.mood = state.mood || '';
  state.moodLog = Array.isArray(state.moodLog) ? state.moodLog : [];
  state.stepsLog = Array.isArray(state.stepsLog) ? state.stepsLog : [];
  state.weightLog = Array.isArray(state.weightLog) ? state.weightLog : [];
  state.currentWeight = state.currentWeight || '';
  state.mealLog = Array.isArray(state.mealLog)
    ? state.mealLog.filter((entry) => entry && typeof entry === 'object' && entry.id && entry.date)
    : [];
  state.savedFoods = Array.isArray(state.savedFoods)
    ? state.savedFoods.map((item) => normalizeSavedFoodItem(item)).filter(Boolean)
    : [];
  state.macroLog = Array.isArray(state.macroLog) ? state.macroLog : [];
  state.currentMacros = state.currentMacros && typeof state.currentMacros === 'object'
    ? { ...createEmptyMacroValues(), ...state.currentMacros }
    : createEmptyMacroValues();
  state.macroGoals = state.macroGoals && typeof state.macroGoals === 'object'
    ? { ...createEmptyMacroGoalValues(), ...state.macroGoals }
    : createEmptyMacroGoalValues();

  if (getTodayMealEntries().length > 0) {
    recalculateTodayMacrosFromMeals();
  }

  ATTRIBUTE_NAMES.forEach((attributeName) => {
    const rawXp = Math.max(0, Number(state.attributes?.[attributeName]) || 0);
    const promotablePoints = Math.floor(rawXp / ATTRIBUTE_XP_PER_POINT);
    if (promotablePoints <= 0) return;

    state.baseAttributes[attributeName] = Math.max(0, Number(state.baseAttributes?.[attributeName]) || 0) + promotablePoints;
    state.attributes[attributeName] = rawXp - (promotablePoints * ATTRIBUTE_XP_PER_POINT);
  });

  ensureTotalsShape();
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
const levelProgressTextEl = document.getElementById('levelProgressText');
const todayStatusEl = document.getElementById('todayStatus');
const heroLevelEl = document.getElementById('heroLevel');
const heroClassNameEl = document.getElementById('heroClassName');
const heroArchetypeEl = document.getElementById('heroArchetype');
const resetButton = document.getElementById('resetButton');
const notificationsButton = document.getElementById('notificationsButton');
const reminderStatusEl = document.getElementById('reminderStatus');
const syncStatusEl = document.getElementById('syncStatus');
const accountEmailEl = document.getElementById('accountEmail');
const logoutButton = document.getElementById('logoutButton');
const checklistSections = document.getElementById('checklistSections');
const moodPicker = document.getElementById('moodPicker');
const weightInput = document.getElementById('weightInput');
const weightSaveButton = document.getElementById('weightSaveButton');
const macroCaloriesInput = document.getElementById('macroCaloriesInput');
const macroProteinInput = document.getElementById('macroProteinInput');
const macroCarbsInput = document.getElementById('macroCarbsInput');
const macroFatInput = document.getElementById('macroFatInput');
const macroSaveButton = document.getElementById('macroSaveButton');
const addMealButton = document.getElementById('addMealButton');
const macroProgressStatus = document.getElementById('macroProgressStatus');
const mealEntriesList = document.getElementById('mealEntriesList');
const foodLookupQueryInput = document.getElementById('foodLookupQueryInput');
const foodLookupSearchButton = document.getElementById('foodLookupSearchButton');
const addSharedFoodButton = document.getElementById('addSharedFoodButton');
const foodLookupSearchStatus = document.getElementById('foodLookupSearchStatus');
const foodLookupSearchResults = document.getElementById('foodLookupSearchResults');
const addMealDialog = document.getElementById('addMealDialog');
const addMealForm = document.getElementById('addMealForm');
const mealBuilderTabButton = document.getElementById('mealBuilderTabButton');
const mealHistoryTabButton = document.getElementById('mealHistoryTabButton');
const mealBuilderPanel = document.getElementById('mealBuilderPanel');
const mealHistoryPanel = document.getElementById('mealHistoryPanel');
const mealHistoryDateInput = document.getElementById('mealHistoryDateInput');
const mealHistoryDailySummary = document.getElementById('mealHistoryDailySummary');
const mealHistorySevenDaySummary = document.getElementById('mealHistorySevenDaySummary');
const mealHistoryAlcoholSummary = document.getElementById('mealHistoryAlcoholSummary');
const mealHistoryItemsList = document.getElementById('mealHistoryItemsList');
const mealHistoryRangeChipButtons = Array.from(document.querySelectorAll('.meal-history-range-chip'));
const mealHistoryChart = document.getElementById('mealHistoryChart');
const mealHistoryChartEmpty = document.getElementById('mealHistoryChartEmpty');
const mealTypeInput = document.getElementById('mealTypeInput');
const mealTypeCustomField = document.getElementById('mealTypeCustomField');
const mealTypeCustomInput = document.getElementById('mealTypeCustomInput');
const mealFoodFields = document.getElementById('mealFoodFields');
const mealFoodSearchInput = document.getElementById('mealFoodSearchInput');
const mealFoodSearchStatus = document.getElementById('mealFoodSearchStatus');
const mealFoodSearchResults = document.getElementById('mealFoodSearchResults');
const mealAlcoholFields = document.getElementById('mealAlcoholFields');
const mealItemNameInput = document.getElementById('mealItemNameInput');
const mealItemCaloriesInput = document.getElementById('mealItemCaloriesInput');
const mealItemProteinInput = document.getElementById('mealItemProteinInput');
const mealItemCarbsInput = document.getElementById('mealItemCarbsInput');
const mealItemFatInput = document.getElementById('mealItemFatInput');
const saveMealItemToMyFoodsCheckbox = document.getElementById('saveMealItemToMyFoodsCheckbox');
const alcoholDrinkTypeInput = document.getElementById('alcoholDrinkTypeInput');
const alcoholDrinkCountInput = document.getElementById('alcoholDrinkCountInput');
const addMealItemButton = document.getElementById('addMealItemButton');
const mealDraftItemsList = document.getElementById('mealDraftItemsList');
const mealDraftTotals = document.getElementById('mealDraftTotals');
const mealDialogStatus = document.getElementById('mealDialogStatus');
const saveMealButton = document.getElementById('saveMealButton');
const cancelMealButton = document.getElementById('cancelMealButton');
const addChecklistDialog = document.getElementById('addChecklistDialog');
const addChecklistForm = document.getElementById('addChecklistForm');
const addChecklistDialogTitle = document.getElementById('addChecklistDialogTitle');
const checklistItemTextInput = document.getElementById('checklistItemTextInput');
const checklistProgressField = document.getElementById('checklistProgressField');
const checklistProgressInput = document.getElementById('checklistProgressInput');
const cancelChecklistItemButton = document.getElementById('cancelChecklistItemButton');
const profilePhotoPreviewEl = document.getElementById('profilePhotoPreview');
const profilePhotoFallbackEl = document.getElementById('profilePhotoFallback');
const profileDisplayNameInput = document.getElementById('profileDisplayNameInput');
const profilePhotoUrlInput = document.getElementById('profilePhotoUrlInput');
const saveProfileButton = document.getElementById('saveProfileButton');
const profileStatusEl = document.getElementById('profileStatus');
const socialStatusEl = document.getElementById('socialStatus');
const followSearchInput = document.getElementById('followSearchInput');
const followSearchButton = document.getElementById('followSearchButton');
const followSearchResultsEl = document.getElementById('followSearchResults');
const followingListEl = document.getElementById('followingList');
const followersListEl = document.getElementById('followersList');
const createPartyNameInput = document.getElementById('createPartyNameInput');
const createPartyButton = document.getElementById('createPartyButton');
const joinPartyIdInput = document.getElementById('joinPartyIdInput');
const joinPartyButton = document.getElementById('joinPartyButton');
const partyListEl = document.getElementById('partyList');
const moodOptions = [
  { value: '😄', label: 'Happy' },
  { value: '😌', label: 'Calm' },
  { value: '😐', label: 'Neutral' },
  { value: '😔', label: 'Low' },
  { value: '😤', label: 'Stressed' },
];

let activeChecklistSectionKey = '';
let draftMealItems = [];
let activeMealDialogTab = 'builder';
let activeMealHistoryRangeDays = 7;

const ALCOHOL_MACROS_PER_DRINK = {
  beer: { label: 'Beer', calories: 153, protein: 2, carbs: 13, fat: 0 },
  wine: { label: 'Wine', calories: 125, protein: 0, carbs: 4, fat: 0 },
  spirit: { label: 'Liquor shot', calories: 97, protein: 0, carbs: 0, fat: 0 },
  cocktail: { label: 'Cocktail', calories: 200, protein: 0, carbs: 18, fat: 0 },
  seltzer: { label: 'Hard seltzer', calories: 100, protein: 0, carbs: 2, fat: 0 },
  cider: { label: 'Cider', calories: 190, protein: 0, carbs: 21, fat: 0 },
};

const ALCOHOL_FOOD_LABELS = Object.values(ALCOHOL_MACROS_PER_DRINK)
  .map((item) => String(item.label || '').toLowerCase())
  .filter(Boolean);

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
    appBootStatusEl.style.display = 'none';
  }

  if (appShell) {
    appShell.hidden = false;
    appShell.style.display = '';
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

function setProfileStatus(message) {
  if (profileStatusEl) {
    profileStatusEl.textContent = message;
  }
}

function setSocialStatus(message) {
  if (socialStatusEl) {
    socialStatusEl.textContent = message;
  }
}

function getProfileDisplayName(profile) {
  const name = String(profile?.displayName || '').trim();
  if (name) return name;
  const fallback = String(currentUser?.email || '').split('@')[0];
  return fallback || 'Adventurer';
}

function normalizePhotoUrl(url) {
  const value = String(url || '').trim();
  if (!value) return '';
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return '';
    }
    return parsed.toString();
  } catch {
    return '';
  }
}

function getDisplayInitial(displayName) {
  const first = String(displayName || '').trim().charAt(0);
  return first ? first.toUpperCase() : 'A';
}

function createSocialListItem(profile, actionLabel = '', actionHandler = null) {
  const item = document.createElement('li');
  item.className = 'social-item';

  const avatar = document.createElement('div');
  avatar.className = 'social-avatar';
  avatar.textContent = getDisplayInitial(getProfileDisplayName(profile));

  const text = document.createElement('div');
  text.className = 'social-item-text';
  text.textContent = getProfileDisplayName(profile);

  item.appendChild(avatar);
  item.appendChild(text);

  if (actionLabel && typeof actionHandler === 'function') {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'secondary-button';
    button.textContent = actionLabel;
    button.addEventListener('click', actionHandler);
    item.appendChild(button);
  }

  return item;
}

function renderSocialHub() {
  if (!profileDisplayNameInput || !profilePhotoUrlInput) {
    return;
  }

  const displayName = getProfileDisplayName(socialHub.profile);
  const photoUrl = normalizePhotoUrl(socialHub.profile?.photoUrl);

  if (document.activeElement !== profileDisplayNameInput) {
    profileDisplayNameInput.value = displayName;
  }
  if (document.activeElement !== profilePhotoUrlInput) {
    profilePhotoUrlInput.value = socialHub.profile?.photoUrl || '';
  }

  if (profilePhotoPreviewEl && profilePhotoFallbackEl) {
    if (photoUrl) {
      profilePhotoPreviewEl.src = photoUrl;
      profilePhotoPreviewEl.hidden = false;
      profilePhotoFallbackEl.hidden = true;
    } else {
      profilePhotoPreviewEl.hidden = true;
      profilePhotoFallbackEl.hidden = false;
      profilePhotoFallbackEl.textContent = getDisplayInitial(displayName);
    }
  }

  if (followSearchResultsEl) {
    followSearchResultsEl.innerHTML = '';
    if (socialHub.searchResults.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'empty-state';
      empty.textContent = 'No search results yet.';
      followSearchResultsEl.appendChild(empty);
    } else {
      socialHub.searchResults.forEach((profile) => {
        const isFollowing = socialHub.following.some((entry) => entry.userId === profile.userId);
        const actionLabel = isFollowing ? 'Unfollow' : 'Follow';
        const action = async () => {
          const syncAdapter = getSyncAdapter();
          if (!syncAdapter?.enabled) return;
          const result = isFollowing
            ? await syncAdapter.unfollowUser(profile.userId)
            : await syncAdapter.followUser(profile.userId);
          setSocialStatus(result.message);
          await hydrateSocialHubData();
        };
        followSearchResultsEl.appendChild(createSocialListItem(profile, actionLabel, action));
      });
    }
  }

  if (followingListEl) {
    followingListEl.innerHTML = '';
    if (socialHub.following.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'empty-state';
      empty.textContent = 'You are not following anyone yet.';
      followingListEl.appendChild(empty);
    } else {
      socialHub.following.forEach((profile) => {
        const action = async () => {
          const syncAdapter = getSyncAdapter();
          if (!syncAdapter?.enabled) return;
          const result = await syncAdapter.unfollowUser(profile.userId);
          setSocialStatus(result.message);
          await hydrateSocialHubData();
        };
        followingListEl.appendChild(createSocialListItem(profile, 'Unfollow', action));
      });
    }
  }

  if (followersListEl) {
    followersListEl.innerHTML = '';
    if (socialHub.followers.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'empty-state';
      empty.textContent = 'No followers yet.';
      followersListEl.appendChild(empty);
    } else {
      socialHub.followers.forEach((profile) => {
        followersListEl.appendChild(createSocialListItem(profile));
      });
    }
  }

  if (partyListEl) {
    partyListEl.innerHTML = '';
    if (socialHub.parties.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'empty-state';
      empty.textContent = 'No parties yet. Create one and invite allies.';
      partyListEl.appendChild(empty);
    } else {
      socialHub.parties.forEach((party) => {
        const item = document.createElement('li');
        item.className = 'party-item';

        const title = document.createElement('div');
        title.className = 'party-title';
        title.textContent = `${party.name} (${party.memberCount}/6)`;

        const partyId = document.createElement('div');
        partyId.className = 'party-id';
        partyId.textContent = `Party ID: ${party.id}`;

        const members = document.createElement('div');
        members.className = 'party-members';
        const memberNames = (party.members || []).map((member) => getProfileDisplayName(member));
        members.textContent = memberNames.length > 0 ? memberNames.join(', ') : 'No members yet.';

        item.appendChild(title);
        item.appendChild(partyId);
        item.appendChild(members);
        partyListEl.appendChild(item);
      });
    }
  }
}

async function hydrateSocialHubData() {
  const syncAdapter = getSyncAdapter();
  if (!syncAdapter?.enabled || !currentUser?.id) {
    return;
  }

  if (
    typeof syncAdapter.getMyProfile !== 'function'
    || typeof syncAdapter.listFollowing !== 'function'
    || typeof syncAdapter.listFollowers !== 'function'
    || typeof syncAdapter.listMyParties !== 'function'
  ) {
    setSocialStatus('Social features need a newer deployment.');
    return;
  }

  const [profileResult, followingResult, followersResult, partiesResult] = await Promise.all([
    syncAdapter.getMyProfile(),
    syncAdapter.listFollowing(),
    syncAdapter.listFollowers(),
    syncAdapter.listMyParties(),
  ]);

  const errors = [profileResult, followingResult, followersResult, partiesResult]
    .filter((result) => !result.ok)
    .map((result) => result.message)
    .filter(Boolean);

  if (profileResult.ok && profileResult.profile) {
    socialHub.profile = profileResult.profile;
  }
  if (followingResult.ok) {
    socialHub.following = followingResult.profiles || [];
  }
  if (followersResult.ok) {
    socialHub.followers = followersResult.profiles || [];
  }
  if (partiesResult.ok) {
    socialHub.parties = partiesResult.parties || [];
  }

  if (errors.length > 0) {
    setSocialStatus(errors[0]);
  } else {
    setSocialStatus('Social hub synced.');
  }

  renderSocialHub();
}

async function runFollowSearch() {
  const syncAdapter = getSyncAdapter();
  if (!syncAdapter?.enabled || typeof syncAdapter.searchProfiles !== 'function') {
    setSocialStatus('Profile search is not available yet.');
    return;
  }

  const query = String(followSearchInput?.value || '').trim();
  const result = await syncAdapter.searchProfiles(query);
  if (!result.ok) {
    setSocialStatus(result.message);
    return;
  }

  socialHub.searchResults = result.profiles || [];
  setSocialStatus(result.message);
  renderSocialHub();
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
    renderSocialHub();
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
  const rawProgress = Number(item?.progress);
  const progress = Number.isFinite(rawProgress)
    ? Math.max(0, Math.min(100, Math.round(rawProgress)))
    : (Boolean(item?.done) ? 100 : 0);

  return {
    text: item?.text || '',
    done: Boolean(item?.done) || progress >= 100,
    progress,
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
    completedDate: item?.completedDate || (item?.done ? getTodayKey() : ''),
    stepCount: Number.isFinite(Number(item?.stepCount)) ? Number(item?.stepCount) : '',
    hydrationCups: Number.isFinite(Number(item?.hydrationCups)) ? Math.max(0, Math.min(10, Math.round(Number(item?.hydrationCups)))) : 0,
    lastAwardedXp: Number.isFinite(Number(item?.lastAwardedXp)) ? Number(item?.lastAwardedXp) : 0,
  };
}

function normalizeConditionalItem(item) {
  const template = defaultConditionalsById[item?.id] || null;
  const sourceCharacteristics = Array.isArray(item?.characteristics)
    ? item.characteristics
    : (Array.isArray(template?.characteristics) ? template.characteristics : []);

  const characteristics = sourceCharacteristics.map((characteristic) => ({
    key: characteristic?.key || createId('characteristic'),
    label: characteristic?.label || 'Metric',
    type: characteristic?.type === 'boolean' ? 'boolean' : 'number',
    unit: characteristic?.unit || '',
    min: Number.isFinite(Number(characteristic?.min)) ? Number(characteristic.min) : 0,
  }));

  const sourceValues = item?.characteristicValues && typeof item.characteristicValues === 'object'
    ? item.characteristicValues
    : {};

  const characteristicValues = characteristics.reduce((accumulator, characteristic) => {
    const rawValue = sourceValues[characteristic.key];
    if (characteristic.type === 'boolean') {
      accumulator[characteristic.key] = Boolean(rawValue);
      return accumulator;
    }

    accumulator[characteristic.key] = Number.isFinite(Number(rawValue)) ? Number(rawValue) : '';
    return accumulator;
  }, {});

  return {
    id: item?.id || createId('conditional'),
    text: item?.text || '',
    done: Boolean(item?.done),
    attribute: getFixedAttribute(item?.text),
    baseXp: Number.isFinite(Number(item?.baseXp)) ? Number(item?.baseXp) : 20,
    completedDate: item?.completedDate || (item?.done ? getTodayKey() : ''),
    xpEarned: Number.isFinite(Number(item?.xpEarned)) ? Number(item?.xpEarned) : 0,
    lastAwardedXp: Number.isFinite(Number(item?.lastAwardedXp)) ? Number(item?.lastAwardedXp) : 0,
    characteristics,
    characteristicValues,
  };
}

function getConditionalCharacteristicNumber(item, key) {
  const value = item?.characteristicValues?.[key];
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function getConditionalCharacteristicBoolean(item, key) {
  return Boolean(item?.characteristicValues?.[key]);
}

function calculateConditionalXp(item) {
  if (!item || !item.id) {
    return 0;
  }

  return 0;
}

function calculateUnconditionalXp(task) {
  return 0;
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
      attributes: parsed.attributes && typeof parsed.attributes === 'object'
        ? { ...createDefaultAttributes(), ...parsed.attributes }
        : createDefaultAttributes(),
      baseAttributes: parsed.baseAttributes && typeof parsed.baseAttributes === 'object'
        ? { ...createDefaultBaseAttributes(), ...parsed.baseAttributes }
        : createDefaultBaseAttributes(),
      history: Array.isArray(parsed.history) ? parsed.history : [],
      streakBonusesAwarded: Array.isArray(parsed.streakBonusesAwarded) ? parsed.streakBonusesAwarded : [],
      totals: parsed.totals && typeof parsed.totals === 'object' ? parsed.totals : createDefaultTotals(),
      playerClass: typeof parsed.playerClass === 'string' && parsed.playerClass.trim() ? parsed.playerClass.trim() : DEFAULT_PLAYER_CLASS,
      playerArchetype: typeof parsed.playerArchetype === 'string' && parsed.playerArchetype.trim() ? parsed.playerArchetype.trim() : DEFAULT_ARCHETYPE,
      achievements: Array.isArray(parsed.achievements) ? parsed.achievements : [],
      assessmentApplied: Boolean(parsed.assessmentApplied),
      lastSeenDate: parsed.lastSeenDate || getTodayKey(),
      reminderEnabled: Boolean(parsed.reminderEnabled),
      checklists: {
        weekly: Array.isArray(checklists.weekly) ? checklists.weekly.map((item) => normalizeChecklistItem(item, 'weekly')) : [],
        quarterly: Array.isArray(checklists.quarterly) ? checklists.quarterly.map((item) => normalizeChecklistItem(item, 'quarterly')) : [],
        yearly: Array.isArray(checklists.yearly) ? checklists.yearly.map((item) => normalizeChecklistItem(item, 'yearly')) : [],
        fiveYear: Array.isArray(checklists.fiveYear) ? checklists.fiveYear.map((item) => normalizeChecklistItem(item, 'fiveYear')) : [],
      },
      mood: parsed.mood || '',
      moodLog: Array.isArray(parsed.moodLog) ? parsed.moodLog : [],
      stepsLog: Array.isArray(parsed.stepsLog) ? parsed.stepsLog : [],
      weightLog: Array.isArray(parsed.weightLog) ? parsed.weightLog : [],
      currentWeight: parsed.currentWeight || '',
      mealLog: Array.isArray(parsed.mealLog) ? parsed.mealLog : [],
      macroLog: Array.isArray(parsed.macroLog) ? parsed.macroLog : [],
      currentMacros: parsed.currentMacros && typeof parsed.currentMacros === 'object'
        ? { ...createEmptyMacroValues(), ...parsed.currentMacros }
        : createEmptyMacroValues(),
      macroGoals: parsed.macroGoals && typeof parsed.macroGoals === 'object'
        ? { ...createEmptyMacroGoalValues(), ...parsed.macroGoals }
        : createEmptyMacroGoalValues(),
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

function getDisplayNameForAchievement() {
  const fromMetadata = String(currentUser?.user_metadata?.displayName || '').trim();
  if (fromMetadata) return fromMetadata;

  const emailPrefix = String(currentUser?.email || '').trim();
  if (emailPrefix.includes('@')) {
    return emailPrefix.split('@')[0];
  }

  return 'Adventurer';
}

function hasAchievement(achievementId) {
  return Array.isArray(state.achievements) && state.achievements.some((entry) => entry.id === achievementId);
}

function awardAchievement(achievementId, title, description = '') {
  if (!achievementId || hasAchievement(achievementId)) {
    return false;
  }

  state.achievements = Array.isArray(state.achievements) ? state.achievements : [];
  const awardedAt = new Date().toISOString();
  state.achievements.push({
    id: achievementId,
    title,
    description,
    awardedAt,
  });

  showNotification('Achievement unlocked!', title);
  saveState();
  return true;
}

function maybeAwardDailyCompletionAchievement(allRequiredDone) {
  if (!allRequiredDone) return;
  if (hasAchievement('first-full-daily')) return;

  const displayName = getDisplayNameForAchievement();
  awardAchievement(
    'first-full-daily',
    `It's a dangerous business, "${displayName}", going out your door.`,
    'Completed your first full daily quest set.'
  );
}

function maybeAwardFirstAttributePromotionAchievement(attributeName) {
  if (!attributeName) return;
  if (hasAchievement('first-attribute-rankup')) return;

  const shortNameByAttribute = {
    Strength: 'STR',
    Dexterity: 'DEX',
    Wisdom: 'WIS',
    Intelligence: 'INT',
    Charisma: 'CHA',
    Constitution: 'CON',
  };

  const shortName = shortNameByAttribute[attributeName] || attributeName;
  awardAchievement(
    'first-attribute-rankup',
    'Change is not always growth, but growth is often rooted in change',
    `Raised ${attributeName} by converting 10,000 XP into a permanent stat point.`
  );
}

function ensureTodayState() {
  const today = getTodayKey();
  if (state.lastSeenDate === today) return false;

  ensureStateShape();
  state.unconditionals = state.unconditionals.map((task) => ({
    ...task,
    done: false,
    completedDate: '',
    stepCount: task.id === 'steps' ? '' : task.stepCount,
    hydrationCups: task.id === 'hydration' ? 0 : task.hydrationCups,
    lastAwardedXp: 0,
    attribute: getFixedAttribute(task.text),
  }));
  state.conditionals = state.conditionals.map((task) => ({ ...task, done: false, completedDate: '', xpEarned: 0, attribute: getFixedAttribute(task.text) }));
  state.mood = '';
  state.currentWeight = '';
  state.currentMacros = createEmptyMacroValues();
  state.attributes = state.attributes || {};
  state.lastSeenDate = today;
  saveState();
  return true;
}

function updateHistoryFromCompletion() {
  const today = getTodayKey();
  const progress = getDailyQuestProgressSnapshot();
  const allDone = progress.allRequiredDone;
  state.streakBonusesAwarded = Array.isArray(state.streakBonusesAwarded) ? state.streakBonusesAwarded : [];

  if (allDone) {
    const isNewCompletion = !state.history.includes(today);
    if (isNewCompletion) {
      state.history = [...state.history, today].sort();

      const streak = calculateStreak(state.history);
      const shouldAwardMilestoneBonus = streak >= 7 && streak % 7 === 0;
      const alreadyAwardedToday = state.streakBonusesAwarded.includes(today);

      if (shouldAwardMilestoneBonus && !alreadyAwardedToday) {
        addXp(DAILY_STREAK_BONUS_XP);
        state.streakBonusesAwarded.push(today);
      }
    }
  } else {
    const hadBonusToday = state.streakBonusesAwarded.includes(today);
    if (hadBonusToday) {
      addXp(-DAILY_STREAK_BONUS_XP);
      state.streakBonusesAwarded = state.streakBonusesAwarded.filter((day) => day !== today);
    }
    state.history = state.history.filter((day) => day !== today);
  }
}

function isDailyTaskComplete(task) {
  if (!task || typeof task !== 'object') {
    return false;
  }

  if (task.id === 'hydration') {
    return (Number(task.hydrationCups) || 0) >= 10;
  }

  return Boolean(task.done);
}

function getDailyQuestProgressSnapshot() {
  const dailyMetaRequirementCount = 3;
  const dailyTaskCount = state.unconditionals.length;
  const completedDailyTasks = state.unconditionals.filter((task) => isDailyTaskComplete(task)).length;
  const macroProgress = getMacroProgressSnapshot();
  const macrosDone = macroProgress.hasGoals ? macroProgress.goalMet : macroProgress.hasAnyIntake;
  const requiredDailyCount = dailyTaskCount + dailyMetaRequirementCount;
  const completedRequiredCount = completedDailyTasks + (state.mood ? 1 : 0) + (state.currentWeight ? 1 : 0) + (macrosDone ? 1 : 0);
  const dailyPercent = requiredDailyCount ? Math.round((completedRequiredCount / requiredDailyCount) * 100) : 0;
  const allRequiredDone = requiredDailyCount > 0 && completedRequiredCount >= requiredDailyCount;
  const remainingRequiredCount = Math.max(0, requiredDailyCount - completedRequiredCount);

  return {
    dailyTaskCount,
    completedDailyTasks,
    requiredDailyCount,
    completedRequiredCount,
    dailyPercent,
    allRequiredDone,
    remainingRequiredCount,
    macrosDone,
  };
}

function upsertMoodLog(value) {
  const today = getTodayKey();
  const normalizedMood = String(value || '').trim();
  const existingIndex = state.moodLog.findIndex((entry) => entry.date === today);

  if (!normalizedMood) {
    if (existingIndex >= 0) {
      state.moodLog.splice(existingIndex, 1);
    }
    return;
  }

  const entry = { date: today, mood: normalizedMood };
  if (existingIndex >= 0) {
    state.moodLog[existingIndex] = entry;
  } else {
    state.moodLog.push(entry);
  }
}

function upsertStepsLog(stepsValue) {
  const today = getTodayKey();
  const hasValue = Number.isFinite(Number(stepsValue));
  const existingIndex = state.stepsLog.findIndex((entry) => entry.date === today);

  if (!hasValue) {
    if (existingIndex >= 0) {
      state.stepsLog.splice(existingIndex, 1);
    }
    return;
  }

  const normalizedSteps = Math.max(0, Math.round(Number(stepsValue)));
  const entry = { date: today, steps: normalizedSteps };
  if (existingIndex >= 0) {
    state.stepsLog[existingIndex] = entry;
  } else {
    state.stepsLog.push(entry);
  }
}

function addXp(amount) {
  return amount;
}

function addAttributeXp(attribute, amount) {
  return { attribute, amount };
}

function getLevelFromXp(xp) {
  let remaining = Math.max(0, Number(xp) || 0);
  let level = 0;

  while (remaining >= getXpForNextLevel(level)) {
    remaining -= getXpForNextLevel(level);
    level += 1;
  }

  return level;
}

function getAttributeLevel(xp) {
  return Math.floor(xp / ATTRIBUTE_XP_PER_POINT);
}

function getXpProgressPercent(xp) {
  const safeXp = Math.max(0, Number(xp) || 0);
  const level = getLevelFromXp(safeXp);
  const levelStart = getXpAtLevelStart(level);
  const progressInLevel = safeXp - levelStart;
  const xpNeeded = getXpForNextLevel(level);
  return Math.min(100, Math.round((progressInLevel / xpNeeded) * 100));
}

function getXpForNextLevel(currentLevel) {
  const nextLevel = currentLevel + 1;
  const tier = LEVEL_XP_TIERS.find((item) => nextLevel <= item.maxLevel);
  return tier ? tier.xpPerLevel : 30000;
}

function getXpAtLevelStart(level) {
  let total = 0;
  for (let current = 0; current < level; current += 1) {
    total += getXpForNextLevel(current);
  }
  return total;
}

function getQuestXpMultiplier(level) {
  const displayLevel = level + 1;
  if (displayLevel <= 5) return 1;
  if (displayLevel <= 10) return 2;
  if (displayLevel <= 15) return 3;
  if (displayLevel <= 20) return 4;
  return 5;
}

function applyStartingProfileFromUserMetadata() {
  if (!currentUser) {
    return false;
  }

  if (state.assessmentApplied) {
    return false;
  }

  const startingProfile = currentUser.user_metadata?.startingProfile;
  if (!startingProfile || typeof startingProfile !== 'object') {
    return false;
  }

  let changed = false;

  const currentGoals = state.macroGoals && typeof state.macroGoals === 'object'
    ? state.macroGoals
    : createEmptyMacroGoalValues();
  const hasExistingGoals = Object.values(currentGoals).some((value) => Number(value) > 0);

  const profileMacroGoals = startingProfile.macroGoals && typeof startingProfile.macroGoals === 'object'
    ? startingProfile.macroGoals
    : null;

  if (!hasExistingGoals && profileMacroGoals) {
    const nextGoals = {
      calories: parseMacroInputValue(profileMacroGoals.calories),
      protein: parseMacroInputValue(profileMacroGoals.protein),
      carbs: parseMacroInputValue(profileMacroGoals.carbs),
      fat: parseMacroInputValue(profileMacroGoals.fat),
    };
    const hasAnyCreationGoal = Object.values(nextGoals).some((value) => value !== '');
    if (hasAnyCreationGoal) {
      state.macroGoals = {
        calories: nextGoals.calories === '' ? '' : String(nextGoals.calories),
        protein: nextGoals.protein === '' ? '' : String(nextGoals.protein),
        carbs: nextGoals.carbs === '' ? '' : String(nextGoals.carbs),
        fat: nextGoals.fat === '' ? '' : String(nextGoals.fat),
      };
      changed = true;
    }
  }

  if (!state.assessmentApplied) {
    state.assessmentApplied = true;
    changed = true;
  }

  if (changed) {
    saveState();
  }

  return changed;
}

function formatNumber(value) {
  return new Intl.NumberFormat().format(Number(value) || 0);
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

function persistNotificationState() {
  state.updatedAt = new Date().toISOString();
  persistLocalState();
  queueSupabaseSave();
}

function maybeNotifyLevelUp(level) {
  return level;
}

function maybeNotifyAllTasksComplete(allRequiredDone) {
  if (!allRequiredDone) {
    return;
  }

  const today = getTodayKey();
  if (state.lastAllTasksNotificationDate === today) {
    return;
  }

  showNotification('Quests complete!', 'You finished all of today\'s tasks. Great work.');
  state.lastAllTasksNotificationDate = today;
  persistNotificationState();
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
    const moodPending = !state.mood;
    const weightPending = !state.currentWeight;
    const macroProgress = getMacroProgressSnapshot();
    const macrosPending = macroProgress.hasGoals ? !macroProgress.goalMet : !macroProgress.hasAnyIntake;
    const metaRemaining = (moodPending ? 1 : 0) + (weightPending ? 1 : 0) + (macrosPending ? 1 : 0);
    const totalRemaining = remaining + metaRemaining;

    showNotification(
      '9pm Quest Reminder',
      totalRemaining > 0
        ? `Log your quests for today. You still have ${totalRemaining} item${totalRemaining === 1 ? '' : 's'} left.`
        : 'Log complete. You finished everything for today.'
    );
    scheduleReminders();
  }, eveningTime - now);

  const midnightTime = new Date(now);
  midnightTime.setHours(24, 0, 0, 0);
  midnightTimer = window.setTimeout(() => {
    state.unconditionals = state.unconditionals.map((task) => ({
      ...task,
      done: false,
      completedDate: '',
      stepCount: task.id === 'steps' ? '' : task.stepCount,
      hydrationCups: task.id === 'hydration' ? 0 : task.hydrationCups,
      lastAwardedXp: 0,
      attribute: getFixedAttribute(task.text),
    }));
    state.mood = '';
    state.currentWeight = '';
    state.currentMacros = createEmptyMacroValues();
    state.lastSeenDate = getTodayKey();
    saveState();
    render();
    showNotification('New day started', 'Your checklist has been reset for today.');
    scheduleReminders();
  }, midnightTime - now);
}

function ensureRemindersEnabledWhenPermitted() {
  if (!('Notification' in window)) {
    return;
  }

  if (Notification.permission === 'granted' && !state.reminderEnabled) {
    state.reminderEnabled = true;
    saveState();
    scheduleReminders();
  }
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

function renderMoodPicker() {
  if (!moodPicker) return;

  moodPicker.innerHTML = '';
  moodOptions.forEach((option) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `mood-option${state.mood === option.value ? ' active' : ''}`;
    button.textContent = option.value;
    button.title = option.label;
    button.setAttribute('aria-label', option.label);
    button.setAttribute('aria-pressed', state.mood === option.value ? 'true' : 'false');
    button.addEventListener('click', () => {
      const nextMood = state.mood === option.value ? '' : option.value;
      state.mood = nextMood;
      upsertMoodLog(nextMood);
      updateHistoryFromCompletion();
      saveState();
      render();
      if (nextMood) {
        launchConfetti();
      }
    });
    moodPicker.appendChild(button);
  });
}

function setFoodLookupStatus(message) {
  if (foodLookupSearchStatus) {
    foodLookupSearchStatus.textContent = message;
  }
}

function normalizeFoodName(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeSavedFoodItem(item) {
  if (!item || typeof item !== 'object') return null;
  const name = sanitizeMealText(item.name, 'Food');
  const calories = Number.isFinite(Number(item.calories)) ? Math.max(0, Math.round(Number(item.calories))) : 0;
  const protein = Number.isFinite(Number(item.protein)) ? Math.max(0, Math.round(Number(item.protein))) : 0;
  const carbs = Number.isFinite(Number(item.carbs)) ? Math.max(0, Math.round(Number(item.carbs))) : 0;
  const fat = Number.isFinite(Number(item.fat)) ? Math.max(0, Math.round(Number(item.fat))) : 0;

  if (!name) return null;
  if ([calories, protein, carbs, fat].every((value) => value <= 0)) return null;

  return {
    name,
    calories,
    protein,
    carbs,
    fat,
    source: 'My Foods',
  };
}

function upsertSavedFood(item) {
  const normalized = normalizeSavedFoodItem(item);
  if (!normalized) return false;

  state.savedFoods = Array.isArray(state.savedFoods) ? state.savedFoods : [];
  const key = normalizeFoodName(normalized.name);
  state.savedFoods = [
    normalized,
    ...state.savedFoods.filter((existing) => normalizeFoodName(existing?.name) !== key),
  ].slice(0, 250);
  return true;
}

function searchLocalFoods(query, limit = FOOD_SEARCH_LIMIT) {
  const normalized = String(query || '').trim().toLowerCase();
  if (!normalized) return [];

  const communityFoods = Array.isArray(communityFoodLibrary) ? communityFoodLibrary : [];
  const savedFoods = Array.isArray(state.savedFoods) ? state.savedFoods : [];
  const combinedLibrary = [
    ...savedFoods.map((item) => ({ ...item, source: 'My Foods' })),
    ...LOCAL_FOOD_LIBRARY.map((item) => ({ ...item, source: 'Built-in' })),
    ...communityFoods.map((item) => ({ ...item, source: item.source || 'Community' })),
  ];

  const seenNames = new Set();
  const uniqueLibrary = combinedLibrary.filter((item) => {
    const key = normalizeFoodName(item.name);
    if (!key || seenNames.has(key)) return false;
    seenNames.add(key);
    return true;
  });

  const tokens = normalized.split(/\s+/).filter(Boolean);
  const scored = uniqueLibrary.map((item) => {
    const name = String(item.name || '').toLowerCase();
    let score = 0;

    if (name === normalized) score += 100;
    if (name.startsWith(normalized)) score += 40;
    if (name.includes(normalized)) score += 20;

    tokens.forEach((token) => {
      if (name.includes(token)) score += 10;
    });

    return { ...item, _score: score };
  })
    .filter((item) => item._score > 0)
    .sort((a, b) => b._score - a._score || a.name.localeCompare(b.name))
    .slice(0, Math.max(1, Math.min(20, Number(limit) || FOOD_SEARCH_LIMIT)))
    .map(({ _score, ...item }) => item);

  return scored;
}

function setMacroFieldValues(values) {
  const safeValues = values && typeof values === 'object' ? values : createEmptyMacroValues();
  if (macroCaloriesInput) macroCaloriesInput.value = safeValues.calories || '';
  if (macroProteinInput) macroProteinInput.value = safeValues.protein || '';
  if (macroCarbsInput) macroCarbsInput.value = safeValues.carbs || '';
  if (macroFatInput) macroFatInput.value = safeValues.fat || '';
}

function parseMacroInputValue(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return '';
  return Math.max(0, Math.round(parsed));
}

function getMacroValuesAsNumbers(values) {
  return {
    calories: Number.isFinite(Number(values?.calories)) ? Math.max(0, Math.round(Number(values.calories))) : 0,
    protein: Number.isFinite(Number(values?.protein)) ? Math.max(0, Math.round(Number(values.protein))) : 0,
    carbs: Number.isFinite(Number(values?.carbs)) ? Math.max(0, Math.round(Number(values.carbs))) : 0,
    fat: Number.isFinite(Number(values?.fat)) ? Math.max(0, Math.round(Number(values.fat))) : 0,
  };
}

function getTodayMealEntries() {
  const today = getTodayKey();
  return (state.mealLog || []).filter((entry) => entry?.date === today);
}

function getMealEntriesByDateKey(dateKey) {
  const key = String(dateKey || '').trim();
  if (!key) return [];
  return (state.mealLog || []).filter((entry) => entry?.date === key);
}

function getMacroTotalsFromEntries(entries) {
  return (Array.isArray(entries) ? entries : []).reduce((totals, entry) => {
    totals.calories += Number(entry?.calories) || 0;
    totals.protein += Number(entry?.protein) || 0;
    totals.carbs += Number(entry?.carbs) || 0;
    totals.fat += Number(entry?.fat) || 0;
    return totals;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
}

function isAlcoholMealEntry(entry) {
  if (!entry || typeof entry !== 'object') return false;
  const category = String(entry.category || '').toLowerCase().trim();
  if (category === 'alcohol') return true;

  const mealName = String(entry.meal || '').toLowerCase().trim();
  if (mealName === 'alcohol') return true;

  const foodText = String(entry.food || '').toLowerCase();
  return ALCOHOL_FOOD_LABELS.some((label) => foodText.includes(label));
}

function getAlcoholMacroTotalsFromEntries(entries) {
  const alcoholEntries = (Array.isArray(entries) ? entries : []).filter((entry) => isAlcoholMealEntry(entry));
  return getMacroTotalsFromEntries(alcoholEntries);
}

function parseDateKeyToDate(dateKey) {
  const [yearText, monthText, dayText] = String(dateKey || '').split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return new Date();
  }
  return new Date(year, Math.max(0, month - 1), Math.max(1, day));
}

function getHistoryWindowDateKeys(endDateKey, dayCount) {
  const safeDayCount = Math.max(1, Number(dayCount) || 7);
  const endDate = parseDateKeyToDate(endDateKey || getTodayKey());
  const keys = [];

  for (let offset = safeDayCount - 1; offset >= 0; offset -= 1) {
    const date = new Date(endDate);
    date.setDate(endDate.getDate() - offset);
    keys.push(toDateKey(date));
  }

  return keys;
}

function getMacroStatsForWindow(endDateKey, dayCount) {
  const keys = getHistoryWindowDateKeys(endDateKey, dayCount);
  const total = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const alcoholTotal = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const series = [];

  keys.forEach((key) => {
    const entries = getMealEntriesByDateKey(key);
    const dayTotals = getMacroTotalsFromEntries(entries);
    const dayAlcoholTotals = getAlcoholMacroTotalsFromEntries(entries);
    total.calories += dayTotals.calories;
    total.protein += dayTotals.protein;
    total.carbs += dayTotals.carbs;
    total.fat += dayTotals.fat;

    alcoholTotal.calories += dayAlcoholTotals.calories;
    alcoholTotal.protein += dayAlcoholTotals.protein;
    alcoholTotal.carbs += dayAlcoholTotals.carbs;
    alcoholTotal.fat += dayAlcoholTotals.fat;

    series.push({
      dateKey: key,
      label: formatShortDateLabel(key),
      calories: dayTotals.calories,
      alcoholCalories: dayAlcoholTotals.calories,
      protein: dayTotals.protein,
      carbs: dayTotals.carbs,
      fat: dayTotals.fat,
    });
  });

  return {
    keys,
    series,
    total,
    alcoholTotal,
    average: {
      calories: Math.round(total.calories / keys.length),
      protein: Math.round(total.protein / keys.length),
      carbs: Math.round(total.carbs / keys.length),
      fat: Math.round(total.fat / keys.length),
    },
    alcoholAverage: {
      calories: Math.round(alcoholTotal.calories / keys.length),
      protein: Math.round(alcoholTotal.protein / keys.length),
      carbs: Math.round(alcoholTotal.carbs / keys.length),
      fat: Math.round(alcoholTotal.fat / keys.length),
    },
  };
}

function formatShortDateLabel(dateKey) {
  const date = parseDateKeyToDate(dateKey);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}/${day}`;
}

function renderMealHistoryChart(seriesInput) {
  if (!mealHistoryChart) return;
  mealHistoryChart.innerHTML = '';

  const series = Array.isArray(seriesInput) ? seriesInput : [];
  const maxCalories = series.reduce((max, item) => Math.max(max, item.calories, item.alcoholCalories), 0);
  if (mealHistoryChartEmpty) {
    mealHistoryChartEmpty.hidden = maxCalories > 0;
  }
  if (series.length === 0) return;

  const svgNs = 'http://www.w3.org/2000/svg';
  const width = 640;
  const height = 200;
  const leftPad = 14;
  const rightPad = 14;
  const topPad = 12;
  const bottomPad = 24;
  const plotWidth = width - leftPad - rightPad;
  const plotHeight = height - topPad - bottomPad;
  const denominator = maxCalories > 0 ? maxCalories : 1;

  const calcX = (index) => {
    if (series.length === 1) return leftPad + (plotWidth / 2);
    return leftPad + ((plotWidth * index) / (series.length - 1));
  };
  const calcY = (value) => topPad + (plotHeight - ((Math.max(0, value) / denominator) * plotHeight));

  const totalPoints = series.map((item, index) => `${calcX(index)},${calcY(item.calories)}`).join(' ');
  const alcoholPoints = series.map((item, index) => `${calcX(index)},${calcY(item.alcoholCalories)}`).join(' ');

  const svg = document.createElementNS(svgNs, 'svg');
  svg.setAttribute('class', 'meal-history-line-chart');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('preserveAspectRatio', 'none');

  const baseline = document.createElementNS(svgNs, 'line');
  baseline.setAttribute('x1', String(leftPad));
  baseline.setAttribute('y1', String(topPad + plotHeight));
  baseline.setAttribute('x2', String(leftPad + plotWidth));
  baseline.setAttribute('y2', String(topPad + plotHeight));
  baseline.setAttribute('class', 'meal-history-line-axis');
  svg.appendChild(baseline);

  const totalLine = document.createElementNS(svgNs, 'polyline');
  totalLine.setAttribute('points', totalPoints);
  totalLine.setAttribute('class', 'meal-history-line-total');
  svg.appendChild(totalLine);

  const alcoholLine = document.createElementNS(svgNs, 'polyline');
  alcoholLine.setAttribute('points', alcoholPoints);
  alcoholLine.setAttribute('class', 'meal-history-line-alcohol');
  svg.appendChild(alcoholLine);

  series.forEach((item, index) => {
    const x = calcX(index);

    const totalDot = document.createElementNS(svgNs, 'circle');
    totalDot.setAttribute('cx', String(x));
    totalDot.setAttribute('cy', String(calcY(item.calories)));
    totalDot.setAttribute('r', '2.6');
    totalDot.setAttribute('class', 'meal-history-line-dot-total');
    svg.appendChild(totalDot);

    const alcoholDot = document.createElementNS(svgNs, 'circle');
    alcoholDot.setAttribute('cx', String(x));
    alcoholDot.setAttribute('cy', String(calcY(item.alcoholCalories)));
    alcoholDot.setAttribute('r', '2.6');
    alcoholDot.setAttribute('class', 'meal-history-line-dot-alcohol');
    svg.appendChild(alcoholDot);
  });

  mealHistoryChart.appendChild(svg);

  const labels = document.createElement('div');
  labels.className = 'meal-history-line-labels';
  series.forEach((item) => {
    const label = document.createElement('span');
    label.className = 'meal-history-line-label';
    label.title = `${item.dateKey}: ${item.calories} kcal total, ${item.alcoholCalories} kcal alcohol`;
    label.textContent = item.label;
    labels.appendChild(label);
  });
  mealHistoryChart.appendChild(labels);

  const legend = document.createElement('div');
  legend.className = 'meal-history-line-legend';
  legend.innerHTML = '<span class="meal-history-legend-item"><span class="meal-history-legend-swatch meal-history-legend-swatch-total"></span>Total calories</span><span class="meal-history-legend-item"><span class="meal-history-legend-swatch meal-history-legend-swatch-alcohol"></span>Alcohol calories</span>';
  mealHistoryChart.appendChild(legend);

  const peak = document.createElement('p');
  peak.className = 'meal-history-chart-note';
  peak.textContent = `Peak day: ${maxCalories} kcal`;
  mealHistoryChart.appendChild(peak);
}

function getMacroProgressSnapshot() {
  const consumed = getMacroValuesAsNumbers(state.currentMacros || createEmptyMacroValues());
  const goals = getMacroValuesAsNumbers(state.macroGoals || createEmptyMacroGoalValues());
  const hasGoals = Object.values(goals).some((value) => value > 0);
  const hasCalorieGoal = goals.calories > 0;
  const hasAnyIntake = Object.values(consumed).some((value) => value > 0);
  const remaining = {
    calories: goals.calories > 0 ? Math.max(0, goals.calories - consumed.calories) : 0,
    protein: goals.protein > 0 ? Math.max(0, goals.protein - consumed.protein) : 0,
    carbs: goals.carbs > 0 ? Math.max(0, goals.carbs - consumed.carbs) : 0,
    fat: goals.fat > 0 ? Math.max(0, goals.fat - consumed.fat) : 0,
  };
  const goalMet = hasCalorieGoal
    ? consumed.calories >= goals.calories
    : hasGoals && Object.entries(goals).every(([key, value]) => value === 0 || consumed[key] >= value);
  const goalOverages = Object.entries(goals)
    .filter(([, value]) => value > 0)
    .map(([key, value]) => Math.max(0, consumed[key] - value));
  const maxOverage = goalOverages.length > 0 ? Math.max(...goalOverages) : 0;
  const overByHundred = hasGoals && (hasCalorieGoal
    ? (consumed.calories - goals.calories) >= 100
    : maxOverage >= 100);

  return {
    consumed,
    goals,
    hasGoals,
    hasAnyIntake,
    remaining,
    goalMet,
    overByHundred,
  };
}

function sanitizeMealText(value, fallback) {
  const normalized = String(value || '').trim();
  return normalized ? normalized.slice(0, 80) : fallback;
}

function seedMealLogFromCurrentMacrosIfNeeded() {
  const todayEntries = getTodayMealEntries();
  if (todayEntries.length > 0) return;

  const current = getMacroValuesAsNumbers(state.currentMacros || createEmptyMacroValues());
  const hasAnyCurrent = Object.values(current).some((value) => value > 0);
  if (!hasAnyCurrent) return;

  state.mealLog = Array.isArray(state.mealLog) ? state.mealLog : [];
  state.mealLog.push({
    id: createId('meal'),
    date: getTodayKey(),
    meal: 'Imported',
    food: 'Existing total',
    calories: current.calories,
    protein: current.protein,
    carbs: current.carbs,
    fat: current.fat,
  });
}

function recalculateTodayMacrosFromMeals() {
  const totals = getTodayMealEntries().reduce((accumulator, entry) => {
    accumulator.calories += Number(entry?.calories) || 0;
    accumulator.protein += Number(entry?.protein) || 0;
    accumulator.carbs += Number(entry?.carbs) || 0;
    accumulator.fat += Number(entry?.fat) || 0;
    return accumulator;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

  state.currentMacros = {
    calories: totals.calories > 0 ? String(totals.calories) : '',
    protein: totals.protein > 0 ? String(totals.protein) : '',
    carbs: totals.carbs > 0 ? String(totals.carbs) : '',
    fat: totals.fat > 0 ? String(totals.fat) : '',
  };

  const today = getTodayKey();
  const hasAnyTotal = Object.values(totals).some((value) => value > 0);
  const existingIndex = state.macroLog.findIndex((item) => item.date === today);

  if (!hasAnyTotal) {
    if (existingIndex >= 0) {
      state.macroLog.splice(existingIndex, 1);
    }
    return;
  }

  const entry = {
    date: today,
    calories: totals.calories,
    protein: totals.protein,
    carbs: totals.carbs,
    fat: totals.fat,
  };

  if (existingIndex >= 0) {
    state.macroLog[existingIndex] = entry;
  } else {
    state.macroLog.push(entry);
  }
}

function addMealEntryToToday(payload) {
  const normalized = getMacroValuesAsNumbers(payload);
  const hasAnyValue = Object.values(normalized).some((value) => value > 0);
  if (!hasAnyValue) {
    return false;
  }

  const category = String(payload?.category || '').toLowerCase().trim();

  state.mealLog = Array.isArray(state.mealLog) ? state.mealLog : [];
  state.mealLog.push({
    id: createId('meal'),
    date: getTodayKey(),
    meal: sanitizeMealText(payload?.meal, 'Meal'),
    food: sanitizeMealText(payload?.food, 'Food'),
    category: category === 'alcohol' ? 'alcohol' : 'food',
    calories: normalized.calories,
    protein: normalized.protein,
    carbs: normalized.carbs,
    fat: normalized.fat,
  });

  return true;
}

function clearTodayMacroTracking() {
  const today = getTodayKey();
  state.mealLog = (state.mealLog || []).filter((entry) => entry?.date !== today);
  recalculateTodayMacrosFromMeals();
}

function saveMacroEntry(options = {}) {
  const macrosFromForm = {
    calories: parseMacroInputValue(macroCaloriesInput?.value),
    protein: parseMacroInputValue(macroProteinInput?.value),
    carbs: parseMacroInputValue(macroCarbsInput?.value),
    fat: parseMacroInputValue(macroFatInput?.value),
  };

  const macros = options.macros && typeof options.macros === 'object'
    ? options.macros
    : macrosFromForm;

  seedMealLogFromCurrentMacrosIfNeeded();
  const wasAdded = addMealEntryToToday({
    meal: options.meal || 'Quick add',
    food: options.food || 'Manual entry',
    calories: macros.calories,
    protein: macros.protein,
    carbs: macros.carbs,
    fat: macros.fat,
  });

  if (!wasAdded) return false;

  recalculateTodayMacrosFromMeals();
  setMacroFieldValues(createEmptyMacroValues());
  updateHistoryFromCompletion();
  saveState();
  updateDailyMeta();
  render();
  launchConfetti();
  return true;
}

function renderFoodLookupSearchResults(items) {
  if (!foodLookupSearchResults) return;
  foodLookupSearchResults.innerHTML = '';

  if (!Array.isArray(items) || items.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty-state';
    empty.textContent = 'No matching foods found.';
    foodLookupSearchResults.appendChild(empty);
    return;
  }

  items.forEach((item) => {
    const row = document.createElement('li');
    row.className = 'food-lookup-result-item';

    const title = document.createElement('div');
    title.className = 'food-lookup-result-title';
    title.textContent = String(item?.name || 'Unknown food');

    const detail = document.createElement('div');
    detail.className = 'food-lookup-result-detail';
    detail.textContent = `${item.source || 'Built-in'} • ${item.calories || 0} kcal • P ${item.protein || 0}g • C ${item.carbs || 0}g • F ${item.fat || 0}g`;

    const useButton = document.createElement('button');
    useButton.type = 'button';
    useButton.className = 'secondary-button';
    useButton.textContent = 'Use';
    useButton.addEventListener('click', () => {
      const next = {
        calories: Number.isFinite(Number(item?.calories)) ? Math.max(0, Math.round(Number(item.calories))) : '',
        protein: Number.isFinite(Number(item?.protein)) ? Math.max(0, Math.round(Number(item.protein))) : '',
        carbs: Number.isFinite(Number(item?.carbs)) ? Math.max(0, Math.round(Number(item.carbs))) : '',
        fat: Number.isFinite(Number(item?.fat)) ? Math.max(0, Math.round(Number(item.fat))) : '',
      };

      setMacroFieldValues({
        calories: next.calories === '' ? '' : String(next.calories),
        protein: next.protein === '' ? '' : String(next.protein),
        carbs: next.carbs === '' ? '' : String(next.carbs),
        fat: next.fat === '' ? '' : String(next.fat),
      });
      saveMacroEntry({
        meal: 'Food lookup',
        food: String(item?.name || 'Library food'),
      });
    });

    row.appendChild(title);
    row.appendChild(detail);
    row.appendChild(useButton);
    foodLookupSearchResults.appendChild(row);
  });
}

async function runFoodLookupSearch() {
  const query = String(foodLookupQueryInput?.value || '').trim();
  if (!query) {
    setFoodLookupStatus('Type a food name to search.');
    return;
  }

  foodLookupSearchButton.disabled = true;
  setFoodLookupStatus('Searching foods...');
  const items = searchLocalFoods(query, FOOD_SEARCH_LIMIT);
  foodLookupSearchButton.disabled = false;

  setFoodLookupStatus(items.length > 0 ? 'Food results loaded from local library.' : 'No matching foods found in local library.');
  renderFoodLookupSearchResults(items);
}

async function hydrateSharedFoodLibrary() {
  const syncAdapter = getSyncAdapter();
  if (!syncAdapter?.enabled || typeof syncAdapter.listSharedFoods !== 'function') {
    return;
  }

  const result = await syncAdapter.listSharedFoods('', 250);
  if (!result.ok) {
    setFoodLookupStatus(`Using built-in foods only. ${result.message}`);
    return;
  }

  communityFoodLibrary = Array.isArray(result.items) ? result.items : [];
  if (communityFoodLibrary.length > 0) {
    setFoodLookupStatus(`Loaded ${communityFoodLibrary.length} community foods.`);
  }
}

async function addCurrentFoodToSharedLibrary() {
  const name = String(foodLookupQueryInput?.value || '').trim();
  if (!name) {
    setFoodLookupStatus('Enter a food name, then click Add for everyone.');
    return;
  }

  const latestMeal = getTodayMealEntries().at(-1) || null;

  const food = {
    name,
    calories: parseMacroInputValue(macroCaloriesInput?.value) || Number(latestMeal?.calories) || 0,
    protein: parseMacroInputValue(macroProteinInput?.value) || Number(latestMeal?.protein) || 0,
    carbs: parseMacroInputValue(macroCarbsInput?.value) || Number(latestMeal?.carbs) || 0,
    fat: parseMacroInputValue(macroFatInput?.value) || Number(latestMeal?.fat) || 0,
  };

  const hasAnyMacro = [food.calories, food.protein, food.carbs, food.fat].some((value) => Number(value) > 0);
  if (!hasAnyMacro) {
    setFoodLookupStatus('Add a meal from the bowl first so macros can be shared for this food.');
    return;
  }

  const syncAdapter = getSyncAdapter();
  if (!syncAdapter?.enabled || typeof syncAdapter.addSharedFood !== 'function') {
    setFoodLookupStatus('Shared food database is not configured yet.');
    return;
  }

  addSharedFoodButton.disabled = true;
  setFoodLookupStatus('Adding food to community library...');
  const result = await syncAdapter.addSharedFood(food);
  addSharedFoodButton.disabled = false;

  if (!result.ok) {
    setFoodLookupStatus(result.message);
    return;
  }

  const item = result.item ? { ...result.item, source: 'Community' } : { ...food, source: 'Community' };
  communityFoodLibrary = [item, ...communityFoodLibrary.filter((existing) => normalizeFoodName(existing.name) !== normalizeFoodName(item.name))];
  setFoodLookupStatus('Food added for everyone.');
}

function renderMealEntries() {
  if (!mealEntriesList) return;

  const todayMeals = getTodayMealEntries();
  mealEntriesList.innerHTML = '';

  if (todayMeals.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty-state';
    empty.textContent = 'No meals logged yet today.';
    mealEntriesList.appendChild(empty);
    return;
  }

  todayMeals.forEach((entry) => {
    const row = document.createElement('li');
    row.className = 'social-item';

    const text = document.createElement('div');
    text.className = 'social-item-text';
    text.textContent = `${entry.meal}: ${entry.food}`;

    const meta = document.createElement('div');
    meta.className = 'meal-list-meta';
    meta.textContent = `${entry.calories} kcal • P ${entry.protein}g • C ${entry.carbs}g • F ${entry.fat}g`;

    const textWrap = document.createElement('div');
    textWrap.appendChild(text);
    textWrap.appendChild(meta);

    const actions = document.createElement('div');
    actions.className = 'meal-list-buttons';

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'secondary-button';
    removeButton.textContent = 'Remove';
    removeButton.addEventListener('click', () => {
      state.mealLog = (state.mealLog || []).filter((item) => item.id !== entry.id);
      recalculateTodayMacrosFromMeals();
      saveState();
      render();
    });

    actions.appendChild(removeButton);

    row.appendChild(textWrap);
    row.appendChild(actions);
    mealEntriesList.appendChild(row);
  });
}

function updateDailyMeta() {
  weightInput.value = state.currentWeight || '';
  const progress = getMacroProgressSnapshot();
  if (macroProgressStatus) {
    if (progress.hasGoals) {
      macroProgressStatus.textContent = `Remaining: ${progress.remaining.calories} kcal • P ${progress.remaining.protein}g • C ${progress.remaining.carbs}g • F ${progress.remaining.fat}g`;
    } else {
      macroProgressStatus.textContent = 'Set macro goals in your profile to track daily remaining calories and macros.';
    }
  }
  renderMealEntries();
  if (mealHistoryDateInput) {
    renderMealHistoryTab();
  }
  renderMoodPicker();
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
  updateHistoryFromCompletion();
  saveState();
  updateDailyMeta();
  render();
  launchConfetti();
}

function renderDailyChecklist() {
  const total = state.unconditionals.length;
  const completed = state.unconditionals.filter((task) => isDailyTaskComplete(task)).length;
  taskList.innerHTML = '';

  if (total === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty-state';
    empty.textContent = 'No daily tasks are available right now.';
    taskList.appendChild(empty);
    return;
  }

  const macroProgress = getMacroProgressSnapshot();
  const macroLabel = macroProgress.hasGoals
    ? `Macros remaining: ${macroProgress.remaining.calories} kcal / P${macroProgress.remaining.protein} C${macroProgress.remaining.carbs} F${macroProgress.remaining.fat}`
    : `Macros: ${state.currentMacros?.calories || '-'} kcal / P${state.currentMacros?.protein || '-'} C${state.currentMacros?.carbs || '-'} F${state.currentMacros?.fat || '-'}`;

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
    {
      key: 'macros',
      label: macroLabel,
      done: macroProgress.hasGoals ? macroProgress.goalMet : macroProgress.hasAnyIntake,
      completionText: macroProgress.hasGoals
        ? (macroProgress.goalMet
          ? (macroProgress.overByHundred ? 'Completed ✅ 🐷' : 'Completed ✅ 🤩')
          : 'Required')
        : (macroProgress.hasAnyIntake ? 'Completed ✅' : 'Required'),
    },
  ];

  const baseTaskCount = state.unconditionals.length;
  const dailyTaskItems = [...state.unconditionals.map((task) => ({ ...task, done: isDailyTaskComplete(task), meta: null })), ...dailyMetaItems.map((item) => ({
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
          state.mood = checkbox.checked ? state.mood : '';
          upsertMoodLog(state.mood);
        } else if (task.meta.key === 'weight') {
          if (!checkbox.checked) {
            state.currentWeight = '';
            weightInput.value = '';
          }
        } else if (task.meta.key === 'macros') {
          if (!checkbox.checked) {
            clearTodayMacroTracking();
            setMacroFieldValues(createEmptyMacroValues());
          }
        }
          updateHistoryFromCompletion();
        saveState();
        render();
        if (checkbox.checked) {
          launchConfetti();
        }
        return;
      }

      const taskIndex = index < baseTaskCount ? index : -1;
      if (taskIndex >= 0) {
        const dailyTask = state.unconditionals[taskIndex];
        if (dailyTask.id === 'hydration') {
          state.unconditionals[taskIndex].hydrationCups = checkbox.checked ? 10 : 0;
        }
        const today = getTodayKey();
        const isCompletedToday = dailyTask.completedDate === today;
        const hasLegacyCredit = dailyTask.done && !dailyTask.completedDate;
        const xpGain = calculateUnconditionalXp(dailyTask);
        if (checkbox.checked && !isCompletedToday) {
          addXp(xpGain);
          addAttributeXp(dailyTask.attribute, xpGain);
          state.unconditionals[taskIndex].completedDate = today;
          state.unconditionals[taskIndex].lastAwardedXp = xpGain;
          updateLifetimeTotals('daily', dailyTask.id || `daily-${taskIndex}`, 1, xpGain);
        } else if (!checkbox.checked) {
          if (isCompletedToday || hasLegacyCredit) {
            const rollbackXp = Number(state.unconditionals[taskIndex].lastAwardedXp) || xpGain;
            addXp(-rollbackXp);
            addAttributeXp(dailyTask.attribute, -rollbackXp);
            updateLifetimeTotals('daily', dailyTask.id || `daily-${taskIndex}`, -1, -rollbackXp);
          }
          state.unconditionals[taskIndex].completedDate = '';
          state.unconditionals[taskIndex].lastAwardedXp = 0;
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

    let stepsControl = null;
    let hydrationControl = null;
    if (!task.meta && task.id === 'steps') {
      stepsControl = document.createElement('label');
      stepsControl.className = 'steps-control';

      const stepsInput = document.createElement('input');
      stepsInput.type = 'number';
      stepsInput.min = '0';
      stepsInput.step = '1';
      stepsInput.className = 'steps-input';
      stepsInput.placeholder = 'Daily steps';
      stepsInput.value = task.stepCount === '' || task.stepCount === null || task.stepCount === undefined ? '' : String(task.stepCount);
      stepsInput.setAttribute('aria-label', 'Daily steps');
      stepsInput.addEventListener('change', () => {
        const taskIndex = index < baseTaskCount ? index : -1;
        if (taskIndex < 0) return;

        const parsed = stepsInput.value === '' ? '' : Number(stepsInput.value);
        const nextSteps = Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : '';
        state.unconditionals[taskIndex].stepCount = nextSteps;
        upsertStepsLog(nextSteps);

        const today = getTodayKey();
        const dailyTask = state.unconditionals[taskIndex];
        if (dailyTask.done && dailyTask.completedDate === today) {
          const previousAward = Number(dailyTask.lastAwardedXp) || DAILY_QUEST_XP;
          const recalculatedAward = calculateUnconditionalXp(dailyTask);
          const delta = recalculatedAward - previousAward;
          if (delta !== 0) {
            addXp(delta);
            addAttributeXp(dailyTask.attribute, delta);
          }
          state.unconditionals[taskIndex].lastAwardedXp = recalculatedAward;
        }

        saveState();
        render();
      });

      stepsControl.appendChild(stepsInput);

    }

    if (!task.meta && task.id === 'hydration') {
      hydrationControl = document.createElement('div');
      hydrationControl.className = 'hydration-cups';

      const currentCups = Math.max(0, Math.min(10, Number(task.hydrationCups) || 0));

      for (let cupIndex = 1; cupIndex <= 10; cupIndex += 1) {
        const cupButton = document.createElement('button');
        cupButton.type = 'button';
        cupButton.className = `cup-emoji${cupIndex <= currentCups ? ' filled' : ''}`;
        cupButton.textContent = cupIndex <= currentCups ? '🥤' : '☕';
        cupButton.setAttribute('aria-label', `Set hydration cups to ${cupIndex}`);
        cupButton.addEventListener('click', () => {
          const taskIndex = index < baseTaskCount ? index : -1;
          if (taskIndex < 0) return;

          const activeCount = Math.max(0, Math.min(10, Number(state.unconditionals[taskIndex].hydrationCups) || 0));
          const nextValue = activeCount === cupIndex ? cupIndex - 1 : cupIndex;
          state.unconditionals[taskIndex].hydrationCups = nextValue;

          const hydrationTask = state.unconditionals[taskIndex];
          const today = getTodayKey();
          const shouldBeDone = nextValue >= 10;
          const isCompletedToday = hydrationTask.completedDate === today;
          const hasLegacyCredit = hydrationTask.done && !hydrationTask.completedDate;
          const xpGain = calculateUnconditionalXp(hydrationTask);

          if (shouldBeDone && !isCompletedToday) {
            addXp(xpGain);
            addAttributeXp(hydrationTask.attribute, xpGain);
            state.unconditionals[taskIndex].done = true;
            state.unconditionals[taskIndex].completedDate = today;
            state.unconditionals[taskIndex].lastAwardedXp = xpGain;
            updateLifetimeTotals('daily', hydrationTask.id || `daily-${taskIndex}`, 1, xpGain);
          } else if (!shouldBeDone && hydrationTask.done) {
            if (isCompletedToday || hasLegacyCredit) {
              const rollbackXp = Number(hydrationTask.lastAwardedXp) || xpGain;
              addXp(-rollbackXp);
              addAttributeXp(hydrationTask.attribute, -rollbackXp);
              updateLifetimeTotals('daily', hydrationTask.id || `daily-${taskIndex}`, -1, -rollbackXp);
            }
            state.unconditionals[taskIndex].done = false;
            state.unconditionals[taskIndex].completedDate = '';
            state.unconditionals[taskIndex].lastAwardedXp = 0;
          }

          updateHistoryFromCompletion();
          saveState();
          render();
        });
        hydrationControl.appendChild(cupButton);
      }
    }

    let badge = null;
    if (task.meta) {
      badge = document.createElement('span');
      badge.className = 'completion-badge';
      badge.textContent = task.meta.completionText || (task.done ? 'Completed' : 'Required');
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
    if (stepsControl) {
      item.appendChild(stepsControl);
    }
    if (hydrationControl) {
      item.appendChild(hydrationControl);
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
  container.className = 'attribute-summary attribute-shield-grid';
  const shortNameByAttribute = {
    Strength: 'STR',
    Dexterity: 'DEX',
    Wisdom: 'WIS',
    Intelligence: 'INT',
    Charisma: 'CHA',
    Constitution: 'CON',
  };

  ATTRIBUTE_NAMES.forEach((attribute) => {
    const xp = Number(state.attributes?.[attribute]) || 0;
    const earnedPoints = getAttributeLevel(xp);
    const basePoints = Math.max(0, Number(state.baseAttributes?.[attribute]) || 0);
    const points = basePoints + earnedPoints;

    const tile = document.createElement('div');
    tile.className = 'attribute-shield';

    const abbrev = document.createElement('span');
    abbrev.className = 'attribute-shield-name';
    abbrev.textContent = shortNameByAttribute[attribute] || attribute.slice(0, 3).toUpperCase();

    const value = document.createElement('span');
    value.className = 'attribute-shield-value';
    value.textContent = `${points}`;

    const fullName = document.createElement('span');
    fullName.className = 'attribute-shield-full';
    fullName.textContent = `${attribute} (${xp} XP)`;

    tile.appendChild(abbrev);
    tile.appendChild(value);
    tile.appendChild(fullName);
    container.appendChild(tile);
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
      const conditional = state.conditionals[index];
      const today = getTodayKey();
      const isCompletedToday = conditional.completedDate === today;
      const hasLegacyCredit = conditional.done && !conditional.completedDate;
      const xpGain = calculateConditionalXp(conditional);
      if (checkbox.checked && !isCompletedToday) {
        addXp(xpGain);
        addAttributeXp(conditional.attribute, xpGain);
        state.conditionals[index].completedDate = today;
        state.conditionals[index].xpEarned = (Number(state.conditionals[index].xpEarned) || 0) + xpGain;
        state.conditionals[index].lastAwardedXp = xpGain;
        updateLifetimeTotals('adventure', conditional.id || `adventure-${index}`, 1, xpGain);
      } else if (!checkbox.checked) {
        if (isCompletedToday || hasLegacyCredit) {
          const rollbackXp = Number(state.conditionals[index].lastAwardedXp) || xpGain;
          addXp(-rollbackXp);
          addAttributeXp(conditional.attribute, -rollbackXp);
          state.conditionals[index].xpEarned = Math.max(0, (Number(state.conditionals[index].xpEarned) || 0) - rollbackXp);
          updateLifetimeTotals('adventure', conditional.id || `adventure-${index}`, -1, -rollbackXp);
        }
        state.conditionals[index].completedDate = '';
        state.conditionals[index].lastAwardedXp = 0;
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

    const details = document.createElement('div');
    details.className = 'conditional-details';

    (item.characteristics || []).forEach((characteristic) => {
      const field = document.createElement('label');
      field.className = 'conditional-field';

      const fieldLabel = document.createElement('span');
      fieldLabel.className = 'conditional-field-label';
      fieldLabel.textContent = characteristic.unit
        ? `${characteristic.label} (${characteristic.unit})`
        : characteristic.label;

      if (item.id === 'hydration' && characteristic.key === 'cups') {
        const cupsWrap = document.createElement('div');
        cupsWrap.className = 'hydration-cups';
        const currentCups = Math.max(0, Math.min(10, getConditionalCharacteristicNumber(item, 'cups')));

        for (let cupIndex = 1; cupIndex <= 10; cupIndex += 1) {
          const cupButton = document.createElement('button');
          cupButton.type = 'button';
          cupButton.className = `cup-emoji${cupIndex <= currentCups ? ' filled' : ''}`;
          cupButton.textContent = cupIndex <= currentCups ? '🥤' : '☕';
          cupButton.setAttribute('aria-label', `Set cups to ${cupIndex}`);
          cupButton.addEventListener('click', () => {
            const activeCount = Math.max(0, Math.min(10, getConditionalCharacteristicNumber(state.conditionals[index], 'cups')));
            const nextValue = activeCount === cupIndex ? cupIndex - 1 : cupIndex;
            state.conditionals[index].characteristicValues = {
              ...(state.conditionals[index].characteristicValues || {}),
              cups: nextValue,
            };
            saveState();
            render();
          });
          cupsWrap.appendChild(cupButton);
        }

        field.appendChild(fieldLabel);
        field.appendChild(cupsWrap);
      } else if (characteristic.type === 'boolean') {
        field.classList.add('conditional-field-boolean');
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = Boolean(item.characteristicValues?.[characteristic.key]);
        input.addEventListener('change', () => {
          const nextValue = input.checked;
          state.conditionals[index].characteristicValues = {
            ...(state.conditionals[index].characteristicValues || {}),
            [characteristic.key]: nextValue,
          };
          saveState();
          render();
        });

        field.appendChild(fieldLabel);
        field.appendChild(input);
      } else {
        const input = document.createElement('input');
        input.type = 'number';
        input.min = String(characteristic.min ?? 0);
        input.step = 'any';
        input.className = 'conditional-field-input';
        const currentValue = item.characteristicValues?.[characteristic.key];
        input.value = currentValue === '' || currentValue === null || currentValue === undefined ? '' : String(currentValue);
        input.addEventListener('change', () => {
          const nextValue = input.value === '' ? '' : Number(input.value);
          state.conditionals[index].characteristicValues = {
            ...(state.conditionals[index].characteristicValues || {}),
            [characteristic.key]: Number.isFinite(nextValue) ? nextValue : '',
          };
          saveState();
          render();
        });

        field.appendChild(fieldLabel);
        field.appendChild(input);
      }

      details.appendChild(field);
    });

    li.appendChild(checkbox);
    li.appendChild(label);
    if ((item.characteristics || []).length > 0) {
      li.appendChild(details);
    }
    container.appendChild(li);
  });
}

function renderLongTermChecklists() {
  ensureStateShape();

  checklistSections.innerHTML = '';
  const sections = [
    { key: 'weekly', title: 'Weekly Tracker', subtitle: 'Custom habits for this week.' },
    { key: 'quarterly', title: 'Quarterly Goals', subtitle: 'Custom goals for the next 3 months.' },
    { key: 'yearly', title: 'Yearly Goals', subtitle: 'Custom goals for the year.' },
    { key: 'fiveYear', title: 'Five-Year Goals', subtitle: 'Longer-term life goals.' },
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
      openAddChecklistItemDialog(section.key, section.title);
    });

    if (section.key === 'quarterly') {
      const resetButton = document.createElement('button');
      resetButton.type = 'button';
      resetButton.className = 'secondary-button';
      resetButton.textContent = 'Reset this quarter';
      resetButton.addEventListener('click', () => {
        state.checklists.quarterly = state.checklists.quarterly.map((item) => ({ ...item, done: false, progress: 0 }));
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
        state.checklists.yearly = state.checklists.yearly.map((item) => ({ ...item, done: false, progress: 0 }));
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
    const averageProgress = items.length
      ? Math.round(items.reduce((sum, item) => sum + (Number(item.progress) || 0), 0) / items.length)
      : 0;
    summary.textContent = `${completed}/${items.length} done • ${percent}% complete • ${averageProgress}% avg progress`;

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
        const supportsProgressTracking = section.key === 'quarterly' || section.key === 'yearly' || section.key === 'fiveYear';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'checkbox';
        checkbox.checked = item.done;
        checkbox.addEventListener('change', () => {
          state.checklists[section.key][index].done = checkbox.checked;
          if (supportsProgressTracking) {
            state.checklists[section.key][index].progress = checkbox.checked
              ? 100
              : Math.min(99, Number(state.checklists[section.key][index].progress) || 0);
          }
          saveState();
          render();
          if (checkbox.checked) {
            launchConfetti();
          }
        });

        const label = document.createElement('span');
        label.className = 'task-label';
        label.textContent = item.text;

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

        let progressControl = null;
        if (supportsProgressTracking) {
          progressControl = document.createElement('div');
          progressControl.className = 'progress-control';

          const progressLabel = document.createElement('span');
          progressLabel.className = 'priority-label';
          progressLabel.textContent = 'Progress';

          const progressInput = document.createElement('input');
          progressInput.type = 'number';
          progressInput.min = '0';
          progressInput.max = '100';
          progressInput.step = '1';
          progressInput.className = 'progress-input';
          progressInput.value = String(Number(item.progress) || 0);
          progressInput.addEventListener('change', () => {
            const parsed = Number(progressInput.value);
            const nextProgress = Number.isFinite(parsed) ? Math.max(0, Math.min(100, Math.round(parsed))) : 0;
            state.checklists[section.key][index].progress = nextProgress;
            state.checklists[section.key][index].done = nextProgress >= 100;
            saveState();
            render();
            if (nextProgress >= 100) {
              launchConfetti();
            }
          });

          progressControl.appendChild(progressLabel);
          progressControl.appendChild(progressInput);
        }

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
        if (progressControl) {
          li.appendChild(progressControl);
        }
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

const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'light';
document.body.dataset.theme = savedTheme;
themeButtons.forEach((button) => button.classList.toggle('active', button.dataset.theme === savedTheme));

function render() {
  const dayChanged = ensureTodayState();
  const progress = getDailyQuestProgressSnapshot();
  const streak = calculateStreak(state.history);

  completedCountEl.textContent = `${progress.completedRequiredCount}`;
  progressPercentEl.textContent = `${progress.dailyPercent}%`;
  streakCountEl.textContent = `${streak}`;
  if (xpCountEl) xpCountEl.textContent = '0';
  if (levelCountEl) levelCountEl.textContent = '0';
  if (levelProgressTextEl) {
    levelProgressTextEl.textContent = 'Daily consistency over time matters more than perfection.';
  }

  todayStatusEl.textContent = dayChanged
    ? 'A fresh day has started — your checklist is reset.'
    : progress.allRequiredDone
      ? 'Nice work — you hit everything today.'
      : progress.requiredDailyCount === 0
        ? 'Your daily checklist is ready for today.'
        : `${progress.remainingRequiredCount} left to go today.`;

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
  renderDailyChecklist();
  renderConditionalChecklist();
  renderLongTermChecklists();
  maybeNotifyAllTasksComplete(progress.allRequiredDone);
}

function getMealDialogTitleLabel() {
  const selectedType = String(mealTypeInput?.value || 'food').trim();
  if (selectedType === 'alcohol') {
    return 'Alcohol';
  }

  const custom = String(mealTypeCustomInput?.value || '').trim();
  return custom || 'Meal';
}

function getDraftMealTotals() {
  return draftMealItems.reduce((totals, item) => {
    totals.calories += Number(item?.calories) || 0;
    totals.protein += Number(item?.protein) || 0;
    totals.carbs += Number(item?.carbs) || 0;
    totals.fat += Number(item?.fat) || 0;
    return totals;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
}

function setMealDialogStatus(message) {
  if (mealDialogStatus) {
    mealDialogStatus.textContent = message;
  }
}

function setMealFoodSearchStatus(message) {
  if (mealFoodSearchStatus) {
    mealFoodSearchStatus.textContent = message;
  }
}

function applyFoodToMealFields(item) {
  if (!item || typeof item !== 'object') return;
  if (mealItemNameInput) mealItemNameInput.value = sanitizeMealText(item.name, 'Food');
  if (mealItemCaloriesInput) mealItemCaloriesInput.value = String(Math.max(0, Math.round(Number(item.calories) || 0)) || '');
  if (mealItemProteinInput) mealItemProteinInput.value = String(Math.max(0, Math.round(Number(item.protein) || 0)) || '');
  if (mealItemCarbsInput) mealItemCarbsInput.value = String(Math.max(0, Math.round(Number(item.carbs) || 0)) || '');
  if (mealItemFatInput) mealItemFatInput.value = String(Math.max(0, Math.round(Number(item.fat) || 0)) || '');
}

function renderMealFoodSearchResults(items) {
  if (!mealFoodSearchResults) return;
  mealFoodSearchResults.innerHTML = '';

  if (!Array.isArray(items) || items.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty-state';
    empty.textContent = 'No matching foods found.';
    mealFoodSearchResults.appendChild(empty);
    return;
  }

  items.forEach((item) => {
    const row = document.createElement('li');
    row.className = 'food-lookup-result-item';

    const title = document.createElement('div');
    title.className = 'food-lookup-result-title';
    title.textContent = String(item?.name || 'Unknown food');

    const detail = document.createElement('div');
    detail.className = 'food-lookup-result-detail';
    detail.textContent = `${item.source || 'Built-in'} • ${item.calories || 0} kcal • P ${item.protein || 0}g • C ${item.carbs || 0}g • F ${item.fat || 0}g`;

    const actions = document.createElement('div');
    actions.className = 'meal-list-buttons';

    const useButton = document.createElement('button');
    useButton.type = 'button';
    useButton.className = 'secondary-button';
    useButton.textContent = 'Use';
    useButton.addEventListener('click', () => {
      applyFoodToMealFields(item);
      setMealFoodSearchStatus(`${item.name} loaded. Click Add item to meal.`);
    });

    const addButton = document.createElement('button');
    addButton.type = 'button';
    addButton.className = 'secondary-button';
    addButton.textContent = 'Add';
    addButton.addEventListener('click', () => {
      applyFoodToMealFields(item);
      addItemToDraftMeal();
    });

    actions.appendChild(useButton);
    actions.appendChild(addButton);
    row.appendChild(title);
    row.appendChild(detail);
    row.appendChild(actions);
    mealFoodSearchResults.appendChild(row);
  });
}

function runMealFoodSearch() {
  const query = String(mealFoodSearchInput?.value || '').trim();
  if (!query) {
    setMealFoodSearchStatus('Search a food to add it quickly.');
    if (mealFoodSearchResults) {
      mealFoodSearchResults.innerHTML = '';
    }
    return;
  }

  const items = searchLocalFoods(query, FOOD_SEARCH_LIMIT);
  setMealFoodSearchStatus(items.length > 0 ? 'Choose a result to use or add.' : 'No matching foods found.');
  renderMealFoodSearchResults(items);
}

function renderDraftMealItems() {
  const totals = getDraftMealTotals();
  if (mealDraftTotals) {
    mealDraftTotals.textContent = `Total: ${totals.calories} kcal • P ${totals.protein}g • C ${totals.carbs}g • F ${totals.fat}g`;
  }

  if (!mealDraftItemsList) return;
  mealDraftItemsList.innerHTML = '';

  if (draftMealItems.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty-state';
    empty.textContent = 'No items yet.';
    mealDraftItemsList.appendChild(empty);
    return;
  }

  draftMealItems.forEach((item, index) => {
    const row = document.createElement('li');
    row.className = 'social-item';

    const textWrap = document.createElement('div');

    const title = document.createElement('div');
    title.className = 'social-item-text';
    title.textContent = item.label;

    const meta = document.createElement('div');
    meta.className = 'meal-list-meta';
    meta.textContent = `${item.calories} kcal • P ${item.protein}g • C ${item.carbs}g • F ${item.fat}g`;

    textWrap.appendChild(title);
    textWrap.appendChild(meta);

    const actions = document.createElement('div');
    actions.className = 'meal-list-buttons';

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'secondary-button';
    removeButton.textContent = 'Remove';
    removeButton.addEventListener('click', () => {
      draftMealItems.splice(index, 1);
      renderDraftMealItems();
      setMealDialogStatus('Meal item removed.');
    });

    actions.appendChild(removeButton);
    row.appendChild(textWrap);
    row.appendChild(actions);
    mealDraftItemsList.appendChild(row);
  });
}

function renderMealHistoryTab() {
  const selectedDateKey = String(mealHistoryDateInput?.value || getTodayKey()).trim() || getTodayKey();
  const dayEntries = getMealEntriesByDateKey(selectedDateKey);
  const dayTotals = getMacroTotalsFromEntries(dayEntries);
  const rangeStats = getMacroStatsForWindow(selectedDateKey, activeMealHistoryRangeDays);

  if (mealHistoryDailySummary) {
    mealHistoryDailySummary.textContent = `Daily total: ${dayTotals.calories} kcal • P ${dayTotals.protein}g • C ${dayTotals.carbs}g • F ${dayTotals.fat}g`;
  }

  if (mealHistorySevenDaySummary) {
    mealHistorySevenDaySummary.textContent = `${activeMealHistoryRangeDays}-day total: ${rangeStats.total.calories} kcal • P ${rangeStats.total.protein}g • C ${rangeStats.total.carbs}g • F ${rangeStats.total.fat}g | Avg/day: ${rangeStats.average.calories} kcal • P ${rangeStats.average.protein}g • C ${rangeStats.average.carbs}g • F ${rangeStats.average.fat}g`;
  }

  if (mealHistoryAlcoholSummary) {
    mealHistoryAlcoholSummary.textContent = `Alcohol total: ${rangeStats.alcoholTotal.calories} kcal • P ${rangeStats.alcoholTotal.protein}g • C ${rangeStats.alcoholTotal.carbs}g • F ${rangeStats.alcoholTotal.fat}g | Avg/day: ${rangeStats.alcoholAverage.calories} kcal • P ${rangeStats.alcoholAverage.protein}g • C ${rangeStats.alcoholAverage.carbs}g • F ${rangeStats.alcoholAverage.fat}g`;
  }

  mealHistoryRangeChipButtons.forEach((button) => {
    const days = Number(button.dataset.days) || 7;
    button.classList.toggle('active', days === activeMealHistoryRangeDays);
  });

  renderMealHistoryChart(rangeStats.series);

  if (!mealHistoryItemsList) return;
  mealHistoryItemsList.innerHTML = '';

  if (dayEntries.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty-state';
    empty.textContent = 'No items logged for this day.';
    mealHistoryItemsList.appendChild(empty);
    return;
  }

  const groupedByMeal = dayEntries.reduce((accumulator, entry) => {
    const mealName = sanitizeMealText(entry?.meal, 'Meal');
    if (!accumulator[mealName]) {
      accumulator[mealName] = [];
    }
    accumulator[mealName].push(entry);
    return accumulator;
  }, {});

  Object.entries(groupedByMeal).forEach(([mealName, entries]) => {
    const row = document.createElement('li');
    row.className = 'social-item meal-history-group';

    const wrap = document.createElement('div');
    wrap.className = 'meal-history-group-wrap';

    const heading = document.createElement('div');
    heading.className = 'social-item-text';
    heading.textContent = mealName;
    wrap.appendChild(heading);

    entries.forEach((entry) => {
      const itemLine = document.createElement('div');
      itemLine.className = 'meal-list-meta';
      if (isAlcoholMealEntry(entry)) {
        itemLine.classList.add('meal-history-item-alcohol');
      }
      itemLine.textContent = `${entry.food} - ${entry.calories} kcal • P ${entry.protein}g • C ${entry.carbs}g • F ${entry.fat}g`;
      wrap.appendChild(itemLine);
    });

    const mealTotals = getMacroTotalsFromEntries(entries);
    const mealTotalLine = document.createElement('div');
    mealTotalLine.className = 'meal-history-meal-total';
    mealTotalLine.textContent = `Meal total: ${mealTotals.calories} kcal • P ${mealTotals.protein}g • C ${mealTotals.carbs}g • F ${mealTotals.fat}g`;
    wrap.appendChild(mealTotalLine);

    row.appendChild(wrap);
    mealHistoryItemsList.appendChild(row);
  });
}

function setActiveMealDialogTab(tabName) {
  activeMealDialogTab = tabName === 'history' ? 'history' : 'builder';
  const onBuilder = activeMealDialogTab === 'builder';

  if (mealBuilderPanel) mealBuilderPanel.hidden = !onBuilder;
  if (mealHistoryPanel) mealHistoryPanel.hidden = onBuilder;
  if (saveMealButton) saveMealButton.hidden = !onBuilder;

  if (mealBuilderTabButton) {
    mealBuilderTabButton.classList.toggle('active', onBuilder);
    mealBuilderTabButton.setAttribute('aria-selected', onBuilder ? 'true' : 'false');
  }
  if (mealHistoryTabButton) {
    mealHistoryTabButton.classList.toggle('active', !onBuilder);
    mealHistoryTabButton.setAttribute('aria-selected', onBuilder ? 'false' : 'true');
  }

  if (!onBuilder) {
    renderMealHistoryTab();
  }
}

function updateMealBuilderVisibility() {
  const selectedMealType = String(mealTypeInput?.value || 'food').trim();
  const isAlcoholMode = selectedMealType === 'alcohol';

  if (mealTypeCustomField) {
    mealTypeCustomField.hidden = isAlcoholMode;
  }

  if (mealFoodFields) {
    mealFoodFields.hidden = isAlcoholMode;
  }
  if (mealAlcoholFields) {
    mealAlcoholFields.hidden = !isAlcoholMode;
  }
}

function resetMealItemFields() {
  if (mealItemNameInput) mealItemNameInput.value = '';
  if (mealItemCaloriesInput) mealItemCaloriesInput.value = '';
  if (mealItemProteinInput) mealItemProteinInput.value = '';
  if (mealItemCarbsInput) mealItemCarbsInput.value = '';
  if (mealItemFatInput) mealItemFatInput.value = '';
  if (saveMealItemToMyFoodsCheckbox) saveMealItemToMyFoodsCheckbox.checked = false;
  if (alcoholDrinkTypeInput) alcoholDrinkTypeInput.value = 'beer';
  if (alcoholDrinkCountInput) alcoholDrinkCountInput.value = '1';
}

function resetMealDialogFields() {
  draftMealItems = [];
  if (mealTypeInput) mealTypeInput.value = 'food';
  if (mealTypeCustomInput) mealTypeCustomInput.value = '';
  if (mealHistoryDateInput) mealHistoryDateInput.value = getTodayKey();
  if (mealFoodSearchInput) mealFoodSearchInput.value = '';
  resetMealItemFields();
  updateMealBuilderVisibility();
  setActiveMealDialogTab('builder');
  setMealDialogStatus('Add at least one item to build your meal total.');
  setMealFoodSearchStatus('Search a food to add it quickly.');
  if (mealFoodSearchResults) {
    mealFoodSearchResults.innerHTML = '';
  }
  renderDraftMealItems();
  renderMealHistoryTab();
}

function createFoodDraftItem() {
  const label = sanitizeMealText(mealItemNameInput?.value, 'Food item');
  const macros = {
    calories: parseMacroInputValue(mealItemCaloriesInput?.value),
    protein: parseMacroInputValue(mealItemProteinInput?.value),
    carbs: parseMacroInputValue(mealItemCarbsInput?.value),
    fat: parseMacroInputValue(mealItemFatInput?.value),
  };

  const hasAny = Object.values(macros).some((value) => value > 0);
  if (!hasAny) {
    return null;
  }

  return { label, category: 'food', ...macros };
}

function createAlcoholDraftItem() {
  const drinkKey = String(alcoholDrinkTypeInput?.value || 'beer').trim();
  const drinkTemplate = ALCOHOL_MACROS_PER_DRINK[drinkKey] || ALCOHOL_MACROS_PER_DRINK.beer;
  const count = Math.max(1, Math.round(parseMacroInputValue(alcoholDrinkCountInput?.value) || 1));

  return {
    label: `${drinkTemplate.label} x${count}`,
    category: 'alcohol',
    calories: drinkTemplate.calories * count,
    protein: drinkTemplate.protein * count,
    carbs: drinkTemplate.carbs * count,
    fat: drinkTemplate.fat * count,
  };
}

function addItemToDraftMeal() {
  const selectedMealType = String(mealTypeInput?.value || 'food').trim();
  const nextItem = selectedMealType === 'alcohol' ? createAlcoholDraftItem() : createFoodDraftItem();

  if (!nextItem) {
    setMealDialogStatus('Enter at least one macro value for this food item.');
    return;
  }

  draftMealItems.push(nextItem);
  let savedToMyFoods = false;
  if (selectedMealType === 'food' && saveMealItemToMyFoodsCheckbox?.checked) {
    savedToMyFoods = upsertSavedFood({
      name: nextItem.label,
      calories: nextItem.calories,
      protein: nextItem.protein,
      carbs: nextItem.carbs,
      fat: nextItem.fat,
    });
    if (savedToMyFoods) {
      saveState();
    }
  }

  resetMealItemFields();
  updateMealBuilderVisibility();
  renderDraftMealItems();
  setMealDialogStatus(savedToMyFoods
    ? `${nextItem.label} added to this meal and saved to My Foods.`
    : `${nextItem.label} added to this meal.`);
}

function saveDraftMealToLog() {
  if (draftMealItems.length === 0) {
    setMealDialogStatus('Add at least one food or drink item before saving the meal.');
    return false;
  }

  const mealLabel = getMealDialogTitleLabel();
  seedMealLogFromCurrentMacrosIfNeeded();

  let addedCount = 0;
  draftMealItems.forEach((item) => {
    const wasAdded = addMealEntryToToday({
      meal: mealLabel,
      food: item.label,
      category: item.category,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
    });
    if (wasAdded) addedCount += 1;
  });

  if (addedCount === 0) {
    setMealDialogStatus('No valid macros were found to save.');
    return false;
  }

  recalculateTodayMacrosFromMeals();
  setMacroFieldValues(createEmptyMacroValues());
  updateHistoryFromCompletion();
  saveState();
  updateDailyMeta();
  render();
  launchConfetti();
  return true;
}

function resetChecklistDialogFields() {
  if (checklistItemTextInput) checklistItemTextInput.value = '';
  if (checklistProgressInput) checklistProgressInput.value = '0';
}

function openAddChecklistItemDialog(sectionKey, sectionTitle) {
  if (!addChecklistDialog) return;

  activeChecklistSectionKey = sectionKey;
  const supportsProgress = sectionKey === 'quarterly' || sectionKey === 'yearly' || sectionKey === 'fiveYear';

  if (addChecklistDialogTitle) {
    addChecklistDialogTitle.textContent = `Add item to ${sectionTitle}`;
  }
  if (checklistProgressField) {
    checklistProgressField.hidden = !supportsProgress;
  }

  resetChecklistDialogFields();
  if (typeof addChecklistDialog.showModal === 'function') {
    addChecklistDialog.showModal();
  } else {
    addChecklistDialog.setAttribute('open', 'open');
  }
}

function closeAddChecklistItemDialog() {
  if (!addChecklistDialog) return;
  if (typeof addChecklistDialog.close === 'function') {
    addChecklistDialog.close();
  } else {
    addChecklistDialog.removeAttribute('open');
  }
}

function openAddMealDialog() {
  if (!addMealDialog) return;
  if (mealHistoryDateInput && !mealHistoryDateInput.value) {
    mealHistoryDateInput.value = getTodayKey();
  }
  renderMealHistoryTab();
  if (typeof addMealDialog.showModal === 'function') {
    addMealDialog.showModal();
  } else {
    addMealDialog.setAttribute('open', 'open');
  }
}

function closeAddMealDialog() {
  if (!addMealDialog) return;
  if (typeof addMealDialog.close === 'function') {
    addMealDialog.close();
  } else {
    addMealDialog.removeAttribute('open');
  }
}

resetButton.addEventListener('click', () => {
  state.unconditionals = state.unconditionals.map((task) => ({
    ...task,
    done: false,
    completedDate: '',
    hydrationCups: task.id === 'hydration' ? 0 : task.hydrationCups,
    attribute: getFixedAttribute(task.text),
  }));
  state.conditionals = state.conditionals.map((task) => ({ ...task, done: false, completedDate: '', xpEarned: 0, attribute: getFixedAttribute(task.text) }));
  state.mood = '';
  state.currentWeight = '';
  clearTodayMacroTracking();
  state.currentMacros = createEmptyMacroValues();
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

weightSaveButton.addEventListener('click', () => {
  saveWeightEntry();
});

weightInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    saveWeightEntry();
  }
});

macroSaveButton?.addEventListener('click', () => {
  saveMacroEntry({
    meal: 'Quick add',
    food: 'Manual entry',
  });
});

addMealButton?.addEventListener('click', () => {
  resetMealDialogFields();
  openAddMealDialog();
});

cancelMealButton?.addEventListener('click', () => {
  closeAddMealDialog();
});

mealTypeInput?.addEventListener('change', () => {
  updateMealBuilderVisibility();
});

mealFoodSearchInput?.addEventListener('input', () => {
  runMealFoodSearch();
});

mealFoodSearchInput?.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    runMealFoodSearch();
  }
});

mealBuilderTabButton?.addEventListener('click', () => {
  setActiveMealDialogTab('builder');
});

mealHistoryTabButton?.addEventListener('click', () => {
  setActiveMealDialogTab('history');
});

mealHistoryDateInput?.addEventListener('change', () => {
  renderMealHistoryTab();
});

mealHistoryRangeChipButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const nextDays = Number(button.dataset.days);
    if (!Number.isFinite(nextDays) || nextDays <= 0) return;
    activeMealHistoryRangeDays = nextDays;
    renderMealHistoryTab();
  });
});

addMealItemButton?.addEventListener('click', () => {
  addItemToDraftMeal();
});

cancelChecklistItemButton?.addEventListener('click', () => {
  closeAddChecklistItemDialog();
});

addChecklistForm?.addEventListener('submit', (event) => {
  event.preventDefault();

  const sectionKey = String(activeChecklistSectionKey || '').trim();
  if (!sectionKey || !state.checklists?.[sectionKey]) {
    closeAddChecklistItemDialog();
    return;
  }

  const text = String(checklistItemTextInput?.value || '').trim();
  if (!text) return;

  const supportsProgress = sectionKey === 'quarterly' || sectionKey === 'yearly' || sectionKey === 'fiveYear';
  const parsedProgress = Number(checklistProgressInput?.value);
  const nextProgress = supportsProgress && Number.isFinite(parsedProgress)
    ? Math.max(0, Math.min(100, Math.round(parsedProgress)))
    : 0;

  state.checklists[sectionKey].push({
    text,
    done: nextProgress >= 100,
    progress: nextProgress,
    priority: 'medium',
  });

  saveState();
  render();
  if (nextProgress >= 100) {
    launchConfetti();
  }

  closeAddChecklistItemDialog();
  resetChecklistDialogFields();
});

addMealForm?.addEventListener('submit', (event) => {
  event.preventDefault();

  const saved = saveDraftMealToLog();

  if (!saved) {
    return;
  }

  closeAddMealDialog();
  resetMealDialogFields();
});

[macroCaloriesInput, macroProteinInput, macroCarbsInput, macroFatInput].forEach((input) => {
  input?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      saveMacroEntry();
    }
  });
});

foodLookupSearchButton?.addEventListener('click', () => {
  runFoodLookupSearch();
});

addSharedFoodButton?.addEventListener('click', () => {
  addCurrentFoodToSharedLibrary();
});

foodLookupQueryInput?.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    runFoodLookupSearch();
  }
});

saveProfileButton?.addEventListener('click', async () => {
  const syncAdapter = getSyncAdapter();
  if (!syncAdapter?.enabled || typeof syncAdapter.updateMyProfile !== 'function') {
    setProfileStatus('Profile updates are not available yet.');
    return;
  }

  saveProfileButton.disabled = true;
  const result = await syncAdapter.updateMyProfile({
    displayName: profileDisplayNameInput?.value,
    photoUrl: profilePhotoUrlInput?.value,
  });
  saveProfileButton.disabled = false;

  if (!result.ok) {
    setProfileStatus(result.message);
    return;
  }

  if (result.profile) {
    socialHub.profile = result.profile;
  }
  setProfileStatus('Profile saved.');
  renderSocialHub();
});

followSearchButton?.addEventListener('click', () => {
  runFollowSearch();
});

followSearchInput?.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    runFollowSearch();
  }
});

createPartyButton?.addEventListener('click', async () => {
  const syncAdapter = getSyncAdapter();
  if (!syncAdapter?.enabled || typeof syncAdapter.createParty !== 'function') {
    setSocialStatus('Party creation is not available yet.');
    return;
  }

  const partyName = String(createPartyNameInput?.value || '').trim();
  const result = await syncAdapter.createParty(partyName);
  setSocialStatus(result.message);
  if (!result.ok) return;

  if (createPartyNameInput) {
    createPartyNameInput.value = '';
  }
  await hydrateSocialHubData();
});

joinPartyButton?.addEventListener('click', async () => {
  const syncAdapter = getSyncAdapter();
  if (!syncAdapter?.enabled || typeof syncAdapter.joinParty !== 'function') {
    setSocialStatus('Party joining is not available yet.');
    return;
  }

  const partyId = String(joinPartyIdInput?.value || '').trim();
  const result = await syncAdapter.joinParty(partyId);
  setSocialStatus(result.message);
  if (!result.ok) return;

  if (joinPartyIdInput) {
    joinPartyIdInput.value = '';
  }
  await hydrateSocialHubData();
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
    applyStartingProfileFromUserMetadata();
    ensureRemindersEnabledWhenPermitted();
    updateAccountUi();
    showAppShell();
    scheduleReminders();
    render();
    await hydrateStateFromSupabase();
    await hydrateSharedFoodLibrary();
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
