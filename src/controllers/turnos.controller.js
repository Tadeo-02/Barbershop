const querystring = require("querystring");
const model = require("../models/Turnos");

const create = (req, res) => {
  res.render("turnos/createTurnos");
};

const store = async (req, res) => {
  const { fechaTurno } = req.body;

  try {
    const result = await model.store(fechaTurno);
    console.log(result);
    res.status(200).json({ message: "Turno created successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// const index = async (req, res) => {
//   try {
//     const turnos = await model.findAll();
//     res.render("turnos/index", { turnos });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).send("Internal Server Error");
//   }
// };

// const show = async (req, res) => {
//   const { id } = req.params;

//   try {
//     const turnos = await model.findById(id);
//     console.log(turnos);
//     if (!turnos) {
//       return res.status(404).send("Turno no encontrado");
//     }
//     res.render("turnos/show", { producto });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).send("Internal Server Error");
//   }
// };

// const edit = async (req, res) => {
//   const { id } = req.params;

//   try {
//     const producto = await model.findById(id);
//     console.log(producto);
//     if (!producto) {
//       return res.status(404).send("Turno no encontrado");
//     }
//     res.render("turnos/edit", { turno });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).send("Internal Server Error");
//   }
// };

// const update = async (req, res) => {
//   const { id } = req.params;
//   const { name } = req.body;

//   try {
//     const result = await model.update(id, name);
//     console.log(result);
//     res.redirect("/turnos");
//   } catch (error) {
//     console.log(error);
//     return res.status(500).send("Internal Server Error");
//   }
// };

const destroy = async (req, res) => {
  const { codTurno } = req.params;

  try {
    const result = await model.destroy(codTurno);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Turno no encontrado" });
    }
    res.status(200).json({ message: "Turno eliminado correctamente" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  create,
  store,
  // index,
  // show,
  // edit,
  // update,
  destroy,
};
