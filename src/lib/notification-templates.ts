// src/lib/notification-templates.ts
/**
 * Notification template system
 * Provides reusable notification templates with dynamic data interpolation
 */

export interface NotificationTemplate {
  type: string;
  category: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  message: string;
  link?: string;
  expiresAfter?: number; // milliseconds
}

export interface TemplateData {
  [key: string]: string | number | Date;
}

// Notification templates
const templates: Record<string, NotificationTemplate> = {
  // Sales notifications
  SALE_CREATED: {
    type: "SALE",
    category: "SALES",
    priority: "NORMAL",
    message: "New sale created: Invoice #{{invoiceNo}} for {{partyName}} - {{amount}}",
    link: "/sales/{{saleId}}",
  },
  SALE_PAYMENT_RECEIVED: {
    type: "PAYMENT",
    category: "SALES",
    priority: "HIGH",
    message: "Payment received: {{amount}} from {{partyName}} for Invoice #{{invoiceNo}}",
    link: "/sales/{{saleId}}",
  },
  SALE_OVERDUE: {
    type: "REMINDER",
    category: "SALES",
    priority: "URGENT",
    message: "Invoice #{{invoiceNo}} is overdue! {{partyName}} owes {{amount}}",
    link: "/sales/{{saleId}}",
    expiresAfter: 7 * 24 * 60 * 60 * 1000, // 7 days
  },

  // Purchase notifications
  PURCHASE_CREATED: {
    type: "PURCHASE",
    category: "PURCHASE",
    priority: "NORMAL",
    message: "New purchase created: Bill #{{billNo}} from {{partyName}} - {{amount}}",
    link: "/purchases/{{purchaseId}}",
  },
  PURCHASE_PAYMENT_DUE: {
    type: "REMINDER",
    category: "PURCHASE",
    priority: "HIGH",
    message: "Payment due: {{amount}} to {{partyName}} for Bill #{{billNo}}",
    link: "/purchases/{{purchaseId}}",
    expiresAfter: 7 * 24 * 60 * 60 * 1000,
  },

  // Party notifications
  PARTY_CREDIT_LIMIT_REACHED: {
    type: "REMINDER",
    category: "PAYMENT",
    priority: "HIGH",
    message: "{{partyName}} has reached credit limit: {{balance}}",
    link: "/parties/{{partyId}}",
  },
  PARTY_PAYMENT_OVERDUE: {
    type: "REMINDER",
    category: "PAYMENT",
    priority: "URGENT",
    message: "{{partyName}} has overdue payment: {{amount}}",
    link: "/parties/{{partyId}}",
  },

  // Inventory notifications
  LOW_STOCK_ALERT: {
    type: "REMINDER",
    category: "SYSTEM",
    priority: "HIGH",
    message: "Low stock alert: {{itemName}} ({{currentStock}} remaining)",
    link: "/inventory",
  },
  OUT_OF_STOCK: {
    type: "REMINDER",
    category: "SYSTEM",
    priority: "URGENT",
    message: "{{itemName}} is out of stock!",
    link: "/inventory",
  },

  // System notifications
  SYSTEM_MAINTENANCE: {
    type: "SYSTEM",
    category: "SYSTEM",
    priority: "NORMAL",
    message: "System maintenance scheduled: {{scheduledTime}}",
    link: "/settings",
  },
  FEATURE_UPDATE: {
    type: "SYSTEM",
    category: "SYSTEM",
    priority: "LOW",
    message: "New feature available: {{featureName}}",
    link: "/settings/feature-settings",
  },

  // Expense notifications
  EXPENSE_CREATED: {
    type: "EXPENSE",
    category: "GENERAL",
    priority: "NORMAL",
    message: "New expense recorded: {{category}} - {{amount}}",
    link: "/expense",
  },
  EXPENSE_LIMIT_EXCEEDED: {
    type: "REMINDER",
    category: "GENERAL",
    priority: "HIGH",
    message: "Expense limit exceeded for {{category}}: {{total}} / {{limit}}",
    link: "/expense",
  },

  // Income notifications
  INCOME_RECEIVED: {
    type: "INCOME",
    category: "GENERAL",
    priority: "NORMAL",
    message: "Income received: {{category}} - {{amount}}",
    link: "/income",
  },
};

/**
 * Interpolate template variables with actual data
 */
export function interpolateTemplate(template: string, data: TemplateData): string {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`{{${key}}}`, "g");
    result = result.replace(regex, String(value));
  }
  return result;
}

/**
 * Get a notification template by key
 */
export function getTemplate(key: string): NotificationTemplate | null {
  return templates[key] || null;
}

/**
 * Render a notification template with data
 */
export function renderTemplate(
  key: string,
  data: TemplateData
): Omit<NotificationTemplate, "expiresAfter"> & { expiresAt?: Date } | null {
  const template = getTemplate(key);
  if (!template) return null;

  const message = interpolateTemplate(template.message, data);
  const link = template.link ? interpolateTemplate(template.link, data) : undefined;
  const expiresAt = template.expiresAfter ? new Date(Date.now() + template.expiresAfter) : undefined;

  return {
    type: template.type,
    category: template.category,
    priority: template.priority,
    message,
    link,
    expiresAt,
  };
}

/**
 * Get all available template keys
 */
export function getTemplateKeys(): string[] {
  return Object.keys(templates);
}
