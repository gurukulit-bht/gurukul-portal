// ─── US-Based Form Validators ─────────────────────────────────────────────────
// Centralised validation + formatting helpers used across all forms.
// Each validator returns an empty string on success, or an error message.

// ── Phone ─────────────────────────────────────────────────────────────────────

/**
 * Validates a US phone number.
 * Accepts any reasonable input (digits, spaces, dashes, parentheses, dots).
 * Extracts exactly 10 digits and applies US-specific rules.
 */
export function validateUSPhone(v: string, required = true): string {
  const digits = v.replace(/\D/g, "");
  if (!digits) return required ? "Phone number is required." : "";
  if (digits.length < 10) return "Please enter all 10 digits of your US phone number.";
  if (digits.length > 10) return "Phone number is too long — please enter only 10 digits.";
  // US area codes cannot start with 0 or 1
  if (digits[0] === "0" || digits[0] === "1")
    return "US area codes cannot start with 0 or 1. Please check your number.";
  // Exchange code (positions 3-5) cannot start with 0 or 1
  if (digits[3] === "0" || digits[3] === "1")
    return "Please enter a valid US phone number.";
  // Reject obviously fake numbers (e.g. 5555555555, 0000000000)
  if (/^(.)\1{9}$/.test(digits))
    return "Please enter a valid US phone number.";
  return "";
}

/**
 * Auto-formats a raw phone string as (XXX) XXX-XXXX as the user types.
 * Safe to call on every keystroke — respects backspace/deletions.
 */
export function formatUSPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/**
 * Strips all non-digit characters from a phone string.
 * Use this to get the raw 10-digit value before storing.
 */
export function stripPhone(v: string): string {
  return v.replace(/\D/g, "");
}

// ── Email ─────────────────────────────────────────────────────────────────────

/**
 * Validates an email address.
 * Requires a proper TLD of at least 2 characters.
 */
export function validateEmail(v: string, required = true): string {
  const trimmed = v.trim();
  if (!trimmed) return required ? "Email address is required." : "";
  if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(trimmed))
    return "Please enter a valid email address (e.g. name@example.com).";
  // Block common typos
  if (/\.co$/.test(trimmed) && !/@.*\.co(m|uk|in|jp|kr|nz|za)$/.test(trimmed))
    return "Did you mean .com? Please check your email address.";
  return "";
}

// ── Names ─────────────────────────────────────────────────────────────────────

/**
 * Validates a person's name.
 * Allows: letters (including accented), spaces, hyphens, apostrophes, and periods.
 */
export function validatePersonName(v: string, label = "Name"): string {
  const trimmed = v.trim();
  if (!trimmed) return `${label} is required.`;
  if (trimmed.length < 2) return `${label} must be at least 2 characters.`;
  if (trimmed.length > 80) return `${label} is too long (max 80 characters).`;
  if (/\d/.test(trimmed)) return `${label} should not contain numbers.`;
  if (/[^a-zA-Z\u00C0-\u024F\s\-'.]/.test(trimmed))
    return `${label} contains invalid characters. Only letters, spaces, hyphens, apostrophes, and periods are allowed.`;
  return "";
}

/**
 * Validates a generic required text field.
 */
export function validateRequired(v: string, label: string): string {
  if (!v.trim()) return `${label} is required.`;
  return "";
}

// ── US ZIP Code ───────────────────────────────────────────────────────────────

/**
 * Validates a US ZIP code — 5 digits, or 5+4 format (e.g. 43065 or 43065-1234).
 */
export function validateUSZip(v: string, required = true): string {
  const trimmed = v.trim();
  if (!trimmed) return required ? "ZIP code is required." : "";
  if (!/^\d{5}(-\d{4})?$/.test(trimmed))
    return "Please enter a valid US ZIP code (e.g. 43065 or 43065-1234).";
  return "";
}

// ── US State ──────────────────────────────────────────────────────────────────

const US_STATES = new Set([
  "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN",
  "IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH",
  "NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT",
  "VT","VA","WA","WV","WI","WY",
]);

/**
 * Validates a 2-letter US state abbreviation.
 */
export function validateUSState(v: string, required = true): string {
  const upper = v.trim().toUpperCase();
  if (!upper) return required ? "State is required." : "";
  if (upper.length !== 2) return "Please enter a 2-letter state abbreviation (e.g. OH).";
  if (!US_STATES.has(upper)) return "Please enter a valid US state abbreviation (e.g. OH).";
  return "";
}

// ── PIN ───────────────────────────────────────────────────────────────────────

/**
 * Validates a 4-digit numeric PIN.
 */
export function validatePIN(v: string): string {
  if (!v) return "PIN is required.";
  if (!/^\d{4}$/.test(v)) return "PIN must be exactly 4 digits (numbers only).";
  if (/^(.)\1{3}$/.test(v)) return "PIN cannot be all the same digit (e.g. 1111).";
  if (["1234", "4321", "0000", "1111", "2222", "3333", "4444", "5555", "6666", "7777", "8888", "9999"].includes(v))
    return "PIN is too simple. Please choose a less predictable PIN.";
  return "";
}

// ── Password ──────────────────────────────────────────────────────────────────

/**
 * Validates an admin password (super-admin use).
 * At least 8 characters, must include uppercase, lowercase, and a number or symbol.
 */
export function validatePassword(v: string): string {
  if (!v) return "Password is required.";
  if (v.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(v)) return "Password must include at least one uppercase letter.";
  if (!/[a-z]/.test(v)) return "Password must include at least one lowercase letter.";
  if (!/[\d!@#$%^&*()_+\-=[\]{};':"|,.<>?]/.test(v))
    return "Password must include at least one number or special character.";
  return "";
}

// ── Address ───────────────────────────────────────────────────────────────────

/**
 * Validates a US street address (basic check — not geocoded).
 */
export function validateAddress(v: string): string {
  const trimmed = v.trim();
  if (!trimmed) return "Home address is required.";
  if (trimmed.length < 10) return "Please enter your full street address including city and state.";
  if (!/\d/.test(trimmed)) return "Address should include a street number (e.g. 123 Main St).";
  return "";
}
