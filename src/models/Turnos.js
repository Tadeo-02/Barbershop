const pool = require("./mysql");

const store = async (fechaTurno) => {
  const sql = `INSERT INTO turnos (fechaTurno) VALUES (?)`;

  try {
    const [result] = await pool.query(sql, [fechaTurno]);
    return result;
  } catch (error) {
    throw error;
  }
};

const findAll = async () => {
  const sql = "SELECT * FROM turnos";

  try {
    const [rows] = await pool.query(sql);
    return rows;
  } catch (error) {
    throw error;
  }
};

const findById = async (codTurno) => {
  const sql = `SELECT * FROM turnos WHERE codTurno = ?`;

  try {
    const [rows] = await pool.query(sql, [codTurno]);
    // console.log(rows, rows.shift())
    return rows.shift();
  } catch (error) {
    throw error;
  }
};

const update = async (codTurno, fechaTurno) => {
  const sql = `UPDATE turnos SET fechaTurno = ? WHERE codTurno = ?`;

  try {
    const [result] = await pool.query(sql, [fechaTurno, codTurno]);
    return result;
  } catch (error) {
    throw error;
  }
};

const destroy = async (codTurno) => {
  const sql = `DELETE FROM turnos WHERE codTurno = ?`;

  try {
    const [result] = await pool.query(sql, [codTurno]);
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
  destroy
};
