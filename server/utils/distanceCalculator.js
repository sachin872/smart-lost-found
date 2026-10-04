/**
 * Haversine formula to compute great-circle distance between two points in meters
 */
export const calculateHaversineDistanceMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in meters
};

/**
 * Calculate location similarity score (0 to 100)
 * Uses geo-coordinates if present with configurable thresholds,
 * or token/string proximity on location names.
 */
export const calculateLocationScore = (
  loc1 = '',
  loc2 = '',
  lat1 = null,
  lon1 = null,
  lat2 = null,
  lon2 = null,
  thresholds = { immediate: 20, close: 100, moderate: 500, broad: 2000 }
) => {
  const str1 = (loc1 || '').trim().toLowerCase();
  const str2 = (loc2 || '').trim().toLowerCase();

  // If identical text location
  if (str1 && str2 && (str1 === str2 || str1.includes(str2) || str2.includes(str1))) {
    // If exact match
    if (str1 === str2) return 100;
  }

  // If both have coordinates
  if (
    lat1 !== null &&
    lat1 !== undefined &&
    lon1 !== null &&
    lon1 !== undefined &&
    lat2 !== null &&
    lat2 !== undefined &&
    lon2 !== null &&
    lon2 !== undefined
  ) {
    const distanceMeters = calculateHaversineDistanceMeters(lat1, lon1, lat2, lon2);

    if (distanceMeters <= thresholds.immediate) return 100;
    if (distanceMeters <= thresholds.close) return 90;
    if (distanceMeters <= thresholds.moderate) return 75;
    if (distanceMeters <= thresholds.broad) {
      // Linear scaling between 500m (75) and 2000m (30)
      const ratio = (distanceMeters - thresholds.moderate) / (thresholds.broad - thresholds.moderate);
      return Math.round(75 - ratio * 45);
    }
    return Math.max(10, Math.round(30 - Math.min(25, (distanceMeters - thresholds.broad) / 1000)));
  }

  // Fallback: Text token overlap of location names
  if (str1 && str2) {
    const words1 = new Set(str1.split(/[\s,.-]+/).filter((w) => w.length > 2));
    const words2 = new Set(str2.split(/[\s,.-]+/).filter((w) => w.length > 2));
    if (words1.size === 0 || words2.size === 0) return 30;

    let overlap = 0;
    for (const w of words1) {
      if (words2.has(w)) overlap++;
    }
    const union = new Set([...words1, ...words2]).size;
    const jaccard = overlap / union;

    if (jaccard >= 0.8) return 95;
    if (jaccard >= 0.5) return 80;
    if (jaccard >= 0.25) return 60;
    if (jaccard > 0) return 40;
  }

  return 20; // Default baseline if different locations
};
