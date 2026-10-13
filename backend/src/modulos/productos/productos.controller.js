import {pool} from '../../db.js';

export const crearProducto = async (req, res, next) => {
    let client;

    try {
        const {
            nombre, descripcion, imagen, codigo, categoria_id,
            precio_compra, precio_venta, stock, stock_minimo
        } = req.body;

        client = await pool.connect();
        await client.query('BEGIN');

        if (!categoria_id) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'Debés seleccionar una categoría'
            });
        }

        const categoria = await client.query(
            `SELECT id
            FROM categorias
            WHERE id = $1 AND activo = true`,
            [categoria_id]
        );

        if (categoria.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'La categoría seleccionada no existe o está inactiva'
            });
        }

        const result = await client.query(
            `INSERT INTO productos (
                nombre, descripcion, imagen, codigo, categoria_id,
                precio_compra, precio_venta, stock, stock_minimo
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *`,
            [
                nombre, descripcion ?? null, imagen ?? null, codigo,
                categoria_id, precio_compra, precio_venta,
                stock ?? 0, stock_minimo ?? 0
            ]
        );

        await client.query('COMMIT');

        return res.status(201).json({
            success: true,
            message: 'Producto creado exitosamente',
            producto: result.rows[0]
        });
    } catch (error) {
        if (client) {
            try {
                await client.query('ROLLBACK');
            } catch (rollbackError) {
                console.error('Error al deshacer la transacción:', rollbackError.message);
            }
        }

        if (error.code === '23505') {
            return res.status(409).json({
                success: false,
                message: 'El código del producto ya existe'
            });
        }

        if (error.code === '23503') {
            return res.status(400).json({
                success: false,
                message: 'La categoría seleccionada no existe'
            });
        }

        console.error('Error al crear el producto:', error.message);
        return next(error);
    } finally {
        if (client) client.release();
    }
};

export const obtenerProductos = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                productos.id,
                productos.nombre,
                productos.descripcion,
                productos.imagen,
                productos.codigo,
                productos.categoria_id,
                categorias.nombre AS categoria_nombre,
                productos.precio_compra,
                productos.precio_venta,
                productos.stock,
                productos.stock_minimo,
                productos.activo,
                productos.created_at,
                productos.updated_at
            FROM productos
            LEFT JOIN categorias
                ON productos.categoria_id = categorias.id
            ORDER BY productos.nombre ASC`
        );

        return res.status(200).json(result.rows);

    } catch (error) {
        console.error('Error al obtener los productos:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Error al obtener los productos'
        });
    }
};

export const obtenerProductoPorId = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `SELECT
                productos.id,
                productos.nombre,
                productos.descripcion,
                productos.imagen,
                productos.codigo,
                productos.categoria_id,
                categorias.nombre AS categoria_nombre,
                productos.precio_compra,
                productos.precio_venta,
                productos.stock,
                productos.stock_minimo,
                productos.activo,
                productos.created_at,
                productos.updated_at
            FROM productos
            LEFT JOIN categorias
                ON productos.categoria_id = categorias.id
            WHERE productos.id = $1`,
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                message: 'Producto no encontrado'
            });
        }

        return res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error al obtener el producto:', error.message);

        return res.status(500).json({
            message: 'Error al obtener el producto'
        });
    }

};

export const actualizarProducto = async (req, res) => {
    const { id } = req.params;
    const {
        nombre, descripcion, imagen, codigo, categoria_id,
        precio_compra, precio_venta
    } = req.body;

    try {
        if (!categoria_id) {
            return res.status(400).json({
                message: 'Debés seleccionar una categoría'
            });
        }

        const categoria = await pool.query(
            `SELECT id
            FROM categorias
            WHERE id = $1 AND activo = true`,
            [categoria_id]
        );

        if (categoria.rowCount === 0) {
            return res.status(400).json({
                message: 'La categoría seleccionada no existe o está inactiva'
            });
        }

        const result = await pool.query(
            `UPDATE productos
            SET nombre = $1,
                descripcion = $2,
                imagen = $3,
                codigo = $4,
                categoria_id = $5,
                precio_compra = $6,
                precio_venta = $7,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $8
            RETURNING *`,
            [
                nombre,
                descripcion ?? null,
                imagen ?? null,
                codigo,
                categoria_id,
                precio_compra,
                precio_venta,
                id
            ]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                message: 'Producto no encontrado'
            });
        }

        return res.status(200).json({
            message: 'Producto actualizado exitosamente',
            producto: result.rows[0]
        });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({
                message: 'El código del producto ya existe'
            });
        }

        console.error('Error al actualizar el producto:', error.message);

        return res.status(500).json({
            message: 'Error al actualizar el producto'
        });
    }

};


export const buscarProductos = async (req, res) => {
    const { search } = res.locals.queryValidada;

    try {
        const result = await pool.query(
            `SELECT
                productos.id,
                productos.nombre,
                productos.descripcion,
                productos.imagen,
                productos.codigo,
                productos.categoria_id,
                categorias.nombre AS categoria_nombre,
                productos.precio_compra,
                productos.precio_venta,
                productos.stock,
                productos.stock_minimo,
                productos.activo,
                productos.created_at,
                productos.updated_at
            FROM productos
            LEFT JOIN categorias
                ON productos.categoria_id = categorias.id
            WHERE productos.activo = true
                AND (
                    productos.nombre ILIKE $1
                    OR productos.codigo ILIKE $1
                )
            ORDER BY productos.nombre ASC
            LIMIT 50`,
            [`%${search}%`]
        );

        return res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error al buscar productos:', error.message);

        return res.status(500).json({
            message: 'Error al buscar productos'
        });
    }
};

export const desactivarProducto = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `UPDATE productos
            SET activo = false,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *`,
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                message: 'Producto no encontrado'
            });
        }

        return res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error al desactivar el producto:', error.message);

        return res.status(500).json({
            message: 'Error al desactivar el producto'
        });
    }
};

export const activarProducto = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `UPDATE productos
            SET activo = true,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *`,
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                message: 'Producto no encontrado'
            });
        }

        return res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error al activar el producto:', error.message);

        return res.status(500).json({
            message: 'Error al activar el producto'
        });
    }
};

export const obtenerProductosInactivos = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                productos.id,
                productos.nombre,
                productos.descripcion,
                productos.imagen,
                productos.codigo,
                productos.categoria_id,
                categorias.nombre AS categoria_nombre,
                productos.precio_compra,
                productos.precio_venta,
                productos.stock,
                productos.stock_minimo,
                productos.activo,
                productos.created_at,
                productos.updated_at
            FROM productos
            LEFT JOIN categorias
                ON productos.categoria_id = categorias.id
            WHERE productos.activo = false
            ORDER BY productos.nombre ASC`
        );

        return res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error al obtener los productos inactivos:', error.message);

        return res.status(500).json({
            message: 'Error al obtener los productos inactivos'
        });
    }
};

export const eliminarProducto = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `DELETE FROM productos
            WHERE id = $1
            RETURNING id`,
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                message: 'Producto no encontrado'
            });
        }

        return res.status(200).json({
            message: 'Producto eliminado definitivamente'
        });
    } catch (error) {
        if (error.code === '23503') {
            return res.status(409).json({
                message: 'No se puede eliminar este producto porque tiene registros asociados'
            });
        }

        console.error('Error al eliminar el producto:', error.message);

        return res.status(500).json({
            message: 'Error al eliminar el producto'
        });
    }
};