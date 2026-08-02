const STORAGE_KEY = 'habit-checklist-v1';

const profileShell = document.getElementById('profileShell');
const profileBootStatus = document.getElementById('profileBootStatus');
const profileAccountEmail = document.getElementById('profileAccountEmail');
const profileLogoutButton = document.getElementById('profileLogoutButton');
const profileDisplayNameInput = document.getElementById('profileDisplayNameInput');
const profilePhotoUrlInput = document.getElementById('profilePhotoUrlInput');
const profilePhotoFileInput = document.getElementById('profilePhotoFileInput');
const profileDropZone = document.getElementById('profileDropZone');
const uploadPhotoButton = document.getElementById('uploadPhotoButton');
const profileBioInput = document.getElementById('profileBioInput');
const profileGoalCaloriesInput = document.getElementById('profileGoalCaloriesInput');
const profileGoalProteinInput = document.getElementById('profileGoalProteinInput');
const profileGoalCarbsInput = document.getElementById('profileGoalCarbsInput');
const profileGoalFatInput = document.getElementById('profileGoalFatInput');
const profileThemeSelect = document.getElementById('profileThemeSelect');
const profileTobaccoEnabledInput = document.getElementById('profileTobaccoEnabledInput');
const profileTobaccoPlanSelect = document.getElementById('profileTobaccoPlanSelect');
const saveProfileButton = document.getElementById('saveProfileButton');
const profileStatus = document.getElementById('profileStatus');
const profilePhotoPreview = document.getElementById('profilePhotoPreview');
const profilePhotoFallback = document.getElementById('profilePhotoFallback');

const VALID_THEMES = ['light', 'dark', 'synthwave'];

function normalizeTobaccoPerDay(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 5;
  return Math.max(1, Math.min(5, Math.round(parsed)));
}

function normalizeTobaccoTaperingSettings(settings) {
  return {
    enabled: Boolean(settings?.enabled),
    perDay: normalizeTobaccoPerDay(settings?.perDay),
  };
}

let currentUser = null;
let cachedState = {};
let myProfile = { userId: '', displayName: '', photoUrl: '' };
let queuedPhotoFile = null;

function getSyncAdapter() {
  return window.supabaseSync || null;
}

function setBootStatus(message) {
  if (profileBootStatus) {
    profileBootStatus.textContent = message;
  }
}

function setStatus(message) {
  if (profileStatus) {
    profileStatus.textContent = message;
  }
}

function showProfileShell() {
  if (profileBootStatus) {
    profileBootStatus.hidden = true;
    profileBootStatus.style.display = 'none';
  }

  if (profileShell) {
    profileShell.hidden = false;
    profileShell.style.display = '';
  }
}

function redirectToLogin() {
  const query = new URLSearchParams({ next: '/profile.html' }).toString();
  window.location.replace(`/login.html?${query}`);
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

function getDisplayName() {
  const fromProfile = String(myProfile.displayName || '').trim();
  if (fromProfile) return fromProfile;

  const fallback = String(currentUser?.email || '').split('@')[0];
  return fallback || 'User';
}

function getInitial(text) {
  const first = String(text || '').trim().charAt(0);
  return first ? first.toUpperCase() : 'U';
}

function getStorageKeyForUser(user) {
  return user?.id ? `${STORAGE_KEY}:${user.id}` : STORAGE_KEY;
}

function readLocalState(user) {
  try {
    const key = getStorageKeyForUser(user);
    const raw = localStorage.getItem(key) || localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function persistLocalState(user, state) {
  try {
    const key = getStorageKeyForUser(user);
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    // Ignore local storage write errors.
  }
}

function safeNumber(value) {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function createEmptyMacroGoalValues() {
  return {
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
  };
}

function parseGoalInputValue(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return '';
  return Math.max(0, Math.round(parsed));
}

function normalizeTheme(value) {
  const theme = String(value || '').trim();
  return VALID_THEMES.includes(theme) ? theme : 'light';
}

function getCurrentTheme() {
  if (window.habitTheme && typeof window.habitTheme.get === 'function') {
    return normalizeTheme(window.habitTheme.get());
  }
  return normalizeTheme(localStorage.getItem('habit-checklist-theme'));
}

function setCurrentTheme(nextTheme) {
  const normalized = normalizeTheme(nextTheme);
  if (window.habitTheme && typeof window.habitTheme.set === 'function') {
    return normalizeTheme(window.habitTheme.set(normalized));
  }

  document.body.dataset.theme = normalized;
  localStorage.setItem('habit-checklist-theme', normalized);
  return normalized;
}

function setDropZoneActive(active) {
  if (!profileDropZone) return;
  profileDropZone.classList.toggle('active', Boolean(active));
}

function setQueuedPhotoFile(file) {
  queuedPhotoFile = file instanceof File ? file : null;
  if (!queuedPhotoFile || !profileDropZone) return;
  profileDropZone.textContent = `Ready: ${queuedPhotoFile.name}`;
}

function clearQueuedPhotoFile() {
  queuedPhotoFile = null;
  if (profilePhotoFileInput) {
    profilePhotoFileInput.value = '';
  }
  if (profileDropZone) {
    profileDropZone.textContent = 'Drop an image here or click to choose a file';
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read image file.'));
    reader.readAsDataURL(file);
  });
}

function loadImageFromDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not decode image.'));
    image.src = dataUrl;
  });
}

function canvasToJpegBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Could not compress image.'));
        return;
      }
      resolve(blob);
    }, 'image/jpeg', quality);
  });
}

async function compressImageFile(file) {
  const dataUrl = await readFileAsDataUrl(file);
  const image = await loadImageFromDataUrl(dataUrl);

  const maxDimension = 1200;
  const width = image.width || 1;
  const height = image.height || 1;
  const scale = Math.min(1, maxDimension / Math.max(width, height));
  const targetWidth = Math.max(1, Math.round(width * scale));
  const targetHeight = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Could not process image canvas.');
  }

  context.drawImage(image, 0, 0, targetWidth, targetHeight);
  const blob = await canvasToJpegBlob(canvas, 0.82);
  return new File([blob], `profile-${Date.now()}.jpg`, { type: 'image/jpeg' });
}

function renderProfile() {
  const displayName = getDisplayName();
  const photoUrl = normalizePhotoUrl(myProfile.photoUrl);

  if (profileDisplayNameInput && document.activeElement !== profileDisplayNameInput) {
    profileDisplayNameInput.value = displayName;
  }

  if (profilePhotoUrlInput && document.activeElement !== profilePhotoUrlInput) {
    profilePhotoUrlInput.value = myProfile.photoUrl || '';
  }

  if (profileBioInput && document.activeElement !== profileBioInput) {
    profileBioInput.value = String(cachedState.profileBio || '');
  }

  const goals = cachedState?.macroGoals && typeof cachedState.macroGoals === 'object'
    ? { ...createEmptyMacroGoalValues(), ...cachedState.macroGoals }
    : createEmptyMacroGoalValues();

  if (profileGoalCaloriesInput && document.activeElement !== profileGoalCaloriesInput) {
    profileGoalCaloriesInput.value = goals.calories || '';
  }
  if (profileGoalProteinInput && document.activeElement !== profileGoalProteinInput) {
    profileGoalProteinInput.value = goals.protein || '';
  }
  if (profileGoalCarbsInput && document.activeElement !== profileGoalCarbsInput) {
    profileGoalCarbsInput.value = goals.carbs || '';
  }
  if (profileGoalFatInput && document.activeElement !== profileGoalFatInput) {
    profileGoalFatInput.value = goals.fat || '';
  }

  if (profileThemeSelect && document.activeElement !== profileThemeSelect) {
    profileThemeSelect.value = getCurrentTheme();
  }

  const tobaccoSettings = normalizeTobaccoTaperingSettings(cachedState?.tobaccoTapering);
  if (profileTobaccoEnabledInput && document.activeElement !== profileTobaccoEnabledInput) {
    profileTobaccoEnabledInput.checked = tobaccoSettings.enabled;
  }
  if (profileTobaccoPlanSelect && document.activeElement !== profileTobaccoPlanSelect) {
    profileTobaccoPlanSelect.value = String(tobaccoSettings.perDay);
  }
  if (profileTobaccoPlanSelect) {
    profileTobaccoPlanSelect.disabled = !tobaccoSettings.enabled;
  }

  if (profilePhotoPreview && profilePhotoFallback) {
    if (photoUrl) {
      profilePhotoPreview.src = photoUrl;
      profilePhotoPreview.hidden = false;
      profilePhotoFallback.hidden = true;
    } else {
      profilePhotoPreview.hidden = true;
      profilePhotoFallback.hidden = false;
      profilePhotoFallback.textContent = getInitial(displayName);
    }
  }

  if (profileAccountEmail) {
    profileAccountEmail.textContent = currentUser?.email ? `Signed in as ${currentUser.email}` : 'Signed in';
  }
}

async function loadStateFromCloud() {
  const syncAdapter = getSyncAdapter();
  if (!syncAdapter?.enabled || typeof syncAdapter.loadState !== 'function') {
    cachedState = readLocalState(currentUser);
    return;
  }

  const localState = readLocalState(currentUser);
  const result = await syncAdapter.loadState();

  if (!result.ok || !result.state) {
    cachedState = localState;
    return;
  }

  const localTs = Date.parse(localState.updatedAt || '') || 0;
  const remoteTs = Date.parse(result.state.updatedAt || result.updatedAt || '') || 0;

  cachedState = remoteTs > localTs ? result.state : localState;
}

async function initializeProfilePage() {
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

    if (typeof syncAdapter.getMyProfile === 'function') {
      const profileResult = await syncAdapter.getMyProfile();
      if (profileResult.ok && profileResult.profile) {
        myProfile = profileResult.profile;
      }
      if (!profileResult.ok) {
        setStatus(profileResult.message);
      }
    }

    await loadStateFromCloud();
    showProfileShell();
    renderProfile();

    syncAdapter.onAuthStateChange((session) => {
      if (!session?.user) {
        redirectToLogin();
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected profile initialization error.';
    setBootStatus(`Could not load profile. ${message}`);
  }
}

async function saveProfileForm(photoUrlOverride = null) {
  const syncAdapter = getSyncAdapter();
  if (!syncAdapter?.enabled || typeof syncAdapter.updateMyProfile !== 'function') {
    setStatus('Profile updates are not available yet.');
    return false;
  }

  const displayName = String(profileDisplayNameInput?.value || '').trim();
  const photoUrl = normalizePhotoUrl(photoUrlOverride || profilePhotoUrlInput?.value || '');
  const bio = String(profileBioInput?.value || '').trim();
  const macroGoals = {
    calories: parseGoalInputValue(profileGoalCaloriesInput?.value),
    protein: parseGoalInputValue(profileGoalProteinInput?.value),
    carbs: parseGoalInputValue(profileGoalCarbsInput?.value),
    fat: parseGoalInputValue(profileGoalFatInput?.value),
  };
  const tobaccoTapering = normalizeTobaccoTaperingSettings({
    enabled: profileTobaccoEnabledInput?.checked,
    perDay: profileTobaccoPlanSelect?.value,
  });

  if (saveProfileButton) {
    saveProfileButton.disabled = true;
  }
  if (uploadPhotoButton) {
    uploadPhotoButton.disabled = true;
  }

  const profileResult = await syncAdapter.updateMyProfile({ displayName, photoUrl });
  if (!profileResult.ok) {
    if (saveProfileButton) {
      saveProfileButton.disabled = false;
    }
    if (uploadPhotoButton) {
      uploadPhotoButton.disabled = false;
    }
    setStatus(profileResult.message);
    return false;
  }

  if (profileResult.profile) {
    myProfile = profileResult.profile;
  }

  cachedState = cachedState && typeof cachedState === 'object' ? cachedState : {};
  cachedState.profileBio = bio;
  cachedState.macroGoals = {
    calories: macroGoals.calories === '' ? '' : String(macroGoals.calories),
    protein: macroGoals.protein === '' ? '' : String(macroGoals.protein),
    carbs: macroGoals.carbs === '' ? '' : String(macroGoals.carbs),
    fat: macroGoals.fat === '' ? '' : String(macroGoals.fat),
  };
  cachedState.tobaccoTapering = tobaccoTapering;
  cachedState.updatedAt = new Date().toISOString();
  persistLocalState(currentUser, cachedState);

  if (typeof syncAdapter.saveState === 'function') {
    const saveResult = await syncAdapter.saveState(cachedState);
    if (!saveResult.ok) {
      if (saveProfileButton) {
        saveProfileButton.disabled = false;
      }
      if (uploadPhotoButton) {
        uploadPhotoButton.disabled = false;
      }
      setStatus(`Profile saved, but bio sync failed. ${saveResult.message}`);
      renderProfile();
      return false;
    }
  }

  if (saveProfileButton) {
    saveProfileButton.disabled = false;
  }
  if (uploadPhotoButton) {
    uploadPhotoButton.disabled = false;
  }
  setStatus('Profile saved.');
  renderProfile();
  return true;
}

saveProfileButton?.addEventListener('click', async () => {
  await saveProfileForm();
});

uploadPhotoButton?.addEventListener('click', async () => {
  const syncAdapter = getSyncAdapter();
  if (!syncAdapter?.enabled || typeof syncAdapter.uploadProfilePhoto !== 'function') {
    setStatus('Photo upload is not available yet.');
    return;
  }

  const selectedFile = queuedPhotoFile || profilePhotoFileInput?.files?.[0] || null;
  const file = selectedFile instanceof File ? selectedFile : null;
  if (!file) {
    setStatus('Choose an image file first.');
    return;
  }

  if (uploadPhotoButton) {
    uploadPhotoButton.disabled = true;
  }
  if (saveProfileButton) {
    saveProfileButton.disabled = true;
  }

  let processedFile = file;
  try {
    setStatus('Optimizing image...');
    processedFile = await compressImageFile(file);
  } catch (error) {
    if (uploadPhotoButton) {
      uploadPhotoButton.disabled = false;
    }
    if (saveProfileButton) {
      saveProfileButton.disabled = false;
    }
    const message = error instanceof Error ? error.message : 'Could not optimize image.';
    setStatus(message);
    return;
  }

  setStatus('Uploading photo...');
  const uploadResult = await syncAdapter.uploadProfilePhoto(processedFile);

  if (!uploadResult.ok || !uploadResult.photoUrl) {
    if (uploadPhotoButton) {
      uploadPhotoButton.disabled = false;
    }
    if (saveProfileButton) {
      saveProfileButton.disabled = false;
    }
    setStatus(uploadResult.message || 'Could not upload profile photo.');
    return;
  }

  if (profilePhotoUrlInput) {
    profilePhotoUrlInput.value = uploadResult.photoUrl;
  }

  const saved = await saveProfileForm(uploadResult.photoUrl);
  if (saved) {
    clearQueuedPhotoFile();
    setStatus('Photo uploaded and profile saved.');
  }
});

profilePhotoFileInput?.addEventListener('change', () => {
  const file = profilePhotoFileInput.files?.[0] || null;
  if (!file) {
    clearQueuedPhotoFile();
    return;
  }

  if (!String(file.type || '').startsWith('image/')) {
    clearQueuedPhotoFile();
    setStatus('Please choose an image file.');
    return;
  }

  setQueuedPhotoFile(file);
  setStatus(`Selected ${file.name}. Click upload to continue.`);
});

profileDropZone?.addEventListener('click', () => {
  profilePhotoFileInput?.click();
});

profileDropZone?.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    profilePhotoFileInput?.click();
  }
});

profileDropZone?.addEventListener('dragenter', (event) => {
  event.preventDefault();
  setDropZoneActive(true);
});

profileDropZone?.addEventListener('dragover', (event) => {
  event.preventDefault();
  setDropZoneActive(true);
});

profileDropZone?.addEventListener('dragleave', (event) => {
  event.preventDefault();
  setDropZoneActive(false);
});

profileDropZone?.addEventListener('drop', (event) => {
  event.preventDefault();
  setDropZoneActive(false);

  const droppedFile = event.dataTransfer?.files?.[0] || null;
  if (!droppedFile) {
    return;
  }

  if (!String(droppedFile.type || '').startsWith('image/')) {
    setStatus('Please drop an image file.');
    return;
  }

  setQueuedPhotoFile(droppedFile);
  setStatus(`Selected ${droppedFile.name}. Click upload to continue.`);
});

profileLogoutButton?.addEventListener('click', async () => {
  const syncAdapter = getSyncAdapter();
  if (!syncAdapter?.enabled) {
    redirectToLogin();
    return;
  }

  profileLogoutButton.disabled = true;
  const result = await syncAdapter.signOut();
  profileLogoutButton.disabled = false;

  if (!result.ok) {
    setStatus(result.message);
    return;
  }

  redirectToLogin();
});

profileThemeSelect?.addEventListener('change', () => {
  const selectedTheme = setCurrentTheme(profileThemeSelect.value);
  profileThemeSelect.value = selectedTheme;
  setStatus(`Theme updated to ${selectedTheme}.`);
});

profileTobaccoEnabledInput?.addEventListener('change', () => {
  if (!profileTobaccoPlanSelect) return;
  profileTobaccoPlanSelect.disabled = !profileTobaccoEnabledInput.checked;
});

initializeProfilePage();
