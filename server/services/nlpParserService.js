/**
 * Natural Language Query Parser for Lost & Found search
 *
 * Example: "I lost my black wallet near the canteen yesterday"
 * Parses to:
 * {
 *   intent: 'lost',
 *   color: 'black',
 *   category: 'Accessories & Wallets',
 *   keyword: 'wallet',
 *   location: 'canteen',
 *   dateRange: { from, to }
 * }
 */

const KNOWN_COLORS = [
  'black', 'white', 'blue', 'navy', 'red', 'green', 'yellow',
  'brown', 'grey', 'gray', 'silver', 'gold', 'purple', 'orange', 'pink'
];

const KNOWN_BRANDS = [
  'apple', 'samsung', 'nike', 'adidas', 'dell', 'hp', 'lenovo',
  'sony', 'bose', 'asus', 'acer', 'puma', 'fossil', 'casio', 'gucci', 'jbl'
];

const CATEGORY_KEYWORDS = {
  'Electronics': ['laptop', 'macbook', 'phone', 'iphone', 'android', 'tablet', 'ipad', 'charger', 'headphones', 'airpods', 'earphones', 'camera', 'powerbank'],
  'Bags & Luggage': ['bag', 'backpack', 'rucksack', 'purse', 'handbag', 'tote', 'duffle', 'briefcase', 'suitcase'],
  'Wallets & Cards': ['wallet', 'purse', 'cardholder', 'billfold', 'id', 'student id', 'license', 'credit card'],
  'Clothing & Wearables': ['jacket', 'hoodie', 'coat', 'sweater', 'shirt', 'hat', 'cap', 'scarf', 'shoes', 'glasses', 'sunglasses', 'watch'],
  'Keys & Accessories': ['key', 'keys', 'keychain', 'ring', 'necklace', 'bracelet', 'umbrella', 'bottle', 'thermos', 'calculator'],
  'Books & Documents': ['book', 'textbook', 'notebook', 'binder', 'folder', 'passport', 'certificate']
};

export function parseNaturalLanguageQuery(query = '') {
  const text = query.toLowerCase();
  const structured = {
    originalQuery: query,
    keyword: query,
    intent: 'all', // 'lost', 'found', or 'all'
    category: '',
    color: '',
    brand: '',
    location: '',
    date: null,
  };

  // 1. Detect intent
  if (text.includes('lost') || text.includes('misplaced') || text.includes('left behind')) {
    structured.intent = 'lost';
  } else if (text.includes('found') || text.includes('picked up') || text.includes('saw')) {
    structured.intent = 'found';
  }

  // 2. Detect color
  for (const c of KNOWN_COLORS) {
    const regex = new RegExp(`\\b${c}\\b`, 'i');
    if (regex.test(text)) {
      structured.color = c;
      break;
    }
  }

  // 3. Detect brand
  for (const b of KNOWN_BRANDS) {
    const regex = new RegExp(`\\b${b}\\b`, 'i');
    if (regex.test(text)) {
      structured.brand = b;
      break;
    }
  }

  // 4. Detect category and specific item keyword
  for (const [catName, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      if (regex.test(text)) {
        structured.category = catName;
        structured.keyword = kw;
        break;
      }
    }
    if (structured.category) break;
  }

  // 5. Detect location ("near ...", "at ...", "in ...", "outside ...")
  const locMatch = text.match(/(?:near|at|in|outside|around|inside|by)\s+(?:the\s+)?([a-z0-9\s]{3,30}?)(?=\s+(?:yesterday|today|last|on|\.|$))/i);
  if (locMatch && locMatch[1]) {
    structured.location = locMatch[1].trim();
  }

  // 6. Detect relative dates
  const now = new Date();
  if (text.includes('yesterday')) {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    structured.date = y.toISOString().split('T')[0];
  } else if (text.includes('today')) {
    structured.date = now.toISOString().split('T')[0];
  } else if (text.includes('last week')) {
    const lw = new Date(now);
    lw.setDate(lw.getDate() - 7);
    structured.date = lw.toISOString().split('T')[0];
  }

  return structured;
}
