import type { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "./mysql.js";

interface Barbero extends RowDataPacket {
  cuil: string;
  nombre: string;
  apellido: string;
  telefono: string;
}

const store = async (cuil: string, nombre: string, apellido: string, telefono: string): Promise<ResultSetHeader> => {
  const sql = `INSERT INTO barberos (cuil, nombre, apellido, telefono) VALUES (?, ?, ?, ?)`;
  const [result] = await pool.query(sql, [cuil, nombre, apellido, telefono]);
  return result as ResultSetHeader;
};

const findAll = async (): Promise<Barbero[]> => {
  const sql = "SELECT * FROM barberos";
  const [rows] = await pool.query(sql);
  return rows as Barbero[];
};

const findById = async (cuil: string): Promise<Barbero | undefined> => {
  const sql = `SELECT * FROM barberos WHERE cuil = ?`;
  const [rows] = await pool.query(sql, [cuil]);
  const barberos = rows as Barbero[];
  return barberos[0];
};

const update = async (cuilViejo: string, nuevoCuil: string, nombre: string, apellido: string, telefono: string): Promise<ResultSetHeader> => {
  const sql = `UPDATE barberos SET cuil = ?, nombre = ?, apellido = ?, telefono = ? WHERE cuil = ?`;
  const [result] = await pool.query(sql, [nuevoCuil, nombre, apellido, telefono, cuilViejo]);
  return result as ResultSetHeader;
};

const destroy = async (cuil: string): Promise<ResultSetHeader> => {
  const sql = `DELETE FROM barberos WHERE cuil = ?`;
  const [result] = await pool.query(sql, [cuil]);
  return result as ResultSetHeader;
};

export {
  store,
  findAll,
  findById,
  update,
  destroy,
};
