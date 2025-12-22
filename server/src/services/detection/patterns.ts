/**
 * Pattern Library for Sensitive Data Detection
 * Contains regex patterns and metadata for detecting various types of sensitive information
 */

export enum RuleType {
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  CREDIT_CARD = 'CREDIT_CARD',
  SSN = 'SSN',
  API_KEY = 'API_KEY',
  IP_ADDRESS = 'IP_ADDRESS',
  CUSTOM_REGEX = 'CUSTOM_REGEX',
  PII = 'PII',
  CODE_SECRET = 'CODE_SECRET',
}

export interface PatternMetadata {
  type: RuleType;
  pattern: RegExp;
  description: string;
  confidence: number; // 0-100
  examples: string[];
}

/**
 * Email Pattern
 * Matches standard email addresses
 */
export const EMAIL_PATTERN: PatternMetadata = {
  type: RuleType.EMAIL,
  pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  description: 'Email addresses',
  confidence: 95,
  examples: ['user@example.com', 'john.doe+tag@company.co.uk'],
};

/**
 * Phone Patterns
 * Matches various phone number formats (US, International)
 */
export const PHONE_PATTERNS: PatternMetadata[] = [
  {
    type: RuleType.PHONE,
    pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
    description: 'US Phone numbers (XXX-XXX-XXXX)',
    confidence: 90,
    examples: ['555-123-4567', '555.123.4567', '5551234567'],
  },
  {
    type: RuleType.PHONE,
    pattern: /\b\(\d{3}\)\s?\d{3}[-.]?\d{4}\b/g,
    description: 'US Phone numbers with parentheses',
    confidence: 90,
    examples: ['(555) 123-4567', '(555)123-4567'],
  },
  {
    type: RuleType.PHONE,
    pattern: /\+\d{1,3}\s?\d{1,4}\s?\d{1,4}\s?\d{1,9}/g,
    description: 'International phone numbers',
    confidence: 85,
    examples: ['+1 555 123 4567', '+44 20 7123 4567'],
  },
];

/**
 * Credit Card Patterns
 * Matches Visa, MasterCard, American Express, Discover
 */
export const CREDIT_CARD_PATTERNS: PatternMetadata[] = [
  {
    type: RuleType.CREDIT_CARD,
    pattern: /\b4\d{3}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    description: 'Visa card numbers',
    confidence: 95,
    examples: ['4111 1111 1111 1111', '4111-1111-1111-1111'],
  },
  {
    type: RuleType.CREDIT_CARD,
    pattern: /\b5[1-5]\d{2}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    description: 'MasterCard numbers',
    confidence: 95,
    examples: ['5500 0000 0000 0004', '5500-0000-0000-0004'],
  },
  {
    type: RuleType.CREDIT_CARD,
    pattern: /\b3[47]\d{2}[\s-]?\d{6}[\s-]?\d{5}\b/g,
    description: 'American Express numbers',
    confidence: 95,
    examples: ['3400 000000 00009', '3400-000000-00009'],
  },
  {
    type: RuleType.CREDIT_CARD,
    pattern: /\b6(?:011|5\d{2})[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    description: 'Discover card numbers',
    confidence: 95,
    examples: ['6011 0000 0000 0004', '6011-0000-0000-0004'],
  },
];

/**
 * SSN Pattern
 * Matches US Social Security Numbers
 */
export const SSN_PATTERN: PatternMetadata = {
  type: RuleType.SSN,
  pattern: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g,
  description: 'US Social Security Numbers',
  confidence: 95,
  examples: ['123-45-6789', '123 45 6789', '123456789'],
};

/**
 * API Key Patterns
 * Matches common API key formats from various providers
 */
export const API_KEY_PATTERNS: PatternMetadata[] = [
  {
    type: RuleType.API_KEY,
    pattern: /sk-[A-Za-z0-9]{48}/g,
    description: 'OpenAI API Keys',
    confidence: 98,
    examples: ['sk-proj-abcdefghijklmnopqrstuvwxyz123456789012345678'],
  },
  {
    type: RuleType.API_KEY,
    pattern: /AKIA[0-9A-Z]{16}/g,
    description: 'AWS Access Key IDs',
    confidence: 98,
    examples: ['AKIAIOSFODNN7EXAMPLE'],
  },
  {
    type: RuleType.API_KEY,
    pattern: /ghp_[A-Za-z0-9]{36}/g,
    description: 'GitHub Personal Access Tokens',
    confidence: 98,
    examples: ['ghp_abcdefghijklmnopqrstuvwxyz123456789012'],
  },
  {
    type: RuleType.API_KEY,
    pattern: /AIza[0-9A-Za-z-_]{35}/g,
    description: 'Google API Keys',
    confidence: 98,
    examples: ['AIzaSyDaGmWKa4JsXZ-HjGw7ISLn_3namBGewQe'],
  },
  {
    type: RuleType.API_KEY,
    pattern: /sk-ant-api03-[A-Za-z0-9-_]{95}/g,
    description: 'Anthropic API Keys',
    confidence: 98,
    examples: ['sk-ant-api03-abcdefghijklmnopqrstuvwxyz123456789012345678901234567890123456789012345678901234567890'],
  },
];

/**
 * IP Address Patterns
 * Matches IPv4 and IPv6 addresses
 */
export const IP_ADDRESS_PATTERNS: PatternMetadata[] = [
  {
    type: RuleType.IP_ADDRESS,
    pattern: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
    description: 'IPv4 addresses',
    confidence: 90,
    examples: ['192.168.1.1', '10.0.0.1', '8.8.8.8'],
  },
  {
    type: RuleType.IP_ADDRESS,
    pattern: /\b(?:[A-F0-9]{1,4}:){7}[A-F0-9]{1,4}\b/gi,
    description: 'IPv6 addresses',
    confidence: 90,
    examples: ['2001:0db8:85a3:0000:0000:8a2e:0370:7334'],
  },
];

/**
 * Pattern Map
 * Maps RuleType to its patterns for easy lookup
 */
export const PATTERN_MAP: Record<RuleType, PatternMetadata[]> = {
  [RuleType.EMAIL]: [EMAIL_PATTERN],
  [RuleType.PHONE]: PHONE_PATTERNS,
  [RuleType.CREDIT_CARD]: CREDIT_CARD_PATTERNS,
  [RuleType.SSN]: [SSN_PATTERN],
  [RuleType.API_KEY]: API_KEY_PATTERNS,
  [RuleType.IP_ADDRESS]: IP_ADDRESS_PATTERNS,
  [RuleType.CUSTOM_REGEX]: [], // Custom patterns are user-defined
  [RuleType.PII]: [], // PII patterns can be combination of other types
  [RuleType.CODE_SECRET]: [], // Code secrets patterns
};

/**
 * Get all patterns for a specific type
 */
export function getPatternsForType(type: RuleType): PatternMetadata[] {
  return PATTERN_MAP[type] || [];
}

/**
 * Get all available patterns
 */
export function getAllPatterns(): PatternMetadata[] {
  return Object.values(PATTERN_MAP).flat();
}
