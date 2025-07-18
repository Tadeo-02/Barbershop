const pool = require("./mysql");

const store = async (cuil, nombre, apellido, telefono) => {
  const sql = `INSERT INTO barberos (cuil, nombre, apellido, telefono) VALUES (?, ?, ?, ?)`;

  try {
    const [result] = await pool.query(sql, [cuil, nombre, apellido, telefono]);
    return result;
  } catch (error) {
    throw error;
  }
};

const findAll = async () => {
  const sql = "SELECT * FROM barberos";

  try {
    const [rows] = await pool.query(sql);
    return rows;
  } catch (error) {
    throw error;
  }
};

const findById = async (cuil) => {
  const sql = `SELECT * FROM barberos WHERE cuil = ?`;

  try {
    const [rows] = await pool.query(sql, [cuil]);
    // console.log(rows, rows.shift())
    return rows.shift();
  } catch (error) {
    throw error;
  }
};

const update = async (cuilViejo, nuevoCuil, nombre, apellido, telefono) => {
  const sql = `UPDATE barberos SET cuil = ?, nombre = ?, apellido = ?, telefono = ? WHERE cuil = ?`;

  try {
    const [result] = await pool.query(sql, [ nuevoCuil, nombre, apellido, telefono, cuilViejo]);
    return result;
  } catch (error) {
    throw error;
  }
};

const destroy = async (cuil) => {
  const sql = `DELETE FROM barberos WHERE cuil = ?`;

  try {
    const [result] = await pool.query(sql, [cuil]);
    return result;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  store,
  findAll,
  findById,
  update,
  destroy,
};
