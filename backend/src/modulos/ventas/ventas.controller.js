import { pool } from '../../db.js';

const MAX_TOTAL_CENTAVOS = 999_999_999_999n;

const crearError = (mensaje, status = 400) => {
    const error = new Error(mensaje);
    error.status = status;
    return error;
};

const centavosDesdeDecimal = (valor) => {
    const texto = String(valor);
    const coincidencia = texto.match(/^(-?)(\d+)(?:\.(\d{1,2}))?$/);

    if (!coincidencia) {
        throw crearError('Se encontró un importe con un formato inválido');
    }

    const signo = coincidencia[1] === '-' ? -1n : 1n;
    const enteros = BigInt(coincidencia[2]);
    const decimales = BigInt((coincidencia[3] || '').padEnd(2, '0'));

    return signo * (enteros * 100n + decimales);
};

const milesimasDesdeDecimal = (valor) => {
    const texto = String(valor);
    const coincidencia = texto.match(/^(-?)(\d+)(?:\.(\d{1,3}))?$/);

    if (!coincidencia) {
        throw crearError('Se encontró una cantidad con un formato inválido');
    }

    const signo = coincidencia[1] === '-' ? -1n : 1n;
    const enteros = BigInt(coincidencia[2]);
    const decimales = BigInt((coincidencia[3] || '').padEnd(3, '0'));

    return signo * (enteros * 1000n + decimales);
};

const decimalDesdeCentavos = (centavos) => {
    const signo = centavos < 0n ? '-' : '';
    const importeAbsoluto = centavos < 0n ? -centavos : centavos;

    return `${signo}${importeAbsoluto / 100n}.${String(importeAbsoluto % 100n).padStart(2, '0')}`;
};

const decimalDesdeMilesimas = (milesimas) => {
    const signo = milesimas < 0n ? '-' : '';
    const cantidadAbsoluta = milesimas < 0n ? -milesimas : milesimas;

    return `${signo}${cantidadAbsoluta / 1000n}.${String(cantidadAbsoluta % 1000n).padStart(3, '0')}`;
};

const numeroDesdeCentavos = (centavos) => Number(centavos) / 100;

const validarTotalVenta = (totalCentavos) => {
    if (totalCentavos <= 0n || totalCentavos > MAX_TOTAL_CENTAVOS) {
        throw crearError('El total de la venta supera el rango permitido');
    }
};

const responderError = (res, error) => {
    return res.status(error.status).json({
        success: false,
        message: error.message
    });
};

export const crearVenta = async (req, res, next) => {
    const { detalles, pagos } = req.body;

    let client;
    let transaccionIniciada = false;

    try {
        if (!req.comercioId || !req.userId) {
            return res.status(401).json({
                success: false,
                message: 'La sesión no tiene un comercio o usuario asignado'
            });
        }

        if (
            !Array.isArray(detalles) ||
            detalles.length === 0 ||
            !Array.isArray(pagos) ||
            pagos.length === 0
        ) {
            throw crearError('La venta debe incluir productos y al menos un pago');
        }

        client = await pool.connect();

        await client.query('BEGIN');
        transaccionIniciada = true;

        // Bloqueamos el comercio para asignar números sin duplicados
        // cuando se registran varias ventas al mismo tiempo.
        const comercioResult = await client.query(
            `SELECT id
            FROM comercios
            WHERE id = $1
            FOR UPDATE`,
            [req.comercioId]
        );

        if (comercioResult.rowCount === 0) {
            throw crearError('No se encontró el comercio de la sesión', 404);
        }

        const numeroResult = await client.query(
            `SELECT COALESCE(MAX(numero_venta), 0) + 1 AS siguiente_numero
            FROM ventas
            WHERE comercio_id = $1`,
            [req.comercioId]
        );

        const siguienteNumero = numeroResult.rows[0].siguiente_numero;

        const detallesOrdenados = [...detalles].sort((a, b) =>
            String(a.producto_id).localeCompare(String(b.producto_id))
        );

        const productosVenta = new Map();

        for (const detalle of detallesOrdenados) {
            if (!detalle.producto_id) {
                throw crearError('Todos los productos deben tener un identificador válido');
            }

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
                  AND productos.comercio_id = $2
                FOR UPDATE`,
                [detalle.producto_id, req.comercioId]
            );

            if (productoResult.rowCount === 0) {
                throw crearError('Uno de los productos no existe en tu comercio', 404);
            }

            const producto = productoResult.rows[0];

            if (!producto.activo) {
                throw crearError(`El producto ${producto.nombre} está inactivo`);
            }

            const cantidadMilesimas = milesimasDesdeDecimal(detalle.cantidad);
            const stockAnteriorMilesimas = milesimasDesdeDecimal(producto.stock);
            const precioCentavos = centavosDesdeDecimal(producto.precio_venta);

            if (cantidadMilesimas <= 0n) {
                throw crearError('La cantidad debe ser mayor a cero');
            }

            if (stockAnteriorMilesimas < cantidadMilesimas) {
                throw crearError(
                    `Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock}`
                );
            }

            if (precioCentavos < 0n) {
                throw crearError(`El precio del producto ${producto.nombre} no es válido`);
            }

            if (productosVenta.has(detalle.producto_id)) {
                throw crearError('No se puede repetir un producto en el detalle de la venta');
            }

            const subtotalCentavos =
                (cantidadMilesimas * precioCentavos + 500n) / 1000n;

            const stockNuevoMilesimas =
                stockAnteriorMilesimas - cantidadMilesimas;

            productosVenta.set(detalle.producto_id, {
                producto_id: producto.id,
                nombre: producto.nombre,
                codigo: producto.codigo,
                cantidadMilesimas,
                stockAnteriorMilesimas,
                stockNuevoMilesimas,
                precioCentavos,
                subtotalCentavos
            });
        }

        const detallesCalculados = detalles.map((detalle) => {
            const producto = productosVenta.get(detalle.producto_id);

            if (!producto) {
                throw crearError('No se pudo validar uno de los productos de la venta');
            }

            return {
                ...producto,
                cantidadReal: Number(producto.cantidadMilesimas) / 1000,
                precioUnitario: numeroDesdeCentavos(producto.precioCentavos),
                subtotal: numeroDesdeCentavos(producto.subtotalCentavos)
            };
        });

        const totalCentavos = detallesCalculados.reduce(
            (acumulado, detalle) => acumulado + detalle.subtotalCentavos,
            0n
        );

        validarTotalVenta(totalCentavos);

        const pagosCentavos = pagos.reduce((acumulado, pago) => {
            const montoCentavos = centavosDesdeDecimal(pago.monto);

            if (montoCentavos <= 0n) {
                throw crearError('Cada pago debe tener un importe mayor a cero');
            }

            if (typeof pago.metodo_pago !== 'string' || !pago.metodo_pago.trim()) {
                throw crearError('Todos los pagos deben indicar un método de pago');
            }

            return acumulado + montoCentavos;
        }, 0n);

        if (pagosCentavos !== totalCentavos) {
            throw crearError('La suma de los pagos debe coincidir con el total de la venta');
        }

        const ventaResult = await client.query(
            `INSERT INTO ventas (
                comercio_id,
                numero_venta,
                usuario_id,
                total,
                estado
            )
            VALUES ($1, $2, $3, $4, 'completada')
            RETURNING id, numero_venta, usuario_id, total, estado, created_at`,
            [
                req.comercioId,
                siguienteNumero,
                req.userId,
                decimalDesdeCentavos(totalCentavos)
            ]
        );

        const venta = ventaResult.rows[0];

        for (const detalle of detallesCalculados) {
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
                    decimalDesdeMilesimas(detalle.cantidadMilesimas),
                    decimalDesdeCentavos(detalle.precioCentavos),
                    decimalDesdeCentavos(detalle.subtotalCentavos)
                ]
            );
        }

        for (const detalle of detallesCalculados) {
            const actualizacion = await client.query(
                `UPDATE productos
                SET stock = $1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
                  AND comercio_id = $3
                RETURNING id`,
                [
                    decimalDesdeMilesimas(detalle.stockNuevoMilesimas),
                    detalle.producto_id,
                    req.comercioId
                ]
            );

            if (actualizacion.rowCount === 0) {
                throw crearError('No se pudo actualizar el stock de uno de los productos', 409);
            }

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
                VALUES ($1, $2, 'salida', $3, $4, $5, $6, $7)`,
                [
                    req.comercioId,
                    detalle.producto_id,
                    decimalDesdeMilesimas(detalle.cantidadMilesimas),
                    `Venta N.º ${venta.numero_venta}`,
                    decimalDesdeMilesimas(detalle.stockAnteriorMilesimas),
                    decimalDesdeMilesimas(detalle.stockNuevoMilesimas),
                    req.userId
                ]
            );
        }

        for (const pago of pagos) {
            await client.query(
                `INSERT INTO pagos_venta (venta_id, metodo_pago, monto)
                VALUES ($1, $2, $3)`,
                [
                    venta.id,
                    pago.metodo_pago.trim(),
                    decimalDesdeCentavos(centavosDesdeDecimal(pago.monto))
                ]
            );
        }

        await client.query('COMMIT');
        transaccionIniciada = false;

        return res.status(201).json({
            success: true,
            message: 'Venta registrada exitosamente',
            venta: {
                ...venta,
                total: numeroDesdeCentavos(totalCentavos),
                detalles: detallesCalculados.map((detalle) => ({
                    producto_id: detalle.producto_id,
                    producto_nombre: detalle.nombre,
                    producto_codigo: detalle.codigo,
                    cantidad: detalle.cantidadReal,
                    precio_unitario: detalle.precioUnitario,
                    subtotal: detalle.subtotal,
                    stock_nuevo: Number(detalle.stockNuevoMilesimas) / 1000
                })),
                pagos: pagos.map((pago) => ({
                    metodo_pago: pago.metodo_pago,
                    monto: numeroDesdeCentavos(centavosDesdeDecimal(pago.monto))
                }))
            }
        });
    } catch (error) {
        if (client && transaccionIniciada) {
            await client.query('ROLLBACK').catch(() => {});
        }

        if (error.status) {
            return responderError(res, error);
        }

        console.error('Error al registrar la venta:', error);
        return next(error);
    } finally {
        if (client) {
            client.release();
        }
    }
};

export const obtenerVentas = async (req, res, next) => {
    try {
        const { desde, hasta, metodo_pago } = res.locals.queryValidada;

        const condiciones = ['ventas.comercio_id = $1'];
        const parametros = [req.comercioId];

        if (desde) {
            parametros.push(desde);
            condiciones.push(`ventas.created_at >= $${parametros.length}::date`);
        }

        if (hasta) {
            parametros.push(hasta);
            condiciones.push(`ventas.created_at < ($${parametros.length}::date + INTERVAL '1 day')`);
        }

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
                AND usuarios.comercio_id = ventas.comercio_id
            WHERE ${condiciones.join(' AND ')}
            ORDER BY ventas.created_at DESC, ventas.numero_venta DESC`,
            parametros
        );

        return res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error al obtener las ventas:', error);
        return next(error);
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
                AND usuarios.comercio_id = ventas.comercio_id
            WHERE ventas.id = $1
              AND ventas.comercio_id = $2`,
            [id, req.comercioId]
        );

        if (ventaResult.rowCount === 0) {
            return res.status(404).json({
                success: false,
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
            INNER JOIN ventas
                ON ventas.id = detalle_ventas.venta_id
            WHERE detalle_ventas.venta_id = $1
              AND ventas.comercio_id = $2
            ORDER BY detalle_ventas.created_at ASC`,
            [id, req.comercioId]
        );

        const pagosResult = await pool.query(
            `SELECT
                pagos_venta.id,
                pagos_venta.metodo_pago,
                pagos_venta.monto,
                pagos_venta.created_at
            FROM pagos_venta
            INNER JOIN ventas
                ON ventas.id = pagos_venta.venta_id
            WHERE pagos_venta.venta_id = $1
              AND ventas.comercio_id = $2
            ORDER BY pagos_venta.created_at ASC`,
            [id, req.comercioId]
        );

        return res.status(200).json({
            ...ventaResult.rows[0],
            detalles: detallesResult.rows,
            pagos: pagosResult.rows
        });
    } catch (error) {
        console.error('Error al obtener la venta:', error);
        return next(error);
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

        const ventaResult = await client.query(
            `SELECT id, numero_venta, estado
            FROM ventas
            WHERE id = $1
              AND comercio_id = $2
            FOR UPDATE`,
            [id, req.comercioId]
        );

        if (ventaResult.rowCount === 0) {
            throw crearError('Venta no encontrada', 404);
        }

        const venta = ventaResult.rows[0];

        if (venta.estado !== 'completada') {
            throw crearError('Solo se pueden anular ventas completadas');
        }

        const detallesResult = await client.query(
            `SELECT
                detalle_ventas.producto_id,
                SUM(detalle_ventas.cantidad)::text AS cantidad
            FROM detalle_ventas
            INNER JOIN ventas
                ON ventas.id = detalle_ventas.venta_id
            WHERE detalle_ventas.venta_id = $1
              AND ventas.comercio_id = $2
            GROUP BY detalle_ventas.producto_id
            ORDER BY detalle_ventas.producto_id ASC`,
            [id, req.comercioId]
        );

        if (detallesResult.rowCount === 0) {
            throw crearError('La venta no tiene productos para restituir');
        }

        const productosBloqueados = new Map();

        for (const detalle of detallesResult.rows) {
            const productoResult = await client.query(
                `SELECT productos.id, productos.nombre, productos.stock
                FROM productos
                WHERE productos.id = $1
                  AND productos.comercio_id = $2
                FOR UPDATE`,
                [detalle.producto_id, req.comercioId]
            );

            if (productoResult.rowCount === 0) {
                throw crearError('No se encontró un producto de esta venta en tu comercio', 409);
            }

            productosBloqueados.set(detalle.producto_id, {
                ...productoResult.rows[0],
                cantidadMilesimas: milesimasDesdeDecimal(detalle.cantidad)
            });
        }

        for (const producto of productosBloqueados.values()) {
            const stockAnteriorMilesimas = milesimasDesdeDecimal(producto.stock);
            const stockNuevoMilesimas =
                stockAnteriorMilesimas + producto.cantidadMilesimas;

            if (
                !Number.isFinite(Number(stockNuevoMilesimas)) ||
                stockNuevoMilesimas >= 10_000_000_000_000n
            ) {
                throw crearError(`El stock resultante de ${producto.nombre} supera el rango permitido`);
            }

            await client.query(
                `UPDATE productos
                SET stock = $1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
                  AND comercio_id = $3`,
                [
                    decimalDesdeMilesimas(stockNuevoMilesimas),
                    producto.id,
                    req.comercioId
                ]
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
                VALUES ($1, $2, 'entrada', $3, $4, $5, $6, $7)`,
                [
                    req.comercioId,
                    producto.id,
                    decimalDesdeMilesimas(producto.cantidadMilesimas),
                    `Anulación de venta N.º ${venta.numero_venta}`,
                    decimalDesdeMilesimas(stockAnteriorMilesimas),
                    decimalDesdeMilesimas(stockNuevoMilesimas),
                    req.userId
                ]
            );
        }

        const actualizacion = await client.query(
            `UPDATE ventas
            SET estado = 'anulada'
            WHERE id = $1
              AND comercio_id = $2
            RETURNING id, numero_venta, total, estado, created_at`,
            [id, req.comercioId]
        );

        await client.query('COMMIT');
        transaccionIniciada = false;

        return res.status(200).json({
            success: true,
            message: 'Venta anulada y stock restituido correctamente',
            venta: actualizacion.rows[0]
        });
    } catch (error) {
        if (client && transaccionIniciada) {
            await client.query('ROLLBACK').catch(() => {});
        }

        if (error.status) {
            return responderError(res, error);
        }

        console.error('Error al anular la venta:', error);
        return next(error);
    } finally {
        if (client) {
            client.release();
        }
    }
};

export const obtenerInformeVentas = async (req, res, next) => {
    try {
        const { desde, hasta, estado, usuario_id } = res.locals.queryValidada;

        const condiciones = ['ventas.comercio_id = $1'];
        const parametros = [req.comercioId];

        if (desde) {
            parametros.push(desde);
            condiciones.push(`ventas.created_at >= $${parametros.length}::date`);
        }

        if (hasta) {
            parametros.push(hasta);
            condiciones.push(`ventas.created_at < ($${parametros.length}::date + INTERVAL '1 day')`);
        }

        if (estado) {
            parametros.push(estado);
            condiciones.push(`ventas.estado = $${parametros.length}`);
        }

        if (usuario_id) {
            parametros.push(usuario_id);
            condiciones.push(`ventas.usuario_id = $${parametros.length}`);
        }

        const resultado = await pool.query(
            `SELECT
                ventas.id,
                ventas.numero_venta,
                ventas.total,
                ventas.estado,
                ventas.created_at,
                usuarios.nombre AS usuario_nombre,
                usuarios.apellido AS usuario_apellido,
                COALESCE(
                    (
                        SELECT json_agg(
                            json_build_object(
                                'producto_nombre', detalle_ventas.producto_nombre,
                                'producto_codigo', detalle_ventas.producto_codigo,
                                'cantidad', detalle_ventas.cantidad,
                                'precio_unitario', detalle_ventas.precio_unitario,
                                'subtotal', detalle_ventas.subtotal
                            )
                            ORDER BY detalle_ventas.created_at
                        )
                        FROM detalle_ventas
                        WHERE detalle_ventas.venta_id = ventas.id
                    ),
                    '[]'::json
                ) AS detalles,
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
                AND usuarios.comercio_id = ventas.comercio_id
            WHERE ${condiciones.join(' AND ')}
            ORDER BY ventas.created_at DESC, ventas.numero_venta DESC`,
            parametros
        );

        const ventas = resultado.rows;
        const ventasCompletadas = ventas.filter((venta) => venta.estado === 'completada');
        const ventasAnuladas = ventas.filter((venta) => venta.estado === 'anulada');

        const sumarTotales = (lista) => {
            const totalCentavos = lista.reduce(
                (total, venta) => total + centavosDesdeDecimal(venta.total),
                0n
            );

            return numeroDesdeCentavos(totalCentavos);
        };

        return res.status(200).json({
            filtros: {
                desde: desde || null,
                hasta: hasta || null,
                estado: estado || null,
                usuario_id: usuario_id || null
            },
            resumen: {
                cantidad_ventas: ventas.length,
                cantidad_completadas: ventasCompletadas.length,
                cantidad_anuladas: ventasAnuladas.length,
                total_completadas: sumarTotales(ventasCompletadas),
                total_anuladas: sumarTotales(ventasAnuladas)
            },
            ventas
        });
    } catch (error) {
        console.error('Error al generar el informe de ventas:', error);
        return next(error);
    }
};