const pool = require("./mysql");

const store = async (nomCategoria, descCategoria) => {
    const sql = `INSERT INTO categorias (nomCategoria, descCategorias) VALUES (?1, ?2)`;

    try {
        const [result] = await pool.query(sql, [nomCategoria, descCategoria]);
        return result;
    } catch (error) {
        throw error;
    }
};

const findAll = async () => {
    const sql = "SELECT * FROM categorias";

    try {
        const [rows] = await pool.query(sql);
        return rows;
    } catch (error) {
        throw error;
    }
};

const findById = async (codCategoria) => {
    const sql = `SELECT * FROM categorias WHERE codCategoria = ?`;

    try {
        const [rows] = await pool.query(sql, [codCategoria]);
        // console.log(rows, rows.shift())
        return rows.shift();
    } catch (error) {
        throw error;
    }
};

const updateNom = async (codCategoria, nomCategoria) => {
    const sql = `UPDATE categorias SET nomCategoria = ? WHERE codCategoria = ?`;

    try {
        const [result] = await pool.query(sql, [nomCategoria, codCategoria]);
        return result;
    } catch (error) {
        throw error;
    }
};

const updateDesc = async (codCategoria, descCategoria) => {
    const sql = `UPDATE categorias SET descCategoria = ? WHERE codCategoria = ?`;

    try {
        const [result] = await pool.query(sql, [descCategoria, codCategoria]);
        return result;
    } catch (error) {
        throw error;
    }
};

const destroy = async (codCategoria) => {
    const sql = `DELETE FROM categorias WHERE codCategoria = ?`;

    try {
        const [result] = await pool.query(sql, [codCategoria]);
        return result;
    } catch (error) {
        throw error;
    }
};

module.exports = {
    store,
    findAll,
    findById,
    updateNom,
    updateDesc,
    destroy,
};
