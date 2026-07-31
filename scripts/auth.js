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
const submitButton = document.getElementById('submitButton');
const authStatusEl = document.getElementById('authStatus');

function setStatus(message) {
  if (authStatusEl) {
    authStatusEl.textContent = message;
  }
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

  setStatus(mode === 'signup' ? 'Creating account...' : 'Logging in...');

  const result = mode === 'signup'
    ? await authAdapter.signUp(email, password)
    : await authAdapter.signIn(email, password);

  submitButton.disabled = false;

  if (!result.ok) {
    setStatus(result.message);
    return;
  }

  if (mode === 'signup' && !result.session) {
    setStatus('Account created. If email confirmation is enabled in Supabase, check your email. Otherwise log in now.');
    authForm.reset();
    return;
  }

  setStatus('Success. Redirecting...');
  redirectToApp();
});

initializeAuthPage();