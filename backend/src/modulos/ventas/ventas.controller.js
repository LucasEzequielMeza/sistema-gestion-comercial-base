import { pool } from '../../db.js';
import { crearVentaSchema } from '../../schemas/ventas/ventas.schema.js';

export const crearVenta = async (req, res, next) => {
    const validacion = crearVentaSchema.safeParse(req.body);

    if (!validacion.success) {
        return res.status(400).json({
            message: 'Los datos de la venta no son válidos',
            errores: validacion.error.issues
        });
    }

    const { detalles, pagos } = validacion.data;

    let client;
    let transaccionIniciada = false;

    try {
        client = await pool.connect();

        await client.query('BEGIN');
        transaccionIniciada = true;

        // Bloqueo los productos en un orden fijo para evitar conflictos entre ventas simultáneas.
        const detallesOrdenados = [...detalles].sort((a, b) =>
            a.producto_id.localeCompare(b.producto_id)
        );

        const productosVenta = new Map();

        for (const detalle of detallesOrdenados) {
            const productoResult = await client.query(
                `SELECT
                    productos.id,
                    productos.nombre,
                    productos.codigo,
                    productos.precio_venta,
                    productos.stock,
                    productos.activo
                FROM productos
                WHERE productos.id = $1
                FOR UPDATE`,
                [detalle.producto_id]
            );

            if (productoResult.rows.length === 0) {
                const error = new Error('Uno de los productos no existe');
                error.status = 404;
                throw error;
            }

            const producto = productoResult.rows[0];

            if (!producto.activo) {
                const error = new Error(
                    `El producto ${producto.nombre} está inactivo`
                );
                error.status = 400;
                throw error;
            }

            const cantidad = Number(detalle.cantidad);
            const stockAnterior = Number(producto.stock);

            if (stockAnterior < cantidad) {
                const error = new Error(
                    `Stock insuficiente para ${producto.nombre}. Disponible: ${stockAnterior}`
                );
                error.status = 400;
                throw error;
            }

            const precioUnitario = Number(producto.precio_venta);

            if (!Number.isFinite(precioUnitario) || precioUnitario < 0) {
                const error = new Error(
                    `El precio del producto ${producto.nombre} no es válido`
                );
                error.status = 400;
                throw error;
            }

            const subtotal = Number((cantidad * precioUnitario).toFixed(2));

            productosVenta.set(detalle.producto_id, {
                ...producto,
                cantidad,
                stockAnterior,
                stockNuevo: Number((stockAnterior - cantidad).toFixed(3)),
                precioUnitario,
                subtotal
            });
        }

        // Calculo el total usando los precios guardados en la base de datos.
        const detallesCalculados = detalles.map((detalle) => ({
            ...productosVenta.get(detalle.producto_id),
            producto_id: detalle.producto_id
        }));

        const totalCentavos = detallesCalculados.reduce(
            (acumulado, detalle) =>
                acumulado + Math.round(detalle.subtotal * 100),
            0
        );

        const pagosCentavos = pagos.reduce(
            (acumulado, pago) =>
                acumulado + Math.round(Number(pago.monto) * 100),
            0
        );

        if (pagosCentavos !== totalCentavos) {
            const error = new Error(
                'La suma de los pagos debe coincidir con el total de la venta'
            );
            error.status = 400;
            throw error;
        }

        const total = totalCentavos / 100;

        const ventaResult = await client.query(
            `INSERT INTO ventas (usuario_id, total, estado)
            VALUES ($1, $2, 'completada')
            RETURNING id, numero_venta, usuario_id, total, estado, created_at`,
            [req.userId, total]
        );

        const venta = ventaResult.rows[0];

        for (const detalle of detallesCalculados) {
            // Guardo los datos del producto tal como estaban al momento de la venta.
            await client.query(
                `INSERT INTO detalle_ventas (
                    venta_id,
                    producto_id,
                    producto_nombre,
                    producto_codigo,
                    cantidad,
                    precio_unitario,
                    subtotal
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    venta.id,
                    detalle.producto_id,
                    detalle.nombre,
                    detalle.codigo,
                    detalle.cantidad,
                    detalle.precioUnitario,
                    detalle.subtotal
                ]
            );
        }

        for (const detalle of detallesCalculados) {
            // Descuento el stock y registro la salida en el historial.
            await client.query(
                `UPDATE productos
                SET stock = $1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $2`,
                [detalle.stockNuevo, detalle.producto_id]
            );

            await client.query(
                `INSERT INTO movimientos_stock (
                    producto_id,
                    tipo,
                    cantidad,
                    motivo,
                    stock_anterior,
                    stock_nuevo,
                    usuario_id
                )
                VALUES ($1, 'salida', $2, $3, $4, $5, $6)`,
                [
                    detalle.producto_id,
                    detalle.cantidad,
                    `Venta N.º ${venta.numero_venta}`,
                    detalle.stockAnterior,
                    detalle.stockNuevo,
                    req.userId
                ]
            );
        }

        for (const pago of pagos) {
            await client.query(
                `INSERT INTO pagos_venta (
                    venta_id,
                    metodo_pago,
                    monto
                )
                VALUES ($1, $2, $3)`,
                [venta.id, pago.metodo_pago, Number(pago.monto).toFixed(2)]
            );
        }

        await client.query('COMMIT');
        transaccionIniciada = false;

        return res.status(201).json({
            message: 'Venta registrada exitosamente',
            venta: {
                ...venta,
                detalles: detallesCalculados.map((detalle) => ({
                    producto_id: detalle.producto_id,
                    producto_nombre: detalle.nombre,
                    producto_codigo: detalle.codigo,
                    cantidad: detalle.cantidad,
                    precio_unitario: detalle.precioUnitario,
                    subtotal: detalle.subtotal,
                    stock_nuevo: detalle.stockNuevo
                })),
                pagos
            }
        });
    } catch (error) {
        if (client && transaccionIniciada) {
            await client.query('ROLLBACK').catch(() => {});
        }

        if (error.status) {
            return res.status(error.status).json({
                message: error.message
            });
        }

        console.error('Error al registrar la venta:', error);
        next(error);
    } finally {
        if (client) {
            client.release();
        }
    }
};

export const obtenerVentas = async (req, res, next) => {
    try {
        const { desde, hasta, metodo_pago } = req.query;

        const condiciones = [];
        const parametros = [];

        // Filtro por la fecha inicial, incluyendo ese día completo.
        if (desde) {
            parametros.push(desde);
            condiciones.push(
                `ventas.created_at >= $${parametros.length}::date`
            );
        }

        // Incluyo todo el día seleccionado en el filtro "Hasta".
        if (hasta) {
            parametros.push(hasta);
            condiciones.push(
                `ventas.created_at < ($${parametros.length}::date + INTERVAL '1 day')`
            );
        }

        // Una venta puede tener varios medios de pago; alcanza con que coincida uno.
        if (metodo_pago) {
            parametros.push(metodo_pago);
            condiciones.push(`
                EXISTS (
                    SELECT 1
                    FROM pagos_venta
                    WHERE pagos_venta.venta_id = ventas.id
                    AND pagos_venta.metodo_pago = $${parametros.length}
                )
            `);
        }

        const where = condiciones.length > 0
            ? `WHERE ${condiciones.join(' AND ')}`
            : '';

        const result = await pool.query(
            `SELECT
                ventas.id,
                ventas.numero_venta,
                ventas.usuario_id,
                usuarios.nombre AS usuario_nombre,
                usuarios.apellido AS usuario_apellido,
                ventas.total,
                ventas.estado,
                ventas.created_at,
                COALESCE(
                    (
                        SELECT json_agg(
                            json_build_object(
                                'metodo_pago', pagos_venta.metodo_pago,
                                'monto', pagos_venta.monto
                            )
                            ORDER BY pagos_venta.created_at
                        )
                        FROM pagos_venta
                        WHERE pagos_venta.venta_id = ventas.id
                    ),
                    '[]'::json
                ) AS pagos
            FROM ventas
            INNER JOIN usuarios
                ON usuarios.id = ventas.usuario_id
            ${where}
            ORDER BY ventas.created_at DESC, ventas.numero_venta DESC`,
            parametros
        );

        return res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error al obtener las ventas:', error);
        next(error);
    }
};

export const obtenerVentaPorId = async (req, res, next) => {
    const { id } = req.params;

    try {
        const ventaResult = await pool.query(
            `SELECT
                ventas.id,
                ventas.numero_venta,
                ventas.usuario_id,
                usuarios.nombre AS usuario_nombre,
                usuarios.apellido AS usuario_apellido,
                ventas.total,
                ventas.estado,
                ventas.created_at
            FROM ventas
            INNER JOIN usuarios
                ON usuarios.id = ventas.usuario_id
            WHERE ventas.id = $1`,
            [id]
        );

        if (ventaResult.rows.length === 0) {
            return res.status(404).json({
                message: 'Venta no encontrada'
            });
        }

        const detallesResult = await pool.query(
            `SELECT
                detalle_ventas.id,
                detalle_ventas.producto_id,
                detalle_ventas.producto_nombre,
                detalle_ventas.producto_codigo,
                detalle_ventas.cantidad,
                detalle_ventas.precio_unitario,
                detalle_ventas.subtotal
            FROM detalle_ventas
            WHERE detalle_ventas.venta_id = $1
            ORDER BY detalle_ventas.created_at ASC`,
            [id]
        );

        const pagosResult = await pool.query(
            `SELECT
                pagos_venta.id,
                pagos_venta.metodo_pago,
                pagos_venta.monto,
                pagos_venta.created_at
            FROM pagos_venta
            WHERE pagos_venta.venta_id = $1
            ORDER BY pagos_venta.created_at ASC`,
            [id]
        );

        return res.status(200).json({
            ...ventaResult.rows[0],
            detalles: detallesResult.rows,
            pagos: pagosResult.rows
        });
    } catch (error) {
        console.error('Error al obtener la venta:', error);
        next(error);
    }
};

export const anularVenta = async (req, res, next) => {
    const { id } = req.params;

    let client;
    let transaccionIniciada = false;

    try {
        client = await pool.connect();

        await client.query('BEGIN');
        transaccionIniciada = true;

        // Bloqueo la venta para impedir que se anule dos veces al mismo tiempo.
        const ventaResult = await client.query(
            `SELECT id, numero_venta, estado
            FROM ventas
            WHERE id = $1
            FOR UPDATE`,
            [id]
        );

        if (ventaResult.rows.length === 0) {
            await client.query('ROLLBACK');
            transaccionIniciada = false;

            return res.status(404).json({
                message: 'Venta no encontrada'
            });
        }

        const venta = ventaResult.rows[0];

        if (venta.estado !== 'completada') {
            await client.query('ROLLBACK');
            transaccionIniciada = false;

            return res.status(400).json({
                message: 'Solo se pueden anular ventas completadas'
            });
        }

        const detallesResult = await client.query(
            `SELECT producto_id, cantidad
            FROM detalle_ventas
            WHERE venta_id = $1
            ORDER BY producto_id ASC`,
            [id]
        );

        if (detallesResult.rows.length === 0) {
            throw new Error('La venta no tiene productos para restituir');
        }

        // Bloqueo los productos en el mismo orden para reducir conflictos entre operaciones.
        for (const detalle of detallesResult.rows) {
            const productoResult = await client.query(
                `SELECT id, nombre, stock
                FROM productos
                WHERE id = $1
                FOR UPDATE`,
                [detalle.producto_id]
            );

            if (productoResult.rows.length === 0) {
                throw new Error(
                    `No se encontró el producto ${detalle.producto_id}`
                );
            }

            const producto = productoResult.rows[0];
            const stockAnterior = Number(producto.stock);
            const cantidad = Number(detalle.cantidad);
            const stockNuevo = Number(
                (stockAnterior + cantidad).toFixed(3)
            );

            await client.query(
                `UPDATE productos
                SET stock = $1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $2`,
                [stockNuevo, producto.id]
            );

            await client.query(
                `INSERT INTO movimientos_stock (
                    producto_id,
                    tipo,
                    cantidad,
                    motivo,
                    stock_anterior,
                    stock_nuevo,
                    usuario_id
                )
                VALUES ($1, 'entrada', $2, $3, $4, $5, $6)`,
                [
                    producto.id,
                    cantidad,
                    `Anulación de venta N.º ${venta.numero_venta}`,
                    stockAnterior,
                    stockNuevo,
                    req.userId
                ]
            );
        }

        // Cambio el estado recién después de restituir todos los productos.
        const actualizacion = await client.query(
            `UPDATE ventas
            SET estado = 'anulada'
            WHERE id = $1
            RETURNING id, numero_venta, total, estado, created_at`,
            [id]
        );

        await client.query('COMMIT');
        transaccionIniciada = false;

        return res.status(200).json({
            message: 'Venta anulada y stock restituido correctamente',
            venta: actualizacion.rows[0]
        });
    } catch (error) {
        if (client && transaccionIniciada) {
            await client.query('ROLLBACK').catch(() => {});
        }

        if (error.status) {
            return res.status(error.status).json({
                message: error.message
            });
        }

        console.error('Error al anular la venta:', error);
        next(error);
    } finally {
        if (client) {
            client.release();
        }
    }
};