import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../supabaseConfig.js';

const SUPABASE_TABLE = 'habit_states';
const LOCAL_STATE_KEY = 'habit-checklist-v1';

function normalizeSupabaseUrl(url) {
	return String(url || '').replace(/\/rest\/v1\/?$/, '');
}

function describeError(prefix, error) {
	if (!error) {
		return prefix;
	}

	const message = String(error.message || '').trim();
	if (!message) {
		return prefix;
	}

	if (
		message.includes(`relation \"${SUPABASE_TABLE}\" does not exist`) ||
		message.includes(`Could not find the table 'public.${SUPABASE_TABLE}' in the schema cache`)
	) {
		return `${prefix}. Create the ${SUPABASE_TABLE} table in Supabase first.`;
	}

	if (message.toLowerCase().includes('row-level security')) {
		return `${prefix}. Add a policy that allows this app to read and write ${SUPABASE_TABLE}.`;
	}

	return `${prefix}. ${message}`;
}

const normalizedUrl = normalizeSupabaseUrl(SUPABASE_URL);
const supabase = normalizedUrl && SUPABASE_ANON_KEY ? createClient(normalizedUrl, SUPABASE_ANON_KEY) : null;

function getLocalStateStorageKey(userId) {
	return userId ? `${LOCAL_STATE_KEY}:${userId}` : LOCAL_STATE_KEY;
}

function createErrorResult(message) {
	return { ok: false, message };
}

async function getSession() {
	if (!supabase) {
		return createErrorResult('Supabase auth is not configured.');
	}

	const { data, error } = await supabase.auth.getSession();
	if (error) {
		return createErrorResult(`Could not read your auth session. ${error.message}`);
	}

	return {
		ok: true,
		session: data.session,
	};
}

async function getCurrentUser() {
	const sessionResult = await getSession();
	if (!sessionResult.ok) {
		return {
			ok: false,
			message: sessionResult.message,
			user: null,
		};
	}

	return {
		ok: true,
		message: sessionResult.session?.user ? 'Authenticated user loaded.' : 'No active user session.',
		user: sessionResult.session?.user || null,
	};
}

function onAuthStateChange(callback) {
	if (!supabase) {
		return { data: { subscription: { unsubscribe() {} } } };
	}

	return supabase.auth.onAuthStateChange((_event, session) => {
		callback(session);
	});
}

async function verifyOtpFromUrl() {
	if (!supabase) {
		return createErrorResult('Supabase auth is not configured.');
	}

	const params = new URLSearchParams(window.location.search);
	const tokenHash = params.get('token_hash');
	const type = params.get('type');

	if (!tokenHash || !type) {
		return {
			ok: true,
			message: 'No auth callback token found.',
			session: null,
		};
	}

	const { data, error } = await supabase.auth.verifyOtp({
		token_hash: tokenHash,
		type,
	});

	if (error) {
		return createErrorResult(`Could not verify your email link. ${error.message}`);
	}

	return {
		ok: true,
		message: 'Email verified successfully.',
		session: data.session || null,
		user: data.user || null,
	};
}

function clearAuthParamsFromUrl() {
	const url = new URL(window.location.href);
	url.searchParams.delete('token_hash');
	url.searchParams.delete('type');
	url.searchParams.delete('code');
	url.searchParams.delete('error');
	url.searchParams.delete('error_code');
	url.searchParams.delete('error_description');
	window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
}

async function signUp(email, password) {
	if (!supabase) {
		return createErrorResult('Supabase auth is not configured.');
	}

	const { data, error } = await supabase.auth.signUp({
		email,
		password,
		options: {
			emailRedirectTo: `${window.location.origin}/login.html?next=/index.html`,
		},
	});

	if (error) {
		return createErrorResult(`Could not sign up. ${error.message}`);
	}

	return {
		ok: true,
		message: data.session ? 'Signed up successfully.' : 'Account created. Confirmation may be required.',
		session: data.session || null,
		user: data.user || null,
	};
}

async function signIn(email, password) {
	if (!supabase) {
		return createErrorResult('Supabase auth is not configured.');
	}

	const { data, error } = await supabase.auth.signInWithPassword({
		email,
		password,
	});

	if (error) {
		return createErrorResult(`Could not log in. ${error.message}`);
	}

	return {
		ok: true,
		message: 'Logged in successfully.',
		session: data.session,
		user: data.user,
	};
}

async function signOut() {
	if (!supabase) {
		return createErrorResult('Supabase auth is not configured.');
	}

	const { error } = await supabase.auth.signOut();
	if (error) {
		return createErrorResult(`Could not log out. ${error.message}`);
	}

	return {
		ok: true,
		message: 'Logged out successfully.',
	};
}

async function getStateOwner() {
	const userResult = await getCurrentUser();
	if (!userResult.ok) {
		return {
			ok: false,
			message: userResult.message,
			user: null,
			ownerKey: null,
		};
	}

	if (!userResult.user) {
		return {
			ok: false,
			message: 'You need to log in before syncing checklist data.',
			user: null,
			ownerKey: null,
		};
	}

	return {
		ok: true,
		message: 'Authenticated sync owner loaded.',
		user: userResult.user,
		ownerKey: userResult.user.id,
	};
}

async function logConnectionTest() {
	const ownerResult = await getStateOwner();
	if (!ownerResult.ok) {
		console.warn('[Supabase] Connection test skipped:', ownerResult.message);
		return { ok: false, message: ownerResult.message };
	}

	const { count, error } = await supabase
		.from(SUPABASE_TABLE)
		.select('device_id', { count: 'exact', head: true })
		.eq('device_id', ownerResult.ownerKey);

	if (error) {
		const message = describeError('Could not reach the Supabase database', error);
		console.error('[Supabase] Connection test failed:', message);
		return { ok: false, message };
	}

	const message = `Connected to Supabase table ${SUPABASE_TABLE} for user ${ownerResult.user.email || ownerResult.ownerKey}. Visible rows: ${count ?? 0}.`;
	console.info('[Supabase] Connection test passed:', message);
	return { ok: true, message, count: count ?? 0 };
}

function readLocalStateSnapshot(userId) {
	try {
		const rawState = localStorage.getItem(getLocalStateStorageKey(userId)) || localStorage.getItem(LOCAL_STATE_KEY);
		if (!rawState) {
			return {
				lastSeenDate: new Date().toISOString().slice(0, 10),
				updatedAt: new Date().toISOString(),
			};
		}

		const parsed = JSON.parse(rawState);
		return {
			...parsed,
			updatedAt: parsed?.updatedAt || new Date().toISOString(),
		};
	} catch {
		return {
			lastSeenDate: new Date().toISOString().slice(0, 10),
			updatedAt: new Date().toISOString(),
		};
	}
}

async function logReadWriteTest() {
	const ownerResult = await getStateOwner();
	if (!ownerResult.ok) {
		console.warn('[Supabase] Write test skipped:', ownerResult.message);
		return { ok: false, message: ownerResult.message, updatedAt: null };
	}

	const connectionResult = await logConnectionTest();
	if (!connectionResult.ok) {
		return connectionResult;
	}

	const localState = readLocalStateSnapshot(ownerResult.ownerKey);
	const saveResult = await saveState(localState);

	if (!saveResult.ok) {
		console.error('[Supabase] Write test failed:', saveResult.message);
		return saveResult;
	}

	const message = `Read/write test passed for ${SUPABASE_TABLE}. User ${ownerResult.user.email || ownerResult.ownerKey} synced at ${saveResult.updatedAt || localState.updatedAt}.`;
	console.info('[Supabase] Write test passed:', message);
	return {
		ok: true,
		message,
		updatedAt: saveResult.updatedAt || localState.updatedAt,
	};
}

async function loadState() {
	const ownerResult = await getStateOwner();
	if (!ownerResult.ok) {
		return {
			ok: false,
			message: ownerResult.message,
			state: null,
			updatedAt: null,
		};
	}

	const { data, error } = await supabase
		.from(SUPABASE_TABLE)
		.select('state, updated_at')
		.eq('device_id', ownerResult.ownerKey)
		.maybeSingle();

	if (error) {
		return {
			ok: false,
			message: describeError('Could not load your saved state from Supabase', error),
			state: null,
			updatedAt: null,
		};
	}

	return {
		ok: true,
		message: data ? 'Loaded state from Supabase.' : 'No saved Supabase state yet.',
		state: data?.state || null,
		updatedAt: data?.updated_at || null,
	};
}

async function saveState(state) {
	const ownerResult = await getStateOwner();
	if (!ownerResult.ok) {
		return {
			ok: false,
			message: ownerResult.message,
			updatedAt: null,
		};
	}

	const payload = {
		device_id: ownerResult.ownerKey,
		state,
		updated_at: state?.updatedAt || new Date().toISOString(),
	};

	const { data, error } = await supabase
		.from(SUPABASE_TABLE)
		.upsert(payload, { onConflict: 'device_id' })
		.select('updated_at')
		.single();

	if (error) {
		return {
			ok: false,
			message: describeError('Could not save your state to Supabase', error),
			updatedAt: null,
		};
	}

	return {
		ok: true,
		message: 'Saved state to Supabase.',
		updatedAt: data?.updated_at || payload.updated_at,
	};
}

window.supabase = supabase;
window.supabaseSync = {
	enabled: Boolean(supabase),
	table: SUPABASE_TABLE,
	getSession,
	getCurrentUser,
	onAuthStateChange,
	verifyOtpFromUrl,
	clearAuthParamsFromUrl,
	signUp,
	signIn,
	signOut,
	logConnectionTest,
	logReadWriteTest,
	loadState,
	saveState,
};
