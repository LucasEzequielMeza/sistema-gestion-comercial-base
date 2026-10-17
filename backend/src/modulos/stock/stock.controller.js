import { pool } from '../../db.js';

const cantidadValida = (valor, permiteCero = false) => {
    if (
        valor === undefined ||
        valor === null ||
        valor === '' ||
        typeof valor === 'boolean' ||
        !Number.isFinite(Number(valor))
    ) {
        return false;
    }

    const numero = Number(valor);

    if (permiteCero ? numero < 0 : numero <= 0) {
        return false;
    }

    // La base admite hasta 10 dígitos enteros y 3 decimales.
    if (numero >= 10_000_000) {
        return false;
    }

    return Number.isInteger(numero * 1000);
};

export const obtenerStock = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, nombre, codigo, stock, stock_minimo, activo
            FROM productos
            WHERE comercio_id = $1
              AND activo = true
            ORDER BY nombre ASC`,
            [req.comercioId]
        );

        return res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error al obtener el stock:', error.message);

        return res.status(500).json({
            message: 'Error al obtener el stock'
        });
    }
};

export const obtenerStockPorProducto = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `SELECT id, nombre, codigo, stock, stock_minimo, activo
            FROM productos
            WHERE id = $1
              AND comercio_id = $2`,
            [id, req.comercioId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                message: 'Producto no encontrado'
            });
        }

        return res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error al obtener el stock del producto:', error.message);

        return res.status(500).json({
            message: 'Error al obtener el stock del producto'
        });
    }
};

export const aumentarStock = async (req, res) => {
    const { id } = req.params;
    const { cantidad, motivo } = req.body;
    const usuarioId = req.userId;

    if (!cantidadValida(cantidad)) {
        return res.status(400).json({
            message: 'La cantidad debe ser un número mayor a cero con hasta tres decimales'
        });
    }

    if (typeof motivo !== 'string' || !motivo.trim()) {
        return res.status(400).json({
            message: 'El motivo es obligatorio'
        });
    }

    const client = await pool.connect();
    let transaccionIniciada = false;

    try {
        await client.query('BEGIN');
        transaccionIniciada = true;

        const productoResult = await client.query(
            `SELECT id, nombre, codigo, stock, stock_minimo, activo
            FROM productos
            WHERE id = $1
              AND comercio_id = $2
            FOR UPDATE`,
            [id, req.comercioId]
        );

        if (productoResult.rowCount === 0) {
            await client.query('ROLLBACK');
            transaccionIniciada = false;

            return res.status(404).json({
                message: 'Producto no encontrado'
            });
        }

        const producto = productoResult.rows[0];

        if (!producto.activo) {
            await client.query('ROLLBACK');
            transaccionIniciada = false;

            return res.status(400).json({
                message: 'No se puede modificar el stock de un producto inactivo'
            });
        }

        const stockAnterior = Number(producto.stock);
        const stockNuevo = stockAnterior + Number(cantidad);

        if (!cantidadValida(stockNuevo, true)) {
            await client.query('ROLLBACK');
            transaccionIniciada = false;

            return res.status(400).json({
                message: 'El stock resultante supera el límite permitido'
            });
        }

        const result = await client.query(
            `UPDATE productos
            SET stock = $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
              AND comercio_id = $3
            RETURNING id, nombre, codigo, stock, stock_minimo, activo`,
            [stockNuevo, id, req.comercioId]
        );

        await client.query(
            `INSERT INTO movimientos_stock (
                comercio_id,
                producto_id,
                tipo,
                cantidad,
                motivo,
                stock_anterior,
                stock_nuevo,
                usuario_id
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
                req.comercioId,
                id,
                'entrada',
                cantidad,
                motivo.trim(),
                stockAnterior,
                stockNuevo,
                usuarioId
            ]
        );

        await client.query('COMMIT');
        transaccionIniciada = false;

        return res.status(200).json({
            message: 'Stock aumentado exitosamente',
            producto: result.rows[0]
        });
    } catch (error) {
        if (transaccionIniciada) {
            await client.query('ROLLBACK').catch(() => {});
        }

        console.error('Error al aumentar el stock:', error.message);

        return res.status(500).json({
            message: 'Error al aumentar el stock'
        });
    } finally {
        client.release();
    }
};

export const disminuirStock = async (req, res) => {
    const { id } = req.params;
    const { cantidad, motivo } = req.body;
    const usuarioId = req.userId;

    if (!cantidadValida(cantidad)) {
        return res.status(400).json({
            message: 'La cantidad debe ser un número mayor a cero con hasta tres decimales'
        });
    }

    if (typeof motivo !== 'string' || !motivo.trim()) {
        return res.status(400).json({
            message: 'El motivo es obligatorio'
        });
    }

    const client = await pool.connect();
    let transaccionIniciada = false;

    try {
        await client.query('BEGIN');
        transaccionIniciada = true;

        const productoResult = await client.query(
            `SELECT id, nombre, codigo, stock, stock_minimo, activo
            FROM productos
            WHERE id = $1
              AND comercio_id = $2
            FOR UPDATE`,
            [id, req.comercioId]
        );

        if (productoResult.rowCount === 0) {
            await client.query('ROLLBACK');
            transaccionIniciada = false;

            return res.status(404).json({
                message: 'Producto no encontrado'
            });
        }

        const producto = productoResult.rows[0];

        if (!producto.activo) {
            await client.query('ROLLBACK');
            transaccionIniciada = false;

            return res.status(400).json({
                message: 'No se puede modificar el stock de un producto inactivo'
            });
        }

        const stockAnterior = Number(producto.stock);
        const stockNuevo = stockAnterior - Number(cantidad);

        if (stockNuevo < 0) {
            await client.query('ROLLBACK');
            transaccionIniciada = false;

            return res.status(400).json({
                message: 'No hay suficiente stock disponible'
            });
        }

        const result = await client.query(
            `UPDATE productos
            SET stock = $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
              AND comercio_id = $3
            RETURNING id, nombre, codigo, stock, stock_minimo, activo`,
            [stockNuevo, id, req.comercioId]
        );

        await client.query(
            `INSERT INTO movimientos_stock (
                comercio_id,
                producto_id,
                tipo,
                cantidad,
                motivo,
                stock_anterior,
                stock_nuevo,
                usuario_id
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
                req.comercioId,
                id,
                'salida',
                cantidad,
                motivo.trim(),
                stockAnterior,
                stockNuevo,
                usuarioId
            ]
        );

        await client.query('COMMIT');
        transaccionIniciada = false;

        return res.status(200).json({
            message: 'Stock disminuido exitosamente',
            producto: result.rows[0]
        });
    } catch (error) {
        if (transaccionIniciada) {
            await client.query('ROLLBACK').catch(() => {});
        }

        console.error('Error al disminuir el stock:', error.message);

        return res.status(500).json({
            message: 'Error al disminuir el stock'
        });
    } finally {
        client.release();
    }
};

export const obtenerProductosConStockBajo = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, nombre, codigo, stock, stock_minimo, activo
            FROM productos
            WHERE comercio_id = $1
              AND stock <= stock_minimo
              AND activo = true
            ORDER BY stock ASC`,
            [req.comercioId]
        );

        return res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error al obtener los productos con stock bajo:', error.message);

        return res.status(500).json({
            message: 'Error al obtener los productos con stock bajo'
        });
    }
};

// Ajustamos el stock según el recuento físico.
export const ajustarStock = async (req, res) => {
    const { id } = req.params;
    const { cantidad, motivo } = req.body;
    const usuarioId = req.userId;

    if (!cantidadValida(cantidad, true)) {
        return res.status(400).json({
            message: 'El stock debe ser un número igual o mayor a cero con hasta tres decimales'
        });
    }

    if (typeof motivo !== 'string' || !motivo.trim()) {
        return res.status(400).json({
            message: 'El motivo es obligatorio'
        });
    }

    const client = await pool.connect();
    let transaccionIniciada = false;

    try {
        await client.query('BEGIN');
        transaccionIniciada = true;

        const productoResult = await client.query(
            `SELECT id, nombre, codigo, stock, stock_minimo, activo
            FROM productos
            WHERE id = $1
              AND comercio_id = $2
            FOR UPDATE`,
            [id, req.comercioId]
        );

        if (productoResult.rowCount === 0) {
            await client.query('ROLLBACK');
            transaccionIniciada = false;

            return res.status(404).json({
                message: 'Producto no encontrado'
            });
        }

        const producto = productoResult.rows[0];

        if (!producto.activo) {
            await client.query('ROLLBACK');
            transaccionIniciada = false;

            return res.status(400).json({
                message: 'No se puede modificar el stock de un producto inactivo'
            });
        }

        const stockAnterior = Number(producto.stock);
        const stockNuevo = Number(cantidad);
        const diferencia = Math.abs(stockNuevo - stockAnterior);

        if (diferencia === 0) {
            await client.query('ROLLBACK');
            transaccionIniciada = false;

            return res.status(400).json({
                message: 'El stock ingresado es igual al stock actual'
            });
        }

        const result = await client.query(
            `UPDATE productos
            SET stock = $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
              AND comercio_id = $3
            RETURNING id, nombre, codigo, stock, stock_minimo, activo`,
            [stockNuevo, id, req.comercioId]
        );

        await client.query(
            `INSERT INTO movimientos_stock (
                comercio_id,
                producto_id,
                tipo,
                cantidad,
                motivo,
                stock_anterior,
                stock_nuevo,
                usuario_id
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
                req.comercioId,
                id,
                'ajuste',
                diferencia,
                motivo.trim(),
                stockAnterior,
                stockNuevo,
                usuarioId
            ]
        );

        await client.query('COMMIT');
        transaccionIniciada = false;

        return res.status(200).json({
            message: 'Stock ajustado exitosamente',
            producto: result.rows[0]
        });
    } catch (error) {
        if (transaccionIniciada) {
            await client.query('ROLLBACK').catch(() => {});
        }

        console.error('Error al ajustar el stock:', error.message);

        return res.status(500).json({
            message: 'Error al ajustar el stock'
        });
    } finally {
        client.release();
    }
};

export const actualizarStockMinimo = async (req, res) => {
    const { id } = req.params;
    const { stock_minimo } = req.body;

    if (!cantidadValida(stock_minimo, true)) {
        return res.status(400).json({
            message: 'El stock mínimo debe ser un número igual o mayor a cero con hasta tres decimales'
        });
    }

    try {
        const result = await pool.query(
            `UPDATE productos
            SET stock_minimo = $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
              AND comercio_id = $3
            RETURNING id, nombre, codigo, stock, stock_minimo, activo`,
            [Number(stock_minimo), id, req.comercioId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                message: 'Producto no encontrado'
            });
        }

        return res.status(200).json({
            message: 'Stock mínimo actualizado exitosamente',
            producto: result.rows[0]
        });
    } catch (error) {
        console.error('Error al actualizar el stock mínimo:', error.message);

        return res.status(500).json({
            message: 'Error al actualizar el stock mínimo'
        });
    }
};

export const obtenerInformeMovimientosStock = async (req, res, next) => {
    const { desde, hasta, tipo, producto_id, usuario_id } = req.query;

    try {
        if (desde && hasta && desde > hasta) {
            return res.status(400).json({
                message: 'La fecha desde no puede ser posterior a la fecha hasta'
            });
        }

        if (tipo && !['entrada', 'salida', 'ajuste'].includes(tipo)) {
            return res.status(400).json({
                message: 'El tipo de movimiento seleccionado no es válido'
            });
        }

        const valores = [req.comercioId];
        const condiciones = ['movimientos_stock.comercio_id = $1'];

        if (desde) {
            valores.push(desde);
            condiciones.push(`movimientos_stock.created_at >= $${valores.length}::date`);
        }

        if (hasta) {
            valores.push(hasta);
            condiciones.push(`movimientos_stock.created_at < ($${valores.length}::date + INTERVAL '1 day')`);
        }

        if (tipo) {
            valores.push(tipo);
            condiciones.push(`movimientos_stock.tipo = $${valores.length}`);
        }

        if (producto_id) {
            valores.push(producto_id);
            condiciones.push(`movimientos_stock.producto_id = $${valores.length}`);
        }

        if (usuario_id) {
            valores.push(usuario_id);
            condiciones.push(`movimientos_stock.usuario_id = $${valores.length}`);
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
                ON productos.id = movimientos_stock.producto_id
                AND productos.comercio_id = movimientos_stock.comercio_id
            LEFT JOIN usuarios
                ON usuarios.id = movimientos_stock.usuario_id
                AND usuarios.comercio_id = movimientos_stock.comercio_id
            WHERE ${condiciones.join(' AND ')}
            ORDER BY movimientos_stock.created_at DESC`,
            valores
        );

        const movimientos = result.rows;

        const resumen = movimientos.reduce(
            (acumulado, movimiento) => {
                const cantidad = Number(movimiento.cantidad);

                acumulado.total_movimientos += 1;

                if (movimiento.tipo === 'entrada') {
                    acumulado.cantidad_entradas += 1;
                    acumulado.unidades_entradas += cantidad;
                } else if (movimiento.tipo === 'salida') {
                    acumulado.cantidad_salidas += 1;
                    acumulado.unidades_salidas += cantidad;
                } else if (movimiento.tipo === 'ajuste') {
                    acumulado.cantidad_ajustes += 1;
                }

                return acumulado;
            },
            {
                total_movimientos: 0,
                cantidad_entradas: 0,
                unidades_entradas: 0,
                cantidad_salidas: 0,
                unidades_salidas: 0,
                cantidad_ajustes: 0
            }
        );

        return res.status(200).json({
            filtros: {
                desde: desde || null,
                hasta: hasta || null,
                tipo: tipo || null,
                producto_id: producto_id || null,
                usuario_id: usuario_id || null
            },
            resumen,
            movimientos
        });
    } catch (error) {
        console.error('Error al generar el informe de movimientos de stock:', error.message);
        return next(error);
    }
};