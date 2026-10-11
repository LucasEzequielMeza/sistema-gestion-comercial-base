import { pool } from '../../db.js';

export const obtenerStock = async (req, res) => {

    try {

        // Obtenemos el stock de todos los productos
        const result = await pool.query(
            `SELECT id, nombre, codigo, stock, stock_minimo, activo
            FROM productos
            WHERE activo = true
            ORDER BY nombre ASC`
        );

        res.status(200).json(result.rows);

    } catch (error) {

        console.error('Error al obtener el stock:', error);

        res.status(500).json({
            message: 'Error al obtener el stock'
        });
    }
};


export const obtenerStockPorProducto = async (req, res) => {

    const { id } = req.params;

    try {

        // Buscamos el stock del producto indicado
        const result = await pool.query(
            `SELECT id, nombre, codigo, stock, stock_minimo, activo
            FROM productos
            WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Producto no encontrado'
            });
        }

        res.status(200).json(result.rows[0]);

    } catch (error) {

        console.error('Error al obtener el stock del producto:', error);

        res.status(500).json({
            message: 'Error al obtener el stock del producto'
        });
    }
};


export const aumentarStock = async (req, res) => {

    const { id } = req.params;
    const { cantidad, motivo } = req.body;

    const usuarioId = req.userId;

    const client = await pool.connect();

    try {

        // Verificamos que la cantidad sea válida
        if (
            cantidad === undefined ||
            cantidad === null ||
            cantidad === '' ||
            !Number.isFinite(Number(cantidad)) ||
            Number(cantidad) <= 0
        ) {
            return res.status(400).json({
                message: 'La cantidad debe ser un número mayor a cero'
            })
        }

        // Verificamos que se haya indicado un motivo
        if (!motivo || !motivo.trim()) {
            return res.status(400).json({
                message: 'El motivo es obligatorio'
            })
        }

        // Iniciamos una transacción
        await client.query('BEGIN');

        // Obtenemos el producto y bloqueamos la fila mientras hacemos el movimiento
        const productoResult = await client.query(
            `SELECT id, nombre, codigo, stock, stock_minimo, activo
            FROM productos
            WHERE id = $1
            FOR UPDATE`,
            [id]
        );

        if (productoResult.rows.length === 0) {
            await client.query('ROLLBACK');

            return res.status(404).json({
                message: 'Producto no encontrado'
            });
        }

        const producto = productoResult.rows[0];

        if (!producto.activo) {
            await client.query('ROLLBACK')
            return res.status(400).json({
                message: 'No se puede modificar el stock de un producto inactivo'
            })
        }

        const stockAnterior = Number(producto.stock);
        const stockNuevo = stockAnterior + Number(cantidad);

        // Actualizamos el stock del producto
        const result = await client.query(
            `UPDATE productos
            SET stock = $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING id, nombre, codigo, stock, stock_minimo, activo`,
            [stockNuevo, id]
        );

        // Guardamos el movimiento en el historial
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
            VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                id,
                'entrada',
                cantidad,
                motivo,
                stockAnterior,
                stockNuevo,
                usuarioId
            ]
        );

        // Si todo salió bien, confirmamos la transacción
        await client.query('COMMIT');

        res.status(200).json({
            message: 'Stock aumentado exitosamente',
            producto: result.rows[0]
        });

    } catch (error) {

        // Si algo falla, deshacemos todos los cambios
        await client.query('ROLLBACK');

        console.error('Error al aumentar el stock:', error);

        res.status(500).json({
            message: 'Error al aumentar el stock'
        });

    } finally {

        // Liberamos la conexión
        client.release();
    }
};


export const disminuirStock = async (req, res) => {

    const { id } = req.params;
    const { cantidad, motivo } = req.body;

    const usuarioId = req.userId;

    const client = await pool.connect();

    try {

        // Verificamos que la cantidad sea válida
        if (
            cantidad === undefined ||
            cantidad === null ||
            cantidad === '' ||
            !Number.isFinite(Number(cantidad)) ||
            Number(cantidad) <= 0
        ) {
            return res.status(400).json({
                message: 'La cantidad debe ser un número mayor a cero'
            })
        }

        // Verificamos que se haya indicado un motivo
       if (!motivo || !motivo.trim()) {
            return res.status(400).json({
                message: 'El motivo es obligatorio'
            })
        }

        // Iniciamos una transacción
        await client.query('BEGIN');

        // Obtenemos el producto y bloqueamos la fila mientras hacemos el movimiento
        const productoResult = await client.query(
            `SELECT id, nombre, codigo, stock, stock_minimo, activo
            FROM productos
            WHERE id = $1
            FOR UPDATE`,
            [id]
        );

        if (productoResult.rows.length === 0) {
            await client.query('ROLLBACK');

            return res.status(404).json({
                message: 'Producto no encontrado'
            });
        }

        const producto = productoResult.rows[0];

        if (!producto.activo) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                message: 'No se puede modificar el stock de un producto inactivo'
            });
        }

        const stockAnterior = Number(producto.stock);
        const stockNuevo = stockAnterior - Number(cantidad);

        // Verificamos que no quede stock negativo
        if (stockNuevo < 0) {
            await client.query('ROLLBACK');

            return res.status(400).json({
                message: 'No hay suficiente stock disponible'
            });
        }

        // Actualizamos el stock del producto
        const result = await client.query(
            `UPDATE productos
            SET stock = $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING id, nombre, codigo, stock, stock_minimo, activo`,
            [stockNuevo, id]
        );

        // Guardamos el movimiento en el historial
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
            VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                id,
                'salida',
                cantidad,
                motivo,
                stockAnterior,
                stockNuevo,
                usuarioId
            ]
        );

        // Si todo salió bien, confirmamos la transacción
        await client.query('COMMIT');

        res.status(200).json({
            message: 'Stock disminuido exitosamente',
            producto: result.rows[0]
        });

    } catch (error) {

        // Si algo falla, deshacemos todos los cambios
        await client.query('ROLLBACK');

        console.error('Error al disminuir el stock:', error);

        res.status(500).json({
            message: 'Error al disminuir el stock'
        });

    } finally {

        // Liberamos la conexión
        client.release();
    }
};


export const obtenerProductosConStockBajo = async (req, res) => {

    try {

        // Buscamos los productos que llegaron al stock mínimo o están por debajo
        const result = await pool.query(
            `SELECT id, nombre, codigo, stock, stock_minimo, activo
            FROM productos
            WHERE stock <= stock_minimo
            AND activo = true
            ORDER BY stock ASC`
        );

        res.status(200).json(result.rows);

    } catch (error) {

        console.error('Error al obtener los productos con stock bajo:', error);

        res.status(500).json({
            message: 'Error al obtener los productos con stock bajo'
        });
    }
};

// Ajusto el stock según el recuento físico
export const ajustarStock = async (req, res) => {
    const { id } = req.params
    const { cantidad, motivo } = req.body
    const usuarioId = req.userId
    const client = await pool.connect()

    try {
        if (
            cantidad === undefined ||
            cantidad === null ||
            cantidad === '' ||
            !Number.isFinite(Number(cantidad)) ||
            Number(cantidad) < 0
        ) {
            return res.status(400).json({
                message: 'El stock debe ser un número igual o mayor a cero'
            })
        }

        if (!motivo || !motivo.trim()) {
            return res.status(400).json({
                message: 'El motivo es obligatorio'
            })
        }

        await client.query('BEGIN')

        const productoResult = await client.query(
            `SELECT id, nombre, codigo, stock, stock_minimo, activo
            FROM productos
            WHERE id = $1
            FOR UPDATE`,
            [id]
        )

        if (productoResult.rows.length === 0) {
            await client.query('ROLLBACK')
            return res.status(404).json({
                message: 'Producto no encontrado'
            })
        }

        const producto = productoResult.rows[0]

        if (!producto.activo) {
            await client.query('ROLLBACK')
            return res.status(400).json({
                message: 'No se puede modificar el stock de un producto inactivo'
            })
        }

        const stockAnterior = Number(producto.stock)
        const stockNuevo = Number(cantidad)
        const diferencia = Math.abs(stockNuevo - stockAnterior)

        if (diferencia === 0) {
            await client.query('ROLLBACK')
            return res.status(400).json({
                message: 'El stock ingresado es igual al stock actual'
            })
        }

        const result = await client.query(
            `UPDATE productos
            SET stock = $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING id, nombre, codigo, stock, stock_minimo, activo`,
            [stockNuevo, id]
        )

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
            VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                id,
                'ajuste',
                diferencia,
                motivo.trim(),
                stockAnterior,
                stockNuevo,
                usuarioId
            ]
        )

        await client.query('COMMIT')

        res.status(200).json({
            message: 'Stock ajustado exitosamente',
            producto: result.rows[0]
        })
    } catch (error) {
        await client.query('ROLLBACK')
        console.error('Error al ajustar el stock:', error)
        res.status(500).json({
            message: 'Error al ajustar el stock'
        })
    } finally {
        client.release()
    }
}

export const actualizarStockMinimo = async (req, res) => {
    const { id } = req.params
    const { stock_minimo } = req.body

    if (
        stock_minimo === undefined ||
        stock_minimo === null ||
        stock_minimo === '' ||
        !Number.isFinite(Number(stock_minimo)) ||
        Number(stock_minimo) < 0
    ) {
        return res.status(400).json({
            message: 'El stock mínimo debe ser un número igual o mayor a cero'
        })
    }

    try {
        const result = await pool.query(
            `UPDATE productos
            SET stock_minimo = $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING id, nombre, codigo, stock, stock_minimo, activo`,
            [Number(stock_minimo), id]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Producto no encontrado'
            })
        }

        res.status(200).json({
            message: 'Stock mínimo actualizado exitosamente',
            producto: result.rows[0]
        })
    } catch (error) {
        console.error('Error al actualizar el stock mínimo:', error)

        res.status(500).json({
            message: 'Error al actualizar el stock mínimo'
        })
    }
}