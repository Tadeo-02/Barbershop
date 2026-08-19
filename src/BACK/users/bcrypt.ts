import bcrypt from "bcrypt";

//encrypt the password
const saltRounds = 12; // number of rounds; The more you add, the more it impacts performance while also making it more secure.
// Takes the password entered from the frontend and encrypts it using the library's function.
export const hashPassword = async (password: string): Promise<string> => {
  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (error) {
    console.error("Error hashing password:", error);
    throw new Error("Error al encriptar contraseña");
  }
};
// To compare the input with the values stored in the database.
export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  try {
    console.log("🔍 Comparing passwords...");
    console.log("Plain password length:", password.length);
    console.log("Hashed password:", hashedPassword);
    console.log(
      "Hashed password starts with $2b:",
      hashedPassword.startsWith("$2b$")
    );

    const isMatch = await bcrypt.compare(password, hashedPassword);
    console.log("🔍 Password comparison result:", isMatch);
    return isMatch;
  } catch (error) {
    console.error("❌ Error comparing password:", error);
    throw new Error("Error al verificar la contraseña");
  }
};
