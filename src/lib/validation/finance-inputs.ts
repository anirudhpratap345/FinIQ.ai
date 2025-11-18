/**
 * Validation utilities for FinIQ.ai inputs
 */

import type { StartupInputs, InputValidation, ValidationError, ValidationWarning } from '@/types/finance-copilot';

/**
 * Validate startup inputs before sending to AI
 */
export function validateStartupInputs(inputs: StartupInputs): InputValidation {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Required field validations
  if (!inputs.startupName || inputs.startupName.trim().length === 0) {
    errors.push({
      field: 'startupName',
      message: 'Startup name is required',
      code: 'REQUIRED_FIELD'
    });
  }

  if (!inputs.industry || inputs.industry.trim().length === 0) {
    errors.push({
      field: 'industry',
      message: 'Industry is required',
      code: 'REQUIRED_FIELD'
    });
  }

  if (!inputs.geography || inputs.geography.trim().length === 0) {
    errors.push({
      field: 'geography',
      message: 'Geography is required',
      code: 'REQUIRED_FIELD'
    });
  }

  if (!inputs.businessModel || inputs.businessModel.trim().length === 0) {
    errors.push({
      field: 'businessModel',
      message: 'Business model is required',
      code: 'REQUIRED_FIELD'
    });
  }

  if (!inputs.mainFinancialConcern || inputs.mainFinancialConcern.trim().length === 0) {
    errors.push({
      field: 'mainFinancialConcern',
      message: 'Main financial concern is required',
      code: 'REQUIRED_FIELD'
    });
  }

  if (!inputs.ideaDescription || inputs.ideaDescription.trim().length === 0) {
    errors.push({
      field: 'ideaDescription',
      message: 'Startup idea description is required',
      code: 'REQUIRED_FIELD'
    });
  }

  // Team size validation
  if (inputs.teamSize < 1) {
    errors.push({
      field: 'teamSize',
      message: 'Team size must be at least 1',
      code: 'INVALID_VALUE'
    });
  }

  if (inputs.teamSize > 1000) {
    warnings.push({
      field: 'teamSize',
      message: 'Team size seems unusually large for early-stage startup',
      suggestion: 'Verify team size is correct'
    });
  }

  // Revenue validation
  if (inputs.monthlyRevenue !== undefined) {
    if (inputs.monthlyRevenue < 0) {
      errors.push({
        field: 'monthlyRevenue',
        message: 'Monthly revenue cannot be negative',
        code: 'INVALID_VALUE'
      });
    }

    // Warning for high revenue but early product stage
    if (inputs.monthlyRevenue > 100000 && (inputs.productStage === 'Idea' || inputs.productStage === 'MVP')) {
      warnings.push({
        field: 'monthlyRevenue',
        message: 'High revenue for early product stage',
        suggestion: 'Consider updating product stage to match revenue level'
      });
    }

    // Warning for no revenue in Growth stage
    if (inputs.productStage === 'Growth' && (!inputs.monthlyRevenue || inputs.monthlyRevenue === 0)) {
      warnings.push({
        field: 'productStage',
        message: 'Growth stage typically has revenue',
        suggestion: 'Add monthly revenue or update product stage'
      });
    }
  }

  // Funding goal validation
  if (inputs.fundingGoal !== undefined) {
    if (inputs.fundingGoal < 0) {
      errors.push({
        field: 'fundingGoal',
        message: 'Funding goal cannot be negative',
        code: 'INVALID_VALUE'
      });
    }

    if (inputs.fundingGoal > 0 && inputs.fundingGoal < 10000) {
      warnings.push({
        field: 'fundingGoal',
        message: 'Funding goal seems very low',
        suggestion: 'Consider if this is enough to achieve your goals'
      });
    }

    // Warning for unrealistic goals
    if (inputs.productStage === 'Idea' && inputs.fundingGoal && inputs.fundingGoal > 5000000) {
      warnings.push({
        field: 'fundingGoal',
        message: 'Large funding goal for idea stage',
        suggestion: 'Most idea-stage startups raise $50K-$500K'
      });
    }
  }

  // Length validations
  if (inputs.startupName.length > 100) {
    warnings.push({
      field: 'startupName',
      message: 'Startup name is very long',
      suggestion: 'Consider using a shorter name'
    });
  }

  if (inputs.mainFinancialConcern.length < 10) {
    warnings.push({
      field: 'mainFinancialConcern',
      message: 'Financial concern description is very short',
      suggestion: 'Provide more detail for better recommendations'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Sanitize and normalize inputs
 */
export function sanitizeStartupInputs(inputs: StartupInputs): StartupInputs {
  return {
    ...inputs,
    startupName: inputs.startupName.trim(),
    industry: inputs.industry.trim(),
    geography: inputs.geography.trim(),
    businessModel: inputs.businessModel.trim(),
    mainFinancialConcern: inputs.mainFinancialConcern.trim(),
    ideaDescription: inputs.ideaDescription.trim(),
    growthRate: inputs.growthRate?.trim() || undefined,
    tractionSummary: inputs.tractionSummary?.trim() || undefined,
    // Ensure numbers are valid
    teamSize: Math.max(1, Math.floor(inputs.teamSize)),
    monthlyRevenue: inputs.monthlyRevenue ? Math.max(0, inputs.monthlyRevenue) : undefined,
    fundingGoal: inputs.fundingGoal ? Math.max(0, inputs.fundingGoal) : undefined,
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, format: 'short' | 'long' | 'detailed' = 'short'): string {
  if (format === 'short') {
    if (amount >= 1000000000) {
      return `$${(amount / 1000000000).toFixed(1)}B`;
    }
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toFixed(0)}`;
  }

  if (format === 'long') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  // detailed
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Calculate data completeness score (0-1)
 */
export function calculateDataCompleteness(inputs: StartupInputs): number {
  let score = 0;
  const weights = {
    required: 0.5,  // 50% for required fields
    optional: 0.5,  // 50% for optional fields
  };

  // Required fields (binary)
  const requiredFields = [
    inputs.startupName,
    inputs.industry,
    inputs.geography,
    inputs.businessModel,
    inputs.mainFinancialConcern,
    inputs.ideaDescription,
  ];
  const requiredScore = requiredFields.filter(f => f && f.trim().length > 0).length / requiredFields.length;
  score += requiredScore * weights.required;

  // Optional fields (with quality weighting)
  let optionalScore = 0;
  let optionalCount = 0;

  if (inputs.monthlyRevenue !== undefined) {
    optionalScore += 1;
    optionalCount += 1;
  }

  if (inputs.growthRate && inputs.growthRate.length > 5) {
    optionalScore += 1;
    optionalCount += 1;
  }

  if (inputs.tractionSummary && inputs.tractionSummary.length > 20) {
    optionalScore += 1;
    optionalCount += 1;
  }

  if (inputs.fundingGoal !== undefined) {
    optionalScore += 1;
    optionalCount += 1;
  }

  if (optionalCount > 0) {
    score += (optionalScore / optionalCount) * weights.optional;
  }

  return Math.min(1, Math.max(0, score));
}

