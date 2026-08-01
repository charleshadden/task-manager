const socialShell = document.getElementById('socialShell');
const socialBootStatus = document.getElementById('socialBootStatus');
const socialAccountEmail = document.getElementById('socialAccountEmail');
const socialLogoutButton = document.getElementById('socialLogoutButton');
const socialStatus = document.getElementById('socialStatus');
const followSearchInput = document.getElementById('followSearchInput');
const followSearchButton = document.getElementById('followSearchButton');
const followSearchResults = document.getElementById('followSearchResults');
const followingList = document.getElementById('followingList');
const followersList = document.getElementById('followersList');
const createPartyNameInput = document.getElementById('createPartyNameInput');
const createPartyButton = document.getElementById('createPartyButton');
const joinPartyIdInput = document.getElementById('joinPartyIdInput');
const joinPartyButton = document.getElementById('joinPartyButton');
const partyList = document.getElementById('partyList');

let currentUser = null;

const socialHub = {
  profile: { userId: '', displayName: '', photoUrl: '' },
  following: [],
  followers: [],
  parties: [],
  searchResults: [],
};

function getSyncAdapter() {
  return window.supabaseSync || null;
}

function setBootStatus(message) {
  if (socialBootStatus) {
    socialBootStatus.textContent = message;
  }
}

function setStatus(message) {
  if (socialStatus) {
    socialStatus.textContent = message;
  }
}

function showSocialShell() {
  if (socialBootStatus) {
    socialBootStatus.hidden = true;
    socialBootStatus.style.display = 'none';
  }

  if (socialShell) {
    socialShell.hidden = false;
    socialShell.style.display = '';
  }
}

function redirectToLogin() {
  const query = new URLSearchParams({ next: '/social.html' }).toString();
  window.location.replace(`/login.html?${query}`);
}

function getProfileDisplayName(profile) {
  const name = String(profile?.displayName || '').trim();
  if (name) return name;
  const fallback = String(currentUser?.email || '').split('@')[0];
  return fallback || 'Adventurer';
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
  if (followSearchResults) {
    followSearchResults.innerHTML = '';
    if (socialHub.searchResults.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'empty-state';
      empty.textContent = 'No search results yet.';
      followSearchResults.appendChild(empty);
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
          setStatus(result.message);
          await hydrateSocialHubData();
        };
        followSearchResults.appendChild(createSocialListItem(profile, actionLabel, action));
      });
    }
  }

  if (followingList) {
    followingList.innerHTML = '';
    if (socialHub.following.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'empty-state';
      empty.textContent = 'You are not following anyone yet.';
      followingList.appendChild(empty);
    } else {
      socialHub.following.forEach((profile) => {
        const action = async () => {
          const syncAdapter = getSyncAdapter();
          if (!syncAdapter?.enabled) return;
          const result = await syncAdapter.unfollowUser(profile.userId);
          setStatus(result.message);
          await hydrateSocialHubData();
        };
        followingList.appendChild(createSocialListItem(profile, 'Unfollow', action));
      });
    }
  }

  if (followersList) {
    followersList.innerHTML = '';
    if (socialHub.followers.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'empty-state';
      empty.textContent = 'No followers yet.';
      followersList.appendChild(empty);
    } else {
      socialHub.followers.forEach((profile) => {
        followersList.appendChild(createSocialListItem(profile));
      });
    }
  }

  if (partyList) {
    partyList.innerHTML = '';
    if (socialHub.parties.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'empty-state';
      empty.textContent = 'No parties yet. Create one and invite allies.';
      partyList.appendChild(empty);
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
        partyList.appendChild(item);
      });
    }
  }

  if (socialAccountEmail) {
    socialAccountEmail.textContent = currentUser?.email ? `Signed in as ${currentUser.email}` : 'Signed in';
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
    setStatus('Social features need a newer deployment.');
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
    setStatus(errors[0]);
  } else {
    setStatus('Social hub synced.');
  }

  renderSocialHub();
}

async function runFollowSearch() {
  const syncAdapter = getSyncAdapter();
  if (!syncAdapter?.enabled || typeof syncAdapter.searchProfiles !== 'function') {
    setStatus('Profile search is not available yet.');
    return;
  }

  const query = String(followSearchInput?.value || '').trim();
  const result = await syncAdapter.searchProfiles(query);
  if (!result.ok) {
    setStatus(result.message);
    return;
  }

  socialHub.searchResults = result.profiles || [];
  setStatus(result.message);
  renderSocialHub();
}

async function initializeSocialPage() {
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

    currentUser = sessionResult.session.user;
    showSocialShell();
    await hydrateSocialHubData();

    syncAdapter.onAuthStateChange((session) => {
      if (!session?.user) {
        redirectToLogin();
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected social initialization error.';
    setBootStatus(`Could not load social hub. ${message}`);
  }
}

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
    setStatus('Party creation is not available yet.');
    return;
  }

  const partyName = String(createPartyNameInput?.value || '').trim();
  const result = await syncAdapter.createParty(partyName);
  setStatus(result.message);
  if (!result.ok) return;

  if (createPartyNameInput) {
    createPartyNameInput.value = '';
  }

  await hydrateSocialHubData();
});

joinPartyButton?.addEventListener('click', async () => {
  const syncAdapter = getSyncAdapter();
  if (!syncAdapter?.enabled || typeof syncAdapter.joinParty !== 'function') {
    setStatus('Party joining is not available yet.');
    return;
  }

  const partyId = String(joinPartyIdInput?.value || '').trim();
  const result = await syncAdapter.joinParty(partyId);
  setStatus(result.message);
  if (!result.ok) return;

  if (joinPartyIdInput) {
    joinPartyIdInput.value = '';
  }

  await hydrateSocialHubData();
});

socialLogoutButton?.addEventListener('click', async () => {
  const syncAdapter = getSyncAdapter();
  if (!syncAdapter?.enabled) {
    redirectToLogin();
    return;
  }

  socialLogoutButton.disabled = true;
  const result = await syncAdapter.signOut();
  socialLogoutButton.disabled = false;

  if (!result.ok) {
    setStatus(result.message);
    return;
  }

  redirectToLogin();
});

initializeSocialPage();
