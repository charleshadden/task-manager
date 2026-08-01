const FATSECRET_TOKEN_URL = 'https://oauth.fatsecret.com/connect/token';
const FATSECRET_API_URL = 'https://platform.fatsecret.com/rest/server.api';
const FATSECRET_V3_SEARCH_URL = 'https://platform.fatsecret.com/rest/foods/search/v3';

function toPositiveInt(value, fallback, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.min(max, Math.round(parsed)));
}

function parseFoodDescription(description) {
  const text = String(description || '');

  const find = (regex) => {
    const match = text.match(regex);
    if (!match) return 0;
    const parsed = Number(match[1]);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  return {
    calories: find(/Calories:\s*([\d.]+)/i),
    fat: find(/Fat:\s*([\d.]+)/i),
    carbs: find(/Carbs:\s*([\d.]+)/i),
    protein: find(/Protein:\s*([\d.]+)/i),
  };
}

async function getFatSecretToken(clientId, clientSecret) {
  const body = new URLSearchParams();
  body.set('grant_type', 'client_credentials');
  body.set('scope', 'basic');
  body.set('client_id', clientId);
  body.set('client_secret', clientSecret);

  const response = await fetch(FATSECRET_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`FatSecret token request failed (${response.status}). ${detail}`);
  }

  const tokenPayload = await response.json();
  const token = String(tokenPayload?.access_token || '');
  if (!token) {
    throw new Error('FatSecret token response missing access_token.');
  }

  console.log('[FatSecret] token acquired');

  return token;
}

async function searchFoods(token, query, limit) {
  const params = new URLSearchParams();
  params.set('method', 'foods.search');
  params.set('format', 'json');
  params.set('search_expression', query);
  params.set('max_results', String(limit));
  params.set('page_number', '0');

  const response = await fetch(`${FATSECRET_API_URL}?${params.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`FatSecret food search failed (${response.status}). ${detail}`);
  }

  const payload = await response.json();
  console.log('[FatSecret] search response keys', Object.keys(payload || {}));
  if (payload?.error) {
    const code = payload.error?.code || 'unknown';
    const message = payload.error?.message || 'Unknown FatSecret API error';
    console.warn('[FatSecret] legacy search error payload', { code, message });
    throw new Error(`FatSecret API error (${code}): ${message}`);
  }
  const legacyRows = payload?.foods?.food;
  const v3Rows = payload?.foods_search?.results?.food;
  const rows = legacyRows || v3Rows;
  const foods = Array.isArray(rows) ? rows : rows ? [rows] : [];

  console.log('[FatSecret] parsed rows', {
    query,
    limit,
    hasLegacyRows: Boolean(legacyRows),
    hasV3Rows: Boolean(v3Rows),
    count: foods.length,
  });

  return foods.map((food) => {
    const desc = parseFoodDescription(food?.food_description);
    return {
      name: String(food?.food_name || 'Unknown food'),
      calories: Math.round(desc.calories || 0),
      protein: Math.round(desc.protein || 0),
      carbs: Math.round(desc.carbs || 0),
      fat: Math.round(desc.fat || 0),
    };
  });
}

async function searchFoodsV3(token, query, limit) {
  const params = new URLSearchParams();
  params.set('search_expression', query);
  params.set('max_results', String(limit));
  params.set('page_number', '0');
  params.set('format', 'json');

  const response = await fetch(`${FATSECRET_V3_SEARCH_URL}?${params.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`FatSecret v3 food search failed (${response.status}). ${detail}`);
  }

  const payload = await response.json();
  console.log('[FatSecret] v3 search response keys', Object.keys(payload || {}));

  if (payload?.error) {
    const code = payload.error?.code || 'unknown';
    const message = payload.error?.message || 'Unknown FatSecret v3 API error';
    throw new Error(`FatSecret v3 API error (${code}): ${message}`);
  }

  const rows = payload?.foods_search?.results?.food;
  const foods = Array.isArray(rows) ? rows : rows ? [rows] : [];

  return foods.map((food) => ({
    name: String(food?.food_name || 'Unknown food'),
    calories: Math.round(Number(food?.food_description?.match(/Calories:\s*([\d.]+)/i)?.[1]) || 0),
    protein: Math.round(Number(food?.food_description?.match(/Protein:\s*([\d.]+)/i)?.[1]) || 0),
    carbs: Math.round(Number(food?.food_description?.match(/Carbs:\s*([\d.]+)/i)?.[1]) || 0),
    fat: Math.round(Number(food?.food_description?.match(/Fat:\s*([\d.]+)/i)?.[1]) || 0),
  }));
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const query = String(req.query?.query || '').trim();
  const limit = toPositiveInt(req.query?.limit, 8, 20);

  console.log('[FatSecret] incoming request', { method: req.method, query, limit });

  if (!query) {
    res.status(400).json({ error: 'query is required', items: [] });
    return;
  }

  const clientId = process.env.FATSECRET_CLIENT_ID || process.env.Client_ID;
  const clientSecret = process.env.FATSECRET_CLIENT_SECRET || process.env.Client_Secret;

  if (!clientId || !clientSecret) {
    res.status(500).json({
      error: 'FatSecret credentials are not configured on the server.',
      items: [],
    });
    return;
  }

  try {
    const token = await getFatSecretToken(clientId, clientSecret);
    let items = [];
    try {
      items = await searchFoods(token, query, limit);
    } catch (legacyError) {
      const legacyMessage = legacyError instanceof Error ? legacyError.message : 'Unknown legacy search error.';
      console.warn('[FatSecret] legacy search failed, trying v3 fallback', { query, legacyMessage });
      items = await searchFoodsV3(token, query, limit);
    }
    console.log('[FatSecret] outgoing response', { query, count: items.length });
    res.status(200).json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown FatSecret integration error.';
    console.error('[FatSecret] route error', { query, message });
    res.status(502).json({ error: message, items: [] });
  }
}
