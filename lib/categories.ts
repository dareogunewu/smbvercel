import { Category } from "./types";

/**
 * Corporate expense categories matching your business template
 */
export const categories: Category[] = [
  {
    id: "accounting_fee",
    name: "Accounting Fee",
    icon: "📊",
    keywords: ["accounting", "accountant", "bookkeeping", "cpa", "tax prep"],
    mccCodes: [8111, 8931],
  },
  {
    id: "bank_charges",
    name: "Bank charges",
    icon: "🏦",
    keywords: ["bank fee", "service charge", "atm", "overdraft", "monthly fee"],
    mccCodes: [6010, 6011, 6012],
  },
  {
    id: "business_cell_phone",
    name: "Business Cell phone",
    icon: "📱",
    keywords: ["wireless", "cell", "mobile", "at&t", "verizon", "t-mobile", "bell", "rogers", "telus"],
    mccCodes: [4814, 4816],
  },
  {
    id: "business_landline",
    name: "Business Land-line",
    icon: "☎️",
    keywords: ["landline", "phone service", "telephone"],
    mccCodes: [4814],
  },
  {
    id: "car_insurance",
    name: "Car insurance",
    icon: "🚗",
    keywords: ["auto insurance", "car insurance", "vehicle insurance", "geico", "state farm", "progressive"],
    mccCodes: [6300, 6381],
  },
  {
    id: "car_lease",
    name: "Car lease (finance) Payment",
    icon: "🚙",
    keywords: ["car payment", "auto loan", "lease", "vehicle payment", "finance"],
    mccCodes: [6010, 6011],
  },
  {
    id: "charitable_donation",
    name: "Charitable donation",
    icon: "❤️",
    keywords: ["charity", "donation", "donate", "nonprofit", "foundation", "giving"],
    mccCodes: [8398, 8641, 8651],
  },
  {
    id: "computer_exp",
    name: "Computer exp",
    icon: "💻",
    keywords: ["computer", "laptop", "software", "adobe", "microsoft", "apple", "dell", "hp", "best buy electronics"],
    mccCodes: [5732, 5734, 5045],
  },
  {
    id: "directors_dividend",
    name: "Director's Dividend",
    icon: "💰",
    keywords: ["dividend", "distribution"],
  },
  {
    id: "gas",
    name: "Gas",
    icon: "⛽",
    keywords: ["shell", "chevron", "exxon", "bp", "mobil", "esso", "petro", "gas station", "fuel"],
    mccCodes: [5541, 5542, 5983],
  },
  {
    id: "government_fee",
    name: "Government fee",
    icon: "🏛️",
    keywords: ["government", "license", "permit", "registration", "filing fee", "regulatory"],
  },
  {
    id: "incorporation_cost",
    name: "Incorporation cost",
    icon: "🏢",
    keywords: ["incorporation", "business registration", "legal formation"],
  },
  {
    id: "internet",
    name: "Internet",
    icon: "🌐",
    keywords: ["internet", "broadband", "isp", "comcast", "spectrum", "rogers", "bell fibe"],
    mccCodes: [4899],
  },
  {
    id: "interest_expense",
    name: "Interest expense",
    icon: "📈",
    keywords: ["interest", "finance charge", "loan interest"],
  },
  {
    id: "meals_entertainment",
    name: "Meals & entertainment",
    icon: "🍽️",
    keywords: ["restaurant", "dining", "meal", "lunch", "dinner", "starbucks", "coffee", "food", "kitchen", "cafe", "bistro", "grill", "eatery", "bar", "pub", "brewery"],
    mccCodes: [5812, 5813, 5814],
  },
  {
    id: "miscellaneous_exp",
    name: "Miscellaneous exp",
    icon: "📦",
    keywords: ["miscellaneous", "misc", "other expense"],
  },
  {
    id: "office_supplies",
    name: "Office Supplies",
    icon: "📎",
    keywords: ["office", "supplies", "staples", "office depot", "paper", "pens"],
    mccCodes: [5943],
  },
  {
    id: "office_utilities",
    name: "Office utilities",
    icon: "💡",
    keywords: ["electric", "electricity", "hydro", "gas", "water", "utility", "power"],
    mccCodes: [4900],
  },
  {
    id: "parking",
    name: "Parking",
    icon: "🅿️",
    keywords: ["parking", "park", "garage", "meter"],
    mccCodes: [7523],
  },
  {
    id: "payroll",
    name: "Payroll",
    icon: "💵",
    keywords: ["payroll", "salary", "wages", "employee", "adp", "paychex"],
  },
  {
    id: "postage_deliveries",
    name: "Postage and Deliveries",
    icon: "📫",
    keywords: ["postage", "mail", "shipping", "fedex", "ups", "usps", "canada post", "courier"],
    mccCodes: [4215],
  },
  {
    id: "rent",
    name: "Rent",
    icon: "🏢",
    keywords: ["rent", "rental", "lease", "office rent"],
  },
  {
    id: "repairs_maintenance",
    name: "Repairs/ maintenance",
    icon: "🔧",
    keywords: ["repair", "maintenance", "fix", "service"],
  },
  {
    id: "training",
    name: "Training",
    icon: "📚",
    keywords: ["training", "course", "seminar", "workshop", "education", "learning"],
    mccCodes: [8211, 8220, 8299],
  },
  {
    id: "travel",
    name: "Travel",
    icon: "✈️",
    keywords: ["airfare", "airline", "flight", "uber", "lyft", "taxi", "transit", "via rail", "amtrak", "train", "rail", "bus", "greyhound", "megabus"],
    mccCodes: [4111, 4112, 4411, 4511, 4722, 4784, 4789],
  },
  {
    id: "professional_services",
    name: "Professional Services",
    icon: "💼",
    keywords: ["lawyer", "attorney", "consultant", "legal", "advisor", "professional"],
    mccCodes: [8111, 8211, 8220, 8241, 8244, 8249, 8299, 8651, 8661, 8675, 8699],
  },
  {
    id: "other",
    name: "Other",
    icon: "📋",
    keywords: ["other"],
  },
  {
    id: "hotel",
    name: "Hotel",
    icon: "🏨",
    keywords: ["hotel", "motel", "airbnb", "booking", "expedia", "resort", "lodge", "inn"],
    mccCodes: [3501, 3502, 3503, 3504, 3505, 3506, 3507, 3508, 3509, 3510, 7011, 7012],
  },
  {
    id: "groceries",
    name: "Groceries",
    icon: "🛒",
    keywords: ["grocery", "supermarket", "walmart", "costco", "loblaws", "sobeys", "metro", "food basics"],
    mccCodes: [5411, 5422, 5441, 5451],
  },
  {
    id: "medical",
    name: "Medical",
    icon: "🏥",
    keywords: ["medical", "doctor", "clinic", "hospital", "pharmacy", "prescription", "health"],
    mccCodes: [5912, 5975, 5976, 8011, 8021, 8031, 8041, 8042, 8043, 8049, 8050, 8062, 8071],
  },
  {
    id: "investment",
    name: "Investment",
    icon: "💹",
    keywords: ["investment", "stock", "bond", "mutual fund", "etf", "securities"],
  },
  {
    id: "house",
    name: "House",
    icon: "🏠",
    keywords: ["mortgage", "property tax", "home insurance", "house"],
  },
  {
    id: "spotify",
    name: "Spotify",
    icon: "🎵",
    keywords: ["spotify"],
  },
  {
    id: "shopping",
    name: "Shopping",
    icon: "🛍️",
    keywords: ["amazon", "shopping", "retail", "store", "online"],
    mccCodes: [5309, 5310, 5311, 5331, 5399, 5611, 5621, 5631, 5641, 5651, 5661, 5691, 5697, 5698, 5699],
  },
  {
    id: "phone",
    name: "Phone",
    icon: "📞",
    keywords: ["phone"],
  },
  {
    id: "car_wash",
    name: "Car wash",
    icon: "🚿",
    keywords: ["car wash", "wash", "detailing"],
    mccCodes: [7542],
  },
  {
    id: "haircut",
    name: "Haircut",
    icon: "💇",
    keywords: ["haircut", "barber", "salon", "hair"],
    mccCodes: [7230, 7298],
  },
  {
    id: "lumin",
    name: "Lumin",
    icon: "✨",
    keywords: ["lumin"],
  },
  {
    id: "income",
    name: "Income",
    icon: "💰",
    keywords: ["income", "revenue", "payment received", "deposit", "earnings"],
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
