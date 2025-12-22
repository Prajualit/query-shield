/**
 * Sanitizer Service
 * Sanitizes sensitive data based on detection results and specified actions
 */

import { DetectedItem } from './detector.service';
import { RuleType } from './patterns';

export enum Action {
  REDACT = 'REDACT',
  MASK = 'MASK',
  BLOCK = 'BLOCK',
  WARN = 'WARN',
  ALLOW = 'ALLOW',
}

export interface SanitizationResult {
  sanitizedText: string;
  action: Action;
  detectedItems: DetectedItem[];
  originalLength: number;
  sanitizedLength: number;
  blocked: boolean;
  warnings: string[];
}

export class SanitizerService {
  /**
   * Main sanitization method
   * Applies the specified action to all detected items
   */
  sanitize(
    text: string,
    detectedItems: DetectedItem[],
    action: Action
  ): SanitizationResult {
    const warnings: string[] = [];
    let sanitizedText = text;
    let blocked = false;

    // Sort items by start index in reverse order to avoid index shifting
    const sortedItems = [...detectedItems].sort((a, b) => b.startIndex - a.startIndex);

    switch (action) {
      case Action.REDACT:
        sanitizedText = this.redactAll(text, sortedItems);
        break;

      case Action.MASK:
        sanitizedText = this.maskAll(text, sortedItems);
        break;

      case Action.BLOCK:
        blocked = true;
        warnings.push(
          `Blocked: Found ${detectedItems.length} sensitive data item(s)`
        );
        break;

      case Action.WARN:
        warnings.push(
          `Warning: Found ${detectedItems.length} sensitive data item(s) - allowing through`
        );
        break;

      case Action.ALLOW:
        // No action needed
        break;
    }

    return {
      sanitizedText: blocked ? '' : sanitizedText,
      action,
      detectedItems,
      originalLength: text.length,
      sanitizedLength: sanitizedText.length,
      blocked,
      warnings,
    };
  }

  /**
   * Redact a single item - replace with [REDACTED] or [REDACTED:TYPE]
   */
  private redact(text: string, item: DetectedItem, showType: boolean = true): string {
    const replacement = showType
      ? `[REDACTED:${item.type}]`
      : '[REDACTED]';

    return (
      text.substring(0, item.startIndex) +
      replacement +
      text.substring(item.endIndex)
    );
  }

  /**
   * Redact all detected items
   */
  private redactAll(text: string, sortedItems: DetectedItem[]): string {
    let result = text;

    for (const item of sortedItems) {
      result = this.redact(result, item);
    }

    return result;
  }

  /**
   * Mask a single item - show first/last characters
   */
  private mask(text: string, item: DetectedItem): string {
    const value = item.value;
    let masked: string;

    switch (item.type) {
      case RuleType.EMAIL:
        masked = this.maskEmail(value);
        break;

      case RuleType.PHONE:
        masked = this.maskPhone(value);
        break;

      case RuleType.CREDIT_CARD:
        masked = this.maskCreditCard(value);
        break;

      case RuleType.SSN:
        masked = this.maskSSN(value);
        break;

      case RuleType.API_KEY:
        masked = this.maskApiKey(value);
        break;

      case RuleType.IP_ADDRESS:
        masked = this.maskIpAddress(value);
        break;

      case RuleType.CUSTOM_REGEX:
      case RuleType.PII:
      case RuleType.CODE_SECRET:
        masked = this.maskGeneric(value);
        break;

      default:
        masked = this.maskGeneric(value);
    }

    return (
      text.substring(0, item.startIndex) +
      masked +
      text.substring(item.endIndex)
    );
  }

  /**
   * Mask all detected items
   */
  private maskAll(text: string, sortedItems: DetectedItem[]): string {
    let result = text;

    for (const item of sortedItems) {
      result = this.mask(result, item);
    }

    return result;
  }

  /**
   * Mask email: user@example.com -> u***@example.com
   */
  private maskEmail(email: string): string {
    const [username, domain] = email.split('@');
    if (!domain) return this.maskGeneric(email);

    const maskedUsername =
      username.length > 2
        ? username[0] + '*'.repeat(username.length - 1)
        : username[0] + '*';

    return `${maskedUsername}@${domain}`;
  }

  /**
   * Mask phone: 555-123-4567 -> ***-***-4567
   */
  private maskPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 4) return '*'.repeat(phone.length);

    const lastFour = digits.slice(-4);
    const format = phone.replace(/\d/g, '*');
    
    // Replace last 4 asterisks with actual digits
    return format.replace(/\*{4}$/, lastFour);
  }

  /**
   * Mask credit card: 4111-1111-1111-1111 -> ****-****-****-1111
   */
  private maskCreditCard(card: string): string {
    const digits = card.replace(/\D/g, '');
    if (digits.length < 4) return '*'.repeat(card.length);

    const lastFour = digits.slice(-4);
    return '*'.repeat(card.length - 4) + lastFour;
  }

  /**
   * Mask SSN: 123-45-6789 -> ***-**-6789
   */
  private maskSSN(ssn: string): string {
    const digits = ssn.replace(/\D/g, '');
    if (digits.length < 4) return '*'.repeat(ssn.length);

    const lastFour = digits.slice(-4);
    const prefix = ssn.substring(0, ssn.length - 4).replace(/\d/g, '*');
    
    return prefix + lastFour;
  }

  /**
   * Mask API key: sk-abc123def456 -> sk-***456
   */
  private maskApiKey(key: string): string {
    if (key.length <= 10) {
      return key.substring(0, 3) + '*'.repeat(key.length - 3);
    }

    const prefix = key.substring(0, 3);
    const suffix = key.slice(-3);
    return prefix + '*'.repeat(key.length - 6) + suffix;
  }

  /**
   * Mask IP address: 192.168.1.100 -> ***.***.***.100
   */
  private maskIpAddress(ip: string): string {
    const parts = ip.split('.');
    if (parts.length !== 4) return this.maskGeneric(ip);

    return '***.***.***.' + parts[3];
  }

  /**
   * Generic masking: show first and last character
   */
  private maskGeneric(value: string): string {
    if (value.length <= 2) {
      return '*'.repeat(value.length);
    }

    return value[0] + '*'.repeat(value.length - 2) + value[value.length - 1];
  }

  /**
   * Sanitize with different actions per rule type
   */
  sanitizeWithRules(
    text: string,
    detectedItems: DetectedItem[],
    ruleActions: Map<RuleType, Action>
  ): SanitizationResult {
    const warnings: string[] = [];
    let sanitizedText = text;
    let blocked = false;

    // Group items by type
    const itemsByType = new Map<RuleType, DetectedItem[]>();
    for (const item of detectedItems) {
      if (!itemsByType.has(item.type)) {
        itemsByType.set(item.type, []);
      }
      itemsByType.get(item.type)!.push(item);
    }

    // Check for BLOCK actions first
    for (const [type, items] of itemsByType) {
      const action = ruleActions.get(type) || Action.WARN;
      if (action === Action.BLOCK) {
        blocked = true;
        warnings.push(
          `Blocked: Found ${items.length} ${type} item(s)`
        );
      }
    }

    if (blocked) {
      return {
        sanitizedText: '',
        action: Action.BLOCK,
        detectedItems,
        originalLength: text.length,
        sanitizedLength: 0,
        blocked: true,
        warnings,
      };
    }

    // Apply other actions
    // Sort all items by start index in reverse
    const sortedItems = [...detectedItems].sort((a, b) => b.startIndex - a.startIndex);

    for (const item of sortedItems) {
      const action = ruleActions.get(item.type) || Action.WARN;

      switch (action) {
        case Action.REDACT:
          sanitizedText = this.redact(sanitizedText, item);
          break;

        case Action.MASK:
          sanitizedText = this.mask(sanitizedText, item);
          break;

        case Action.WARN:
          warnings.push(`Warning: ${item.type} detected - allowing through`);
          break;

        case Action.ALLOW:
          // Do nothing
          break;
      }
    }

    return {
      sanitizedText,
      action: Action.WARN, // Mixed actions
      detectedItems,
      originalLength: text.length,
      sanitizedLength: sanitizedText.length,
      blocked: false,
      warnings,
    };
  }
}

// Export a singleton instance
export const sanitizerService = new SanitizerService();
