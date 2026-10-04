/**
 * AI Image Matching Service
 *
 * Architecture designed for pluggable Vision-Language Models (e.g. OpenAI CLIP,
 * HuggingFace ViT, Python FastAPI endpoint).
 *
 * As per specification:
 * - Does NOT fake AI scores when an external model is not yet connected.
 * - Clearly signals whether the live AI image model is integrated or pending.
 */

export const IMAGE_SERVICE_STATUS = {
  INTEGRATED: 'AI Image Model Active',
  INTEGRATION_REQUIRED: 'AI Image Matching Service – Integration Required (CLIP/Vision Model)',
};

/**
 * Check if remote CLIP / Computer Vision microservice is configured
 */
export function isImageAIConfigured() {
  return Boolean(process.env.AI_SERVICE_URL || (process.env.AI_API_KEY && process.env.ENABLE_IMAGE_AI === 'true'));
}

/**
 * Query external CLIP / Computer Vision Embedding service
 */
async function callRemoteCLIPService(images1, images2) {
  const serviceUrl = process.env.AI_SERVICE_URL;
  const apiKey = process.env.AI_API_KEY;

  if (!serviceUrl) return null;

  try {
    const res = await fetch(`${serviceUrl}/similarity/images`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({
        sourceImages: images1,
        targetImages: images2,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return typeof data.similarityScore === 'number'
        ? Math.round(data.similarityScore * 100)
        : null;
    }
  } catch (err) {
    console.warn('Remote image embedding call failed:', err.message);
  }
  return null;
}

/**
 * Calculate Image Similarity Score (0 - 100)
 *
 * @param {Array<string>} lostImageUrls
 * @param {Array<string>} foundImageUrls
 * @returns {Promise<{ score: number, status: string, isRealModel: boolean }>}
 */
export async function calculateImageScore(lostImageUrls = [], foundImageUrls = []) {
  // If neither item has images, or only one has images
  if (!lostImageUrls || lostImageUrls.length === 0 || !foundImageUrls || foundImageUrls.length === 0) {
    return {
      score: 50, // Neutral score when image comparison is not applicable
      status: 'No images provided for comparison on one or both items',
      isRealModel: false,
    };
  }

  // If external CLIP/Vision model is connected
  if (isImageAIConfigured()) {
    const remoteScore = await callRemoteCLIPService(lostImageUrls, foundImageUrls);
    if (remoteScore !== null) {
      return {
        score: Math.min(100, Math.max(0, remoteScore)),
        status: IMAGE_SERVICE_STATUS.INTEGRATED,
        isRealModel: true,
      };
    }
  }

  // When live model is not yet connected:
  // Strictly honor guideline: Do not pretend image AI is working if no model is connected.
  return {
    score: 50, // Standard neutral baseline for unintegrated vision pipeline
    status: IMAGE_SERVICE_STATUS.INTEGRATION_REQUIRED,
    isRealModel: false,
    note: 'CLIP or PyTorch FastAPI service can be plugged in via AI_SERVICE_URL',
  };
}
