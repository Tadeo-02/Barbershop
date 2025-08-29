import type { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "../mysql";
// 'async' indica que es una funcion que puede llevar tiempo (como una consulta a la DB); habilita usar 'await'
interface TipoCorte extends RowDataPacket {
  codCorte: string;
  nombreCorte: string;
  valorBase: string;
}

const store = async (
  nombreCorte: string,
  valorBase: string
): Promise<ResultSetHeader> => {
  const sql = `INSERT INTO tipoCorte (nombreCorte, valorBase) VALUES (?, ?)`; //consulta a la DB
  //logs extra de chequeo
  console.log("Executing SQL:", sql);
  console.log("With parameters:", [nombreCorte, valorBase]);
  try {
    //codigo que puede fallar
    const [result] = await pool.query(sql, [nombreCorte, valorBase]);
    // 'pool.query' funcion de mysql, envia la consulta a la DB con el primer parametro; el segundo es un array con los valores que reemplazan los '?' en la consulta
    // 'await' inidica que espere la ejecucion de la consulta
    // 'result' toma el primer elemento de la respuesta de la consulta (destructuracion de arrays)
    console.log("Raw database result:", result);
    return result as ResultSetHeader; // devuelve result si el try se ejecuta correctamente
  } catch (error) {
    // si el 'try' falla, detiene su ejecucion y ejectua el bloque del catch
    console.error("Database error in store:", error);
    throw error; // informa el error al controlador
  }
};

const findAll = async (): Promise<TipoCorte[]> => {
  const sql = "SELECT * FROM tipoCorte";
  console.log("Executing findAll SQL:", sql);
  try {
    const [rows] = await pool.query(sql);
    console.log("Raw findAll result:", rows);
    const tipoCortes = rows as TipoCorte[];
    console.log("Parsed tipoCortes:", tipoCortes);
    return tipoCortes;
  } catch (error) {
    console.error("Database error in findAll:", error);
    throw error;
  }
};

const findById = async (codCorte: string): Promise<TipoCorte | undefined> => {
  const sql = `SELECT * FROM tipoCorte WHERE codCorte = ?`;

  try {
    const [rows] = await pool.query(sql, [codCorte]);
    const tipoCortes = rows as TipoCorte[];
    return tipoCortes[0];
  } catch (error) {
    console.error("Database error in findById:", error);
    throw error;
  }
};

const update = async (
  codCorte: string,
  nombreCorte: string,
  valorBase: string
): Promise<ResultSetHeader> => {
  const sql = `UPDATE tipoCorte SET nombreCorte = ?, valorBase = ? WHERE codCorte = ?`;

  try {
    const [result] = await pool.query(sql, [nombreCorte, valorBase, codCorte]);
    return result as ResultSetHeader;
  } catch (error) {
    console.error("Database error in update:", error);
    throw error;
  }
};

const destroy = async (codCorte: string): Promise<ResultSetHeader> => {
  const sql = `DELETE FROM tipoCorte WHERE codCorte = ?`;

  try {
    const [result] = await pool.query(sql, [codCorte]);
    return result as ResultSetHeader;
  } catch (error) {
    console.error("Database error in destroy:", error);
    throw error;
  }
};

export { store, findAll, findById, update, destroy };
