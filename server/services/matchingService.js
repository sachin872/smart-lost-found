import Match from '../models/Match.js';
import LostItem from '../models/LostItem.js';
import FoundItem from '../models/FoundItem.js';
import { calculateTextScore } from './textMatchingService.js';
import { calculateImageScore } from './imageMatchingService.js';
import { calculateLocationScore } from '../utils/distanceCalculator.js';
import { calculateTimeScore } from '../utils/timeDecay.js';
import { createNotification } from './notificationService.js';

export const WEIGHTS = {
  text: 0.30,
  image: 0.30,
  category: 0.10,
  color: 0.05,
  brand: 0.05,
  location: 0.10,
  time: 0.10,
};

/**
 * Calculate Category Similarity (0 or 100, or partial for subcategory match)
 */
export function calculateCategoryScore(lostCat = '', foundCat = '', lostSub = '', foundSub = '') {
  const c1 = (lostCat || '').trim().toLowerCase();
  const c2 = (foundCat || '').trim().toLowerCase();

  if (!c1 || !c2) return 50;

  if (c1 === c2) {
    if (lostSub && foundSub && lostSub.trim().toLowerCase() === foundSub.trim().toLowerCase()) {
      return 100;
    }
    return 90;
  }

  // Related categories
  const relatedGroups = [
    ['electronics', 'gadgets', 'computers', 'mobile', 'accessories'],
    ['bags', 'luggage', 'backpacks', 'accessories'],
    ['clothing', 'apparel', 'wearables'],
    ['documents', 'cards', 'identification', 'wallets'],
  ];

  for (const group of relatedGroups) {
    if (group.includes(c1) && group.includes(c2)) return 65;
  }

  return 10;
}

/**
 * Calculate Color Similarity
 */
export function calculateColorScore(color1 = '', color2 = '') {
  const c1 = (color1 || '').trim().toLowerCase();
  const c2 = (color2 || '').trim().toLowerCase();

  if (!c1 || !c2) return 50;
  if (c1 === c2) return 100;

  const colorSynonyms = {
    black: ['dark', 'charcoal', 'matte black', 'jet black'],
    blue: ['navy', 'dark blue', 'light blue', 'cyan', 'indigo'],
    navy: ['blue', 'dark blue'],
    grey: ['gray', 'silver', 'slate', 'charcoal'],
    gray: ['grey', 'silver', 'slate', 'charcoal'],
    white: ['ivory', 'off-white', 'cream', 'silver'],
    red: ['maroon', 'crimson', 'burgundy', 'scarlet'],
    brown: ['tan', 'khaki', 'beige', 'coffee'],
  };

  if (colorSynonyms[c1]?.includes(c2) || colorSynonyms[c2]?.includes(c1)) {
    return 85;
  }

  if (c1.includes(c2) || c2.includes(c1)) return 80;

  return 20;
}

/**
 * Calculate Brand Similarity
 */
export function calculateBrandScore(brand1 = '', brand2 = '') {
  const b1 = (brand1 || '').trim().toLowerCase();
  const b2 = (brand2 || '').trim().toLowerCase();

  if (!b1 || !b2) return 50; // Neutral if either didn't specify brand
  if (b1 === b2) return 100;
  if (b1.includes(b2) || b2.includes(b1)) return 85;
  return 15;
}

/**
 * Determine confidence classification based on final score
 */
export function getConfidenceLevel(finalScore) {
  if (finalScore >= 85) return 'HIGH CONFIDENCE';
  if (finalScore >= 65) return 'MEDIUM CONFIDENCE';
  return 'LOW CONFIDENCE';
}

/**
 * Generate human-readable analysis justification
 */
export function generateMatchReason({
  lostItem,
  foundItem,
  finalScore,
  textScore,
  categoryScore,
  colorScore,
  locationScore,
  timeScore,
}) {
  const parts = [];

  if (textScore >= 75) {
    parts.push(`Semantic description strongly aligns ("${lostItem.title}" vs "${foundItem.title}")`);
  }
  if (categoryScore >= 80) {
    parts.push(`Matching category (${lostItem.category})`);
  }
  if (colorScore >= 80 && lostItem.color && foundItem.color) {
    parts.push(`Complementary color profiles (${lostItem.color} / ${foundItem.color})`);
  }
  if (locationScore >= 75) {
    parts.push(`Close proximity: Lost at "${lostItem.lostLocation}", found at "${foundItem.foundLocation}"`);
  }
  if (timeScore >= 75) {
    parts.push('Found within a tight temporal window from the reported lost timestamp');
  }

  if (parts.length === 0) {
    return `Potential correlation detected with an overall confidence rating of ${finalScore}%.`;
  }

  return parts.join('. ') + '.';
}

/**
 * Compare a LostItem and a FoundItem, computing all subscores and weighted finalScore
 */
export async function compareItems(lostItem, foundItem) {
  // 1. Text Score (30%)
  const textScore = await calculateTextScore(lostItem, foundItem);

  // 2. Image Score (30%)
  const imageResult = await calculateImageScore(lostItem.imageUrls, foundItem.imageUrls);
  const imageScore = imageResult.score;

  // 3. Category Score (10%)
  const categoryScore = calculateCategoryScore(
    lostItem.category,
    foundItem.category,
    lostItem.subcategory,
    foundItem.subcategory
  );

  // 4. Color Score (5%)
  const colorScore = calculateColorScore(lostItem.color, foundItem.color);

  // 5. Brand Score (5%)
  const brandScore = calculateBrandScore(lostItem.brand, foundItem.brand);

  // 6. Location Score (10%)
  const locationScore = calculateLocationScore(
    lostItem.lostLocation,
    foundItem.foundLocation,
    lostItem.latitude,
    lostItem.longitude,
    foundItem.latitude,
    foundItem.longitude
  );

  // 7. Time Score (10%)
  const timeScore = calculateTimeScore(
    lostItem.lostDate,
    foundItem.foundDate,
    lostItem.lostTime,
    foundItem.foundTime
  );

  // Calculate weighted final score
  const finalScore = Math.round(
    textScore * WEIGHTS.text +
    imageScore * WEIGHTS.image +
    categoryScore * WEIGHTS.category +
    colorScore * WEIGHTS.color +
    brandScore * WEIGHTS.brand +
    locationScore * WEIGHTS.location +
    timeScore * WEIGHTS.time
  );

  const confidenceLevel = getConfidenceLevel(finalScore);

  const matchReason = generateMatchReason({
    lostItem,
    foundItem,
    finalScore,
    textScore,
    categoryScore,
    colorScore,
    locationScore,
    timeScore,
  });

  return {
    lostItemId: lostItem._id,
    foundItemId: foundItem._id,
    textScore,
    imageScore,
    imageStatus: imageResult.status,
    categoryScore,
    colorScore,
    brandScore,
    locationScore,
    timeScore,
    finalScore,
    confidenceLevel,
    matchReason,
  };
}

/**
 * Match a specific lost item against all active found items
 */
export async function matchLostItemWithFoundItems(lostItemId) {
  const lostItem = await LostItem.findById(lostItemId);
  if (!lostItem) throw new Error('Lost item not found');

  const foundItems = await FoundItem.find({ status: { $in: ['reported', 'matched'] } });
  const generatedMatches = [];

  for (const foundItem of foundItems) {
    const comparison = await compareItems(lostItem, foundItem);

    // Save or update match if score is notable (>= 50)
    if (comparison.finalScore >= 50) {
      const matchDoc = await Match.findOneAndUpdate(
        { lostItemId: lostItem._id, foundItemId: foundItem._id },
        {
          ...comparison,
          status: 'potential',
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      // If high or medium confidence, update items' status and trigger notifications
      if (comparison.finalScore >= 65) {
        if (lostItem.status === 'reported') {
          lostItem.status = 'matched';
          await lostItem.save();
        }
        if (foundItem.status === 'reported') {
          foundItem.status = 'matched';
          await foundItem.save();
        }

        // Notify lost item owner
        await createNotification({
          userId: lostItem.userId,
          type: 'match_found',
          title: `Potential Match (${comparison.confidenceLevel}) Found!`,
          message: `An item matching "${lostItem.title}" was found at ${foundItem.foundLocation} with ${comparison.finalScore}% confidence.`,
          relatedItemId: foundItem._id,
          relatedItemModel: 'FoundItem',
          relatedMatchId: matchDoc._id,
        });

        // Notify finder
        await createNotification({
          userId: foundItem.finderId,
          type: 'match_found',
          title: `Potential Owner Identified (${comparison.finalScore}%)`,
          message: `A lost report for "${lostItem.title}" closely matches the item you found at ${foundItem.foundLocation}.`,
          relatedItemId: lostItem._id,
          relatedItemModel: 'LostItem',
          relatedMatchId: matchDoc._id,
        });
      }

      generatedMatches.push(matchDoc);
    }
  }

  return generatedMatches;
}

/**
 * Match a specific found item against all active lost items
 */
export async function matchFoundItemWithLostItems(foundItemId) {
  const foundItem = await FoundItem.findById(foundItemId);
  if (!foundItem) throw new Error('Found item not found');

  const lostItems = await LostItem.find({ status: { $in: ['reported', 'matched'] } });
  const generatedMatches = [];

  for (const lostItem of lostItems) {
    const comparison = await compareItems(lostItem, foundItem);

    if (comparison.finalScore >= 50) {
      const matchDoc = await Match.findOneAndUpdate(
        { lostItemId: lostItem._id, foundItemId: foundItem._id },
        {
          ...comparison,
          status: 'potential',
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      if (comparison.finalScore >= 65) {
        if (lostItem.status === 'reported') {
          lostItem.status = 'matched';
          await lostItem.save();
        }
        if (foundItem.status === 'reported') {
          foundItem.status = 'matched';
          await foundItem.save();
        }

        // Notify lost item owner
        await createNotification({
          userId: lostItem.userId,
          type: 'match_found',
          title: `Potential Match Found (${comparison.finalScore}%)`,
          message: `An item found at ${foundItem.foundLocation} closely matches your lost item "${lostItem.title}".`,
          relatedItemId: foundItem._id,
          relatedItemModel: 'FoundItem',
          relatedMatchId: matchDoc._id,
        });

        // Notify finder
        await createNotification({
          userId: foundItem.finderId,
          type: 'match_found',
          title: `Potential Match Identified (${comparison.confidenceLevel})`,
          message: `The item "${foundItem.title}" you reported has matched a lost report by an owner.`,
          relatedItemId: lostItem._id,
          relatedItemModel: 'LostItem',
          relatedMatchId: matchDoc._id,
        });
      }

      generatedMatches.push(matchDoc);
    }
  }

  return generatedMatches;
}

/**
 * Run global batch matching engine across all active records
 */
export async function runGlobalMatchingEngine() {
  const lostItems = await LostItem.find({ status: { $in: ['reported', 'matched'] } });
  const foundItems = await FoundItem.find({ status: { $in: ['reported', 'matched'] } });

  const results = [];
  for (const lost of lostItems) {
    for (const found of foundItems) {
      const comp = await compareItems(lost, found);
      if (comp.finalScore >= 50) {
        const match = await Match.findOneAndUpdate(
          { lostItemId: lost._id, foundItemId: found._id },
          { ...comp, status: 'potential' },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        results.push(match);
      }
    }
  }
  return results;
}
