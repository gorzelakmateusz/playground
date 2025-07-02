interface EmailDetails {
  localPart: string;
  domain: string;
  normalized: string;
}

/**
 * Generic validation result interface
 */
interface ValidationResult<T = undefined> {
  isValid: boolean;
  error?: string;
  details?: T;
}

/**
 * Advanced email validator with RFC 5322 compliance options
 */
class EmailValidator {
  // Basic regex for quick validation (fast but less precise)
  private static readonly BASIC_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // More strict regex following RFC 5322 guidelines
  private static readonly STRICT_REGEX =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  // Maximum lengths according to RFC standards
  private static readonly MAX_EMAIL_LENGTH = 254;
  private static readonly MAX_LOCAL_PART_LENGTH = 64;
  private static readonly MAX_DOMAIN_PART_LENGTH = 253;
  private static readonly MAX_DOMAIN_LABEL_LENGTH = 63;
  private static readonly MIN_TLD_LENGTH = 2;

  /**
   * Validates email address with detailed error information
   *
   * @param email - Email address to validate
   * @param strict - Whether to use strict RFC 5322 validation
   * @returns Validation result with detailed information on success
   */
  static validateDetailed(
    email: string,
    strict: boolean = false,
  ): ValidationResult<EmailDetails> {
    try {
      if (!email) {
        return { isValid: false, error: "Email cannot be empty" };
      }

      // Trim whitespace from beginning and end
      const trimmedEmail = email.trim();

      // Check overall email length
      if (trimmedEmail.length > this.MAX_EMAIL_LENGTH) {
        return {
          isValid: false,
          error: `Email is too long (maximum ${this.MAX_EMAIL_LENGTH} characters)`,
        };
      }

      // Basic structure validation
      if (!trimmedEmail.includes("@")) {
        return { isValid: false, error: "Email must contain @ symbol" };
      }

      const parts = trimmedEmail.split("@");
      if (parts.length !== 2) {
        return { isValid: false, error: "Email can contain only one @ symbol" };
      }

      const localPart = parts[0];
      const domain = parts[1];

      // Validate local part
      const localValidation = this.validateLocalPart(localPart);
      if (!localValidation.isValid) return localValidation;

      // Validate domain
      const domainValidation = this.validateDomain(domain);
      if (!domainValidation.isValid) return domainValidation;

      // Apply appropriate regex validation
      const regex = strict ? this.STRICT_REGEX : this.BASIC_REGEX;

      if (!regex.test(trimmedEmail)) {
        return { isValid: false, error: "Invalid email format" };
      }

      // Check for consecutive dots
      if (trimmedEmail.includes("..")) {
        return {
          isValid: false,
          error: "Email cannot contain consecutive dots",
        };
      }

      return {
        isValid: true,
        details: {
          localPart,
          domain,
          normalized: trimmedEmail.toLowerCase(),
        },
      };
    } catch (error) {
      return {
        isValid: false,
        error: `Unexpected error during email validation: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  /**
   * Simple email validation (maintains compatibility)
   *
   * @param email - Email address to validate
   * @returns true if email is valid, false otherwise
   */
  static validate(email: string): boolean {
    return this.validateDetailed(email).isValid;
  }

  /**
   * Validates and normalizes email address
   *
   * @param email - Email address to normalize
   * @returns Normalized email address or null if invalid
   */
  static normalizeEmail(email: string): string | null {
    const result = this.validateDetailed(email);
    return result.isValid ? result.details?.normalized || null : null;
  }

  /**
   * Validates the local part (before @) of email address
   */
  private static validateLocalPart(localPart: string): ValidationResult {
    if (!localPart) {
      return { isValid: false, error: "Local part of email cannot be empty" };
    }

    if (localPart.length > this.MAX_LOCAL_PART_LENGTH) {
      return {
        isValid: false,
        error: `Local part is too long (maximum ${this.MAX_LOCAL_PART_LENGTH} characters)`,
      };
    }

    if (localPart.startsWith(".") || localPart.endsWith(".")) {
      return {
        isValid: false,
        error: "Local part cannot start or end with a dot",
      };
    }

    return { isValid: true };
  }

  /**
   * Validates the domain part (after @) of email address
   */
  private static validateDomain(domain: string): ValidationResult {
    if (!domain) {
      return { isValid: false, error: "Domain cannot be empty" };
    }

    if (domain.length > this.MAX_DOMAIN_PART_LENGTH) {
      return {
        isValid: false,
        error: `Domain is too long (maximum ${this.MAX_DOMAIN_PART_LENGTH} characters)`,
      };
    }

    // Check for at least one dot in domain
    if (!domain.includes(".")) {
      return { isValid: false, error: "Domain must contain at least one dot" };
    }

    // Check domain doesn't start or end with dot
    if (domain.startsWith(".") || domain.endsWith(".")) {
      return { isValid: false, error: "Domain cannot start or end with a dot" };
    }

    // Check domain doesn't start or end with hyphen
    if (domain.startsWith("-") || domain.endsWith("-")) {
      return {
        isValid: false,
        error: "Domain cannot start or end with a hyphen",
      };
    }

    // Validate individual domain labels
    const domainLabels = domain.split(".");
    for (const label of domainLabels) {
      if (!label) {
        return {
          isValid: false,
          error: "Domain cannot contain empty parts between dots",
        };
      }

      if (label.length > this.MAX_DOMAIN_LABEL_LENGTH) {
        return {
          isValid: false,
          error: `Domain label cannot exceed ${this.MAX_DOMAIN_LABEL_LENGTH} characters`,
        };
      }

      if (label.startsWith("-") || label.endsWith("-")) {
        return {
          isValid: false,
          error: "Domain labels cannot start or end with hyphens",
        };
      }

      if (!/^[a-zA-Z0-9-]+$/.test(label)) {
        return {
          isValid: false,
          error: "Domain labels can only contain letters, digits, and hyphens",
        };
      }
    }

    // Validate TLD (Top Level Domain)
    const tld = domainLabels[domainLabels.length - 1];
    if (!/^[a-zA-Z]+$/.test(tld)) {
      return {
        isValid: false,
        error: "Top-level domain (TLD) can only contain letters",
      };
    }

    if (tld.length < this.MIN_TLD_LENGTH) {
      return {
        isValid: false,
        error: `Top-level domain (TLD) must have at least ${this.MIN_TLD_LENGTH} characters`,
      };
    }

    return { isValid: true };
  }
}

// Export classes for advanced usage
export { EmailValidator, ValidationResult, EmailDetails };
