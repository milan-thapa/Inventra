// src/lib/constants.ts

// ── Business Categories ───────────────────────────────────
export const BUSINESS_CATEGORIES = [
  { value: "information_technology", label: "Information Technology", emoji: "💻" },
  { value: "garage", label: "Garage", emoji: "🚗" },
  { value: "poultry", label: "Poultry", emoji: "🐔" },
  { value: "tailoring", label: "Tailoring", emoji: "🧵" },
  { value: "gifts_toys", label: "Gifts & Toys", emoji: "🎁" },
  { value: "pooja_bhandar", label: "Pooja Bhandar", emoji: "🪔" },
  { value: "kawadi_scrap", label: "Kawadi / Scrap", emoji: "♻️" },
  { value: "kirana_pasal", label: "Kirana Pasal", emoji: "🏪" },
  { value: "pharmacy", label: "Pharmacy", emoji: "💊" },
  { value: "bakery", label: "Bakery", emoji: "🍞" },
  { value: "hardware", label: "Hardware", emoji: "🔧" },
  { value: "electronics", label: "Electronics", emoji: "📱" },
  { value: "furniture", label: "Furniture", emoji: "🪑" },
  { value: "stationary", label: "Stationary", emoji: "📚" },
  { value: "travel_agency", label: "Travel Agency", emoji: "✈️" },
  { value: "salon", label: "Salon", emoji: "💇" },
  { value: "clinic", label: "Clinic", emoji: "🏥" },
  { value: "restaurant", label: "Restaurant", emoji: "🍽️" },
  { value: "wholesale", label: "Wholesale", emoji: "📦" },
  { value: "retail", label: "Retail", emoji: "🛍️" },
  { value: "other", label: "Other", emoji: "🏢" },
] as const;

// ── Default Expense Categories ────────────────────────────
export const DEFAULT_EXPENSE_CATEGORIES = [
  "General", "Entertainment", "Health", "Fuel", "Food",
  "Recharge", "Shopping", "Travel", "Education", "Clothing",
  "Utilities", "Rent", "Maintenance", "Transportation", "Other",
];

// ── Default Income Categories ─────────────────────────────
export const DEFAULT_INCOME_CATEGORIES = [
  "Investment", "Salary", "Business Revenue", "Freelance",
  "Rental Income", "Interest", "Dividend", "Gift", "Other",
];

// ── Default Item Categories ───────────────────────────────
export const DEFAULT_ITEM_CATEGORIES = [
  "Electronics", "Groceries", "Clothing", "Home & Kitchen",
  "Stationery", "Sports", "Toys", "Books", "Beauty",
  "Automotive", "Health", "Other",
];

// ── Payment Methods ───────────────────────────────────────
export const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "BANK", label: "Bank" },
] as const;

// ── Party Filter Options ──────────────────────────────────
export const PARTY_FILTERS = [
  { value: "ALL", label: "All Payment" },
  { value: "TO_RECEIVE", label: "To Receive" },
  { value: "TO_GIVE", label: "To Give" },
  { value: "SETTLED", label: "Settled" },
] as const;

// ── Theme Options ─────────────────────────────────────────
export const THEMES = [
  { value: "light", label: "Light Theme" },
  { value: "dark", label: "Dark Theme" },
  { value: "classic", label: "Classic Theme" },
  { value: "system", label: "System Default" },
] as const;

// ── Language Options ──────────────────────────────────────
export const LANGUAGES = [
  { value: "en", label: "English", flag: "🇺🇸" },
  { value: "ne", label: "नेपाली", flag: "🇳🇵" },
] as const;

// ── Calendar Types ────────────────────────────────────────
export const CALENDAR_TYPES = [
  { value: "AD", label: "AD (Gregorian)" },
  { value: "BS", label: "BS (Bikram Sambat)" },
] as const;

// ── Currency Options ──────────────────────────────────────
export const CURRENCIES = [
  { value: "Rs.", label: "Rs. — Nepali Rupee", symbol: "Rs." },
  { value: "₹", label: "₹ — Indian Rupee", symbol: "₹" },
] as const;

// ── Number Formats ────────────────────────────────────────
export const NUMBER_FORMATS = [
  { value: "indian", label: "1,00,000 (Indian)" },
  { value: "international", label: "1,000,000 (International)" },
] as const;

// ── Reminder Types ────────────────────────────────────────
export const REMINDER_TYPES = [
  { value: "TASK", label: "Task Reminder" },
  { value: "PAYMENT", label: "Payment Reminder" },
] as const;

// ── Report Types ──────────────────────────────────────────
export const REPORTS = [
  {
    id: "all-party",
    title: "All Party Report",
    description: "View total receivables and payables for all parties",
    href: "/reports/all-party",
    icon: "Users",
  },
  {
    id: "cash-in-hand",
    title: "Cash In Hand Statement",
    description: "Complete cash flow statement with opening and closing balance",
    href: "/reports/cash-in-hand-statement",
    icon: "Banknote",
  },
  {
    id: "expense-category",
    title: "Expense Category Report",
    description: "Expenses grouped by category with totals",
    href: "/reports/expense-category",
    icon: "TrendingDown",
  },
  {
    id: "income-category",
    title: "Income Category Report",
    description: "Incomes grouped by category with totals",
    href: "/reports/income-category",
    icon: "TrendingUp",
  },
  {
    id: "transactions",
    title: "Transaction Report",
    description: "All transactions in a date range",
    href: "/reports/transactions",
    icon: "Receipt",
  },
  {
    id: "party-statement",
    title: "Party Statement",
    description: "Detailed statement for a specific party",
    href: "/reports/party-statement",
    icon: "UserCheck",
  },
  {
    id: "inventory",
    title: "Inventory Report",
    description: "Complete inventory analysis with stock value, low stock items, and movements",
    href: "/reports/inventory",
    icon: "Package",
  },
] as const;

// ── Nav Items ─────────────────────────────────────────────
export const MAIN_NAV = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "Parties", href: "/parties", icon: "Users" },
  { label: "Expense", href: "/expense", icon: "Receipt" },
  { label: "Income", href: "/income", icon: "Wallet" },
  { label: "Manage Accounts", href: "/manage-account", icon: "Building2" },
  { label: "Reports", href: "/reports", icon: "BarChart3" },
] as const;

export const TOOLS_NAV = [
  { label: "Business Cards", href: "/business-tools/business-cards", icon: "CreditCard" },
  { label: "Greeting Cards", href: "/business-tools/greeting-cards", icon: "Gift" },
  { label: "Reminders", href: "/business-tools/reminders", icon: "Bell" },
  { label: "Bill Gallery", href: "/business-tools/bill-gallery", icon: "Image" },
  { label: "Notebook", href: "/business-tools/notebook", icon: "BookOpen" },
] as const;

export const SETTINGS_NAV = [
  { label: "General", href: "/settings/general", icon: "Settings" },
  { label: "My Account", href: "/settings/my-account", icon: "User" },
  { label: "Personal Profile", href: "/settings/personal-profile", icon: "Building" },
  { label: "Subscription", href: "/settings/subscription", icon: "CreditCard" },
] as const;

export const FEATURE_SETTINGS_NAV = [
  { label: "Parties", href: "/settings/feature-settings/parties", icon: "Users" },
  { label: "Transactions", href: "/settings/feature-settings/transactions", icon: "ArrowLeftRight" },
] as const;

// ── App Meta ──────────────────────────────────────────────
export const APP_NAME = "Inventra";
export const APP_TAGLINE = "Manage Your Business Anytime, Anywhere";
export const APP_DESCRIPTION =
  "Inventra is your digital business partner — manage accounting, inventory, parties, and more from any device.";

// ── Date Filter Options ───────────────────────────────────
export const DATE_FILTER_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "this_week", label: "This Week" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "this_year", label: "This Year" },
  { value: "custom", label: "Custom Range" },
] as const;

// ── Cashflow Chart Periods ────────────────────────────────
export const CASHFLOW_PERIODS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
] as const;
