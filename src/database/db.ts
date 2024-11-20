import { Pool } from "pg";

// Configuración de la base de datos (actualizar los valores con los de tu instancia RDS)
const pool = new Pool({
  user: "postgres",
  host: "thirds-lm.cdkukm4ik3ba.us-east-1.rds.amazonaws.com",
  database: "postgres",
  password: "Cuenta?AWS5%",
  port: 5432,
  ssl: { rejectUnauthorized: false }, // Agregar si `rds.force_ssl` está habilitado
});
// Función para realizar consultas
export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};
