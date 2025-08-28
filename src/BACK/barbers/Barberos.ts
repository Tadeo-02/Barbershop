import type { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "../mysql";

interface Barbero extends RowDataPacket {
  cuil: string;
  nombre: string;
  apellido: string;
  telefono: string;
}

const store = async (
  cuil: string,
  nombre: string,
  apellido: string,
  telefono: string
): Promise<ResultSetHeader> => {
  const sql = `INSERT INTO barberos (cuil, nombre, apellido, telefono) VALUES (?, ?, ?, ?)`;
  console.log("Executing SQL:", sql);
  console.log("With parameters:", [cuil, nombre, apellido, telefono]);

  try {
    const [result] = await pool.query(sql, [cuil, nombre, apellido, telefono]);
    console.log("Raw database result:", result);
    return result as ResultSetHeader;
  } catch (error) {
    console.error("Database error in store:", error);
    throw error;
  }
};

const findAll = async (): Promise<Barbero[]> => {
  const sql = "SELECT * FROM barberos";
  console.log("Executing findAll SQL:", sql);

  try {
    const [rows] = await pool.query(sql);
    console.log("Raw findAll result:", rows);
    const barberos = rows as Barbero[];
    console.log("Parsed barberos:", barberos);
    return barberos;
  } catch (error) {
    console.error("Database error in findAll:", error);
    throw error;
  }
};

const findById = async (cuil: string): Promise<Barbero | undefined> => {
  const sql = `SELECT * FROM barberos WHERE cuil = ?`;

  try {
    const [rows] = await pool.query(sql, [cuil]);
    const barberos = rows as Barbero[];
    return barberos[0];
  } catch (error) {
    console.error("Database error in findById:", error);
    throw error;
  }
};

const update = async (
  cuilViejo: string,
  nuevoCuil: string,
  nombre: string,
  apellido: string,
  telefono: string
): Promise<ResultSetHeader> => {
  const sql = `UPDATE barberos SET cuil = ?, nombre = ?, apellido = ?, telefono = ? WHERE cuil = ?`;

  try {
    const [result] = await pool.query(sql, [
      nuevoCuil,
      nombre,
      apellido,
      telefono,
      cuilViejo,
    ]);
    return result as ResultSetHeader;
  } catch (error) {
    console.error("Database error in update:", error);
    throw error;
  }
};

const destroy = async (cuil: string): Promise<ResultSetHeader> => {
  const sql = `DELETE FROM barberos WHERE cuil = ?`;

  try {
    const [result] = await pool.query(sql, [cuil]);
    return result as ResultSetHeader;
  } catch (error) {
    console.error("Database error in destroy:", error);
    throw error;
  }
};

export { store, findAll, findById, update, destroy };
