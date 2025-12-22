/**
 * Detector Service
 * Detects sensitive data in text using regex patterns
 */

import {
  RuleType,
  PatternMetadata,
  PATTERN_MAP,
  getPatternsForType,
  getAllPatterns,
} from './patterns';

export interface DetectedItem {
  type: RuleType;
  value: string;
  startIndex: number;
  endIndex: number;
  confidence: number;
  description: string;
}

export class DetectorService {
  /**
   * Main detection method
   * Detects all sensitive data in the provided text
   */
  detect(text: string, ruleTypes?: RuleType[]): DetectedItem[] {
    if (!text || text.trim().length === 0) {
      return [];
    }

    const detectedItems: DetectedItem[] = [];
    const typesToCheck = ruleTypes || Object.keys(PATTERN_MAP) as RuleType[];

    // Check each rule type
    for (const type of typesToCheck) {
      if (type === RuleType.CUSTOM_REGEX || type === RuleType.PII || type === RuleType.CODE_SECRET) continue; // Custom patterns handled separately

      const patterns = getPatternsForType(type);
      
      for (const pattern of patterns) {
        const items = this.detectPattern(text, pattern);
        detectedItems.push(...items);
      }
    }

    // Sort by start index
    return detectedItems.sort((a, b) => a.startIndex - b.startIndex);
  }

  /**
   * Detect using a specific pattern
   */
  private detectPattern(text: string, patternMeta: PatternMetadata): DetectedItem[] {
    const detectedItems: DetectedItem[] = [];
    
    // Reset regex lastIndex to avoid issues with global flag
    const regex = new RegExp(patternMeta.pattern.source, patternMeta.pattern.flags);
    let match;

    while ((match = regex.exec(text)) !== null) {
      detectedItems.push({
        type: patternMeta.type,
        value: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        confidence: patternMeta.confidence,
        description: patternMeta.description,
      });
    }

    return detectedItems;
  }

  /**
   * Detect emails specifically
   */
  detectEmail(text: string): DetectedItem[] {
    return this.detect(text, [RuleType.EMAIL]);
  }

  /**
   * Detect phone numbers specifically
   */
  detectPhone(text: string): DetectedItem[] {
    return this.detect(text, [RuleType.PHONE]);
  }

  /**
   * Detect credit cards specifically
   */
  detectCreditCard(text: string): DetectedItem[] {
    const detected = this.detect(text, [RuleType.CREDIT_CARD]);
    
    // Additional validation: Luhn algorithm check
    return detected.filter(item => this.validateCreditCard(item.value));
  }

  /**
   * Validate credit card using Luhn algorithm
   */
  private validateCreditCard(cardNumber: string): boolean {
    // Remove spaces and dashes
    const cleaned = cardNumber.replace(/[\s-]/g, '');
    
    if (!/^\d+$/.test(cleaned)) {
      return false;
    }

    let sum = 0;
    let isEven = false;

    // Loop through values starting from the rightmost
    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned.charAt(i), 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  /**
   * Detect SSN specifically
   */
  detectSSN(text: string): DetectedItem[] {
    return this.detect(text, [RuleType.SSN]);
  }

  /**
   * Detect API keys specifically
   */
  detectApiKey(text: string): DetectedItem[] {
    return this.detect(text, [RuleType.API_KEY]);
  }

  /**
   * Detect IP addresses specifically
   */
  detectIpAddress(text: string): DetectedItem[] {
    return this.detect(text, [RuleType.IP_ADDRESS]);
  }

  /**
   * Detect using a custom pattern
   */
  detectCustomPattern(text: string, pattern: string, description: string = 'Custom pattern'): DetectedItem[] {
    try {
      const regex = new RegExp(pattern, 'g');
      const detectedItems: DetectedItem[] = [];
      let match;

      while ((match = regex.exec(text)) !== null) {
        detectedItems.push({
          type: RuleType.CUSTOM_REGEX,
          value: match[0],
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          confidence: 80, // Lower confidence for custom patterns
          description,
        });
      }

      return detectedItems;
    } catch (error) {
      console.error('Invalid regex pattern:', pattern, error);
      return [];
    }
  }

  /**
   * Get detection statistics
   */
  getStatistics(detectedItems: DetectedItem[]): Record<RuleType, number> {
    const stats: Record<string, number> = {};

    for (const item of detectedItems) {
      stats[item.type] = (stats[item.type] || 0) + 1;
    }

    return stats as Record<RuleType, number>;
  }

  /**
   * Check if text contains any sensitive data
   */
  hasSensitiveData(text: string, ruleTypes?: RuleType[]): boolean {
    const detected = this.detect(text, ruleTypes);
    return detected.length > 0;
  }

  /**
   * Get unique detected types
   */
  getDetectedTypes(detectedItems: DetectedItem[]): RuleType[] {
    const types = new Set<RuleType>();
    detectedItems.forEach(item => types.add(item.type));
    return Array.from(types);
  }
}

// Export a singleton instance
export const detectorService = new DetectorService();
