const { Pool } = require("pg");

const pool = new Pool({
    user: "postgres",
    host: "third-parties-lm.cluster-c90iyucmovrc.us-east-2.rds.amazonaws.com",
    database: "postgres",
    password: "Cuenta?AWS5%",
    port: 5432,
    ssl: { rejectUnauthorized: false }, // Agregar si `rds.force_ssl` está habilitado
});

export default async function handler(req, res) {
    try {
        const result = await pool.query("SELECT * FROM third_parties");
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al obtener datos" });
    }
}