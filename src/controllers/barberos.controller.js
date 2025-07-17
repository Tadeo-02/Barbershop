const querystring = require("querystring");
const model = require("../models/Barberos");

const create = (req, res) => {
  res.render("barberos/createBarberos");
};

const store = async (req, res) => {
  const { cuil, nombre, apellido, telefono } = req.body;

  try {
    const result = await model.store( cuil, nombre, apellido, telefono );
    console.log(result);
    res.status(200).json({ message: "Barberos created successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const index = async (req, res) => {
  try {
    const barberos = await model.findAll();
    res.status(200).json(barberos); // <-- Aquí va el res.status
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error");
  }
};

const show = async (req, res) => {
  console.log(req.params);

  const { cuil } = req.params;

  try {
    const barbero = await model.findById(cuil);
    // console.log(barbero);
    if (!barbero) {
      return res.status(404).send("Barbero no encontrado");
    }
    res.status(200).json(barbero);
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error");
  }
};

const edit = async (req, res) => {
  const { cuil } = req.params;

  try {
    const barbero = await model.findById(cuil);
    console.log(barbero);
    if (!barbero) {
      return res.status(404).json({ message: "Barbero no encontrado" });
    }
    res.json(barbero);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const update = async (req, res) => {
  const { cuil } = req.params;
  const { nombre, apellido, telefono } = req.body;

  try {
    const result = await model.update(cuil, nombre, apellido, telefono);
    console.log(result);
    res.json({ message: "Barbero updated successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const destroy = async (req, res) => {
  const { cuil } = req.params;

  try {
    const result = await model.destroy(cuil);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Barbero no encontrado" });
    }
    res.status(200).json({ message: "Barbero eliminado correctamente" });
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