const pool = require("./mysql");

const store = async (nombreCorte, valorBase) => {
  const sql = `INSERT INTO tipoCorte (nombreCorte, valorBase) VALUES (?, ?)`;

  try {
    const [result] = await pool.query(sql, [nombreCorte, valorBase]);
    return result;
  } catch (error) {
    throw error;
  }
};

const findAll = async () => {
  const sql = "SELECT * FROM tipoCorte";

  try {
    const [rows] = await pool.query(sql);
    return rows;
  } catch (error) {
    throw error;
  }
};

const findById = async (codCorte) => {
  const sql = `SELECT * FROM tipoCorte WHERE codCorte = ?`;

  try {
    const [rows] = await pool.query(sql, [codCorte]);
    // console.log(rows, rows.shift())
    return rows.shift();
  } catch (error) {
    throw error;
  }
};

const update = async (codCorte, nombreCorte, valorBase) => {
  const sql = `UPDATE tipoCorte SET nombreCorte = ?, valorBase = ? WHERE codCorte = ?`;

  try {
    const [result] = await pool.query(sql, [nombreCorte, valorBase, codCorte]);
    return result;
  } catch (error) {
    throw error;
  }
};

const destroy = async (codCorte) => {
  const sql = `DELETE FROM tipoCorte WHERE codCorte = ?`;

  try {
    const [result] = await pool.query(sql, [codCorte]);
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
