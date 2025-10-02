import bcrypt from "bcrypt";

//encriptacion de contraseña
const saltRounds = 12; // numero de rondas; mientras mas pones mas afecta la performance a la vez que es mas seguro
// tomas la contraseña ingresada por el front y la encriptas con la funcion de la libreria
export const hashPassword = async (password: string): Promise<string> => {
  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (error) {
    console.error("Error hashing password:", error);
    throw new Error("Error al encriptar contraseña");
  }
};
// para comparar ingreso con los de la base de datos
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
