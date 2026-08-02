function getAuthAdapter() {
  return window.supabaseSync || null;
}

function getMode() {
  return document.body.dataset.authMode === 'signup' ? 'signup' : 'login';
}

function getNextPath() {
  const params = new URLSearchParams(window.location.search);
  const nextPath = params.get('next');

  if (!nextPath) {
    return '/';
  }

  return nextPath.startsWith('/') ? nextPath : `/${nextPath}`;
}

function redirectToApp() {
  window.location.replace(getNextPath());
}

const authForm = document.getElementById('authForm');
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const displayNameInput = document.getElementById('displayNameInput');
const photoUrlInput = document.getElementById('photoUrlInput');
const signupGoalCaloriesInput = document.getElementById('signupGoalCaloriesInput');
const signupGoalProteinInput = document.getElementById('signupGoalProteinInput');
const signupGoalCarbsInput = document.getElementById('signupGoalCarbsInput');
const signupGoalFatInput = document.getElementById('signupGoalFatInput');
const submitButton = document.getElementById('submitButton');
const authStatusEl = document.getElementById('authStatus');
const photoFileInput = document.getElementById('photoFileInput');

function setStatus(message) {
  if (authStatusEl) {
    authStatusEl.textContent = message;
  }
}

function normalizePhotoUrl(url) {
  const value = String(url || '').trim();
  if (!value) {
    return '';
  }

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

function parseGoalInputValue(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return '';
  return Math.max(0, Math.round(parsed));
}

function getSignupMacroGoals() {
  return {
    calories: parseGoalInputValue(signupGoalCaloriesInput?.value),
    protein: parseGoalInputValue(signupGoalProteinInput?.value),
    carbs: parseGoalInputValue(signupGoalCarbsInput?.value),
    fat: parseGoalInputValue(signupGoalFatInput?.value),
  };
}

async function uploadSignupPhotoIfPossible(authAdapter, selectedFile, displayName) {
  if (!selectedFile || !(selectedFile instanceof File)) {
    return { ok: true, photoUrl: '' };
  }

  if (typeof authAdapter.uploadProfilePhoto !== 'function') {
    return { ok: false, photoUrl: '', message: 'Photo upload method is unavailable in this deployment.' };
  }

  const uploadResult = await authAdapter.uploadProfilePhoto(selectedFile);
  if (!uploadResult.ok || !uploadResult.photoUrl) {
    return {
      ok: false,
      photoUrl: '',
      message: uploadResult.message || 'Photo upload failed.',
    };
  }

  if (typeof authAdapter.updateMyProfile === 'function') {
    const profileResult = await authAdapter.updateMyProfile({
      displayName,
      photoUrl: uploadResult.photoUrl,
    });

    if (!profileResult.ok) {
      return {
        ok: false,
        photoUrl: uploadResult.photoUrl,
        message: `Image uploaded, but profile update failed. ${profileResult.message}`,
      };
    }
  }

  return { ok: true, photoUrl: uploadResult.photoUrl };
}

async function initializeAuthPage() {
  try {
    const authAdapter = getAuthAdapter();
    if (!authAdapter?.enabled) {
      setStatus('Supabase auth is not configured.');
      return;
    }

    if (typeof authAdapter.getSession !== 'function') {
      setStatus('Auth module is outdated. Hard refresh this page and redeploy if needed.');
      return;
    }

    if (typeof authAdapter.consumeAuthRedirect === 'function') {
      const verifyResult = await authAdapter.consumeAuthRedirect();
      if (!verifyResult.ok) {
        setStatus(verifyResult.message);
        return;
      }

      if (verifyResult.session?.user) {
        if (typeof authAdapter.clearAuthParamsFromUrl === 'function') {
          authAdapter.clearAuthParamsFromUrl();
        }
        setStatus('Email verified. Redirecting...');
        redirectToApp();
        return;
      }
    }

    const sessionResult = await authAdapter.getSession();
    if (!sessionResult.ok) {
      setStatus(sessionResult.message);
      return;
    }

    if (sessionResult.session?.user) {
      if (typeof authAdapter.clearAuthParamsFromUrl === 'function') {
        authAdapter.clearAuthParamsFromUrl();
      }
      redirectToApp();
      return;
    }

    setStatus(getMode() === 'signup' ? 'Create an account to start syncing your own checklist.' : 'Log in to load your saved checklist.');

    authAdapter.onAuthStateChange((session) => {
      if (session?.user) {
        redirectToApp();
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected auth initialization error.';
    setStatus(`Could not initialize authentication. ${message}`);
  }
}

authForm?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const authAdapter = getAuthAdapter();
  if (!authAdapter?.enabled) {
    setStatus('Supabase auth is not configured.');
    return;
  }

  submitButton.disabled = true;
  const mode = getMode();
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const signupMacroGoals = mode === 'signup' ? getSignupMacroGoals() : null;
  const displayName = String(displayNameInput?.value || '').trim();
  const photoUrl = normalizePhotoUrl(photoUrlInput?.value || '');
  const selectedPhotoFile = photoFileInput?.files?.[0] || null;

  setStatus(mode === 'signup' ? 'Creating account...' : 'Logging in...');

  const result = mode === 'signup'
    ? await authAdapter.signUp(email, password, {
      displayName,
      photoUrl,
      startingProfile: {
        macroGoals: {
          calories: signupMacroGoals?.calories === '' ? '' : String(signupMacroGoals.calories),
          protein: signupMacroGoals?.protein === '' ? '' : String(signupMacroGoals.protein),
          carbs: signupMacroGoals?.carbs === '' ? '' : String(signupMacroGoals.carbs),
          fat: signupMacroGoals?.fat === '' ? '' : String(signupMacroGoals.fat),
        },
        createdAt: new Date().toISOString(),
      },
    })
    : await authAdapter.signIn(email, password);

  submitButton.disabled = false;

  if (!result.ok) {
    setStatus(result.message);
    return;
  }

  if (mode === 'signup' && !result.session) {
    const pendingUploadMessage = selectedPhotoFile
      ? ' Your image will need to be uploaded after you log in (Profile page).'
      : '';
    setStatus(`Account created. If email confirmation is enabled in Supabase, check your email. Otherwise log in now.${pendingUploadMessage}`);
    authForm.reset();
    return;
  }

  if (mode === 'signup' && selectedPhotoFile) {
    setStatus('Account created. Uploading profile image...');
    const uploadResult = await uploadSignupPhotoIfPossible(authAdapter, selectedPhotoFile, displayName);
    if (!uploadResult.ok) {
      setStatus(`Account created. ${uploadResult.message} You can retry later on your Profile page.`);
      redirectToApp();
      return;
    }
  }

  setStatus('Success. Redirecting...');
  redirectToApp();
});

initializeAuthPage();