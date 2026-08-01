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

function getInitial(text) {
  const first = String(text || '').trim().charAt(0);
  return first ? first.toUpperCase() : 'A';
}

function setAvatar(photoUrl, fallbackText) {
  const avatarImage = document.getElementById('globalProfileAvatarImage');
  const avatarFallback = document.getElementById('globalProfileAvatarFallback');
  if (!avatarImage || !avatarFallback) {
    return;
  }

  const safePhoto = normalizePhotoUrl(photoUrl);
  if (safePhoto) {
    avatarImage.src = safePhoto;
    avatarImage.hidden = false;
    avatarFallback.hidden = true;
    return;
  }

  avatarImage.hidden = true;
  avatarFallback.hidden = false;
  avatarFallback.textContent = getInitial(fallbackText);
}

async function initializeTopAvatar() {
  setAvatar('', 'A');

  const syncAdapter = window.supabaseSync || null;
  if (!syncAdapter?.enabled || typeof syncAdapter.getSession !== 'function') {
    return;
  }

  const sessionResult = await syncAdapter.getSession();
  if (!sessionResult.ok || !sessionResult.session?.user) {
    return;
  }

  const user = sessionResult.session.user;
  const emailPrefix = String(user.email || '').split('@')[0] || 'A';
  const metadataPhotoUrl = String(user?.user_metadata?.photoUrl || '').trim();
  setAvatar(metadataPhotoUrl, emailPrefix);

  if (typeof syncAdapter.getMyProfile !== 'function') {
    return;
  }

  const profileResult = await syncAdapter.getMyProfile();
  if (!profileResult.ok || !profileResult.profile) {
    return;
  }

  const fallbackName = profileResult.profile.displayName || emailPrefix;
  setAvatar(profileResult.profile.photoUrl || '', fallbackName);
}

initializeTopAvatar();
