import { pool } from '../../db.js';
import { crearCompraSchema } from '../../schemas/compras/compras.schema.js';

export const crearCompra = async (req, res, next) => {
    const validacion = crearCompraSchema.safeParse(req.body);

    if (!validacion.success) {
        return res.status(400).json({
            message: 'Los datos de la compra no son válidos',
            errores: validacion.error.issues
        });
    }

    const {
        proveedor_id,
        tipo_comprobante,
        numero_comprobante,
        observaciones,
        detalles
    } = validacion.data;

    let client;
    let transaccionIniciada = false;

    try {
        client = await pool.connect();

        await client.query('BEGIN');
        transaccionIniciada = true;

        const proveedor = await client.query(
            `SELECT id FROM proveedores
            WHERE id = $1 AND activo = true`,
            [proveedor_id]
        );

        if (proveedor.rows.length === 0) {
            await client.query('ROLLBACK');
            transaccionIniciada = false;

            return res.status(404).json({
                message: 'El proveedor no existe o está inactivo'
            });
        }

        // Evito registrar dos veces el mismo comprobante para el proveedor.
        const numeroNormalizado = numero_comprobante?.trim() || null;
        const tipoNormalizado = tipo_comprobante?.trim() || null;

        if (numeroNormalizado && tipoNormalizado) {
            const comprobanteExistente = await client.query(
                `SELECT id FROM compras
                WHERE proveedor_id = $1
                AND tipo_comprobante = $2
                AND numero_comprobante = $3
                LIMIT 1`,
                [
                    proveedor_id,
                    tipoNormalizado,
                    numeroNormalizado
                ]
            );

            if (comprobanteExistente.rows.length > 0) {
                await client.query('ROLLBACK');
                transaccionIniciada = false;

                return res.status(409).json({
                    message: 'Ya existe una compra registrada con este comprobante para este proveedor'
                });
            }
        }

        let total = 0;

        const detallesCalculados = detalles.map((detalle) => {
            const subtotal = Number(
                (detalle.cantidad * detalle.costo_unitario).toFixed(2)
            );

            total += subtotal;

            return {
                ...detalle,
                subtotal
            };
        });

        total = Number(total.toFixed(2));

        const compraResult = await client.query(
            `INSERT INTO compras (
                proveedor_id, usuario_id, tipo_comprobante,
                numero_comprobante, total, observaciones
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *`,
            [
                proveedor_id,
                req.userId,
                tipoNormalizado,
                numeroNormalizado,
                total,
                observaciones || null
            ]
        );

        const compra = compraResult.rows[0];

        for (const detalle of detallesCalculados) {
            const producto = await client.query(
                `SELECT id FROM productos
                WHERE id = $1 AND activo = true`,
                [detalle.producto_id]
            );

            if (producto.rows.length === 0) {
                throw new Error(
                    `El producto ${detalle.producto_id} no existe o está inactivo`
                );
            }

            await client.query(
                `INSERT INTO detalle_compras (
                    compra_id, producto_id, cantidad,
                    costo_unitario, subtotal
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
        if (client && transaccionIniciada) {
            await client.query('ROLLBACK').catch(() => {});
        }

        // Muestro un mensaje claro si el comprobante ya existe.
        if (
            error.code === '23505' &&
            error.constraint === 'uq_compras_comprobante'
        ) {
            return res.status(409).json({
                message: 'Ya existe una compra con ese comprobante para este proveedor'
            });
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
    const validacion = crearCompraSchema.safeParse(req.body);

    if (!validacion.success) {
        return res.status(400).json({
            message: 'Los datos de la compra no son válidos',
            errores: validacion.error.issues
        });
    }

    const {
        proveedor_id,
        tipo_comprobante,
        numero_comprobante,
        observaciones,
        detalles
    } = validacion.data;

    let client;
    let transaccionIniciada = false;

    try {
        client = await pool.connect();

        await client.query('BEGIN');
        transaccionIniciada = true;

        const compraResult = await client.query(
            `SELECT * FROM compras
            WHERE id = $1
            FOR UPDATE`,
            [id]
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

        const proveedor = await client.query(
            `SELECT id FROM proveedores
            WHERE id = $1 AND activo = true`,
            [proveedor_id]
        );

        if (proveedor.rows.length === 0) {
            await client.query('ROLLBACK');
            transaccionIniciada = false;

            return res.status(404).json({
                message: 'El proveedor no existe o está inactivo'
            });
        }

        const tipoNormalizado = tipo_comprobante?.trim() || null;
        const numeroNormalizado = numero_comprobante?.trim() || null;

        if (tipoNormalizado && numeroNormalizado) {
            const comprobanteExistente = await client.query(
                `SELECT id FROM compras
                WHERE proveedor_id = $1
                AND tipo_comprobante = $2
                AND numero_comprobante = $3
                AND id <> $4
                LIMIT 1`,
                [
                    proveedor_id,
                    tipoNormalizado,
                    numeroNormalizado,
                    id
                ]
            );

            if (comprobanteExistente.rows.length > 0) {
                await client.query('ROLLBACK');
                transaccionIniciada = false;

                return res.status(409).json({
                    message: 'Ya existe una compra registrada con este comprobante para este proveedor'
                });
            }
        }

        const productosValidados = new Set();
        let total = 0;

        const detallesCalculados = [];

        for (const detalle of detalles) {
            if (productosValidados.has(detalle.producto_id)) {
                await client.query('ROLLBACK');
                transaccionIniciada = false;

                return res.status(400).json({
                    message: 'No se puede incluir el mismo producto más de una vez'
                });
            }

            productosValidados.add(detalle.producto_id);

            const producto = await client.query(
                `SELECT id FROM productos
                WHERE id = $1 AND activo = true`,
                [detalle.producto_id]
            );

            if (producto.rows.length === 0) {
                await client.query('ROLLBACK');
                transaccionIniciada = false;

                return res.status(404).json({
                    message: `El producto ${detalle.producto_id} no existe o está inactivo`
                });
            }

            const subtotal = Number(
                (detalle.cantidad * detalle.costo_unitario).toFixed(2)
            );

            total += subtotal;

            detallesCalculados.push({
                ...detalle,
                subtotal
            });
        }

        total = Number(total.toFixed(2));

        const actualizacion = await client.query(
            `UPDATE compras
            SET proveedor_id = $1,
                tipo_comprobante = $2,
                numero_comprobante = $3,
                observaciones = $4,
                total = $5,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $6
            RETURNING *`,
            [
                proveedor_id,
                tipoNormalizado,
                numeroNormalizado,
                observaciones || null,
                total,
                id
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
                    compra_id, producto_id, cantidad,
                    costo_unitario, subtotal
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
        if (client && transaccionIniciada) {
            await client.query('ROLLBACK').catch(() => {});
        }

        if (
            error.code === '23505' &&
            error.constraint === 'uq_compras_comprobante'
        ) {
            return res.status(409).json({
                message: 'Ya existe una compra con ese comprobante para este proveedor'
            });
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
            INNER JOIN proveedores ON proveedores.id = compras.proveedor_id
            INNER JOIN usuarios ON usuarios.id = compras.usuario_id
            ORDER BY compras.fecha DESC`
        );

        res.status(200).json(result.rows);
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
            INNER JOIN proveedores ON proveedores.id = compras.proveedor_id
            INNER JOIN usuarios ON usuarios.id = compras.usuario_id
            WHERE compras.id = $1`,
            [id]
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
            INNER JOIN productos
                ON productos.id = detalle_compras.producto_id
            WHERE detalle_compras.compra_id = $1`,
            [id]
        );

        res.status(200).json({
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
            `SELECT * FROM compras
            WHERE id = $1
            FOR UPDATE`,
            [id]
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
            `SELECT * FROM detalle_compras
            WHERE compra_id = $1`,
            [id]
        );

        if (detallesResult.rows.length === 0) {
            await client.query('ROLLBACK');
            transaccionIniciada = false;

            return res.status(400).json({
                message: 'La compra no tiene productos'
            });
        }

        for (const detalle of detallesResult.rows) {
            const productoResult = await client.query(
                `SELECT stock FROM productos
                WHERE id = $1 AND activo = true
                FOR UPDATE`,
                [detalle.producto_id]
            );

            if (productoResult.rows.length === 0) {
                throw new Error(
                    `El producto ${detalle.producto_id} no existe o está inactivo`
                );
            }

            const stockAnterior = Number(productoResult.rows[0].stock);
            const cantidad = Number(detalle.cantidad);
            const stockNuevo = Number(
                (stockAnterior + cantidad).toFixed(3)
            );

            await client.query(
                `UPDATE productos
                SET stock = $1, updated_at = CURRENT_TIMESTAMP
                WHERE id = $2`,
                [stockNuevo, detalle.producto_id]
            );

            await client.query(
                `INSERT INTO movimientos_stock (
                    producto_id, tipo, cantidad, motivo,
                    stock_anterior, stock_nuevo, usuario_id
                )
                VALUES ($1, 'entrada', $2, $3, $4, $5, $6)`,
                [
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
            WHERE id = $1
            RETURNING *`,
            [id]
        );

        await client.query('COMMIT');
        transaccionIniciada = false;

        return res.status(200).json({
            message: 'Compra confirmada y stock actualizado',
            compra: actualizacion.rows[0]
        });
    } catch (error) {
        if (client && transaccionIniciada) {
            await client.query('ROLLBACK').catch(() => {});
        }

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
            WHERE id = $1 AND estado = 'pendiente'
            RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({
                message: 'La compra no existe o ya no está pendiente'
            });
        }

        res.status(200).json({
            message: 'Compra cancelada',
            compra: result.rows[0]
        });
    } catch (error) {
        console.error('Error al cancelar la compra:', error);
        next(error);
    }
};