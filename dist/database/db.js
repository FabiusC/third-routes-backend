"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.query = void 0;
const pg_1 = require("pg");
// Configuración de la base de datos (actualizar los valores con los de tu instancia RDS)
const pool = new pg_1.Pool({
    user: "postgres",
    host: "third-parties-lm.cluster-c90iyucmovrc.us-east-2.rds.amazonaws.com",
    database: "postgres",
    password: "Cuenta?AWS5%",
    port: 5432,
    ssl: { rejectUnauthorized: false }, // Agregar si `rds.force_ssl` está habilitado
});
// Función para realizar consultas
const query = (text, params) => {
    return pool.query(text, params);
};
exports.query = query;
