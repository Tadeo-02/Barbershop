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

// For now, just use the barberos router that we fixed
// Since it's ES modules, we need to use dynamic import or convert it back
// const barberosRouter = require("./src/BACK/routes/barberos.router");
// app.use("/barberos", barberosRouter);

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
