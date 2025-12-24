import { Category } from "./types";

/**
 * Comprehensive category database for transaction categorization
 */
export const categories: Category[] = [
  {
    id: "grocery",
    name: "Grocery",
    icon: "🛒",
    keywords: [
      "walmart", "target", "kroger", "safeway", "whole foods", "trader joe",
      "aldi", "costco", "sam's club", "food lion", "publix", "wegmans",
      "market", "grocery", "supermarket", "food store", "produce"
    ],
    mccCodes: [5411, 5422, 5441, 5451],
  },
  {
    id: "restaurants",
    name: "Restaurants & Dining",
    icon: "🍽️",
    keywords: [
      "restaurant", "cafe", "bistro", "grill", "diner", "pizza", "burger",
      "mcdonald", "burger king", "wendy", "subway", "chipotle", "panera",
      "starbucks", "dunkin", "coffee", "bar", "pub", "tavern", "eatery",
      "food", "dining", "kitchen", "taco", "sushi", "chinese", "thai"
    ],
    mccCodes: [5812, 5813, 5814],
  },
  {
    id: "fuel",
    name: "Fuel & Gas",
    icon: "⛽",
    keywords: [
      "shell", "chevron", "exxon", "bp", "mobil", "sunoco", "valero",
      "gas station", "fuel", "petrol", "pump", "conoco", "citgo",
      "marathon", "speedway", "wawa", "sheetz"
    ],
    mccCodes: [5541, 5542, 5983],
  },
  {
    id: "transportation",
    name: "Transportation",
    icon: "🚗",
    keywords: [
      "uber", "lyft", "taxi", "transit", "metro", "subway", "bus",
      "parking", "toll", "train", "airline", "flight", "airport"
    ],
    mccCodes: [4111, 4121, 4131, 4411, 4511, 4722, 4784, 4789],
  },
  {
    id: "utilities",
    name: "Utilities",
    icon: "💡",
    keywords: [
      "electric", "gas company", "water", "sewer", "utility", "power",
      "energy", "internet", "cable", "phone", "wireless", "telecom",
      "verizon", "at&t", "t-mobile", "comcast", "spectrum"
    ],
    mccCodes: [4812, 4814, 4816, 4821, 4899, 4900],
  },
  {
    id: "healthcare",
    name: "Healthcare & Medical",
    icon: "🏥",
    keywords: [
      "hospital", "clinic", "doctor", "physician", "medical", "health",
      "pharmacy", "cvs", "walgreens", "rite aid", "dental", "dentist",
      "vision", "optical", "insurance", "medicare", "prescription"
    ],
    mccCodes: [5912, 5975, 5976, 8011, 8021, 8031, 8041, 8042, 8043, 8049, 8050, 8062, 8071],
  },
  {
    id: "entertainment",
    name: "Entertainment",
    icon: "🎬",
    keywords: [
      "netflix", "hulu", "disney", "spotify", "apple music", "youtube",
      "theater", "cinema", "movie", "concert", "sports", "gym", "fitness",
      "streaming", "gaming", "xbox", "playstation", "nintendo"
    ],
    mccCodes: [5815, 5816, 5817, 5818, 5832, 5912, 5945, 5970, 5971, 7832, 7911, 7922, 7929, 7932, 7933, 7991, 7992, 7993, 7994, 7995, 7996, 7997, 7998, 7999],
  },
  {
    id: "retail",
    name: "Retail & Shopping",
    icon: "🛍️",
    keywords: [
      "amazon", "ebay", "shop", "store", "retail", "department",
      "clothing", "apparel", "fashion", "shoes", "electronics",
      "best buy", "home depot", "lowe's", "ikea", "furniture"
    ],
    mccCodes: [5309, 5310, 5311, 5331, 5399, 5611, 5621, 5631, 5641, 5651, 5661, 5691, 5697, 5698, 5699, 5712, 5713, 5714, 5718, 5719, 5722, 5732, 5733, 5734, 5735],
  },
  {
    id: "insurance",
    name: "Insurance",
    icon: "🛡️",
    keywords: [
      "insurance", "insure", "policy", "premium", "coverage",
      "geico", "state farm", "progressive", "allstate", "nationwide"
    ],
    mccCodes: [6300, 6381],
  },
  {
    id: "home",
    name: "Home & Garden",
    icon: "🏠",
    keywords: [
      "rent", "mortgage", "landlord", "property", "hoa",
      "home", "garden", "lawn", "hardware", "repair", "maintenance"
    ],
    mccCodes: [5712, 5713, 5714, 5718, 5719],
  },
  {
    id: "education",
    name: "Education",
    icon: "📚",
    keywords: [
      "school", "university", "college", "tuition", "education",
      "books", "learning", "course", "training", "academy"
    ],
    mccCodes: [5942, 5943, 8211, 8220, 8241, 8244, 8249, 8299],
  },
  {
    id: "professional_services",
    name: "Professional Services",
    icon: "💼",
    keywords: [
      "accountant", "lawyer", "attorney", "consultant", "legal",
      "tax", "cpa", "financial", "advisor", "professional"
    ],
    mccCodes: [8111, 8211, 8220, 8241, 8244, 8249, 8299, 8651, 8661, 8675, 8699],
  },
  {
    id: "auto",
    name: "Auto & Vehicle",
    icon: "🚙",
    keywords: [
      "auto", "car", "vehicle", "mechanic", "repair", "oil change",
      "tire", "parts", "service", "dealer", "automotive"
    ],
    mccCodes: [5511, 5521, 5531, 5532, 5533, 5571, 5592, 5598, 5599, 7531, 7534, 7535, 7538, 7542],
  },
  {
    id: "travel",
    name: "Travel & Lodging",
    icon: "✈️",
    keywords: [
      "hotel", "motel", "airbnb", "booking", "expedia", "travel",
      "vacation", "resort", "lodge", "inn", "hostel"
    ],
    mccCodes: [3501, 3502, 3503, 3504, 3505, 3506, 3507, 3508, 3509, 3510, 3511, 3512, 3513, 3514, 3515, 3516, 3517, 3518, 3519, 3520, 3521, 3522, 3523, 3524, 3525, 3526, 3527, 3528, 3529, 3530, 4511, 7011, 7012],
  },
  {
    id: "subscriptions",
    name: "Subscriptions",
    icon: "📱",
    keywords: [
      "subscription", "recurring", "monthly", "annual", "membership",
      "adobe", "microsoft", "dropbox", "icloud", "google"
    ],
  },
  {
    id: "charity",
    name: "Charity & Donations",
    icon: "❤️",
    keywords: [
      "charity", "donation", "donate", "nonprofit", "foundation",
      "giving", "fundraiser", "contribution"
    ],
    mccCodes: [8398, 8641, 8651, 8661, 8675, 8699],
  },
  {
    id: "fees",
    name: "Fees & Charges",
    icon: "💳",
    keywords: [
      "fee", "charge", "penalty", "interest", "late", "overdraft",
      "atm", "service charge", "bank fee"
    ],
    mccCodes: [6010, 6011, 6012],
  },
  {
    id: "income",
    name: "Income",
    icon: "💰",
    keywords: [
      "salary", "payroll", "deposit", "income", "payment received",
      "revenue", "earnings", "refund", "reimbursement"
    ],
  },
];

/**
 * Get category by ID
 */
export function getCategoryById(id: string): Category | undefined {
  return categories.find((cat) => cat.id === id);
}

/**
 * Get category by name
 */
export function getCategoryByName(name: string): Category | undefined {
  return categories.find(
    (cat) => cat.name.toLowerCase() === name.toLowerCase()
  );
}

/**
 * Get all category names
 */
export function getAllCategoryNames(): string[] {
  return categories.map((cat) => cat.name);
}
