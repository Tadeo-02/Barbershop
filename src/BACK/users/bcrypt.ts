import bcrypt from "bcrypt";

const BCRYPT_SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;

export const hashPassword = async (password: string): Promise<string> => {
  try {
    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    return hashedPassword;
  } catch {
    throw new Error("Error al encriptar contraseña");
  }
};
// To compare the input with the values stored in the database.
export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  try {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
  } catch {
    throw new Error("Error al verificar la contraseña");
  }
};
