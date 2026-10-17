import { pool } from '../../db.js';

export const crearProveedor = async (req, res, next) => {
    const { nombre, cuit, telefono, mail, direccion, contacto, observaciones } = req.body;

    try {
        if (!req.comercioId) {
            return res.status(401).json({
                message: 'La sesión no tiene un comercio asignado'
            });
        }

        const result = await pool.query(
            `INSERT INTO proveedores (comercio_id, nombre, cuit, telefono, mail, direccion, contacto, observaciones)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *`,
            [req.comercioId, nombre, cuit, telefono, mail, direccion, contacto, observaciones]
        );

        return res.status(201).json({
            message: 'Proveedor creado exitosamente',
            proveedor: result.rows[0]
        });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({
                message: 'Ya existe un proveedor con ese CUIT en tu comercio'
            });
        }

        console.error('Error al crear el proveedor:', error.message);
        return next(error);
    }
};

export const obtenerProveedores = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT *
            FROM proveedores
            WHERE comercio_id = $1
            ORDER BY nombre ASC`,
            [req.comercioId]
        );

        return res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error al obtener los proveedores:', error.message);

        return res.status(500).json({
            message: 'Error al obtener los proveedores'
        });
    }
};

export const obtenerProveedorPorId = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `SELECT *
            FROM proveedores
            WHERE id = $1
              AND comercio_id = $2`,
            [id, req.comercioId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                message: 'Proveedor no encontrado'
            });
        }

        return res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error al obtener el proveedor:', error.message);

        return res.status(500).json({
            message: 'Error al obtener el proveedor'
        });
    }
};

export const actualizarProveedor = async (req, res) => {
    const { id } = req.params;
    const { nombre, cuit, telefono, mail, direccion, contacto, observaciones } = req.body;

    try {
        const result = await pool.query(
            `UPDATE proveedores
            SET nombre = $1,
                cuit = $2,
                telefono = $3,
                mail = $4,
                direccion = $5,
                contacto = $6,
                observaciones = $7,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $8
              AND comercio_id = $9
            RETURNING *`,
            [nombre, cuit, telefono, mail, direccion, contacto, observaciones, id, req.comercioId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                message: 'Proveedor no encontrado'
            });
        }

        return res.status(200).json({
            message: 'Proveedor actualizado exitosamente',
            proveedor: result.rows[0]
        });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({
                message: 'Ya existe un proveedor con ese CUIT en tu comercio'
            });
        }

        console.error('Error al actualizar el proveedor:', error.message);

        return res.status(500).json({
            message: 'Error al actualizar el proveedor'
        });
    }
};

export const buscarProveedores = async (req, res) => {
    const { search } = res.locals.queryValidada;

    try {
        const result = await pool.query(
            `SELECT *
            FROM proveedores
            WHERE comercio_id = $1
              AND (nombre ILIKE $2 OR cuit ILIKE $2)
            ORDER BY nombre ASC`,
            [req.comercioId, `%${search}%`]
        );

        return res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error al buscar proveedores:', error.message);

        return res.status(500).json({
            message: 'Error al buscar proveedores'
        });
    }
};

export const desactivarProveedor = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `UPDATE proveedores
            SET activo = false,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
              AND comercio_id = $2
            RETURNING *`,
            [id, req.comercioId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                message: 'Proveedor no encontrado'
            });
        }

        return res.status(200).json({
            message: 'Proveedor desactivado exitosamente',
            proveedor: result.rows[0]
        });
    } catch (error) {
        console.error('Error al desactivar el proveedor:', error.message);

        return res.status(500).json({
            message: 'Error al desactivar el proveedor'
        });
    }
};

export const activarProveedor = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `UPDATE proveedores
            SET activo = true,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
              AND comercio_id = $2
            RETURNING *`,
            [id, req.comercioId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                message: 'Proveedor no encontrado'
            });
        }

        return res.status(200).json({
            message: 'Proveedor activado exitosamente',
            proveedor: result.rows[0]
        });
    } catch (error) {
        console.error('Error al activar el proveedor:', error.message);

        return res.status(500).json({
            message: 'Error al activar el proveedor'
        });
    }
};

// Obtenemos los productos asociados a un proveedor del comercio autenticado.
export const obtenerProductosProveedor = async (req, res) => {
    const { id } = req.params;

    try {
        const proveedor = await pool.query(
            `SELECT id
            FROM proveedores
            WHERE id = $1
              AND comercio_id = $2`,
            [id, req.comercioId]
        );

        if (proveedor.rowCount === 0) {
            return res.status(404).json({
                message: 'Proveedor no encontrado'
            });
        }

        const result = await pool.query(
            `SELECT
                productos.id,
                productos.nombre,
                productos.descripcion,
                productos.codigo,
                productos.categoria_id,
                productos.precio_compra AS precio_compra_general,
                productos.precio_venta,
                productos.stock,
                productos.stock_minimo,
                productos.activo,
                proveedores_productos.precio_compra AS precio_compra_proveedor,
                proveedores_productos.codigo_proveedor,
                proveedores_productos.created_at,
                proveedores_productos.updated_at
            FROM proveedores_productos
            INNER JOIN proveedores
                ON proveedores.id = proveedores_productos.proveedor_id
            INNER JOIN productos
                ON productos.id = proveedores_productos.producto_id
            WHERE proveedores_productos.proveedor_id = $1
              AND proveedores.comercio_id = $2
              AND productos.comercio_id = $2
            ORDER BY productos.nombre ASC`,
            [id, req.comercioId]
        );

        return res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error al obtener los productos del proveedor:', error.message);

        return res.status(500).json({
            message: 'Error al obtener los productos del proveedor'
        });
    }
};

// Asociamos un producto del mismo comercio al proveedor o actualizamos su costo.
export const asociarProductoProveedor = async (req, res) => {
    const { id } = req.params;
    const { producto_id, precio_compra, codigo_proveedor } = req.body;

    if (
        !producto_id ||
        precio_compra === undefined ||
        precio_compra === null ||
        precio_compra === '' ||
        !Number.isFinite(Number(precio_compra)) ||
        Number(precio_compra) < 0
    ) {
        return res.status(400).json({
            message: 'El producto y un precio de compra válido son obligatorios'
        });
    }

    try {
        const proveedor = await pool.query(
            `SELECT id
            FROM proveedores
            WHERE id = $1
              AND comercio_id = $2
              AND activo = true`,
            [id, req.comercioId]
        );

        if (proveedor.rowCount === 0) {
            return res.status(404).json({
                message: 'Proveedor no encontrado o inactivo'
            });
        }

        const producto = await pool.query(
            `SELECT id
            FROM productos
            WHERE id = $1
              AND comercio_id = $2
              AND activo = true`,
            [producto_id, req.comercioId]
        );

        if (producto.rowCount === 0) {
            return res.status(404).json({
                message: 'Producto no encontrado o inactivo en tu comercio'
            });
        }

        const result = await pool.query(
            `INSERT INTO proveedores_productos (proveedor_id, producto_id, precio_compra, codigo_proveedor)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (proveedor_id, producto_id)
            DO UPDATE SET
                precio_compra = EXCLUDED.precio_compra,
                codigo_proveedor = EXCLUDED.codigo_proveedor,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *`,
            [id, producto_id, Number(precio_compra), codigo_proveedor || null]
        );

        return res.status(200).json({
            message: 'Producto asociado al proveedor exitosamente',
            relacion: result.rows[0]
        });
    } catch (error) {
        console.error('Error al asociar el producto al proveedor:', error.message);

        return res.status(500).json({
            message: 'Error al asociar el producto al proveedor'
        });
    }
};

// Quitamos la relación sin eliminar el producto del catálogo.
export const quitarProductoProveedor = async (req, res) => {
    const { id, productoId } = req.params;

    try {
        const result = await pool.query(
            `DELETE FROM proveedores_productos
            USING proveedores, productos
            WHERE proveedores_productos.proveedor_id = proveedores.id
              AND proveedores_productos.producto_id = productos.id
              AND proveedores_productos.proveedor_id = $1
              AND proveedores_productos.producto_id = $2
              AND proveedores.comercio_id = $3
              AND productos.comercio_id = $3
            RETURNING proveedores_productos.producto_id`,
            [id, productoId, req.comercioId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                message: 'El producto no está asociado a este proveedor'
            });
        }

        return res.status(200).json({
            message: 'Producto quitado del proveedor exitosamente'
        });
    } catch (error) {
        console.error('Error al quitar el producto del proveedor:', error.message);

        return res.status(500).json({
            message: 'Error al quitar el producto del proveedor'
        });
    }
};