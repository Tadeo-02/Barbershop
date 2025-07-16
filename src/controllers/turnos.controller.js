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

const index = async (req, res) => {
  try {
    const turnos = await model.findAll();
    res.status(200).json(turnos); // <-- Aquí va el res.status
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error");
  }
};

const show = async (req, res) => {
  console.log(req.params);

  const { codTurno } = req.params;

  try {
    const turno = await model.findById(codTurno);
    // console.log(turno);
    if (!turno) {
      return res.status(404).send("Turno no encontrado");
    }
    res.status(200).json(turno);
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error");
  }
};

// Replace your existing 'show' function with this for the test
// const show = async (req, res) => {
//   const { codTurno } = req.params;
//   const pool = require("../models/mysql"); // IMPORTANT: Make sure this path is correct

//   try {
//     const updateSql = "UPDATE turnos SET precioTurno = 999 WHERE codTurno = ?";
//     const [result] = await pool.query(updateSql, [codTurno]);

//     // This will tell us if the UPDATE query found and changed a row
//     if (result.affectedRows > 0) {
//       res.send("SUCCESS: The row was found and updated!");
//     } else {
//       res.send("FAILURE: The row was NOT found. The update did nothing.");
//     }

//   } catch (error) {
//     console.log(error);
//     return res.status(500).send("Internal Server Error during update test.");
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

// const destroy = async (req, res) => {
//   const { id } = req.params;

//   try {
//     const result = await model.destroy(id);
//     console.log(result);
//     res.redirect("/turnos");
//   } catch (error) {
//     console.log(error);
//     return res.status(500).send("Internal Server Error");
//   }
// };

module.exports = {
  create,
  store,
  index,
  show,
  // edit,
  // update,
  // destroy,
};
