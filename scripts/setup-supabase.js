// This script is a helper for local development only.
// It uses the Supabase JS client to authenticate and fetch initial user data.

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../supabaseConfig.js';

const SUPABASE_TABLE = 'habit_states';
const DEVICE_ID_KEY = 'habit-check-device-id';
const LOCAL_STATE_KEY = 'habit-checklist-v1';

function normalizeSupabaseUrl(url) {
	return String(url || '').replace(/\/rest\/v1\/?$/, '');
}

function createDeviceId() {
	if (window.crypto?.randomUUID) {
		return window.crypto.randomUUID();
	}

	return `device-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

function getDeviceId() {
	const existingId = localStorage.getItem(DEVICE_ID_KEY);
	if (existingId) {
		return existingId;
	}

	const nextId = createDeviceId();
	localStorage.setItem(DEVICE_ID_KEY, nextId);
	return nextId;
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

async function logConnectionTest() {
	if (!supabase) {
		console.warn('[Supabase] Connection test skipped: client is not configured.');
		return { ok: false, message: 'Supabase client is not configured.' };
	}

	const { count, error } = await supabase
		.from(SUPABASE_TABLE)
		.select('device_id', { count: 'exact', head: true });

	if (error) {
		const message = describeError('Could not reach the Supabase database', error);
		console.error('[Supabase] Connection test failed:', message);
		return { ok: false, message };
	}

	const message = `Connected to Supabase table ${SUPABASE_TABLE}. Visible rows: ${count ?? 0}.`;
	console.info('[Supabase] Connection test passed:', message);
	return { ok: true, message, count: count ?? 0 };
}

function readLocalStateSnapshot() {
	try {
		const rawState = localStorage.getItem(LOCAL_STATE_KEY);
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
	const connectionResult = await logConnectionTest();
	if (!connectionResult.ok) {
		return connectionResult;
	}

	const localState = readLocalStateSnapshot();
	const saveResult = await saveState(localState);

	if (!saveResult.ok) {
		console.error('[Supabase] Write test failed:', saveResult.message);
		return saveResult;
	}

	const message = `Read/write test passed for ${SUPABASE_TABLE}. Device ${getDeviceId()} synced at ${saveResult.updatedAt || localState.updatedAt}.`;
	console.info('[Supabase] Write test passed:', message);
	return {
		ok: true,
		message,
		updatedAt: saveResult.updatedAt || localState.updatedAt,
	};
}

async function loadState() {
	if (!supabase) {
		return {
			ok: false,
			message: 'Supabase sync is not configured.',
			state: null,
			updatedAt: null,
		};
	}

	const { data, error } = await supabase
		.from(SUPABASE_TABLE)
		.select('state, updated_at')
		.eq('device_id', getDeviceId())
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
	if (!supabase) {
		return {
			ok: false,
			message: 'Supabase sync is not configured.',
			updatedAt: null,
		};
	}

	const payload = {
		device_id: getDeviceId(),
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
	getDeviceId,
	logConnectionTest,
	logReadWriteTest,
	loadState,
	saveState,
};

logReadWriteTest();
