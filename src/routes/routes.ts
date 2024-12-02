import express, { Request, Response, Router } from "express";
import { query } from "../database/db";
import { ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";

const router: Router = express.Router();

// Mostrar todos los endpoints
router.get("/", (_req: Request, res: Response) => {
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
router.get("/routes-history", async (_req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT 
        rh.id AS route_id,
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
  } catch (err) {
    console.error("Error al obtener el histórico de rutas:", err);
    res.status(500).json({ error: "Error al obtener el histórico de rutas" });
  }
});

// Obtener Rutas Pendientes
router.get("/routes/pending", async (_req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT 
        r.id AS route_id, 
        r.route_date, 
        t.name AS third_party_name, 
        t.address, 
        t.contact_name, 
        t.contact_info, 
        r.comment 
      FROM routes_history r 
      JOIN third_parties t ON r.third_party_id = t.id 
      WHERE r.is_finished = false
    `);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error obteniendo las rutas pendientes:", err);
    res.status(500).json({ error: "Error obteniendo las rutas pendientes" });
  }
});

// Actualizar una ruta
router.put("/routes/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { route_date, comment, is_finished, observations } = req.body;
  // Validar id
  if (!id) {
    res.status(400).json({ error: "El ID de la ruta es obligatorio." });
    return;
  }
  // Validar campos
  if (!route_date || !comment || is_finished === undefined) {
    res.status(400).json({
      error:
        "Los campos fecha, ID de tercero, comentario y estado son obligatorios.",
    });
    return;
  }
  try {
    const result = await query(
      `
      UPDATE routes_history
      SET route_date = $1, third_party_id = $2, comment = $3, is_finished = $4, observations = $5
      WHERE id = $6
      RETURNING *;
      `,
      [route_date, comment, is_finished, observations, id]
    );
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
  } catch (err) {
    console.error("Error al actualizar la ruta:", err);
    res.status(500).json({ error: "Error al actualizar la ruta." });
  }
});

// Agregar una nueva ruta
router.post("/add-route", async (req: Request, res: Response) => {
  try {
    const { routes } = req.body;

    if (!routes || !Array.isArray(routes) || routes.length === 0) {
      res.status(400).json({
        error:
          "Debe proporcionar al menos una ruta con fecha, ID de tercero y comentario.",
      });
      return;
    }

    const insertPromises = routes.map((route: any) =>
      query(
        "INSERT INTO routes_history (route_date, third_party_id, comment) VALUES ($1, $2, $3)",
        [route.route_date, route.third_party_id, route.comment]
      )
    );

    await Promise.all(insertPromises);

    res.status(201).json({ message: "Rutas creadas exitosamente." });
  } catch (err) {
    console.error("Error al crear las rutas:", err);
    res.status(500).json({ error: "Error al crear las rutas." });
  }
});

// Eliminar una ruta
router.delete("/route/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: "El ID de la ruta es obligatorio." });
      return;
    }

    const result = await query(
      "DELETE FROM routes_history WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rowCount === 0) {
      res
        .status(404)
        .json({ error: "La ruta con el ID especificado no existe." });
      return;
    }

    res.status(200).json({ message: "Ruta eliminada correctamente." });
  } catch (err) {
    console.error("Error al eliminar la ruta:", err);
    res.status(500).json({ error: "Error al eliminar la ruta." });
  }
});

// Metodos CRUD de Terceros
// Agregar un nuevo tercero
router.post("/add-third-party", async (req: Request, res: Response) => {
  try {
    const { name, address, contact_name, contact_info, category } = req.body;

    if (!name || !address || !category) {
      res.status(400).json({
        error: "Los campos nombre, dirección y categoría son obligatorios.",
      });
      return;
    }

    const result = await query(
      `
      INSERT INTO third_parties (name, address, contact_name, contact_info, category)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
      `,
      [name, address, contact_name || null, contact_info || null, category]
    );

    res.status(201).json({
      message: "Tercero agregado exitosamente",
      thirdParty: result.rows[0],
    });
  } catch (err: any) {
    console.error("Error capturado:", err);

    if (err.code === "23505") {
      res.status(400).json({ error: "El nombre del tercero ya existe." });
    } else {
      res.status(500).json({ error: "Error al agregar el tercero" });
    }
  }
});

// Obtener la lista de terceros
router.get("/third-parties", async (_req: Request, res: Response) => {
  try {
    const result = await query(
      "SELECT id, name, address, contact_name, contact_info, category FROM third_parties"
    );
    res.json(result.rows);
  } catch (err: any) {
    console.error("Error al obtener terceros:", err.message, err.stack);
    res
      .status(500)
      .json({ error: "Error al obtener terceros", details: err.message });
  }
});

// Actualizar un tercero
router.put("/third-parties/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, address, contact_name, contact_info, category } = req.body;

  if (!id || !name || !address || !category) {
    res.status(400).json({
      error: "Los campos ID, nombre, dirección y categoría son obligatorios.",
    });
    return;
  }

  try {
    const result = await query(
      `
      UPDATE third_parties
      SET name = $1, address = $2, contact_name = $3, contact_info = $4, category = $5
      WHERE id = $6
      RETURNING *;
      `,
      [name, address, contact_name || null, contact_info || null, category, id]
    );

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
  } catch (err) {
    console.error("Error al actualizar tercero:", err);
    res.status(500).json({ error: "Error al actualizar el tercero." });
  }
});

// Eliminar un tercero
router.delete(
  "/third-party/:id",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ error: "El ID del tercero es obligatorio." });
        return;
      }

      const result = await query(
        "DELETE FROM third_parties WHERE id = $1 RETURNING *",
        [id]
      );

      if (result.rowCount === 0) {
        res
          .status(404)
          .json({ error: "El tercero con el ID especificado no existe." });
        return;
      }

      res.status(200).json({ message: "Tercero eliminado correctamente." });
    } catch (err) {
      console.error("Error al eliminar tercero:", err);
      res.status(500).json({ error: "Error al eliminar el tercero." });
    }
  }
);

export default router;
