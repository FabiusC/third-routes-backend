import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import routes from "./routes/routes";
import https from "https";
import fs from "fs";

const app = express();
const PORT = 8080;

// Cargar los certificados SSL
const options = {
  key: fs.readFileSync("server.key"), // Ruta al archivo de clave privada
  cert: fs.readFileSync("server.cert"), // Ruta al archivo de certificado
};

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Rutas
app.use("/api", routes);

// Crear el servidor HTTPS
https.createServer(options, app).listen(PORT, () => {
  console.log(`Servidor corriendo en https://localhost:${PORT}`);
});
