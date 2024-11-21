"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const routes_1 = __importDefault(require("./routes/routes"));
const https_1 = __importDefault(require("https"));
const fs_1 = __importDefault(require("fs"));
const app = (0, express_1.default)();
const PORT = 8080;
// Cargar los certificados SSL
const options = {
    key: fs_1.default.readFileSync("server.key"), // Ruta al archivo de clave privada
    cert: fs_1.default.readFileSync("server.cert"), // Ruta al archivo de certificado
};
// Middleware
app.use((0, cors_1.default)());
app.use(body_parser_1.default.json());
// Rutas
app.use("/api", routes_1.default);
// Crear el servidor HTTPS
https_1.default.createServer(options, app).listen(PORT, () => {
    console.log(`Servidor corriendo en https://localhost:${PORT}`);
});
