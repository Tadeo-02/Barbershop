require("dotenv").config(); // cargamos las variables de entrono desde el .env

const express = require("express");
const app = express();

const methodOverride = require("method-override");
app.use(methodOverride("_method"));

// const layouts = require("express-ejs-layouts");

const path = require("path");

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "src/views"));

// app.use(layouts);
// app.set("layout", "layouts/layout");

// Temporarily disable other routers until they are converted
// const mainRouter = require("./src/BACK/routes/main.router");
// app.use(mainRouter);

// const turnosRouter = require("./src/BACK/routes/turnos.router");
// app.use("/turnos", turnosRouter);

// Simple test route for barberos
app.post("/barberos", async (req, res) => {
  const { cuil, nombre, apellido, telefono } = req.body;

  try {
    // Here you would normally call your model function
    // For now, let's just return a success response
    console.log("Received barbero data:", { cuil, nombre, apellido, telefono });
    res.status(200).json({ message: "Barbero created successfully" });
  } catch (error) {
    console.log("Error creating barbero:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/barberos", async (req, res) => {
  try {
    // Return empty array for now
    res.status(200).json([]);
  } catch (error) {
    console.log("Error fetching barberos:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// app.use("/productos", require("./src/routes/productos.router"));

// const tipoCortesRouter = require("./src/BACK/routes/tipoCortes.router");
// app.use("/tipoCortes", tipoCortesRouter);

// const categoriasRouter = require("./src/BACK/routes/categorias.router");
// app.use("/categorias", categoriasRouter);

// app.use("/contacto", require("./src/routes/contacto.router"));

// Simple test route
app.get("/", (req, res) => {
  res.send("Server is running! Barbershop backend is up.");
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
