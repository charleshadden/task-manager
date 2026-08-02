const STORAGE_KEY = 'habit-checklist-v1';

const summaryShell = document.getElementById('summaryShell');
const summaryBootStatus = document.getElementById('summaryBootStatus');
const summaryAccountEmail = document.getElementById('summaryAccountEmail');
const summaryLogoutButton = document.getElementById('summaryLogoutButton');
const summaryXp = document.getElementById('summaryXp');
const summaryCurrentStreak = document.getElementById('summaryCurrentStreak');
const summaryBestStreak = document.getElementById('summaryBestStreak');
const summaryDailyCompletions = document.getElementById('summaryDailyCompletions');
const summaryAdventureCompletions = document.getElementById('summaryAdventureCompletions');
const summaryAverageMood = document.getElementById('summaryAverageMood');
const summaryAverageSteps = document.getElementById('summaryAverageSteps');
const summaryAverageWeight = document.getElementById('summaryAverageWeight');
const summaryAverageCalories = document.getElementById('summaryAverageCalories');
const summaryAverageProtein = document.getElementById('summaryAverageProtein');
const summaryAverageCarbs = document.getElementById('summaryAverageCarbs');
const summaryAverageFat = document.getElementById('summaryAverageFat');
const summaryProgressText = document.getElementById('summaryProgressText');
const summaryAdventures = document.getElementById('summaryAdventures');
const summaryDailyQuests = document.getElementById('summaryDailyQuests');
const summaryStatus = document.getElementById('summaryStatus');

function getSyncAdapter() {
  return window.supabaseSync || null;
}

function setBootStatus(message) {
  if (summaryBootStatus) {
    summaryBootStatus.textContent = message;
  }
}

function setSummaryStatus(message) {
  if (summaryStatus) {
    summaryStatus.textContent = message;
  }
}

function showSummaryShell() {
  if (summaryBootStatus) {
    summaryBootStatus.hidden = true;
    summaryBootStatus.style.display = 'none';
  }

  if (summaryShell) {
    summaryShell.hidden = false;
    summaryShell.style.display = '';
  }
}

function redirectToLogin() {
  const query = new URLSearchParams({ next: '/summary.html' }).toString();
  window.location.replace(`/login.html?${query}`);
}

function getStorageKeyForUser(user) {
  return user?.id ? `${STORAGE_KEY}:${user.id}` : STORAGE_KEY;
}

function parseTimestamp(value) {
  const parsed = Date.parse(value || '');
  return Number.isFinite(parsed) ? parsed : 0;
}

function safeNumber(value) {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function formatNumber(value) {
  return new Intl.NumberFormat().format(safeNumber(value));
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function calculateCurrentStreak(history) {
  if (!Array.isArray(history) || history.length === 0) return 0;

  const uniqueDays = [...new Set(history)].sort();
  const today = new Date();
  let streak = 0;
  const cursor = new Date(today);

  while (true) {
    const key = toDateKey(cursor);
    if (!uniqueDays.includes(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function calculateBestStreak(history) {
  if (!Array.isArray(history) || history.length === 0) return 0;

  const uniqueDays = [...new Set(history)].sort();
  let best = 0;
  let current = 0;
  let previousDate = null;

  uniqueDays.forEach((dayKey) => {
    const day = new Date(`${dayKey}T00:00:00`);
    if (Number.isNaN(day.getTime())) return;

    if (!previousDate) {
      current = 1;
      best = Math.max(best, current);
      previousDate = day;
      return;
    }

    const diff = Math.round((day.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 1) {
      current += 1;
    } else {
      current = 1;
    }

    best = Math.max(best, current);
    previousDate = day;
  });

  return best;
}


function ensureTotalsShape(state) {
  const totals = state?.totals && typeof state.totals === 'object' ? state.totals : {};
  return {
    dailyCompletions: safeNumber(totals.dailyCompletions),
    dailyXpEarned: safeNumber(totals.dailyXpEarned),
    adventureCompletions: totals.adventureCompletions && typeof totals.adventureCompletions === 'object' ? totals.adventureCompletions : {},
    adventureXpEarned: totals.adventureXpEarned && typeof totals.adventureXpEarned === 'object' ? totals.adventureXpEarned : {},
    dailyTaskCompletions: totals.dailyTaskCompletions && typeof totals.dailyTaskCompletions === 'object' ? totals.dailyTaskCompletions : {},
    dailyTaskXpEarned: totals.dailyTaskXpEarned && typeof totals.dailyTaskXpEarned === 'object' ? totals.dailyTaskXpEarned : {},
  };
}

function readLocalState(user) {
  try {
    const key = getStorageKeyForUser(user);
    const raw = localStorage.getItem(key) || localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function pickNewestState(localState, remoteState) {
  if (!localState) return remoteState || null;
  if (!remoteState) return localState;

  const localTs = parseTimestamp(localState.updatedAt);
  const remoteTs = parseTimestamp(remoteState.updatedAt);
  return remoteTs > localTs ? remoteState : localState;
}

function renderRows(container, rows) {
  if (!container) return;
  container.innerHTML = '';

  if (!rows || rows.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty-state';
    empty.textContent = 'No totals yet.';
    container.appendChild(empty);
    return;
  }

  rows.forEach((row) => {
    const item = document.createElement('li');
    item.className = 'summary-row';

    const label = document.createElement('span');
    label.className = 'summary-row-label';
    label.textContent = row.label;

    const stats = document.createElement('span');
    stats.className = 'summary-row-stats';
    stats.textContent = `${formatNumber(row.completions)} completions`;

    item.appendChild(label);
    item.appendChild(stats);
    container.appendChild(item);
  });
}

function renderSummary(state, user) {
  const safeState = state || {};
  const totals = ensureTotalsShape(safeState);

  const history = Array.isArray(safeState.history) ? safeState.history : [];
  const currentStreak = calculateCurrentStreak(history);
  const bestStreak = calculateBestStreak(history);

  const conditionals = Array.isArray(safeState.conditionals) ? safeState.conditionals : [];
  const unconditionals = Array.isArray(safeState.unconditionals) ? safeState.unconditionals : [];

  const adventureNameById = Object.fromEntries(conditionals.map((task) => [task.id, task.text || task.id]));
  const dailyNameById = Object.fromEntries(unconditionals.map((task) => [task.id, task.text || task.id]));

  const adventureRows = Object.keys(totals.adventureCompletions)
    .map((taskId) => ({
      id: taskId,
      label: adventureNameById[taskId] || taskId,
      completions: safeNumber(totals.adventureCompletions[taskId]),
    }))
    .filter((row) => row.completions > 0)
    .sort((a, b) => b.completions - a.completions || a.label.localeCompare(b.label));

  const dailyRows = Object.keys(totals.dailyTaskCompletions)
    .map((taskId) => ({
      id: taskId,
      label: dailyNameById[taskId] || taskId,
      completions: safeNumber(totals.dailyTaskCompletions[taskId]),
    }))
    .filter((row) => row.completions > 0)
    .sort((a, b) => b.completions - a.completions || a.label.localeCompare(b.label));

  const adventureCompletionTotal = adventureRows.reduce((sum, row) => sum + row.completions, 0);

  const moodScale = {
    '😔': 1,
    '😤': 2,
    '😐': 3,
    '😌': 4,
    '😄': 5,
  };
  const moodByScore = {
    1: '😔',
    2: '😤',
    3: '😐',
    4: '😌',
    5: '😄',
  };

  const moodLog = Array.isArray(safeState.moodLog) ? safeState.moodLog : [];
  const moodScores = moodLog
    .map((entry) => moodScale[String(entry?.mood || '').trim()] || null)
    .filter((score) => Number.isFinite(score));
  const averageMoodScore = moodScores.length > 0
    ? moodScores.reduce((sum, score) => sum + score, 0) / moodScores.length
    : 0;
  const averageMoodRounded = averageMoodScore > 0 ? Math.round(averageMoodScore) : 0;
  const averageMoodEmoji = averageMoodRounded > 0 ? moodByScore[averageMoodRounded] : '-';

  const stepsLog = Array.isArray(safeState.stepsLog) ? safeState.stepsLog : [];
  const stepValues = stepsLog
    .map((entry) => safeNumber(entry?.steps))
    .filter((value) => Number.isFinite(value) && value >= 0);
  const averageSteps = stepValues.length > 0
    ? Math.round(stepValues.reduce((sum, value) => sum + value, 0) / stepValues.length)
    : 0;

  const weightLog = Array.isArray(safeState.weightLog) ? safeState.weightLog : [];
  const weightValues = weightLog
    .map((entry) => safeNumber(entry?.weight))
    .filter((value) => Number.isFinite(value) && value > 0);
  const averageWeight = weightValues.length > 0
    ? weightValues.reduce((sum, value) => sum + value, 0) / weightValues.length
    : 0;

  const macroLog = Array.isArray(safeState.macroLog) ? safeState.macroLog : [];
  const caloriesValues = macroLog.map((entry) => safeNumber(entry?.calories)).filter((value) => value > 0);
  const proteinValues = macroLog.map((entry) => safeNumber(entry?.protein)).filter((value) => value > 0);
  const carbsValues = macroLog.map((entry) => safeNumber(entry?.carbs)).filter((value) => value > 0);
  const fatValues = macroLog.map((entry) => safeNumber(entry?.fat)).filter((value) => value > 0);

  const averageCalories = caloriesValues.length > 0
    ? Math.round(caloriesValues.reduce((sum, value) => sum + value, 0) / caloriesValues.length)
    : 0;
  const averageProtein = proteinValues.length > 0
    ? Math.round(proteinValues.reduce((sum, value) => sum + value, 0) / proteinValues.length)
    : 0;
  const averageCarbs = carbsValues.length > 0
    ? Math.round(carbsValues.reduce((sum, value) => sum + value, 0) / carbsValues.length)
    : 0;
  const averageFat = fatValues.length > 0
    ? Math.round(fatValues.reduce((sum, value) => sum + value, 0) / fatValues.length)
    : 0;

  if (summaryAccountEmail) {
    summaryAccountEmail.textContent = user?.email ? `Signed in as ${user.email}` : 'Signed in';
  }

  if (summaryXp) summaryXp.textContent = '0';
  if (summaryCurrentStreak) summaryCurrentStreak.textContent = `${currentStreak}`;
  if (summaryBestStreak) summaryBestStreak.textContent = `${bestStreak}`;
  if (summaryDailyCompletions) summaryDailyCompletions.textContent = formatNumber(totals.dailyCompletions);
  if (summaryAdventureCompletions) summaryAdventureCompletions.textContent = formatNumber(adventureCompletionTotal);
  if (summaryAverageMood) {
    summaryAverageMood.textContent = averageMoodEmoji === '-' ? '-' : `${averageMoodEmoji} (${averageMoodScore.toFixed(1)})`;
  }
  if (summaryAverageSteps) {
    summaryAverageSteps.textContent = stepValues.length > 0 ? formatNumber(averageSteps) : '-';
  }
  if (summaryAverageWeight) {
    summaryAverageWeight.textContent = weightValues.length > 0 ? averageWeight.toFixed(1) : '-';
  }
  if (summaryAverageCalories) {
    summaryAverageCalories.textContent = caloriesValues.length > 0 ? formatNumber(averageCalories) : '-';
  }
  if (summaryAverageProtein) {
    summaryAverageProtein.textContent = proteinValues.length > 0 ? `${formatNumber(averageProtein)}g` : '-';
  }
  if (summaryAverageCarbs) {
    summaryAverageCarbs.textContent = carbsValues.length > 0 ? `${formatNumber(averageCarbs)}g` : '-';
  }
  if (summaryAverageFat) {
    summaryAverageFat.textContent = fatValues.length > 0 ? `${formatNumber(averageFat)}g` : '-';
  }

  if (summaryProgressText) {
    summaryProgressText.textContent = 'Consistent tracking builds momentum.';
  }

  renderRows(summaryAdventures, adventureRows);
  renderRows(summaryDailyQuests, dailyRows);
}

async function initializeSummaryPage() {
  try {
    const syncAdapter = getSyncAdapter();
    if (!syncAdapter?.enabled) {
      setBootStatus('Supabase auth is not configured.');
      return;
    }

    if (typeof syncAdapter.getSession !== 'function') {
      setBootStatus('Auth module is outdated. Hard refresh and redeploy.');
      return;
    }

    setBootStatus('Checking your account...');

    if (typeof syncAdapter.consumeAuthRedirect === 'function') {
      const redirectResult = await syncAdapter.consumeAuthRedirect();
      if (!redirectResult.ok) {
        setBootStatus(redirectResult.message);
        return;
      }
      if (redirectResult.session?.user && typeof syncAdapter.clearAuthParamsFromUrl === 'function') {
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

    const user = sessionResult.session.user;
    let localState = readLocalState(user);

    if (typeof syncAdapter.loadState === 'function') {
      const remoteResult = await syncAdapter.loadState();
      if (remoteResult.ok && remoteResult.state) {
        const remoteState = {
          ...remoteResult.state,
          updatedAt: remoteResult.updatedAt || remoteResult.state.updatedAt,
        };
        localState = pickNewestState(localState, remoteState);
      }
    }

    showSummaryShell();
    renderSummary(localState || {}, user);
    setSummaryStatus('Summary synced.');

    syncAdapter.onAuthStateChange((session) => {
      if (!session?.user) {
        redirectToLogin();
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected summary initialization error.';
    setBootStatus(`Could not load summary. ${message}`);
  }
}

summaryLogoutButton?.addEventListener('click', async () => {
  const syncAdapter = getSyncAdapter();
  if (!syncAdapter?.enabled) {
    redirectToLogin();
    return;
  }

  summaryLogoutButton.disabled = true;
  const result = await syncAdapter.signOut();
  summaryLogoutButton.disabled = false;

  if (!result.ok) {
    setSummaryStatus(result.message);
    return;
  }

  redirectToLogin();
});

initializeSummaryPage();
