/**
 * Rules Engine
 * Evaluates firewall rules and applies detection/sanitization accordingly
 */

import { prisma } from '../../db';
import { DetectorService, DetectedItem, detectorService } from './detector.service';
import { SanitizerService, Action, SanitizationResult, sanitizerService } from './sanitizer.service';
import { RuleType } from './patterns';

export interface RuleEvaluationResult {
  sanitizedText: string;
  originalText: string;
  detectedItems: DetectedItem[];
  appliedRules: AppliedRule[];
  blocked: boolean;
  warnings: string[];
  firewallId: string;
  timestamp: Date;
}

export interface AppliedRule {
  ruleId: string;
  ruleName: string;
  ruleType: RuleType;
  action: Action;
  matchCount: number;
}

export class RulesEngine {
  private detector: DetectorService;
  private sanitizer: SanitizerService;
  private ruleCache: Map<string, any>; // Cache for firewall rules
  private cacheTTL: number = 5 * 60 * 1000; // 5 minutes
  private cacheTimestamps: Map<string, number>;

  constructor() {
    this.detector = detectorService;
    this.sanitizer = sanitizerService;
    this.ruleCache = new Map();
    this.cacheTimestamps = new Map();
  }

  /**
   * Main method to evaluate rules for a firewall
   */
  async evaluateRules(
    text: string,
    firewallId: string,
    userId?: string
  ): Promise<RuleEvaluationResult> {
    // Fetch firewall and its rules
    const firewall = await this.getFirewallWithRules(firewallId);

    if (!firewall) {
      throw new Error(`Firewall not found: ${firewallId}`);
    }

    if (!firewall.isActive) {
      return this.createPassThroughResult(text, firewallId);
    }

    // Get active rules sorted by priority (highest first)
    const activeRules = firewall.rules
      .filter((rule: any) => rule.isActive)
      .sort((a: any, b: any) => b.priority - a.priority);

    if (activeRules.length === 0) {
      return this.createPassThroughResult(text, firewallId);
    }

    // Detect all sensitive data
    const allDetectedItems: DetectedItem[] = [];
    const appliedRules: AppliedRule[] = [];
    const ruleActions = new Map<RuleType, Action>();

    for (const rule of activeRules) {
      let detectedItems: DetectedItem[] = [];

      // Detect based on rule type
      if (rule.type === 'CUSTOM_REGEX') {
        detectedItems = this.detector.detectCustomPattern(
          text,
          rule.pattern,
          rule.name
        );
      } else {
        detectedItems = this.detector.detect(text, [rule.type as RuleType]);
      }

      if (detectedItems.length > 0) {
        allDetectedItems.push(...detectedItems);
        
        appliedRules.push({
          ruleId: rule.id,
          ruleName: rule.name,
          ruleType: rule.type as RuleType,
          action: rule.action as Action,
          matchCount: detectedItems.length,
        });

        // Store the action for this rule type
        // Higher priority rules override lower ones
        if (!ruleActions.has(rule.type as RuleType)) {
          ruleActions.set(rule.type as RuleType, rule.action as Action);
        }
      }
    }

    // Remove duplicates based on startIndex and endIndex
    const uniqueDetectedItems = this.removeDuplicates(allDetectedItems);

    // Apply sanitization with rule-specific actions
    const sanitizationResult = this.sanitizer.sanitizeWithRules(
      text,
      uniqueDetectedItems,
      ruleActions
    );

    // Create audit log if userId is provided
    if (userId) {
      await this.createAuditLog(
        userId,
        firewallId,
        text,
        sanitizationResult,
        uniqueDetectedItems,
        appliedRules
      );
    }

    return {
      sanitizedText: sanitizationResult.sanitizedText,
      originalText: text,
      detectedItems: uniqueDetectedItems,
      appliedRules,
      blocked: sanitizationResult.blocked,
      warnings: sanitizationResult.warnings,
      firewallId,
      timestamp: new Date(),
    };
  }

  /**
   * Fetch firewall with rules (with caching)
   */
  private async getFirewallWithRules(firewallId: string): Promise<any> {
    const now = Date.now();
    const cachedTime = this.cacheTimestamps.get(firewallId);

    // Check cache validity
    if (cachedTime && now - cachedTime < this.cacheTTL) {
      const cached = this.ruleCache.get(firewallId);
      if (cached) {
        return cached;
      }
    }

    // Fetch from database
    const firewall = await prisma.firewall.findUnique({
      where: { id: firewallId },
      include: {
        rules: true,
      },
    });

    // Update cache
    if (firewall) {
      this.ruleCache.set(firewallId, firewall);
      this.cacheTimestamps.set(firewallId, now);
    }

    return firewall;
  }

  /**
   * Clear cache for a specific firewall
   */
  clearCache(firewallId: string): void {
    this.ruleCache.delete(firewallId);
    this.cacheTimestamps.delete(firewallId);
  }

  /**
   * Clear all cache
   */
  clearAllCache(): void {
    this.ruleCache.clear();
    this.cacheTimestamps.clear();
  }

  /**
   * Remove duplicate detected items
   */
  private removeDuplicates(items: DetectedItem[]): DetectedItem[] {
    const seen = new Set<string>();
    return items.filter((item) => {
      const key = `${item.startIndex}-${item.endIndex}-${item.type}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Create pass-through result (no rules applied)
   */
  private createPassThroughResult(
    text: string,
    firewallId: string
  ): RuleEvaluationResult {
    return {
      sanitizedText: text,
      originalText: text,
      detectedItems: [],
      appliedRules: [],
      blocked: false,
      warnings: [],
      firewallId,
      timestamp: new Date(),
    };
  }

  /**
   * Create audit log entry
   */
  private async createAuditLog(
    userId: string,
    firewallId: string,
    inputText: string,
    sanitizationResult: SanitizationResult,
    detectedItems: DetectedItem[],
    appliedRules: AppliedRule[]
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          firewallId,
          inputText,
          sanitizedText: sanitizationResult.sanitizedText,
          detectedIssues: JSON.parse(JSON.stringify(detectedItems)),
          action: sanitizationResult.blocked
            ? 'BLOCKED'
            : detectedItems.length > 0
            ? 'REDACTED'
            : 'ALLOWED',
          metadata: JSON.parse(JSON.stringify({
            appliedRules,
            warnings: sanitizationResult.warnings,
            detectionCount: detectedItems.length,
          })),
        },
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw - audit log failure shouldn't block the main flow
    }
  }

  /**
   * Test a rule against sample text
   */
  async testRule(
    ruleId: string,
    sampleText: string
  ): Promise<{
    detected: DetectedItem[];
    sanitized: string;
    action: Action;
  }> {
    const rule = await prisma.rule.findUnique({
      where: { id: ruleId },
    });

    if (!rule) {
      throw new Error(`Rule not found: ${ruleId}`);
    }

    let detectedItems: DetectedItem[] = [];

    if (rule.type === 'CUSTOM_REGEX') {
      detectedItems = this.detector.detectCustomPattern(
        sampleText,
        rule.pattern,
        rule.name
      );
    } else {
      detectedItems = this.detector.detect(sampleText, [rule.type as RuleType]);
    }

    const sanitizationResult = this.sanitizer.sanitize(
      sampleText,
      detectedItems,
      rule.action as Action
    );

    return {
      detected: detectedItems,
      sanitized: sanitizationResult.sanitizedText,
      action: rule.action as Action,
    };
  }

  /**
   * Get statistics for a firewall
   */
  async getFirewallStatistics(
    firewallId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalRequests: number;
    blockedRequests: number;
    redactedRequests: number;
    allowedRequests: number;
    detectionsByType: Record<string, number>;
  }> {
    const where: any = { firewallId };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const logs = await prisma.auditLog.findMany({
      where,
      select: {
        action: true,
        detectedIssues: true,
      },
    });

    const stats = {
      totalRequests: logs.length,
      blockedRequests: 0,
      redactedRequests: 0,
      allowedRequests: 0,
      detectionsByType: {} as Record<string, number>,
    };

    for (const log of logs) {
      switch (log.action) {
        case 'BLOCKED':
          stats.blockedRequests++;
          break;
        case 'REDACTED':
          stats.redactedRequests++;
          break;
        case 'ALLOWED':
          stats.allowedRequests++;
          break;
      }

      // Count detections by type
      const detectedItems = log.detectedIssues as any[];
      if (Array.isArray(detectedItems)) {
        for (const item of detectedItems) {
          const type = item.type || 'UNKNOWN';
          stats.detectionsByType[type] = (stats.detectionsByType[type] || 0) + 1;
        }
      }
    }

    return stats;
  }
}

// Export a singleton instance
export const rulesEngine = new RulesEngine();
