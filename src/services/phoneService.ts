/**
 * Phone Number Formatting and Validation Service
 * Primary focus: Sri Lanka (+94) TRCSL standards with full multi-country support.
 */

export interface CountryConfig {
  code: string;
  iso: string;
  flag: string;
  name: string;
  placeholder: string;
  maxDigits: number;
}

export const SUPPORTED_COUNTRIES: CountryConfig[] = [
  { code: '+94', iso: 'LK', flag: '🇱🇰', name: 'Sri Lanka (+94)', placeholder: '077 123 4567', maxDigits: 10 },
  { code: '+1', iso: 'US', flag: '🇺🇸', name: 'United States (+1)', placeholder: '(555) 123-4567', maxDigits: 10 },
  { code: '+44', iso: 'GB', flag: '🇬🇧', name: 'United Kingdom (+44)', placeholder: '07911 123456', maxDigits: 11 },
  { code: '+91', iso: 'IN', flag: '🇮🇳', name: 'India (+91)', placeholder: '98765 43210', maxDigits: 10 },
  { code: '+61', iso: 'AU', flag: '🇦🇺', name: 'Australia (+61)', placeholder: '0412 345 678', maxDigits: 10 },
  { code: '+971', iso: 'AE', flag: '🇦🇪', name: 'UAE (+971)', placeholder: '050 123 4567', maxDigits: 10 },
  { code: '+65', iso: 'SG', flag: '🇸🇬', name: 'Singapore (+65)', placeholder: '9123 4567', maxDigits: 8 },
  { code: '+49', iso: 'DE', flag: '🇩🇪', name: 'Germany (+49)', placeholder: '0151 23456789', maxDigits: 11 },
  { code: '+33', iso: 'FR', flag: '🇫🇷', name: 'France (+33)', placeholder: '06 12 34 56 78', maxDigits: 10 },
  { code: '+81', iso: 'JP', flag: '🇯🇵', name: 'Japan (+81)', placeholder: '090 1234 5678', maxDigits: 11 },
  { code: '+60', iso: 'MY', flag: '🇲🇾', name: 'Malaysia (+60)', placeholder: '012 345 6789', maxDigits: 10 },
  { code: '+966', iso: 'SA', flag: '🇸🇦', name: 'Saudi Arabia (+966)', placeholder: '050 123 4567', maxDigits: 10 },
  { code: '+974', iso: 'QA', flag: '🇶🇦', name: 'Qatar (+974)', placeholder: '3312 3456', maxDigits: 8 },
  { code: '+64', iso: 'NZ', flag: '🇳🇿', name: 'New Zealand (+64)', placeholder: '021 123 4567', maxDigits: 10 },
];

/**
 * Valid Sri Lanka 3-digit prefixes (with leading 0):
 * Mobile (TRCSL allocated):
 *  - 070, 071: Mobitel
 *  - 072, 078: Hutch
 *  - 074, 076, 077: Dialog
 *  - 075: Airtel / Dialog
 * Fixed lines / Landlines:
 *  - 011, 021, 023, 024, 025, 026, 027, 031, 032, 033, 034, 035, 036, 037, 038,
 *    041, 045, 047, 051, 052, 054, 055, 057, 063, 065, 066, 067, 081
 */
const SRI_LANKA_VALID_PREFIXES = new Set([
  // Mobile
  '070', '071', '072', '074', '075', '076', '077', '078',
  // Fixed / Landline
  '011', '021', '023', '024', '025', '026', '027', '031', '032', '033',
  '034', '035', '036', '037', '038', '041', '045', '047', '051', '052',
  '054', '055', '057', '063', '065', '066', '067', '081',
]);

/**
 * Format raw input as the user types based on the selected country.
 */
export const formatAsYouType = (input: string, countryCode: string): string => {
  if (!input) return '';

  // Extract digits only
  let digits = input.replace(/\D/g, '');

  if (countryCode === '+94') {
    // If user pasted/typed +94 or 94 at the beginning, strip it
    if (digits.startsWith('94') && digits.length > 9) {
      digits = digits.slice(2);
    }

    // If user typed without leading 0 (e.g. 771234567), auto-prepend 0
    if (digits.length > 0 && !digits.startsWith('0')) {
      digits = '0' + digits;
    }

    // Limit to 10 digits
    digits = digits.slice(0, 10);

    // Format: 0XX XXX XXXX
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 6) {
      return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    } else {
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    }
  }

  if (countryCode === '+1') {
    // US / Canada: (XXX) XXX-XXXX
    if (digits.startsWith('1') && digits.length > 10) {
      digits = digits.slice(1);
    }
    digits = digits.slice(0, 10);

    if (digits.length === 0) return '';
    if (digits.length <= 3) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  if (countryCode === '+91') {
    // India: XXXXX XXXXX
    if (digits.startsWith('91') && digits.length > 10) {
      digits = digits.slice(2);
    }
    digits = digits.slice(0, 10);

    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  }

  if (countryCode === '+44') {
    // UK: 5 digits space rest (e.g. 07911 123456)
    if (digits.startsWith('44') && digits.length > 10) {
      digits = digits.slice(2);
    }
    digits = digits.slice(0, 11);

    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  }

  if (countryCode === '+61') {
    // Australia: 0412 345 678 or 412 345 678
    if (digits.startsWith('61') && digits.length > 9) {
      digits = digits.slice(2);
    }
    digits = digits.slice(0, 10);

    if (digits.length <= 4) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }

  if (countryCode === '+971') {
    // UAE: 050 123 4567
    if (digits.startsWith('971') && digits.length > 9) {
      digits = digits.slice(3);
    }
    digits = digits.slice(0, 10);

    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }

  if (countryCode === '+65' || countryCode === '+974') {
    // Singapore / Qatar: 4 digits space 4 digits (8 digits)
    digits = digits.slice(0, 8);
    if (digits.length <= 4) return digits;
    return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  }

  // Generic fallback: group by 3 or 4
  digits = digits.slice(0, 12);
  if (digits.length <= 4) return digits;
  if (digits.length <= 8) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8)}`;
};

/**
 * Validate phone number based on the selected country.
 * Returns { isValid: boolean, error?: string }
 */
export const validatePhoneNumber = (
  input: string,
  countryCode: string
): { isValid: boolean; error?: string } => {
  const trimmed = input.trim();
  if (!trimmed) {
    return { isValid: true }; // Phone is optional
  }

  const digits = trimmed.replace(/\D/g, '');

  if (countryCode === '+94') {
    // Must have exactly 10 digits starting with 0
    if (digits.length !== 10) {
      return {
        isValid: false,
        error: `Sri Lankan phone numbers must be 10 digits (currently ${digits.length}/10). Example: 077 123 4567`,
      };
    }

    const prefix = digits.slice(0, 3);
    if (!SRI_LANKA_VALID_PREFIXES.has(prefix)) {
      return {
        isValid: false,
        error: `Invalid Sri Lankan prefix "${prefix}". Valid prefixes start with 070, 071, 072, 074, 075, 076, 077, 078, or valid area code.`,
      };
    }

    return { isValid: true };
  }

  if (countryCode === '+1') {
    if (digits.length !== 10) {
      return {
        isValid: false,
        error: `US/Canada phone numbers must be 10 digits (currently ${digits.length}/10). Example: (555) 123-4567`,
      };
    }
    return { isValid: true };
  }

  if (countryCode === '+91') {
    if (digits.length !== 10) {
      return {
        isValid: false,
        error: `Indian phone numbers must be 10 digits (currently ${digits.length}/10). Example: 98765 43210`,
      };
    }
    return { isValid: true };
  }

  if (countryCode === '+44') {
    if (digits.length < 10 || digits.length > 11) {
      return {
        isValid: false,
        error: `UK phone numbers must be 10 or 11 digits (currently ${digits.length}). Example: 07911 123456`,
      };
    }
    return { isValid: true };
  }

  if (countryCode === '+65') {
    if (digits.length !== 8) {
      return {
        isValid: false,
        error: `Singapore phone numbers must be 8 digits (currently ${digits.length}/8). Example: 9123 4567`,
      };
    }
    return { isValid: true };
  }

  if (countryCode === '+974') {
    if (digits.length !== 8) {
      return {
        isValid: false,
        error: `Qatar phone numbers must be 8 digits (currently ${digits.length}/8). Example: 3312 3456`,
      };
    }
    return { isValid: true };
  }

  if (countryCode === '+971' || countryCode === '+61' || countryCode === '+966') {
    if (digits.length < 9 || digits.length > 10) {
      return {
        isValid: false,
        error: `Phone number must be 9 or 10 digits (currently ${digits.length}).`,
      };
    }
    return { isValid: true };
  }

  // General check for remaining countries
  if (digits.length < 7 || digits.length > 15) {
    return {
      isValid: false,
      error: `Please enter a valid phone number (7–15 digits).`,
    };
  }

  return { isValid: true };
};

/**
 * Standardize the phone number for saving to database.
 * Formats as E.164-compatible readable international format: e.g. `+94 77 123 4567`.
 */
export const toInternationalFormat = (input: string, countryCode: string): string => {
  const trimmed = input.trim();
  if (!trimmed) return '';

  const digits = trimmed.replace(/\D/g, '');

  if (countryCode === '+94') {
    // If it has 10 digits starting with 0, drop the leading 0
    let localDigits = digits;
    if (localDigits.startsWith('94') && localDigits.length > 9) {
      localDigits = localDigits.slice(2);
    }
    if (localDigits.startsWith('0')) {
      localDigits = localDigits.slice(1);
    }
    if (localDigits.length === 9) {
      const op = localDigits.slice(0, 2);
      const p1 = localDigits.slice(2, 5);
      const p2 = localDigits.slice(5, 9);
      return `+94 ${op} ${p1} ${p2}`;
    }
    return `+94 ${localDigits}`;
  }

  return `${countryCode} ${trimmed}`;
};

/**
 * Split a stored phone number from database into countryCode and local formatted number
 * for loading into edit modal.
 */
export const parseStoredPhone = (
  storedPhone: string
): { countryCode: string; localNumber: string } => {
  if (!storedPhone || !storedPhone.trim()) {
    return { countryCode: '+94', localNumber: '' };
  }

  const cleaned = storedPhone.trim();

  // Check matching country code
  for (const country of SUPPORTED_COUNTRIES) {
    if (cleaned.startsWith(country.code)) {
      const remainder = cleaned.slice(country.code.length).trim();

      if (country.code === '+94') {
        // Normalize to 10-digit national format for input: e.g. '077 123 4567'
        const rawDigits = remainder.replace(/\D/g, '');
        if (rawDigits.length === 9 && !rawDigits.startsWith('0')) {
          return { countryCode: '+94', localNumber: formatAsYouType('0' + rawDigits, '+94') };
        }
        return { countryCode: '+94', localNumber: formatAsYouType(remainder, '+94') };
      }

      return {
        countryCode: country.code,
        localNumber: formatAsYouType(remainder, country.code),
      };
    }
  }

  // If no country code prefix but starts with 07 or 0 (Sri Lanka local)
  const digits = cleaned.replace(/\D/g, '');
  if (digits.startsWith('0') && digits.length === 10) {
    return { countryCode: '+94', localNumber: formatAsYouType(digits, '+94') };
  }

  return { countryCode: '+94', localNumber: formatAsYouType(cleaned, '+94') };
};

