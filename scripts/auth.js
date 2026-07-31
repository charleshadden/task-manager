function getAuthAdapter() {
  return window.supabaseSync || null;
}

const ATTRIBUTE_NAMES = ['Strength', 'Dexterity', 'Wisdom', 'Intelligence', 'Charisma', 'Constitution'];
const ATTRIBUTE_XP_PER_POINT = 1000;

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
const assessmentArchetypeEl = document.getElementById('assessmentArchetype');
const assessmentPreviewEl = document.getElementById('assessmentPreview');

const workoutDaysInput = document.getElementById('workoutDaysInput');
const workoutStyleInput = document.getElementById('workoutStyleInput');
const workoutMinutesInput = document.getElementById('workoutMinutesInput');
const workoutYearsInput = document.getElementById('workoutYearsInput');
const dailyStepsInput = document.getElementById('dailyStepsInput');
const sleepQualityInput = document.getElementById('sleepQualityInput');
const learningDaysInput = document.getElementById('learningDaysInput');
const learningMinutesInput = document.getElementById('learningMinutesInput');
const reflectionDaysInput = document.getElementById('reflectionDaysInput');
const socialConfidenceInput = document.getElementById('socialConfidenceInput');
const serviceActsInput = document.getElementById('serviceActsInput');
const focusBlocksInput = document.getElementById('focusBlocksInput');
const injuryLevelInput = document.getElementById('injuryLevelInput');
const fitnessRatingInput = document.getElementById('fitnessRatingInput');
const restDaysInput = document.getElementById('restDaysInput');
const weekdayMinutesInput = document.getElementById('weekdayMinutesInput');
const weekendMinutesInput = document.getElementById('weekendMinutesInput');
const primaryGoalInput = document.getElementById('primaryGoalInput');
const nutritionDaysInput = document.getElementById('nutritionDaysInput');
const stressLevelInput = document.getElementById('stressLevelInput');
const consistencyMonthsInput = document.getElementById('consistencyMonthsInput');
const hydrationBaselineInput = document.getElementById('hydrationBaselineInput');
const outdoorDaysInput = document.getElementById('outdoorDaysInput');
const socialExposureInput = document.getElementById('socialExposureInput');

function setStatus(message) {
  if (authStatusEl) {
    authStatusEl.textContent = message;
  }
}

function clampNumber(value, min, max) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return min;
  }
  return Math.min(max, Math.max(min, numeric));
}

function normalize(value, max) {
  return clampNumber(value, 0, max) / max;
}

function readOptionalNumber(value, min, max, fallback) {
  const normalized = String(value ?? '').trim();
  if (!normalized) {
    return fallback;
  }
  return clampNumber(normalized, min, max);
}

function getAssessmentAnswers() {
  return {
    workoutDays: clampNumber(workoutDaysInput?.value ?? 0, 0, 7),
    workoutStyle: String(workoutStyleInput?.value || 'mixed'),
    workoutMinutes: clampNumber(workoutMinutesInput?.value ?? 0, 0, 240),
    workoutYears: clampNumber(workoutYearsInput?.value ?? 0, 0, 50),
    dailySteps: clampNumber(dailyStepsInput?.value ?? 0, 0, 50000),
    sleepQuality: clampNumber(sleepQualityInput?.value ?? 3, 1, 5),
    learningDays: clampNumber(learningDaysInput?.value ?? 0, 0, 7),
    learningMinutes: clampNumber(learningMinutesInput?.value ?? 0, 0, 600),
    reflectionDays: clampNumber(reflectionDaysInput?.value ?? 0, 0, 7),
    socialConfidence: clampNumber(socialConfidenceInput?.value ?? 3, 1, 5),
    serviceActs: clampNumber(serviceActsInput?.value ?? 0, 0, 50),
    focusBlocks: clampNumber(focusBlocksInput?.value ?? 0, 0, 20),
    injuryLevel: String(injuryLevelInput?.value || ''),
    fitnessRating: readOptionalNumber(fitnessRatingInput?.value, 1, 10, 5),
    restDays: readOptionalNumber(restDaysInput?.value, 0, 7, 2),
    weekdayMinutes: readOptionalNumber(weekdayMinutesInput?.value, 0, 600, 45),
    weekendMinutes: readOptionalNumber(weekendMinutesInput?.value, 0, 900, 75),
    primaryGoal: String(primaryGoalInput?.value || ''),
    nutritionDays: readOptionalNumber(nutritionDaysInput?.value, 0, 7, 4),
    stressLevel: readOptionalNumber(stressLevelInput?.value, 1, 5, 3),
    consistencyMonths: readOptionalNumber(consistencyMonthsInput?.value, 0, 240, 6),
    hydrationBaseline: readOptionalNumber(hydrationBaselineInput?.value, 0, 30, 6),
    outdoorDays: readOptionalNumber(outdoorDaysInput?.value, 0, 7, 3),
    socialExposure: readOptionalNumber(socialExposureInput?.value, 0, 50, 2),
  };
}

function getDnDClassProfile(scores) {
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [topAttribute] = ranked[0];
  const [secondAttribute] = ranked[1];

  if (topAttribute === 'Strength') {
    if (secondAttribute === 'Charisma') {
      return { className: 'Paladin', archetype: 'Oath of Devotion' };
    }
    return { className: 'Fighter', archetype: 'Battle Master' };
  }

  if (topAttribute === 'Dexterity') {
    if (secondAttribute === 'Wisdom') {
      return { className: 'Ranger', archetype: 'Hunter' };
    }
    if (secondAttribute === 'Intelligence') {
      return { className: 'Rogue', archetype: 'Arcane Trickster' };
    }
    return { className: 'Rogue', archetype: 'Scout' };
  }

  if (topAttribute === 'Wisdom') {
    if (secondAttribute === 'Constitution') {
      return { className: 'Cleric', archetype: 'Life Domain' };
    }
    return { className: 'Druid', archetype: 'Circle of the Land' };
  }

  if (topAttribute === 'Intelligence') {
    if (secondAttribute === 'Dexterity') {
      return { className: 'Wizard', archetype: 'Bladesinger' };
    }
    return { className: 'Wizard', archetype: 'School of Divination' };
  }

  if (topAttribute === 'Charisma') {
    if (secondAttribute === 'Constitution') {
      return { className: 'Sorcerer', archetype: 'Draconic Bloodline' };
    }
    return { className: 'Bard', archetype: 'College of Lore' };
  }

  if (topAttribute === 'Constitution') {
    if (secondAttribute === 'Strength') {
      return { className: 'Barbarian', archetype: 'Path of the Totem Warrior' };
    }
    return { className: 'Fighter', archetype: 'Champion' };
  }

  return { className: 'Fighter', archetype: 'Champion' };
}

function calculateStartingProfile(answers) {
  const styleStrength = answers.workoutStyle === 'strength' ? 1 : 0;
  const styleCardio = answers.workoutStyle === 'cardio' ? 1 : 0;
  const styleMobility = answers.workoutStyle === 'mobility' ? 1 : 0;
  const styleMixed = answers.workoutStyle === 'mixed' ? 1 : 0;
  const injuryPenaltyByLevel = {
    '': 0,
    none: 0,
    minor: 1,
    moderate: 2,
    significant: 4,
  };
  const injuryPenalty = injuryPenaltyByLevel[answers.injuryLevel] ?? 0;
  const fitnessBoost = normalize(answers.fitnessRating, 10);
  const stressPenalty = normalize(answers.stressLevel - 1, 4);
  const hydrationBoost = normalize(answers.hydrationBaseline, 12);
  const nutritionBoost = normalize(answers.nutritionDays, 7);
  const consistencyBoost = normalize(answers.consistencyMonths, 24);
  const outdoorBoost = normalize(answers.outdoorDays, 7);
  const socialExposureBoost = normalize(answers.socialExposure, 10);
  const weeklyMinutes = answers.weekdayMinutes * 5 + answers.weekendMinutes * 2;
  const timeBudgetBoost = normalize(weeklyMinutes, 900);
  const restBalance = 1 - Math.min(1, Math.abs(answers.restDays - 2) / 5);

  const goalBonuses = {
    Strength: 0,
    Dexterity: 0,
    Wisdom: 0,
    Intelligence: 0,
    Charisma: 0,
    Constitution: 0,
  };

  if (answers.primaryGoal === 'strength') {
    goalBonuses.Strength += 2.5;
    goalBonuses.Constitution += 1.5;
  } else if (answers.primaryGoal === 'endurance') {
    goalBonuses.Constitution += 2.5;
    goalBonuses.Dexterity += 1.5;
  } else if (answers.primaryGoal === 'fatloss') {
    goalBonuses.Constitution += 2;
    goalBonuses.Wisdom += 1.5;
  } else if (answers.primaryGoal === 'learning') {
    goalBonuses.Intelligence += 2.5;
    goalBonuses.Wisdom += 1.5;
  } else if (answers.primaryGoal === 'social') {
    goalBonuses.Charisma += 2.5;
    goalBonuses.Wisdom += 1;
  } else if (answers.primaryGoal === 'consistency') {
    goalBonuses.Wisdom += 2;
    goalBonuses.Constitution += 1;
    goalBonuses.Intelligence += 1;
  }

  const strengthPoints = 1 + Math.round(
    7 * normalize(answers.workoutDays, 7)
    + 5 * normalize(answers.workoutMinutes, 90)
    + 4 * normalize(answers.workoutYears, 5)
    + 3 * styleStrength
    + 2 * styleMixed
    + 3 * fitnessBoost
    + 2 * timeBudgetBoost
    + goalBonuses.Strength
    - injuryPenalty
  );

  const constitutionPoints = 1 + Math.round(
    6 * normalize(answers.workoutDays, 7)
    + 7 * normalize(answers.dailySteps, 12000)
    + 5 * normalize(answers.sleepQuality, 5)
    + 3 * normalize(answers.workoutYears, 5)
    + 1 * styleCardio
    + 3 * hydrationBoost
    + 3 * nutritionBoost
    + 2 * consistencyBoost
    + 2 * restBalance
    + 2 * outdoorBoost
    + 2 * fitnessBoost
    + goalBonuses.Constitution
    - injuryPenalty
    - (2 * stressPenalty)
  );

  const dexterityPoints = 1 + Math.round(
    6 * normalize(answers.dailySteps, 12000)
    + 4 * normalize(answers.workoutDays, 7)
    + 4 * normalize(answers.focusBlocks, 5)
    + 4 * styleMobility
    + 2 * styleCardio
    + 2 * outdoorBoost
    + 2 * fitnessBoost
    + goalBonuses.Dexterity
    - injuryPenalty
  );

  const wisdomPoints = 1 + Math.round(
    6 * normalize(answers.reflectionDays, 7)
    + 6 * normalize(answers.sleepQuality, 5)
    + 5 * normalize(answers.learningDays, 7)
    + 3 * normalize(answers.learningMinutes, 90)
    + 2 * nutritionBoost
    + 2 * hydrationBoost
    + 3 * consistencyBoost
    + 2 * restBalance
    + goalBonuses.Wisdom
    - (2 * stressPenalty)
  );

  const intelligencePoints = 1 + Math.round(
    7 * normalize(answers.learningDays, 7)
    + 7 * normalize(answers.learningMinutes, 120)
    + 3 * normalize(answers.focusBlocks, 5)
    + 2 * normalize(answers.reflectionDays, 7)
    + 3 * timeBudgetBoost
    + 2 * consistencyBoost
    + goalBonuses.Intelligence
    - (2 * stressPenalty)
  );

  const charismaPoints = 1 + Math.round(
    8 * normalize(answers.socialConfidence, 5)
    + 5 * normalize(answers.serviceActs, 7)
    + 3 * normalize(answers.reflectionDays, 7)
    + 2 * normalize(answers.focusBlocks, 5)
    + 3 * socialExposureBoost
    + goalBonuses.Charisma
  );

  const startingPoints = {
    Strength: clampNumber(strengthPoints, 1, 20),
    Dexterity: clampNumber(dexterityPoints, 1, 20),
    Wisdom: clampNumber(wisdomPoints, 1, 20),
    Intelligence: clampNumber(intelligencePoints, 1, 20),
    Charisma: clampNumber(charismaPoints, 1, 20),
    Constitution: clampNumber(constitutionPoints, 1, 20),
  };

  const startingAttributes = ATTRIBUTE_NAMES.reduce((accumulator, attributeName) => {
    accumulator[attributeName] = startingPoints[attributeName] * ATTRIBUTE_XP_PER_POINT;
    return accumulator;
  }, {});

  const classProfile = getDnDClassProfile(startingPoints);
  return {
    className: classProfile.className,
    archetype: classProfile.archetype,
    startingPoints,
    startingAttributes,
    responses: answers,
  };
}

function renderAssessmentPreview() {
  if (getMode() !== 'signup') {
    return;
  }

  if (!assessmentArchetypeEl || !assessmentPreviewEl) {
    return;
  }

  const profile = calculateStartingProfile(getAssessmentAnswers());
  assessmentArchetypeEl.textContent = `Class: ${profile.className} • Archetype: ${profile.archetype}`;
  assessmentPreviewEl.textContent = `Starting points - STR ${profile.startingPoints.Strength}, DEX ${profile.startingPoints.Dexterity}, WIS ${profile.startingPoints.Wisdom}, INT ${profile.startingPoints.Intelligence}, CHA ${profile.startingPoints.Charisma}, CON ${profile.startingPoints.Constitution}`;
}

function attachAssessmentPreviewHandlers() {
  if (getMode() !== 'signup') {
    return;
  }

  const inputs = [
    workoutDaysInput,
    workoutStyleInput,
    workoutMinutesInput,
    workoutYearsInput,
    dailyStepsInput,
    sleepQualityInput,
    learningDaysInput,
    learningMinutesInput,
    reflectionDaysInput,
    socialConfidenceInput,
    serviceActsInput,
    focusBlocksInput,
    injuryLevelInput,
    fitnessRatingInput,
    restDaysInput,
    weekdayMinutesInput,
    weekendMinutesInput,
    primaryGoalInput,
    nutritionDaysInput,
    stressLevelInput,
    consistencyMonthsInput,
    hydrationBaselineInput,
    outdoorDaysInput,
    socialExposureInput,
  ];

  inputs.forEach((input) => {
    input?.addEventListener('change', renderAssessmentPreview);
    input?.addEventListener('input', renderAssessmentPreview);
  });

  renderAssessmentPreview();
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
  const startingProfile = mode === 'signup' ? calculateStartingProfile(getAssessmentAnswers()) : null;

  setStatus(mode === 'signup' ? 'Creating account...' : 'Logging in...');

  const result = mode === 'signup'
    ? await authAdapter.signUp(email, password, {
      startingProfile: {
        ...startingProfile,
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
    setStatus('Account created. If email confirmation is enabled in Supabase, check your email. Otherwise log in now.');
    authForm.reset();
    renderAssessmentPreview();
    return;
  }

  setStatus('Success. Redirecting...');
  redirectToApp();
});

initializeAuthPage();
attachAssessmentPreviewHandlers();