import { pool } from '../../db.js';

// Obtenemos los movimientos de stock del comercio autenticado.
export const obtenerMovimientosStock = async (req, res) => {
    try {
        if (!req.comercioId) {
            return res.status(401).json({
                message: 'La sesión no tiene un comercio asignado'
            });
        }

        const result = await pool.query(
            `SELECT
                movimientos_stock.id,
                movimientos_stock.producto_id,
                productos.nombre AS producto_nombre,
                productos.codigo AS producto_codigo,
                movimientos_stock.tipo,
                movimientos_stock.cantidad,
                movimientos_stock.motivo,
                movimientos_stock.stock_anterior,
                movimientos_stock.stock_nuevo,
                movimientos_stock.usuario_id,
                usuarios.nombre AS usuario_nombre,
                usuarios.apellido AS usuario_apellido,
                movimientos_stock.created_at
            FROM movimientos_stock
            INNER JOIN productos
                ON movimientos_stock.producto_id = productos.id
                AND productos.comercio_id = movimientos_stock.comercio_id
            LEFT JOIN usuarios
                ON movimientos_stock.usuario_id = usuarios.id
                AND usuarios.comercio_id = movimientos_stock.comercio_id
            WHERE movimientos_stock.comercio_id = $1
            ORDER BY movimientos_stock.created_at DESC`,
            [req.comercioId]
        );

        return res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error al obtener los movimientos de stock:', error.message);

        return res.status(500).json({
            message: 'Error al obtener los movimientos de stock'
        });
    }
};

// Obtenemos los movimientos de un producto del comercio autenticado.
export const obtenerMovimientosStockPorProducto = async (req, res) => {
    const { id } = req.params;

    try {
        if (!req.comercioId) {
            return res.status(401).json({
                message: 'La sesión no tiene un comercio asignado'
            });
        }

        const productoResult = await pool.query(
            `SELECT id, nombre, codigo
            FROM productos
            WHERE id = $1
              AND comercio_id = $2`,
            [id, req.comercioId]
        );

        if (productoResult.rowCount === 0) {
            return res.status(404).json({
                message: 'Producto no encontrado'
            });
        }

        const result = await pool.query(
            `SELECT
                movimientos_stock.id,
                movimientos_stock.producto_id,
                productos.nombre AS producto_nombre,
                productos.codigo AS producto_codigo,
                movimientos_stock.tipo,
                movimientos_stock.cantidad,
                movimientos_stock.motivo,
                movimientos_stock.stock_anterior,
                movimientos_stock.stock_nuevo,
                movimientos_stock.usuario_id,
                usuarios.nombre AS usuario_nombre,
                usuarios.apellido AS usuario_apellido,
                movimientos_stock.created_at
            FROM movimientos_stock
            INNER JOIN productos
                ON movimientos_stock.producto_id = productos.id
                AND productos.comercio_id = movimientos_stock.comercio_id
            LEFT JOIN usuarios
                ON movimientos_stock.usuario_id = usuarios.id
                AND usuarios.comercio_id = movimientos_stock.comercio_id
            WHERE movimientos_stock.producto_id = $1
              AND movimientos_stock.comercio_id = $2
              AND productos.comercio_id = $2
            ORDER BY movimientos_stock.created_at DESC`,
            [id, req.comercioId]
        );

        return res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error al obtener los movimientos del producto:', error.message);

        return res.status(500).json({
            message: 'Error al obtener los movimientos del producto'
        });
    }
};