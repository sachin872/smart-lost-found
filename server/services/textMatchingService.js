/**
 * Semantic Text Matching Service
 *
 * Implements a pluggable architecture supporting:
 * 1. Semantic synonym expansion & TF-IDF Cosine Similarity (built-in deterministic engine)
 * 2. External Embedding Service (Sentence Transformers / OpenAI / Python FastAPI) via HTTP when configured.
 */

// Common synonym mapping dictionary for lost & found domains
const SYNONYMS = {
  backpack: ['bag', 'knapsack', 'rucksack', 'laptop bag', 'school bag', 'pack'],
  bag: ['backpack', 'tote', 'handbag', 'duffle', 'briefcase', 'purse'],
  phone: ['smartphone', 'iphone', 'android', 'mobile', 'cellphone', 'device'],
  laptop: ['computer', 'notebook', 'macbook', 'pc'],
  wallet: ['purse', 'cardholder', 'billfold', 'pocketbook'],
  glasses: ['spectacles', 'sunglasses', 'shades', 'eyewear'],
  earphones: ['earbuds', 'airpods', 'headphones', 'headset'],
  bottle: ['flask', 'thermos', 'water bottle', 'tumbler'],
  jacket: ['coat', 'hoodie', 'sweater', 'outerwear', 'blazer'],
  watch: ['smartwatch', 'timepiece', 'apple watch'],
  keys: ['keychain', 'fob', 'car keys'],
  id: ['identification', 'card', 'license', 'badge', 'student id'],
  navy: ['dark blue', 'blue'],
  'dark blue': ['navy', 'blue'],
  grey: ['gray', 'silver'],
  gray: ['grey', 'silver'],
  black: ['dark', 'charcoal', 'jet black'],
  logo: ['brand', 'branding', 'insignia', 'emblem', 'trademark', 'mark'],
  branding: ['logo', 'brand', 'insignia', 'emblem'],
};

/**
 * Interface to plug in external embeddings (CLIP/SentenceTransformers/FastAPI)
 */
export async function getRemoteEmbeddingSimilarity(text1, text2) {
  const serviceUrl = process.env.AI_SERVICE_URL;
  const apiKey = process.env.AI_API_KEY;

  if (!serviceUrl) return null;

  try {
    const res = await fetch(`${serviceUrl}/similarity/text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({ text1, text2 }),
    });

    if (res.ok) {
      const data = await res.json();
      return typeof data.score === 'number' ? Math.round(data.score * 100) : null;
    }
  } catch (err) {
    console.warn('External AI Text Matching API call failed, falling back to local semantic engine:', err.message);
  }
  return null;
}

/**
 * Tokenize and normalize text
 */
function tokenize(text = '') {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 1);
}

/**
 * Expand tokens with synonyms
 */
function expandTokens(tokens) {
  const expanded = new Set(tokens);

  for (const token of tokens) {
    if (SYNONYMS[token]) {
      for (const syn of SYNONYMS[token]) {
        for (const sub of syn.split(' ')) {
          if (sub.length > 1) expanded.add(sub);
        }
      }
    }
  }

  // Also check two-word phrases (e.g., 'dark blue', 'laptop bag')
  for (let i = 0; i < tokens.length - 1; i++) {
    const phrase = `${tokens[i]} ${tokens[i + 1]}`;
    if (SYNONYMS[phrase]) {
      for (const syn of SYNONYMS[phrase]) {
        for (const sub of syn.split(' ')) {
          if (sub.length > 1) expanded.add(sub);
        }
      }
    }
  }

  return Array.from(expanded);
}

/**
 * Calculate Term Frequency - Cosine Similarity between two strings
 */
export function calculateCosineSimilarity(str1, str2) {
  const tokens1 = expandTokens(tokenize(str1));
  const tokens2 = expandTokens(tokenize(str2));

  if (tokens1.length === 0 || tokens2.length === 0) return 0;

  // Build combined vocabulary
  const vocab = Array.from(new Set([...tokens1, ...tokens2]));

  // Frequency vectors
  const vec1 = vocab.map((w) => tokens1.filter((t) => t === w).length);
  const vec2 = vocab.map((w) => tokens2.filter((t) => t === w).length);

  // Dot product
  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;

  for (let i = 0; i < vocab.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    mag1 += vec1[i] * vec1[i];
    mag2 += vec2[i] * vec2[i];
  }

  if (mag1 === 0 || mag2 === 0) return 0;
  return dotProduct / (Math.sqrt(mag1) * Math.sqrt(mag2));
}

/**
 * Main Text Matching Function
 * Returns score between 0 and 100
 */
export async function calculateTextScore(lostItem, foundItem) {
  const text1 = `${lostItem.title || ''} ${lostItem.description || ''} ${lostItem.uniqueFeatures || ''}`;
  const text2 = `${foundItem.title || ''} ${foundItem.description || ''} ${foundItem.uniqueFeatures || ''}`;

  // 1. Try remote AI model if configured
  const remoteScore = await getRemoteEmbeddingSimilarity(text1, text2);
  if (remoteScore !== null) {
    return Math.min(100, Math.max(0, remoteScore));
  }

  // 2. Local semantic cosine similarity with synonym expansion
  const similarity = calculateCosineSimilarity(text1, text2);
  const rawScore = Math.round(similarity * 100);

  // Boost for key keyword matches (e.g. title match)
  const titleSim = calculateCosineSimilarity(lostItem.title || '', foundItem.title || '');
  const finalScore = Math.min(100, Math.round(rawScore * 0.7 + (titleSim * 100) * 0.3));

  return Math.min(100, Math.max(0, finalScore));
}
