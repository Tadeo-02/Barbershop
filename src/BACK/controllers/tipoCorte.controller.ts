const querystring = require("querystring"); // manejan parametros de URL
const model = require("../models/TipoCorte"); // importar modelo de TipoCorte que conecta con la DB
// req: request, res: response
const create = (req, res) => { //renderizar la vista de crear tipoCorte
  res.render("tipoCortes/createTipoCorte");
};

const store = async (req, res) => {
  // req.body contiene los datos del formulario
  // al almacenarlos en constantes, indica que se espera que el cliente envíe estos campos
  const { nombreCorte } = req.body;
  const { valorBase } = req.body;

  try {
    const result = await model.store(nombreCorte, valorBase);
    console.log(result);
    res.status(200).json({ message: "Tipo de Corte creado con Éxito" }); // envia una respuesta HTTP con codigo de estado 200 (ok) y un objeto JSON con un mensaje de exito
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" }); // 500 indica error del servidor
  }
};

const index = async (req, res) => {
  try {
    const cortes = await model.findAll();
    res.status(200).json(cortes); // <-- Aquí va el res.status
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error");
  }
};

const show = async (req, res) => {
  const { codCorte } = req.params; // se extra el codCorte de los parametros de la URL con 'req.params'

  try {
    const tipoCorte = await model.findById(codCorte);
    console.log(tipoCorte);
    if (!tipoCorte) {
      return res.status(404).json({ message: "Tipo de Corte no encontrado" }); // 404 indica que el recurso no fue encontrado
    }
    res.json(tipoCorte);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const edit = async (req, res) => {
  const { codCorte } = req.params;

  try {
    const tipoCorte = await model.findById(codCorte);
    console.log(tipoCorte);
    if (!tipoCorte) {
      return res.status(404).json({ message: "Tipo de Corte no encontrado" });
    }
    res.json(tipoCorte);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const update = async (req, res) => {
  const { codCorte } = req.params;
  const { nombreCorte } = req.body;
  const { valorBase } = req.body;

  try {
    const result = await model.update(codCorte, nombreCorte, valorBase);
    console.log(result);
    res.json({ message: "Tipo de Corte updated successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const destroy = async (req, res) => {
  const { codCorte } = req.params;

  try {
    const result = await model.destroy(codCorte);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Tipo de Corte no encontrado" });
    }
    res.status(200).json({ message: "Tipo de Corte eliminado correctamente" });
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
