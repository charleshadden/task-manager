const leaderboardShell = document.getElementById('leaderboardShell');
const leaderboardBootStatus = document.getElementById('leaderboardBootStatus');
const leaderboardAccountEmail = document.getElementById('leaderboardAccountEmail');
const leaderboardLogoutButton = document.getElementById('leaderboardLogoutButton');
const leaderboardList = document.getElementById('leaderboardList');
const leaderboardStatus = document.getElementById('leaderboardStatus');

function getSyncAdapter() {
  return window.supabaseSync || null;
}

function setBootStatus(message) {
  if (leaderboardBootStatus) {
    leaderboardBootStatus.textContent = message;
  }
}

function setStatus(message) {
  if (leaderboardStatus) {
    leaderboardStatus.textContent = message;
  }
}

function showShell() {
  if (leaderboardBootStatus) {
    leaderboardBootStatus.hidden = true;
    leaderboardBootStatus.style.display = 'none';
  }

  if (leaderboardShell) {
    leaderboardShell.hidden = false;
    leaderboardShell.style.display = '';
  }
}

function redirectToLogin() {
  const query = new URLSearchParams({ next: '/leaderboard.html' }).toString();
  window.location.replace(`/login.html?${query}`);
}

function normalizeDisplayName(raw) {
  const text = String(raw || '').trim();
  return text || 'Unknown Adventurer';
}

function formatNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '0';
  return number.toLocaleString();
}

function getInitial(name) {
  const trimmed = String(name || '').trim();
  return trimmed ? trimmed[0].toUpperCase() : 'A';
}

function getMedalMeta(rank) {
  if (rank === 1) return { label: 'Gold', className: 'leaderboard-rank-gold' };
  if (rank === 2) return { label: 'Silver', className: 'leaderboard-rank-silver' };
  if (rank === 3) return { label: 'Bronze', className: 'leaderboard-rank-bronze' };
  return null;
}

function renderLeaderboard(rows, currentUserId) {
  if (!leaderboardList) return;

  leaderboardList.innerHTML = '';
  if (!Array.isArray(rows) || rows.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty-state';
    empty.textContent = 'No ranking data yet. Complete quests to start climbing the board.';
    leaderboardList.appendChild(empty);
    return;
  }

  rows.forEach((row, index) => {
    const item = document.createElement('li');
    item.className = 'leaderboard-row';

    const rank = Number(row?.rank ?? index + 1);
    const xp = Number(row?.xp ?? 0);
    const userId = String(row?.user_id || '');
    const isMe = userId && currentUserId && userId === currentUserId;

    if (isMe) {
      item.classList.add('leaderboard-row-me');
    }

    const rankNode = document.createElement('span');
    rankNode.className = 'leaderboard-rank';
    rankNode.textContent = `#${Number.isFinite(rank) ? rank : index + 1}`;
    const medalMeta = getMedalMeta(rank);
    if (medalMeta) {
      rankNode.classList.add(medalMeta.className);
      rankNode.setAttribute('title', `${medalMeta.label} medal`);
      rankNode.setAttribute('aria-label', `${medalMeta.label} medal rank ${rank}`);
    }

    const avatarWrap = document.createElement('div');
    avatarWrap.className = 'leaderboard-avatar';

    const avatarImg = document.createElement('img');
    avatarImg.className = 'leaderboard-avatar-image';
    avatarImg.alt = '';
    avatarImg.referrerPolicy = 'no-referrer';

    const avatarFallback = document.createElement('span');
    avatarFallback.className = 'leaderboard-avatar-fallback';

    const details = document.createElement('div');
    details.className = 'leaderboard-details';

    const nameNode = document.createElement('div');
    nameNode.className = 'leaderboard-name';
    const displayName = normalizeDisplayName(row?.display_name);
    nameNode.textContent = isMe ? `${displayName} (You)` : displayName;

    const xpNode = document.createElement('div');
    xpNode.className = 'leaderboard-xp';
    xpNode.textContent = `${formatNumber(xp)} XP`;

    const photoUrl = String(row?.photo_url || '').trim();
    const initial = getInitial(displayName);
    avatarFallback.textContent = initial;

    if (photoUrl) {
      avatarImg.src = photoUrl;
      avatarImg.hidden = false;
      avatarFallback.hidden = true;
      avatarImg.addEventListener('error', () => {
        avatarImg.hidden = true;
        avatarFallback.hidden = false;
      });
    } else {
      avatarImg.hidden = true;
      avatarFallback.hidden = false;
    }

    avatarWrap.appendChild(avatarImg);
    avatarWrap.appendChild(avatarFallback);

    details.appendChild(nameNode);
    details.appendChild(xpNode);

    item.appendChild(rankNode);
    item.appendChild(avatarWrap);
    item.appendChild(details);
    leaderboardList.appendChild(item);
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
    if (leaderboardAccountEmail) {
      leaderboardAccountEmail.textContent = user?.email ? `Signed in as ${user.email}` : 'Signed in';
    }

    showShell();

    if (typeof syncAdapter.getXpLeaderboard !== 'function') {
      setStatus('Leaderboard adapter missing. Hard refresh and redeploy.');
      renderLeaderboard([], user?.id || null);
      return;
    }

    const result = await syncAdapter.getXpLeaderboard(100);
    if (!result.ok) {
      setStatus(result.message);
      renderLeaderboard([], user?.id || null);
      return;
    }

    renderLeaderboard(result.rows, user?.id || null);
    setStatus(result.rows.length ? 'Leaderboard synced.' : 'No leaderboard entries yet.');

    syncAdapter.onAuthStateChange((session) => {
      if (!session?.user) {
        redirectToLogin();
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected leaderboard initialization error.';
    setBootStatus(`Could not load leaderboard. ${message}`);
  }
}

leaderboardLogoutButton?.addEventListener('click', async () => {
  const syncAdapter = getSyncAdapter();
  if (!syncAdapter?.enabled) {
    redirectToLogin();
    return;
  }

  leaderboardLogoutButton.disabled = true;
  const result = await syncAdapter.signOut();
  leaderboardLogoutButton.disabled = false;

  if (!result.ok) {
    setStatus(result.message);
    return;
  }

  redirectToLogin();
});

initializePage();
