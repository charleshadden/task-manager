import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../supabaseConfig.js';

const SUPABASE_TABLE = 'habit_states';
const PROFILES_TABLE = 'profiles';
const FOLLOWS_TABLE = 'follows';
const PARTIES_TABLE = 'parties';
const PARTY_MEMBERS_TABLE = 'party_members';
const PROFILE_PHOTOS_BUCKET = 'profile-photos';
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

function describeTableError(prefix, tableName, error) {
	if (!error) {
		return prefix;
	}

	const message = String(error.message || '').trim();
	if (!message) {
		return prefix;
	}

	if (
		message.includes(`relation \"${tableName}\" does not exist`) ||
		message.includes(`Could not find the table 'public.${tableName}' in the schema cache`)
	) {
		return `${prefix}. Create the ${tableName} table in Supabase first.`;
	}

	if (message.toLowerCase().includes('row-level security')) {
		return `${prefix}. Add RLS policies that allow this action for ${tableName}.`;
	}

	return `${prefix}. ${message}`;
}

function describeStorageError(prefix, bucketName, error) {
	if (!error) {
		return prefix;
	}

	const message = String(error.message || '').trim();
	if (!message) {
		return prefix;
	}

	if (message.includes('Bucket not found') || message.includes('The resource was not found')) {
		return `${prefix}. Create the ${bucketName} storage bucket first.`;
	}

	if (message.toLowerCase().includes('row-level security') || message.toLowerCase().includes('permission denied')) {
		return `${prefix}. Add storage policies that allow authenticated users to upload into ${bucketName}.`;
	}

	return `${prefix}. ${message}`;
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

async function exchangeCodeFromUrl() {
	if (!supabase) {
		return createErrorResult('Supabase auth is not configured.');
	}

	const params = new URLSearchParams(window.location.search);
	const code = params.get('code');

	if (!code) {
		return {
			ok: true,
			message: 'No auth code found.',
			session: null,
		};
	}

	const { data, error } = await supabase.auth.exchangeCodeForSession(code);
	if (error) {
		return createErrorResult(`Could not finish sign-in from the email link. ${error.message}`);
	}

	return {
		ok: true,
		message: 'Email link sign-in completed.',
		session: data.session || null,
		user: data.user || null,
	};
}

async function consumeAuthRedirect() {
	const params = new URLSearchParams(window.location.search);

	if (params.get('code')) {
		return exchangeCodeFromUrl();
	}

	if (params.get('token_hash') && params.get('type')) {
		return verifyOtpFromUrl();
	}

	return {
		ok: true,
		message: 'No auth redirect parameters found.',
		session: null,
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
	url.hash = '';
	window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
}

async function signUp(email, password, profileMetadata = null) {
	if (!supabase) {
		return createErrorResult('Supabase auth is not configured.');
	}

	const metadata = profileMetadata && typeof profileMetadata === 'object' ? profileMetadata : undefined;

	const { data, error } = await supabase.auth.signUp({
		email,
		password,
		options: {
			emailRedirectTo: `${window.location.origin}/login.html?next=/index.html`,
			data: metadata,
		},
	});

	if (error) {
		return createErrorResult(`Could not sign up. ${error.message}`);
	}

	return {
		ok: true,
		message: data.session ? 'Signed up successfully.' : 'Account created. Email confirmation may still be enabled in Supabase Auth.',
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

function getDefaultDisplayNameFromUser(user) {
	const fromMetadata = String(user?.user_metadata?.displayName || '').trim();
	if (fromMetadata) {
		return fromMetadata;
	}

	const email = String(user?.email || '');
	if (email.includes('@')) {
		return email.split('@')[0];
	}

	return 'Adventurer';
}

function normalizeProfileRow(row, fallbackUser = null) {
	if (!row) {
		return {
			userId: fallbackUser?.id || '',
			displayName: getDefaultDisplayNameFromUser(fallbackUser),
			photoUrl: '',
		};
	}

	return {
		userId: row.user_id,
		displayName: row.display_name || getDefaultDisplayNameFromUser(fallbackUser),
		photoUrl: row.photo_url || '',
	};
}

async function ensureProfile() {
	const ownerResult = await getStateOwner();
	if (!ownerResult.ok) {
		return {
			ok: false,
			message: ownerResult.message,
			profile: null,
		};
	}

	const user = ownerResult.user;
	const defaultDisplayName = getDefaultDisplayNameFromUser(user);
	const metadataPhotoUrl = String(user?.user_metadata?.photoUrl || '').trim();

	const { data: existingProfile, error: existingProfileError } = await supabase
		.from(PROFILES_TABLE)
		.select('user_id, display_name, photo_url')
		.eq('user_id', ownerResult.ownerKey)
		.maybeSingle();

	if (existingProfileError) {
		return {
			ok: false,
			message: describeTableError('Could not load your profile', PROFILES_TABLE, existingProfileError),
			profile: null,
		};
	}

	if (existingProfile) {
		return {
			ok: true,
			message: 'Profile is ready.',
			profile: normalizeProfileRow(existingProfile, user),
		};
	}

	const { data, error } = await supabase
		.from(PROFILES_TABLE)
		.insert(
			{
				user_id: ownerResult.ownerKey,
				display_name: defaultDisplayName,
				photo_url: metadataPhotoUrl,
				updated_at: new Date().toISOString(),
			},
		)
		.select('user_id, display_name, photo_url')
		.single();

	if (error) {
		return {
			ok: false,
			message: describeTableError('Could not initialize your profile', PROFILES_TABLE, error),
			profile: null,
		};
	}

	return {
		ok: true,
		message: 'Profile is ready.',
		profile: normalizeProfileRow(data, user),
	};
}

async function getMyProfile() {
	const profileResult = await ensureProfile();
	if (!profileResult.ok) {
		return profileResult;
	}

	return {
		ok: true,
		message: 'Profile loaded.',
		profile: profileResult.profile,
	};
}

async function updateMyProfile({ displayName, photoUrl }) {
	const ownerResult = await getStateOwner();
	if (!ownerResult.ok) {
		return {
			ok: false,
			message: ownerResult.message,
			profile: null,
		};
	}

	const safeDisplayName = String(displayName || '').trim() || getDefaultDisplayNameFromUser(ownerResult.user);
	const safePhotoUrl = String(photoUrl || '').trim();

	const { data, error } = await supabase
		.from(PROFILES_TABLE)
		.upsert(
			{
				user_id: ownerResult.ownerKey,
				display_name: safeDisplayName,
				photo_url: safePhotoUrl,
				updated_at: new Date().toISOString(),
			},
			{ onConflict: 'user_id' }
		)
		.select('user_id, display_name, photo_url')
		.single();

	if (error) {
		return {
			ok: false,
			message: describeTableError('Could not update your profile', PROFILES_TABLE, error),
			profile: null,
		};
	}

	return {
		ok: true,
		message: 'Profile updated.',
		profile: normalizeProfileRow(data, ownerResult.user),
	};
}

function getFileExtension(fileName) {
	const safeName = String(fileName || '').trim();
	if (!safeName.includes('.')) {
		return 'jpg';
	}

	const extension = safeName.split('.').pop().toLowerCase();
	return extension || 'jpg';
}

async function uploadProfilePhoto(file) {
	if (!supabase) {
		return createErrorResult('Supabase auth is not configured.');
	}

	const ownerResult = await getStateOwner();
	if (!ownerResult.ok) {
		return createErrorResult(ownerResult.message);
	}

	if (!(file instanceof File)) {
		return createErrorResult('Choose an image file first.');
	}

	if (!String(file.type || '').startsWith('image/')) {
		return createErrorResult('Only image uploads are supported.');
	}

	const ext = getFileExtension(file.name);
	const filePath = `${ownerResult.ownerKey}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

	const { error: uploadError } = await supabase
		.storage
		.from(PROFILE_PHOTOS_BUCKET)
		.upload(filePath, file, {
			upsert: true,
			cacheControl: '3600',
			contentType: file.type || undefined,
		});

	if (uploadError) {
		return createErrorResult(describeStorageError('Could not upload profile photo', PROFILE_PHOTOS_BUCKET, uploadError));
	}

	const { data } = supabase.storage.from(PROFILE_PHOTOS_BUCKET).getPublicUrl(filePath);
	const publicUrl = String(data?.publicUrl || '').trim();

	if (!publicUrl) {
		return createErrorResult('Photo uploaded but public URL could not be generated.');
	}

	return {
		ok: true,
		message: 'Photo uploaded.',
		photoUrl: publicUrl,
		path: filePath,
	};
}

async function searchProfiles(query) {
	const ownerResult = await getStateOwner();
	if (!ownerResult.ok) {
		return {
			ok: false,
			message: ownerResult.message,
			profiles: [],
		};
	}

	const safeQuery = String(query || '').trim();
	if (safeQuery.length < 2) {
		return {
			ok: true,
			message: 'Type at least 2 characters to search.',
			profiles: [],
		};
	}

	const { data, error } = await supabase
		.from(PROFILES_TABLE)
		.select('user_id, display_name, photo_url')
		.ilike('display_name', `%${safeQuery}%`)
		.neq('user_id', ownerResult.ownerKey)
		.limit(12);

	if (error) {
		return {
			ok: false,
			message: describeTableError('Could not search profiles', PROFILES_TABLE, error),
			profiles: [],
		};
	}

	return {
		ok: true,
		message: data?.length ? 'Profiles found.' : 'No matching profiles yet.',
		profiles: (data || []).map((row) => normalizeProfileRow(row, null)),
	};
}

async function followUser(targetUserId) {
	const ownerResult = await getStateOwner();
	if (!ownerResult.ok) {
		return createErrorResult(ownerResult.message);
	}

	const target = String(targetUserId || '').trim();
	if (!target) {
		return createErrorResult('Pick a user before following.');
	}

	if (target === ownerResult.ownerKey) {
		return createErrorResult('You cannot follow yourself.');
	}

	const { error } = await supabase
		.from(FOLLOWS_TABLE)
		.upsert(
			{
				follower_id: ownerResult.ownerKey,
				followee_id: target,
				created_at: new Date().toISOString(),
			},
			{ onConflict: 'follower_id,followee_id' }
		);

	if (error) {
		return createErrorResult(describeTableError('Could not follow that user', FOLLOWS_TABLE, error));
	}

	return { ok: true, message: 'Now following user.' };
}

async function unfollowUser(targetUserId) {
	const ownerResult = await getStateOwner();
	if (!ownerResult.ok) {
		return createErrorResult(ownerResult.message);
	}

	const target = String(targetUserId || '').trim();
	if (!target) {
		return createErrorResult('Pick a user before unfollowing.');
	}

	const { error } = await supabase
		.from(FOLLOWS_TABLE)
		.delete()
		.eq('follower_id', ownerResult.ownerKey)
		.eq('followee_id', target);

	if (error) {
		return createErrorResult(describeTableError('Could not unfollow that user', FOLLOWS_TABLE, error));
	}

	return { ok: true, message: 'Unfollowed user.' };
}

async function listFollowing() {
	const ownerResult = await getStateOwner();
	if (!ownerResult.ok) {
		return {
			ok: false,
			message: ownerResult.message,
			profiles: [],
		};
	}

	const { data, error } = await supabase
		.from(FOLLOWS_TABLE)
		.select('followee_id')
		.eq('follower_id', ownerResult.ownerKey);

	if (error) {
		return {
			ok: false,
			message: describeTableError('Could not load following list', FOLLOWS_TABLE, error),
			profiles: [],
		};
	}

	const followeeIds = (data || []).map((row) => row.followee_id).filter(Boolean);
	if (followeeIds.length === 0) {
		return {
			ok: true,
			message: 'Not following anyone yet.',
			profiles: [],
		};
	}

	const { data: profileRows, error: profileError } = await supabase
		.from(PROFILES_TABLE)
		.select('user_id, display_name, photo_url')
		.in('user_id', followeeIds);

	if (profileError) {
		return {
			ok: false,
			message: describeTableError('Could not load following profiles', PROFILES_TABLE, profileError),
			profiles: [],
		};
	}

	return {
		ok: true,
		message: 'Following loaded.',
		profiles: (profileRows || []).map((row) => normalizeProfileRow(row, null)),
	};
}

async function listFollowers() {
	const ownerResult = await getStateOwner();
	if (!ownerResult.ok) {
		return {
			ok: false,
			message: ownerResult.message,
			profiles: [],
		};
	}

	const { data, error } = await supabase
		.from(FOLLOWS_TABLE)
		.select('follower_id')
		.eq('followee_id', ownerResult.ownerKey);

	if (error) {
		return {
			ok: false,
			message: describeTableError('Could not load followers', FOLLOWS_TABLE, error),
			profiles: [],
		};
	}

	const followerIds = (data || []).map((row) => row.follower_id).filter(Boolean);
	if (followerIds.length === 0) {
		return {
			ok: true,
			message: 'No followers yet.',
			profiles: [],
		};
	}

	const { data: profileRows, error: profileError } = await supabase
		.from(PROFILES_TABLE)
		.select('user_id, display_name, photo_url')
		.in('user_id', followerIds);

	if (profileError) {
		return {
			ok: false,
			message: describeTableError('Could not load follower profiles', PROFILES_TABLE, profileError),
			profiles: [],
		};
	}

	return {
		ok: true,
		message: 'Followers loaded.',
		profiles: (profileRows || []).map((row) => normalizeProfileRow(row, null)),
	};
}

async function createParty(name) {
	const ownerResult = await getStateOwner();
	if (!ownerResult.ok) {
		return {
			ok: false,
			message: ownerResult.message,
			party: null,
		};
	}

	const safeName = String(name || '').trim();
	if (!safeName) {
		return {
			ok: false,
			message: 'Party name is required.',
			party: null,
		};
	}

	const { data, error } = await supabase
		.from(PARTIES_TABLE)
		.insert({
			owner_id: ownerResult.ownerKey,
			name: safeName,
			created_at: new Date().toISOString(),
		})
		.select('id, owner_id, name, created_at')
		.single();

	if (error) {
		return {
			ok: false,
			message: describeTableError('Could not create party', PARTIES_TABLE, error),
			party: null,
		};
	}

	const memberInsert = await supabase
		.from(PARTY_MEMBERS_TABLE)
		.upsert(
			{
				party_id: data.id,
				user_id: ownerResult.ownerKey,
				joined_at: new Date().toISOString(),
			},
			{ onConflict: 'party_id,user_id' }
		);

	if (memberInsert.error) {
		return {
			ok: false,
			message: describeTableError('Party created but could not add you as a member', PARTY_MEMBERS_TABLE, memberInsert.error),
			party: null,
		};
	}

	return {
		ok: true,
		message: 'Party created.',
		party: data,
	};
}

async function joinParty(partyId) {
	const ownerResult = await getStateOwner();
	if (!ownerResult.ok) {
		return createErrorResult(ownerResult.message);
	}

	const safePartyId = String(partyId || '').trim();
	if (!safePartyId) {
		return createErrorResult('Party ID is required.');
	}

	const { data: existingMembership, error: existingMembershipError } = await supabase
		.from(PARTY_MEMBERS_TABLE)
		.select('party_id')
		.eq('party_id', safePartyId)
		.eq('user_id', ownerResult.ownerKey)
		.maybeSingle();

	if (existingMembershipError) {
		return createErrorResult(describeTableError('Could not check your party membership', PARTY_MEMBERS_TABLE, existingMembershipError));
	}

	if (existingMembership) {
		return { ok: true, message: 'You are already in this party.' };
	}

	const { count, error: countError } = await supabase
		.from(PARTY_MEMBERS_TABLE)
		.select('user_id', { head: true, count: 'exact' })
		.eq('party_id', safePartyId);

	if (countError) {
		return createErrorResult(describeTableError('Could not check party size', PARTY_MEMBERS_TABLE, countError));
	}

	if ((count || 0) >= 6) {
		return createErrorResult('That party is already full (6 members max).');
	}

	const { error } = await supabase
		.from(PARTY_MEMBERS_TABLE)
		.insert({
			party_id: safePartyId,
			user_id: ownerResult.ownerKey,
			joined_at: new Date().toISOString(),
		});

	if (error) {
		return createErrorResult(describeTableError('Could not join that party', PARTY_MEMBERS_TABLE, error));
	}

	return { ok: true, message: 'Joined party.' };
}

async function listMyParties() {
	const ownerResult = await getStateOwner();
	if (!ownerResult.ok) {
		return {
			ok: false,
			message: ownerResult.message,
			parties: [],
		};
	}

	const { data: memberships, error: membershipError } = await supabase
		.from(PARTY_MEMBERS_TABLE)
		.select('party_id')
		.eq('user_id', ownerResult.ownerKey);

	if (membershipError) {
		return {
			ok: false,
			message: describeTableError('Could not load your party memberships', PARTY_MEMBERS_TABLE, membershipError),
			parties: [],
		};
	}

	const partyIds = (memberships || []).map((row) => row.party_id).filter(Boolean);
	if (partyIds.length === 0) {
		return {
			ok: true,
			message: 'No parties yet.',
			parties: [],
		};
	}

	const { data: parties, error: partiesError } = await supabase
		.from(PARTIES_TABLE)
		.select('id, owner_id, name, created_at')
		.in('id', partyIds)
		.order('created_at', { ascending: false });

	if (partiesError) {
		return {
			ok: false,
			message: describeTableError('Could not load parties', PARTIES_TABLE, partiesError),
			parties: [],
		};
	}

	const { data: members, error: membersError } = await supabase
		.from(PARTY_MEMBERS_TABLE)
		.select('party_id, user_id')
		.in('party_id', partyIds);

	if (membersError) {
		return {
			ok: false,
			message: describeTableError('Could not load party members', PARTY_MEMBERS_TABLE, membersError),
			parties: [],
		};
	}

	const memberIds = [...new Set((members || []).map((row) => row.user_id).filter(Boolean))];
	const { data: memberProfiles, error: memberProfilesError } = await supabase
		.from(PROFILES_TABLE)
		.select('user_id, display_name, photo_url')
		.in('user_id', memberIds);

	if (memberProfilesError) {
		return {
			ok: false,
			message: describeTableError('Could not load member profiles', PROFILES_TABLE, memberProfilesError),
			parties: [],
		};
	}

	const profileById = new Map((memberProfiles || []).map((row) => [row.user_id, normalizeProfileRow(row)]));
	const membersByPartyId = (members || []).reduce((accumulator, row) => {
		if (!accumulator[row.party_id]) {
			accumulator[row.party_id] = [];
		}
		const profile = profileById.get(row.user_id) || {
			userId: row.user_id,
			displayName: 'Unknown Adventurer',
			photoUrl: '',
		};
		accumulator[row.party_id].push(profile);
		return accumulator;
	}, {});

	return {
		ok: true,
		message: 'Parties loaded.',
		parties: (parties || []).map((party) => {
			const partyMembers = membersByPartyId[party.id] || [];
			return {
				id: party.id,
				name: party.name,
				ownerId: party.owner_id,
				isOwner: party.owner_id === ownerResult.ownerKey,
				memberCount: partyMembers.length,
				members: partyMembers,
			};
		}),
	};
}

async function getXpLeaderboard(limit = 50) {
	const ownerResult = await getStateOwner();
	if (!ownerResult.ok) {
		return {
			ok: false,
			message: ownerResult.message,
			rows: [],
		};
	}

	const safeLimit = Number.isFinite(Number(limit))
		? Math.max(1, Math.min(200, Math.round(Number(limit))))
		: 50;

	const { data, error } = await supabase.rpc('get_xp_leaderboard', {
		row_limit: safeLimit,
	});

	if (error) {
		const rawMessage = String(error.message || '');
		const lowered = rawMessage.toLowerCase();
		if (
			rawMessage.includes('get_xp_leaderboard') &&
			(lowered.includes('does not exist') || lowered.includes('could not find the function'))
		) {
			return {
				ok: false,
				message: 'Leaderboard is not configured yet. Run the leaderboard SQL function from the README.',
				rows: [],
			};
		}

		return {
			ok: false,
			message: `Could not load leaderboard. ${rawMessage || 'Unknown database error.'}`,
			rows: [],
		};
	}

	return {
		ok: true,
		message: 'Leaderboard loaded.',
		rows: Array.isArray(data) ? data : [],
	};
}

window.supabase = supabase;
window.supabaseSync = {
	enabled: Boolean(supabase),
	table: SUPABASE_TABLE,
	getSession,
	getCurrentUser,
	onAuthStateChange,
	consumeAuthRedirect,
	verifyOtpFromUrl,
	clearAuthParamsFromUrl,
	signUp,
	signIn,
	signOut,
	logConnectionTest,
	logReadWriteTest,
	loadState,
	saveState,
	getMyProfile,
	updateMyProfile,
	uploadProfilePhoto,
	searchProfiles,
	followUser,
	unfollowUser,
	listFollowing,
	listFollowers,
	createParty,
	joinParty,
	listMyParties,
	getXpLeaderboard,
};
