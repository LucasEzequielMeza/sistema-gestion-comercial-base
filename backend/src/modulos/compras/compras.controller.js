import { pool } from '../../db.js';

const normalizarTexto = (valor) => {
    if (typeof valor !== 'string') {
        return null;
    }

    return valor.trim() || null;
};

// Calculo cada subtotal con dos decimales y acumulo el total en centavos.
const calcularDetalles = (detalles) => {
    let totalCentavos = 0;

    const detallesCalculados = detalles.map((detalle) => {
        const subtotalCentavos = Math.round(detalle.cantidad * detalle.costo_unitario * 100);

        totalCentavos += subtotalCentavos;

        return {
            ...detalle,
            subtotal: subtotalCentavos / 100
        };
    });

    return {
        detallesCalculados,
        total: totalCentavos / 100
    };
};

const revertirTransaccion = async (client, transaccionIniciada) => {
    if (client && transaccionIniciada) {
        await client.query('ROLLBACK').catch(() => {});
    }
};

const comprobarProveedorActivo = async (client, proveedorId, comercioId) => {
    const resultado = await client.query(
        `SELECT id
        FROM proveedores
        WHERE id = $1 AND comercio_id = $2 AND activo = true`,
        [proveedorId, comercioId]
    );

    return resultado.rows.length > 0;
};

const comprobarProductosActivos = async (client, detalles, comercioId) => {
    const productosIds = detalles.map((detalle) => detalle.producto_id);

    const resultado = await client.query(
        `SELECT id
        FROM productos
        WHERE id = ANY($1::uuid[])
        AND comercio_id = $2
        AND activo = true`,
        [productosIds, comercioId]
    );

    const productosActivos = new Set(resultado.rows.map((producto) => producto.id));

    return productosIds.find((productoId) => !productosActivos.has(productoId)) || null;
};

const comprobarComprobanteDuplicado = async (client, comercioId, proveedorId, tipoComprobante, numeroComprobante, compraId = null) => {
    if (!tipoComprobante || !numeroComprobante) {
        return false;
    }

    const parametros = [comercioId, proveedorId, tipoComprobante, numeroComprobante];
    let condicionCompra = '';

    if (compraId) {
        parametros.push(compraId);
        condicionCompra = `AND id <> $${parametros.length}`;
    }

    const resultado = await client.query(
        `SELECT id
        FROM compras
        WHERE comercio_id = $1
        AND proveedor_id = $2
        AND tipo_comprobante = $3
        AND numero_comprobante = $4
        ${condicionCompra}
        LIMIT 1`,
        parametros
    );

    return resultado.rows.length > 0;
};

const responderErrorComprobanteDuplicado = (error, res) => {
    if (error.code === '23505' && error.constraint === 'uq_compras_comprobante') {
        res.status(409).json({
            message: 'Ya existe una compra con ese comprobante para este proveedor'
        });

        return true;
    }

    return false;
};

export const crearCompra = async (req, res, next) => {
    const { proveedor_id, tipo_comprobante, numero_comprobante, observaciones, detalles } = req.body;

    const tipoNormalizado = normalizarTexto(tipo_comprobante);
    const numeroNormalizado = normalizarTexto(numero_comprobante);
    const observacionesNormalizadas = normalizarTexto(observaciones);

    let client;
    let transaccionIniciada = false;

    try {
        client = await pool.connect();

        await client.query('BEGIN');
        transaccionIniciada = true;

        const proveedorActivo = await comprobarProveedorActivo(client, proveedor_id, req.comercioId);

        if (!proveedorActivo) {
            await client.query('ROLLBACK');
            transaccionIniciada = false;

            return res.status(404).json({
                message: 'El proveedor no existe o está inactivo'
            });
        }

        const comprobanteDuplicado = await comprobarComprobanteDuplicado(client, req.comercioId, proveedor_id, tipoNormalizado, numeroNormalizado);

        if (comprobanteDuplicado) {
            await client.query('ROLLBACK');
            transaccionIniciada = false;

            return res.status(409).json({
                message: 'Ya existe una compra registrada con este comprobante para este proveedor'
            });
        }

        const productoInvalido = await comprobarProductosActivos(client, detalles, req.comercioId);

        if (productoInvalido) {
            await client.query('ROLLBACK');
            transaccionIniciada = false;

            return res.status(404).json({
                message: `El producto ${productoInvalido} no existe o está inactivo`
            });
        }

        const { detallesCalculados, total } = calcularDetalles(detalles);

        const compraResult = await client.query(
            `INSERT INTO compras (
                comercio_id,
                proveedor_id,
                usuario_id,
                tipo_comprobante,
                numero_comprobante,
                total,
                observaciones
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *`,
            [
                req.comercioId,
                proveedor_id,
                req.userId,
                tipoNormalizado,
                numeroNormalizado,
                total,
                observacionesNormalizadas
            ]
        );

        const compra = compraResult.rows[0];

        for (const detalle of detallesCalculados) {
            await client.query(
                `INSERT INTO detalle_compras (
                    compra_id,
                    producto_id,
                    cantidad,
                    costo_unitario,
                    subtotal
                )
                VALUES ($1, $2, $3, $4, $5)`,
                [
                    compra.id,
                    detalle.producto_id,
                    detalle.cantidad,
                    detalle.costo_unitario,
                    detalle.subtotal
                ]
            );
        }

        await client.query('COMMIT');
        transaccionIniciada = false;

        return res.status(201).json({
            message: 'Compra registrada como pendiente',
            compra
        });
    } catch (error) {
        await revertirTransaccion(client, transaccionIniciada);

        if (responderErrorComprobanteDuplicado(error, res)) {
            return;
        }

        console.error('Error al registrar la compra:', error);
        next(error);
    } finally {
        if (client) {
            client.release();
        }
    }
};

export const editarCompra = async (req, res, next) => {
    const { id } = req.params;
    const { proveedor_id, tipo_comprobante, numero_comprobante, observaciones, detalles } = req.body;

    const tipoNormalizado = normalizarTexto(tipo_comprobante);
    const numeroNormalizado = normalizarTexto(numero_comprobante);
    const observacionesNormalizadas = normalizarTexto(observaciones);

    let client;
    let transaccionIniciada = false;

    try {
        client = await pool.connect();

        await client.query('BEGIN');
        transaccionIniciada = true;

        const compraResult = await client.query(
            `SELECT *
            FROM compras
            WHERE id = $1 AND comercio_id = $2
            FOR UPDATE`,
            [id, req.comercioId]
        );

        if (compraResult.rows.length === 0) {
            await client.query('ROLLBACK');
            transaccionIniciada = false;

            return res.status(404).json({
                message: 'Compra no encontrada'
            });
        }

        if (compraResult.rows[0].estado !== 'pendiente') {
            await client.query('ROLLBACK');
            transaccionIniciada = false;

            return res.status(400).json({
                message: 'Solo se pueden editar compras pendientes'
            });
        }

        const proveedorActivo = await comprobarProveedorActivo(client, proveedor_id, req.comercioId);

        if (!proveedorActivo) {
            await client.query('ROLLBACK');
            transaccionIniciada = false;

            return res.status(404).json({
                message: 'El proveedor no existe o está inactivo'
            });
        }

        const comprobanteDuplicado = await comprobarComprobanteDuplicado(client, req.comercioId, proveedor_id, tipoNormalizado, numeroNormalizado, id);

        if (comprobanteDuplicado) {
            await client.query('ROLLBACK');
            transaccionIniciada = false;

            return res.status(409).json({
                message: 'Ya existe una compra registrada con este comprobante para este proveedor'
            });
        }

        const productoInvalido = await comprobarProductosActivos(client, detalles, req.comercioId);

        if (productoInvalido) {
            await client.query('ROLLBACK');
            transaccionIniciada = false;

            return res.status(404).json({
                message: `El producto ${productoInvalido} no existe o está inactivo`
            });
        }

        const { detallesCalculados, total } = calcularDetalles(detalles);

        const actualizacion = await client.query(
            `UPDATE compras
            SET proveedor_id = $1,
                tipo_comprobante = $2,
                numero_comprobante = $3,
                observaciones = $4,
                total = $5,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $6 AND comercio_id = $7
            RETURNING *`,
            [
                proveedor_id,
                tipoNormalizado,
                numeroNormalizado,
                observacionesNormalizadas,
                total,
                id,
                req.comercioId
            ]
        );

        await client.query(
            `DELETE FROM detalle_compras
            WHERE compra_id = $1`,
            [id]
        );

        for (const detalle of detallesCalculados) {
            await client.query(
                `INSERT INTO detalle_compras (
                    compra_id,
                    producto_id,
                    cantidad,
                    costo_unitario,
                    subtotal
                )
                VALUES ($1, $2, $3, $4, $5)`,
                [
                    id,
                    detalle.producto_id,
                    detalle.cantidad,
                    detalle.costo_unitario,
                    detalle.subtotal
                ]
            );
        }

        await client.query('COMMIT');
        transaccionIniciada = false;

        return res.status(200).json({
            message: 'Compra actualizada correctamente',
            compra: actualizacion.rows[0]
        });
    } catch (error) {
        await revertirTransaccion(client, transaccionIniciada);

        if (responderErrorComprobanteDuplicado(error, res)) {
            return;
        }

        console.error('Error al editar la compra:', error);
        next(error);
    } finally {
        if (client) {
            client.release();
        }
    }
};

export const obtenerCompras = async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT
                compras.*,
                proveedores.nombre AS proveedor_nombre,
                usuarios.nombre AS usuario_nombre,
                usuarios.apellido AS usuario_apellido
            FROM compras
            INNER JOIN proveedores ON proveedores.id = compras.proveedor_id AND proveedores.comercio_id = compras.comercio_id
            INNER JOIN usuarios ON usuarios.id = compras.usuario_id AND usuarios.comercio_id = compras.comercio_id
            WHERE compras.comercio_id = $1
            ORDER BY compras.fecha DESC`,
            [req.comercioId]
        );

        return res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error al obtener las compras:', error);
        next(error);
    }
};

export const obtenerCompraPorId = async (req, res, next) => {
    const { id } = req.params;

    try {
        const compraResult = await pool.query(
            `SELECT
                compras.*,
                proveedores.nombre AS proveedor_nombre,
                usuarios.nombre AS usuario_nombre,
                usuarios.apellido AS usuario_apellido
            FROM compras
            INNER JOIN proveedores ON proveedores.id = compras.proveedor_id AND proveedores.comercio_id = compras.comercio_id
            INNER JOIN usuarios ON usuarios.id = compras.usuario_id AND usuarios.comercio_id = compras.comercio_id
            WHERE compras.id = $1 AND compras.comercio_id = $2`,
            [id, req.comercioId]
        );

        if (compraResult.rows.length === 0) {
            return res.status(404).json({
                message: 'Compra no encontrada'
            });
        }

        const detallesResult = await pool.query(
            `SELECT
                detalle_compras.*,
                productos.nombre AS producto_nombre,
                productos.codigo AS producto_codigo
            FROM detalle_compras
            INNER JOIN productos ON productos.id = detalle_compras.producto_id AND productos.comercio_id = $2
            INNER JOIN compras ON compras.id = detalle_compras.compra_id AND compras.comercio_id = $2
            WHERE detalle_compras.compra_id = $1`,
            [id, req.comercioId]
        );

        return res.status(200).json({
            ...compraResult.rows[0],
            detalles: detallesResult.rows
        });
    } catch (error) {
        console.error('Error al obtener la compra:', error);
        next(error);
    }
};

export const confirmarCompra = async (req, res, next) => {
    const { id } = req.params;

    let client;
    let transaccionIniciada = false;

    try {
        client = await pool.connect();

        await client.query('BEGIN');
        transaccionIniciada = true;

        const compraResult = await client.query(
            `SELECT *
            FROM compras
            WHERE id = $1 AND comercio_id = $2
            FOR UPDATE`,
            [id, req.comercioId]
        );

        if (compraResult.rows.length === 0) {
            await client.query('ROLLBACK');
            transaccionIniciada = false;

            return res.status(404).json({
                message: 'Compra no encontrada'
            });
        }

        const compra = compraResult.rows[0];

        if (compra.estado !== 'pendiente') {
            await client.query('ROLLBACK');
            transaccionIniciada = false;

            return res.status(400).json({
                message: 'Solo se pueden confirmar compras pendientes'
            });
        }

        const detallesResult = await client.query(
            `SELECT detalle_compras.*
            FROM detalle_compras
            INNER JOIN compras ON compras.id = detalle_compras.compra_id
            WHERE detalle_compras.compra_id = $1
            AND compras.comercio_id = $2`,
            [id, req.comercioId]
        );

        if (detallesResult.rows.length === 0) {
            await client.query('ROLLBACK');
            transaccionIniciada = false;

            return res.status(400).json({
                message: 'La compra no tiene productos'
            });
        }

        // Bloqueo cada producto mientras actualizo su stock.
        for (const detalle of detallesResult.rows) {
            const productoResult = await client.query(
                `SELECT stock
                FROM productos
                WHERE id = $1 AND comercio_id = $2 AND activo = true
                FOR UPDATE`,
                [detalle.producto_id, req.comercioId]
            );

            if (productoResult.rows.length === 0) {
                await client.query('ROLLBACK');
                transaccionIniciada = false;

                return res.status(409).json({
                    message: `El producto ${detalle.producto_id} no existe o está inactivo. La compra no fue confirmada`
                });
            }

            const stockAnterior = Number(productoResult.rows[0].stock);
            const cantidad = Number(detalle.cantidad);
            const stockNuevo = Math.round((stockAnterior + cantidad) * 1000) / 1000;

            await client.query(
                `UPDATE productos
                SET stock = $1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $2 AND comercio_id = $3`,
                [stockNuevo, detalle.producto_id, req.comercioId]
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
                    detalle.producto_id,
                    cantidad,
                    'Compra',
                    stockAnterior,
                    stockNuevo,
                    req.userId
                ]
            );
        }

        const actualizacion = await client.query(
            `UPDATE compras
            SET estado = 'confirmada',
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1 AND comercio_id = $2
            RETURNING *`,
            [id, req.comercioId]
        );

        await client.query('COMMIT');
        transaccionIniciada = false;

        return res.status(200).json({
            message: 'Compra confirmada y stock actualizado',
            compra: actualizacion.rows[0]
        });
    } catch (error) {
        await revertirTransaccion(client, transaccionIniciada);

        console.error('Error al confirmar la compra:', error);
        next(error);
    } finally {
        if (client) {
            client.release();
        }
    }
};

export const cancelarCompra = async (req, res, next) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `UPDATE compras
            SET estado = 'cancelada',
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            AND comercio_id = $2
            AND estado = 'pendiente'
            RETURNING *`,
            [id, req.comercioId]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({
                message: 'La compra no existe o ya no está pendiente'
            });
        }

        return res.status(200).json({
            message: 'Compra cancelada',
            compra: result.rows[0]
        });
    } catch (error) {
        console.error('Error al cancelar la compra:', error);
        next(error);
    }
};

export const obtenerInformeCompras = async (req, res, next) => {
    const { desde, hasta, estado, proveedor_id } = res.locals.queryValidada;

    try {
        const condiciones = ['compras.comercio_id = $1'];
        const parametros = [req.comercioId];

        if (desde) {
            parametros.push(desde);
            condiciones.push(`compras.fecha >= $${parametros.length}::date`);
        }

        if (hasta) {
            parametros.push(hasta);
            condiciones.push(`compras.fecha < ($${parametros.length}::date + INTERVAL '1 day')`);
        }

        if (estado) {
            parametros.push(estado);
            condiciones.push(`compras.estado = $${parametros.length}`);
        }

        if (proveedor_id) {
            parametros.push(proveedor_id);
            condiciones.push(`compras.proveedor_id = $${parametros.length}`);
        }

        const where = `WHERE ${condiciones.join(' AND ')}`;

        const comprasResult = await pool.query(
            `SELECT
                compras.id,
                compras.fecha,
                compras.proveedor_id,
                compras.usuario_id,
                compras.tipo_comprobante,
                compras.numero_comprobante,
                compras.total,
                compras.estado,
                compras.observaciones,
                proveedores.nombre AS proveedor_nombre,
                usuarios.nombre AS usuario_nombre,
                usuarios.apellido AS usuario_apellido,
                COALESCE(
                    JSON_AGG(
                        JSON_BUILD_OBJECT(
                            'producto_id', detalle_compras.producto_id,
                            'producto_nombre', productos.nombre,
                            'producto_codigo', productos.codigo,
                            'cantidad', detalle_compras.cantidad,
                            'costo_unitario', detalle_compras.costo_unitario,
                            'subtotal', detalle_compras.subtotal
                        )
                        ORDER BY productos.nombre
                    ) FILTER (WHERE detalle_compras.id IS NOT NULL),
                    '[]'::json
                ) AS detalles
            FROM compras
            INNER JOIN proveedores ON proveedores.id = compras.proveedor_id AND proveedores.comercio_id = compras.comercio_id
            INNER JOIN usuarios ON usuarios.id = compras.usuario_id AND usuarios.comercio_id = compras.comercio_id
            LEFT JOIN detalle_compras ON detalle_compras.compra_id = compras.id
            LEFT JOIN productos ON productos.id = detalle_compras.producto_id AND productos.comercio_id = compras.comercio_id
            ${where}
            GROUP BY
                compras.id,
                proveedores.nombre,
                usuarios.nombre,
                usuarios.apellido
            ORDER BY compras.fecha DESC, compras.id DESC`,
            parametros
        );

        const resumenResult = await pool.query(
            `SELECT
                COUNT(*)::int AS cantidad_total,
                COALESCE(SUM(compras.total), 0) AS importe_total,
                COUNT(*) FILTER (WHERE compras.estado = 'pendiente')::int AS cantidad_pendientes,
                COALESCE(SUM(compras.total) FILTER (WHERE compras.estado = 'pendiente'), 0) AS importe_pendiente,
                COUNT(*) FILTER (WHERE compras.estado = 'confirmada')::int AS cantidad_confirmadas,
                COALESCE(SUM(compras.total) FILTER (WHERE compras.estado = 'confirmada'), 0) AS importe_confirmado,
                COUNT(*) FILTER (WHERE compras.estado = 'cancelada')::int AS cantidad_canceladas,
                COALESCE(SUM(compras.total) FILTER (WHERE compras.estado = 'cancelada'), 0) AS importe_cancelado
            FROM compras
            ${where}`,
            parametros
        );

        const proveedoresResult = await pool.query(
            `SELECT id, nombre
            FROM proveedores
            WHERE comercio_id = $1 AND activo = true
            ORDER BY nombre ASC`,
            [req.comercioId]
        );

        return res.status(200).json({
            filtros: {
                desde: desde || null,
                hasta: hasta || null,
                estado: estado || null,
                proveedor_id: proveedor_id || null
            },
            resumen: resumenResult.rows[0],
            compras: comprasResult.rows,
            proveedores: proveedoresResult.rows
        });
    } catch (error) {
        console.error('Error al generar el informe de compras:', error);
        next(error);
    }
};