import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "./passwordConstants.ts";

const hasLower = (value: string) => /[a-z]/.test(value);
const hasUpper = (value: string) => /[A-Z]/.test(value);
const hasNumber = (value: string) => /\d/.test(value);
const hasSymbol = (value: string) => /\W/.test(value);

export const passwordRequirements = [
  {
    key: "minLength",
    label: `Mínimo ${PASSWORD_MIN_LENGTH} caracteres`,
    test: (value: string) => value.length >= PASSWORD_MIN_LENGTH && value.length <= PASSWORD_MAX_LENGTH,
  },
  { key: "lower", label: "Una minúscula", test: hasLower },
  { key: "upper", label: "Una mayúscula", test: hasUpper },
  { key: "number", label: "Un número", test: hasNumber },
  { key: "symbol", label: "Un símbolo", test: hasSymbol },
];

export const getPasswordMissing = (value: string) =>
  passwordRequirements.filter((rule) => !rule.test(value)).map((rule) => rule.label);
