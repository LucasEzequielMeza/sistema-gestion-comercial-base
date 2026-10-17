import { pool } from '../../db.js';

export const crearCategoria = async (req, res, next) => {
    const { nombre, descripcion } = req.body;

    try {
        if (!req.comercioId) {
            return res.status(401).json({
                success: false,
                message: 'La sesión no tiene un comercio asignado'
            });
        }

        const result = await pool.query(
            `INSERT INTO categorias (comercio_id, nombre, descripcion)
            VALUES ($1, $2, $3)
            RETURNING *`,
            [req.comercioId, nombre, descripcion ?? null]
        );

        return res.status(201).json({
            success: true,
            message: 'Categoría creada exitosamente',
            categoria: result.rows[0]
        });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({
                success: false,
                message: 'Ya existe una categoría con ese nombre en tu comercio'
            });
        }

        console.error('Error al crear la categoría:', error.message);
        return next(error);
    }
};

export const obtenerCategorias = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT *
            FROM categorias
            WHERE comercio_id = $1
            ORDER BY nombre ASC`,
            [req.comercioId]
        );

        return res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error al obtener las categorías:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Error al obtener las categorías'
        });
    }
};

export const obtenerCategoriaPorId = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `SELECT *
            FROM categorias
            WHERE id = $1
              AND comercio_id = $2`,
            [id, req.comercioId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Categoría no encontrada'
            });
        }

        return res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error al obtener la categoría:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Error al obtener la categoría'
        });
    }
};

export const actualizarCategoria = async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;

    try {
        const result = await pool.query(
            `UPDATE categorias
            SET nombre = $1,
                descripcion = $2,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
              AND comercio_id = $4
            RETURNING *`,
            [nombre, descripcion ?? null, id, req.comercioId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Categoría no encontrada'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Categoría actualizada exitosamente',
            categoria: result.rows[0]
        });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({
                success: false,
                message: 'Ya existe una categoría con ese nombre en tu comercio'
            });
        }

        console.error('Error al actualizar la categoría:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Error al actualizar la categoría'
        });
    }
};

export const buscarCategorias = async (req, res) => {
    const { search } = res.locals.queryValidada;

    try {
        const result = await pool.query(
            `SELECT *
            FROM categorias
            WHERE comercio_id = $1
              AND nombre ILIKE $2
            ORDER BY nombre ASC`,
            [req.comercioId, `%${search}%`]
        );

        return res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error al buscar categorías:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Error al buscar categorías'
        });
    }
};

export const desactivarCategoria = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `UPDATE categorias
            SET activo = false,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
              AND comercio_id = $2
            RETURNING *`,
            [id, req.comercioId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Categoría no encontrada'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Categoría desactivada exitosamente',
            categoria: result.rows[0]
        });
    } catch (error) {
        console.error('Error al desactivar la categoría:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Error al desactivar la categoría'
        });
    }
};

export const activarCategoria = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `UPDATE categorias
            SET activo = true,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
              AND comercio_id = $2
            RETURNING *`,
            [id, req.comercioId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Categoría no encontrada'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Categoría activada exitosamente',
            categoria: result.rows[0]
        });
    } catch (error) {
        console.error('Error al activar la categoría:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Error al activar la categoría'
        });
    }
};