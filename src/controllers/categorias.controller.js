const querystring = require("querystring");
const model = require("../models/Categorias");

const create = (req, res) => {
    res.render("categorias/createCategorias");
};

const store = async (req, res) => {
    const { nomCategoria, descCategoria} = req.body;

    try {
        const result = await model.store(nomCategoria, descCategoria);
        console.log(result);
        res.status(200).json({ message: "Categoria created successfully" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

const index = async (req, res) => {
    try {
        const categorias = await model.findAll();
        res.status(200).json(categorias); // <-- Aquí va el res.status
    } catch (error) {
        console.log(error);
        return res.status(500).send("Internal Server Error");
    }
};

const show = async (req, res) => {
    console.log(req.params);

    const { codCategoria} = req.params;

    try {
        const categoria = await model.findById(codCategoria);
        // console.log(categoria);
        if (!categoria) {
            return res.status(404).send("Categoria no encontrado");
        }
        res.status(200).json(categoria);
    } catch (error) {
        console.log(error);
        return res.status(500).send("Internal Server Error");
    }
};

const edit = async (req, res) => {
    const { codCategoria } = req.params;

    try {
        const categoria = await model.findById(codCategoria);
        console.log(categoria);
        if (!categoria) {
            return res.status(404).json({ message: "Categoria no encontrado" });
        }
        res.json(categoria);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

const update = async (req, res) => {
    const { codCategoria } = req.params;
    const { nomCategoria, descCategoria } = req.body;

    // Validaciones
    if (!nomCategoria || nomCategoria.trim() === "") {
        return res.status(400).json({ message: "nomCategoria es requerido" });
    }
    if (!descCategoria || descCategoria.trim() === "") {
        return res.status(400).json({ message: "descCategoria es requerido" });
    }

    try {
        // Asegurar que los valores son strings
        const nomCategoriaString = String(nomCategoria).trim();
        const descCategoriaString = String(descCategoria).trim();
        const codCategoriaNumber = parseInt(codCategoria, 10);

        const result = await model.update(nomCategoriaString, descCategoriaString, codCategoriaNumber);
        res.json({ message: "Categoría actualizada correctamente" });
    } catch (error) {
        console.log("Error en update:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};


const destroy = async (req, res) => {
    const { codCategoria } = req.params;

    try {
        const result = await model.destroy(codCategoria);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Categoria no encontrada" });
        }
        res.status(200).json({ message: "Categoria eliminada correctamente" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

module.exports = {
    create,
    store,
    index,
    show,
    edit,
    update,
    destroy
};
