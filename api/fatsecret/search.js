const FATSECRET_TOKEN_URL = 'https://oauth.fatsecret.com/connect/token';
const FATSECRET_API_URL = 'https://platform.fatsecret.com/rest/server.api';

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
  const rows = payload?.foods?.food;
  const foods = Array.isArray(rows) ? rows : rows ? [rows] : [];

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

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const query = String(req.query?.query || '').trim();
  const limit = toPositiveInt(req.query?.limit, 8, 20);

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
    const items = await searchFoods(token, query, limit);
    res.status(200).json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown FatSecret integration error.';
    res.status(502).json({ error: message, items: [] });
  }
}
