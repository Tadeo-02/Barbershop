const pool = require("./mysql");
// 'async' indica que es una funcion que puede llevar tiempo (como una consulta a la DB); habilita usar 'await'
const store = async (nombreCorte, valorBase) => {
  const sql = `INSERT INTO tipoCorte (nombreCorte, valorBase) VALUES (?, ?)`; //consulta a la DB

  try { //codigo que puede fallar
    const [result] = await pool.query(sql, [nombreCorte, valorBase]); 
    // 'pool.query' funcion de mysql, envia la consulta a la DB con el primer parametro; el segundo es un array con los valores que reemplazan los '?' en la consulta
    // 'await' inidica que espere la ejecucion de la consulta
    // 'result' toma el primer elemento de la respuesta de la consulta (destructuracion de arrays)
    return result; // devuelve result si el try se ejecuta correctamente
  } catch (error) { // si el 'try' falla, detiene su ejecucion y ejectua el bloque del catch
    throw error; // informa el error al controlador
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
