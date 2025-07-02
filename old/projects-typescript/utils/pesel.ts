/**
 * Generic validation result interface
 */
interface ValidationResult<T = undefined> {
  isValid: boolean;
  error?: string;
  details?: T;
}

/**
 * Century information for PESEL date decoding
 */
interface CenturyInfo {
  min: number;
  max: number;
  century: number;
  offset: number;
}

/**
 * Detailed validation result types
 */
interface PeselDetails {
  birthDate: {
    year: number;
    month: number;
    day: number;
  };
  gender: "female" | "male";
  age: number;
}

/**
 * Advanced PESEL (Polish Personal Identity Number) validator
 *
 * PESEL is an 11-digit number that encodes:
 * - Birth date (with century encoding in month digits)
 * - Gender (odd for male, even for female in 10th digit)
 * - Check digit (11th digit)
 */
class PeselValidator {
  private static readonly PESEL_LENGTH = 11;
  private static readonly CONTROL_WEIGHTS = [
    1, 3, 7, 9, 1, 3, 7, 9, 1, 3,
  ] as const;

  /**
   * Century ranges for PESEL date decoding
   * Month digits are modified based on birth century:
   * - 1900-1999: months 1-12 (no offset)
   * - 2000-2099: months 41-52 (offset +40)
   * - 2100-2199: months 21-32 (offset +20)
   * - 2200-2299: months 61-72 (offset +60)
   * - 1800-1899: months 81-92 (offset +80)
   */
  private static readonly CENTURY_RANGES: readonly CenturyInfo[] = [
    { min: 1, max: 12, century: 1900, offset: 0 }, // 1900-1999
    { min: 21, max: 32, century: 2100, offset: 20 }, // 2100-2199
    { min: 41, max: 52, century: 2000, offset: 40 }, // 2000-2099
    { min: 61, max: 72, century: 2200, offset: 60 }, // 2200-2299
    { min: 81, max: 92, century: 1800, offset: 80 }, // 1800-1899
  ] as const;

  /**
   * Validates PESEL number with detailed error information
   *
   * @param pesel - PESEL number to validate (supports spaces and hyphens)
   * @returns Validation result with detailed information on success
   */
  static validateDetailed(pesel: string): ValidationResult<PeselDetails> {
    try {
      // Normalize input - remove spaces and hyphens
      const normalizedPesel = pesel.replace(/[\s-]/g, "");

      // Basic format validation
      const basicValidation = this.validateBasicFormat(normalizedPesel);
      if (!basicValidation.isValid) return basicValidation;

      // Checksum validation
      const checksumValidation = this.validateChecksum(normalizedPesel);
      if (!checksumValidation.isValid) return checksumValidation;

      // Date validation
      const dateValidation = this.validateDate(normalizedPesel);
      if (!dateValidation.isValid) return dateValidation;

      return {
        isValid: true,
        details: this.extractPersonInfo(normalizedPesel),
      };
    } catch (error) {
      return {
        isValid: false,
        error: `Unexpected error during PESEL validation: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  /**
   * Simple PESEL validation (maintains compatibility with original function)
   *
   * @param pesel - PESEL number to validate
   * @returns true if PESEL is valid, false otherwise
   */
  static validate(pesel: string): boolean {
    return this.validateDetailed(pesel).isValid;
  }

  /**
   * Validates basic PESEL format (length and digit-only requirement)
   */
  private static validateBasicFormat(pesel: string): ValidationResult {
    if (!pesel) {
      return { isValid: false, error: "PESEL cannot be empty" };
    }

    if (pesel.length !== this.PESEL_LENGTH) {
      return {
        isValid: false,
        error: `PESEL must have exactly ${this.PESEL_LENGTH} digits`,
      };
    }

    if (!/^\d{11}$/.test(pesel)) {
      return { isValid: false, error: "PESEL can only contain digits" };
    }

    return { isValid: true };
  }

  /**
   * Validates PESEL checksum using the official algorithm
   */
  private static validateChecksum(pesel: string): ValidationResult {
    let sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(pesel[i]) * this.CONTROL_WEIGHTS[i];
    }

    const controlDigit = parseInt(pesel[10]);
    const calculatedControlDigit = (10 - (sum % 10)) % 10;

    if (controlDigit !== calculatedControlDigit) {
      return {
        isValid: false,
        error: `Invalid checksum. Expected: ${calculatedControlDigit}, got: ${controlDigit}`,
      };
    }

    return { isValid: true };
  }

  /**
   * Validates the birth date encoded in PESEL
   */
  private static validateDate(pesel: string): ValidationResult {
    const dateInfo = this.decodeBirthDate(pesel);
    if (!dateInfo) {
      return {
        isValid: false,
        error: "Invalid date format in PESEL - unsupported month range",
      };
    }

    const { year, month, day } = dateInfo;

    // Check year bounds
    if (year < 1800 || year > 2299) {
      return {
        isValid: false,
        error: `Year ${year} is outside supported range (1800-2299)`,
      };
    }

    // Check month bounds
    if (month < 1 || month > 12) {
      return { isValid: false, error: `Month ${month} is invalid (1-12)` };
    }

    // Check day bounds
    if (day < 1 || day > 31) {
      return { isValid: false, error: `Day ${day} is invalid (1-31)` };
    }

    // Validate actual date (handles leap years and month lengths)
    const date = new Date(year, month - 1, day);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return {
        isValid: false,
        error: `Date ${day}.${month}.${year} is invalid`,
      };
    }

    // Check if date is not in the future
    const now = new Date();
    if (date > now) {
      return { isValid: false, error: "Birth date cannot be in the future" };
    }

    // Check reasonable historical limits
    const minDate = new Date(1800, 0, 1);
    if (date < minDate) {
      return { isValid: false, error: "Birth date is too far in the past" };
    }

    return { isValid: true };
  }

  /**
   * Decodes birth date from PESEL number
   *
   * @param pesel - PESEL number
   * @returns Decoded date information or null if invalid
   */
  private static decodeBirthDate(
    pesel: string,
  ): { year: number; month: number; day: number } | null {
    const yearDigits = parseInt(pesel.substring(0, 2));
    const monthDigits = parseInt(pesel.substring(2, 4));
    const day = parseInt(pesel.substring(4, 6));

    // Find appropriate century range - more efficient than map lookup
    for (const range of this.CENTURY_RANGES) {
      if (monthDigits >= range.min && monthDigits <= range.max) {
        const month = monthDigits - range.offset;

        // Additional validation of month range after offset calculation
        if (month >= 1 && month <= 12) {
          return {
            year: range.century + yearDigits,
            month: month,
            day: day,
          };
        }
      }
    }

    // Log unsupported ranges for debugging (if console is available)
    if (typeof console !== "undefined" && console.warn) {
      console.warn(
        `PESEL: Unsupported month range: ${monthDigits} in number ${pesel}`,
      );
    }

    return null;
  }

  /**
   * Extracts detailed person information from valid PESEL
   *
   * @param pesel - Valid PESEL number
   * @returns Person details including birth date, gender, and age
   */
  private static extractPersonInfo(pesel: string): PeselDetails {
    const dateInfo = this.decodeBirthDate(pesel);
    if (!dateInfo) {
      throw new Error("Cannot extract information from invalid PESEL");
    }

    const genderDigit = parseInt(pesel[9]);
    const currentYear = new Date().getFullYear();

    return {
      birthDate: dateInfo,
      gender: genderDigit % 2 === 0 ? "female" : "male",
      age: currentYear - dateInfo.year,
    };
  }
}

export { PeselValidator, ValidationResult, PeselDetails };
