"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("../database/db");
const router = express_1.default.Router();
// Mostrar todos los endpoints
router.get("/", (_req, res) => {
    const endpoints = [
        {
            method: "GET",
            endpoint: "/api/third-parties",
            description: "Obtener todos los terceros",
        },
        {
            method: "GET",
            endpoint: "/api/routes-history",
            description: "Obtener el histórico de rutas con comentarios",
        },
        {
            method: "POST",
            endpoint: "/api/add-route",
            description: "Crear una nueva ruta con comentarios",
        },
        {
            method: "POST",
            endpoint: "/api/add-third-party",
            description: "Agregar un nuevo tercero",
        },
    ];
    res.json(endpoints);
});
// Obtener la lista de terceros
router.get("/third-parties", async (_req, res) => {
    try {
        const result = await (0, db_1.query)("SELECT id, name, address, contact_name, contact_info, category FROM third_parties");
        res.json(result.rows);
    }
    catch (err) {
        console.error("Error al obtener terceros:", err.message, err.stack);
        res
            .status(500)
            .json({ error: "Error al obtener terceros", details: err.message });
    }
});
// Obtener el histórico de rutas
router.get("/routes-history", async (_req, res) => {
    try {
        const result = await (0, db_1.query)(`
      SELECT 
        rh.route_date AS route_date,
        tp.name AS third_party_name,
        tp.address,
        tp.contact_name,
        tp.contact_info,
        rh.comment
      FROM routes_history rh
      JOIN third_parties tp ON rh.third_party_id = tp.id
      ORDER BY rh.route_date DESC
    `);
        res.json(result.rows);
    }
    catch (err) {
        console.error("Error al obtener el histórico de rutas:", err);
        res.status(500).json({ error: "Error al obtener el histórico de rutas" });
    }
});
// Agregar una nueva ruta
router.post("/add-route", async (req, res) => {
    try {
        const { routes } = req.body;
        if (!routes || !Array.isArray(routes) || routes.length === 0) {
            res.status(400).json({
                error: "Debe proporcionar al menos una ruta con fecha, ID de tercero y comentario.",
            });
            return;
        }
        // Validate that each route contains the necessary fields
        for (const route of routes) {
            if (!route.third_party_id || !route.route_date || !route.comment) {
                res.status(400).json({
                    error: "Cada ruta debe contener un ID de tercero, una fecha y un comentario.",
                });
                return;
            }
        }
        // Insert each route into the database
        const insertPromises = routes.map((route) => (0, db_1.query)("INSERT INTO routes_history (route_date, third_party_id, comment) VALUES ($1, $2, $3)", [route.route_date, route.third_party_id, route.comment]));
        await Promise.all(insertPromises);
        res.status(201).json({ message: "Rutas creadas exitosamente." });
    }
    catch (err) {
        console.error("Error al crear las rutas:", err);
        res.status(500).json({ error: "Error al crear las rutas." });
    }
});
// Agregar un nuevo tercero
router.post("/add-third-party", async (req, res) => {
    try {
        const { name, address, contact_name, contact_info, category } = req.body;
        if (!name || !address || !category) {
            res.status(400).json({
                error: "Los campos nombre, dirección y categoría son obligatorios.",
            });
            return;
        }
        await (0, db_1.query)(`
          INSERT INTO third_parties (name, address, contact_name, contact_info, category)
          VALUES ($1, $2, $3, $4, $5)
          `, [name, address, contact_name || null, contact_info || null, category]);
        res.status(201).json({ message: "Tercero agregado exitosamente" });
    }
    catch (err) {
        console.error("Error capturado:", err); // Registrar el error completo para depuración
        // Identificar el error específico de restricción única
        if (err.code === "23505") {
            res.status(400).json({ error: "El nombre del tercero ya existe." });
        }
        else {
            res.status(500).json({ error: "Error al agregar el tercero" });
        }
    }
});
// Eliminar un tercero
router.delete("/third-party/:id", async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ error: "El ID del tercero es obligatorio." });
            return;
        }
        await (0, db_1.query)("DELETE FROM third_parties WHERE id = $1", [id]);
        res.status(200).json({ message: "Tercero eliminado correctamente." });
    }
    catch (err) {
        console.error("Error al eliminar tercero:", err);
        res.status(500).json({ error: "Error al eliminar el tercero." });
    }
});
// Actualizar un tercero
router.put("/third-parties/:id", async (req, res) => {
    const { id } = req.params;
    const { name, address, contact_name, contact_info, category } = req.body;
    if (!id || !name || !address || !category) {
        res.status(400).json({
            error: "Los campos ID, nombre, dirección y categoría son obligatorios.",
        });
        return;
    }
    try {
        const result = await (0, db_1.query)(`
      UPDATE third_parties
      SET name = $1, address = $2, contact_name = $3, contact_info = $4, category = $5
      WHERE id = $6
      RETURNING *;
      `, [name, address, contact_name || null, contact_info || null, category, id]);
        if (result.rowCount === 0) {
            res
                .status(404)
                .json({ error: "El tercero con el ID especificado no existe." });
            return;
        }
        res.status(200).json({
            message: "Tercero actualizado correctamente.",
            thirdParty: result.rows[0],
        });
    }
    catch (err) {
        console.error("Error al actualizar tercero:", err);
        res.status(500).json({ error: "Error al actualizar el tercero." });
    }
});
exports.default = router;
