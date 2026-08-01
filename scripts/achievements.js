const STORAGE_KEY = 'habit-checklist-v1';

const achievementsShell = document.getElementById('achievementsShell');
const achievementsBootStatus = document.getElementById('achievementsBootStatus');
const achievementsAccountEmail = document.getElementById('achievementsAccountEmail');
const achievementsLogoutButton = document.getElementById('achievementsLogoutButton');
const achievementsList = document.getElementById('achievementsList');
const achievementsStatus = document.getElementById('achievementsStatus');

function getSyncAdapter() {
  return window.supabaseSync || null;
}

function setBootStatus(message) {
  if (achievementsBootStatus) {
    achievementsBootStatus.textContent = message;
  }
}

function setStatus(message) {
  if (achievementsStatus) {
    achievementsStatus.textContent = message;
  }
}

function showShell() {
  if (achievementsBootStatus) {
    achievementsBootStatus.hidden = true;
    achievementsBootStatus.style.display = 'none';
  }

  if (achievementsShell) {
    achievementsShell.hidden = false;
    achievementsShell.style.display = '';
  }
}

function redirectToLogin() {
  const query = new URLSearchParams({ next: '/achievements.html' }).toString();
  window.location.replace(`/login.html?${query}`);
}

function getStorageKeyForUser(user) {
  return user?.id ? `${STORAGE_KEY}:${user.id}` : STORAGE_KEY;
}

function parseTimestamp(value) {
  const parsed = Date.parse(value || '');
  return Number.isFinite(parsed) ? parsed : 0;
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

function formatDate(value) {
  const date = new Date(value || '');
  if (Number.isNaN(date.getTime())) {
    return 'Unknown date';
  }

  return date.toLocaleDateString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function renderAchievements(state) {
  if (!achievementsList) return;

  achievementsList.innerHTML = '';
  const entries = Array.isArray(state?.achievements) ? state.achievements : [];

  if (entries.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty-state';
    empty.textContent = 'No badges yet. Complete your quests to unlock your first achievement.';
    achievementsList.appendChild(empty);
    return;
  }

  const sortedEntries = [...entries].sort((a, b) => parseTimestamp(b?.awardedAt) - parseTimestamp(a?.awardedAt));

  sortedEntries.forEach((entry) => {
    const item = document.createElement('li');
    item.className = 'achievement-row';

    const badge = document.createElement('span');
    badge.className = 'achievement-icon';
    badge.textContent = '🏅';

    const textWrap = document.createElement('div');
    textWrap.className = 'achievement-text-wrap';

    const title = document.createElement('div');
    title.className = 'achievement-title';
    title.textContent = String(entry?.title || 'Achievement unlocked');

    const meta = document.createElement('div');
    meta.className = 'achievement-meta';
    meta.textContent = `Received ${formatDate(entry?.awardedAt)}`;

    textWrap.appendChild(title);
    textWrap.appendChild(meta);

    item.appendChild(badge);
    item.appendChild(textWrap);
    achievementsList.appendChild(item);
  });
}

async function initializePage() {
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

    if (achievementsAccountEmail) {
      achievementsAccountEmail.textContent = user?.email ? `Signed in as ${user.email}` : 'Signed in';
    }

    showShell();
    renderAchievements(localState || {});
    setStatus('Achievements synced.');

    syncAdapter.onAuthStateChange((session) => {
      if (!session?.user) {
        redirectToLogin();
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected achievements initialization error.';
    setBootStatus(`Could not load achievements. ${message}`);
  }
}

achievementsLogoutButton?.addEventListener('click', async () => {
  const syncAdapter = getSyncAdapter();
  if (!syncAdapter?.enabled) {
    redirectToLogin();
    return;
  }

  achievementsLogoutButton.disabled = true;
  const result = await syncAdapter.signOut();
  achievementsLogoutButton.disabled = false;

  if (!result.ok) {
    setStatus(result.message);
    return;
  }

  redirectToLogin();
});

initializePage();
