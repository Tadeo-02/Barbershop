export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 128;
// HTML5 pattern attribute - simpler pattern without lookaheads
// This pattern just ensures it contains allowed characters and correct length
// Real validation is done via JavaScript (passwordRules.ts)
export const PASSWORD_PATTERN = `[a-zA-Z0-9$@.!%*?&#^()_+={}\\[\\]|:;,<>~\`'"\\-]{${PASSWORD_MIN_LENGTH},${PASSWORD_MAX_LENGTH}}`;
