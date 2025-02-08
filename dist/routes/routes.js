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
            url: "/routes-history",
            method: "GET",
            description: "Obtener el histórico de rutas",
        },
        {
            url: "/routes/pending",
            method: "GET",
            description: "Obtener las rutas pendientes",
        },
        {
            url: "/routes/:id",
            method: "PUT",
            description: "Marcar una ruta como hecha",
        },
        {
            url: "/add-route",
            method: "POST",
            description: "Agregar una nueva ruta",
        },
        {
            url: "/route/:id",
            method: "DELETE",
            description: "Eliminar una ruta",
        },
    ];
    res.json(endpoints);
});
// Obtener el histórico de rutas
router.get("/routes-history", async (_req, res) => {
    try {
        const result = await (0, db_1.query)(`
      SELECT 
        rh.id AS route_id,
        rh.route_date AS route_date,
        tp.name AS third_party_name,
        tp.address,
        tp.contact_name,
        tp.contact_info,
        rh.comment,
        rh.is_finished, -- Agregado para obtener el estado
        rh.observations -- Agregado para obtener las observaciones
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
// Actualizar una ruta
router.put("/routes/:id", async (req, res) => {
    const { id } = req.params;
    const { route_date, comment, is_finished, observations } = req.body;
    // Validar id
    if (!id) {
        res.status(400).json({ error: "El ID de la ruta es obligatorio." });
        return;
    }
    // Validar campos obligatorios
    if (!route_date ||
        typeof comment !== "string" ||
        is_finished === undefined) {
        res.status(400).json({
            error: "Los campos 'route_date', 'comment' y 'is_finished' son obligatorios.",
        });
        return;
    }
    try {
        // Ejecutar la consulta SQL
        const result = await (0, db_1.query)(`
        UPDATE routes_history
        SET route_date = $1, comment = $2, is_finished = $3, observations = $4
        WHERE id = $5
        RETURNING *;
        `, [route_date, comment, is_finished, observations || null, id]);
        if (result.rowCount === 0) {
            res
                .status(404)
                .json({ error: "La ruta con el ID especificado no existe." });
            return;
        }
        res.status(200).json({
            message: "Ruta actualizada correctamente.",
            route: result.rows[0],
        });
    }
    catch (err) {
        console.error("Error al actualizar la ruta:", err);
        res.status(500).json({ error: "Error al actualizar la ruta." });
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
        const insertPromises = routes.map((route) => (0, db_1.query)("INSERT INTO routes_history (route_date, third_party_id, comment) VALUES ($1, $2, $3)", [route.route_date, route.third_party_id, route.comment]));
        await Promise.all(insertPromises);
        res.status(201).json({ message: "Rutas creadas exitosamente." });
    }
    catch (err) {
        console.error("Error al crear las rutas:", err);
        res.status(500).json({ error: "Error al crear las rutas." });
    }
});
// Eliminar una ruta
router.delete("/route/:id", async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ error: "El ID de la ruta es obligatorio." });
            return;
        }
        const result = await (0, db_1.query)("DELETE FROM routes_history WHERE id = $1 RETURNING *", [id]);
        if (result.rowCount === 0) {
            res
                .status(404)
                .json({ error: "La ruta con el ID especificado no existe." });
            return;
        }
        res.status(200).json({ message: "Ruta eliminada correctamente." });
    }
    catch (err) {
        console.error("Error al eliminar la ruta:", err);
        res.status(500).json({ error: "Error al eliminar la ruta." });
    }
});
// Metodos CRUD de Terceros
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
        const result = await (0, db_1.query)(`
      INSERT INTO third_parties (name, address, contact_name, contact_info, category)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
      `, [name, address, contact_name || null, contact_info || null, category]);
        res.status(201).json({
            message: "Tercero agregado exitosamente",
            thirdParty: result.rows[0],
        });
    }
    catch (err) {
        console.error("Error capturado:", err);
        if (err.code === "23505") {
            res.status(400).json({ error: "El nombre del tercero ya existe." });
        }
        else {
            res.status(500).json({ error: "Error al agregar el tercero" });
        }
    }
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
// Eliminar un tercero
router.delete("/third-party/:id", async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ error: "El ID del tercero es obligatorio." });
            return;
        }
        const result = await (0, db_1.query)("DELETE FROM third_parties WHERE id = $1 RETURNING *", [id]);
        if (result.rowCount === 0) {
            res
                .status(404)
                .json({ error: "El tercero con el ID especificado no existe." });
            return;
        }
        res.status(200).json({ message: "Tercero eliminado correctamente." });
    }
    catch (err) {
        console.error("Error al eliminar tercero:", err);
        res.status(500).json({ error: "Error al eliminar el tercero." });
    }
});
// Metodos de Productos
// Obtener todos los productos
router.get("/products", async (_req, res) => {
    try {
        const result = await (0, db_1.query)("SELECT * FROM products ORDER BY id ASC");
        res.json(result.rows);
    }
    catch (error) {
        res
            .status(500)
            .json({ error: "Error al obtener productos", details: error });
    }
});
// Obtener un producto por ID
router.get("/products/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const result = await (0, db_1.query)("SELECT * FROM products WHERE id = $1", [id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: "Producto no encontrado" });
            return;
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        res
            .status(500)
            .json({ error: "Error al obtener el producto", details: error });
    }
});
// Crear un nuevo producto
router.post("/products", async (req, res) => {
    try {
        const { name, reference, description, image_url } = req.body;
        const result = await (0, db_1.query)("INSERT INTO products (name, reference, description, image_url) VALUES ($1, $2, $3, $4) RETURNING *", [name, reference, description, image_url]);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        res
            .status(500)
            .json({ error: "Error al crear el producto", details: error });
    }
});
// Actualizar un producto por ID
router.put("/products/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { name, reference, description, image_url } = req.body;
        const result = await (0, db_1.query)("UPDATE products SET name = $1, reference = $2, description = $3, image_url = $4 WHERE id = $5 RETURNING *", [name, reference, description, image_url, id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: "Producto no encontrado" });
            return;
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        res
            .status(500)
            .json({ error: "Error al actualizar el producto", details: error });
    }
});
// Eliminar un producto por ID
router.delete("/products/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const result = await (0, db_1.query)("DELETE FROM products WHERE id = $1 RETURNING *", [id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: "Producto no encontrado" });
            return;
        }
        res.json({
            message: "Producto eliminado con éxito",
            deletedProduct: result.rows[0],
        });
    }
    catch (error) {
        res
            .status(500)
            .json({ error: "Error al eliminar el producto", details: error });
    }
});
exports.default = router;
