import { z } from 'zod';

// Convierto el valor a número y rechazo los campos vacíos.
const numeroValido = (mensaje) => z.coerce.number({
    invalid_type_error: mensaje,
    required_error: mensaje
}).finite(mensaje).refine(
    (valor) => Number.isFinite(valor),
    mensaje
);

// NUMERIC(10,3): hasta 7 enteros y 3 decimales.
const cantidadSchema = numeroValido('La cantidad debe ser un número válido')
    .positive('La cantidad debe ser mayor a cero')
    .max(9_999_999.999, 'La cantidad supera el máximo permitido')
    .refine(
        (valor) => Math.abs(valor * 1000 - Math.round(valor * 1000)) < 0.000001,
        'La cantidad admite como máximo 3 decimales'
    );

// NUMERIC(12,2): hasta 10 enteros y 2 decimales.
const costoSchema = numeroValido('El costo debe ser un número válido')
    .positive('El costo unitario debe ser mayor que cero')
    .max(9_999_999_999.99, 'El costo supera el máximo permitido')
    .refine(
        (valor) => Math.abs(valor * 100 - Math.round(valor * 100)) < 0.000001,
        'El costo admite como máximo 2 decimales'
    );

const detalleCompraSchema = z.object({
    producto_id: z.string().uuid('El producto no es válido'),
    cantidad: cantidadSchema,
    costo_unitario: costoSchema
});

const camposCompra = {
    proveedor_id: z.string().uuid('El proveedor no es válido'),

    tipo_comprobante: z.string()
        .trim()
        .max(50, 'El tipo de comprobante no puede superar los 50 caracteres')
        .nullable()
        .optional(),

    numero_comprobante: z.string()
        .trim()
        .max(100, 'El número de comprobante no puede superar los 100 caracteres')
        .nullable()
        .optional(),

    observaciones: z.string()
        .trim()
        .max(1000, 'Las observaciones no pueden superar los 1000 caracteres')
        .nullable()
        .optional(),

    detalles: z.array(detalleCompraSchema)
        .min(1, 'La compra debe tener al menos un producto')
};

const validarCompra = (compra, contexto) => {
    const productosAgregados = new Set();

    compra.detalles.forEach((detalle, indice) => {
        if (productosAgregados.has(detalle.producto_id)) {
            contexto.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'No se puede agregar el mismo producto más de una vez en una compra',
                path: ['detalles', indice, 'producto_id']
            });
        }

        productosAgregados.add(detalle.producto_id);
    });
};

export const crearCompraSchema = z.object(camposCompra)
    .superRefine(validarCompra);

export const actualizarEstadoCompraSchema = z.object({
    estado: z.enum(['confirmada', 'cancelada'])
});

export const idCompraSchema = z.object({
    id: z.string().uuid('El identificador de la compra no es válido')
});

const fechaSchema = z.preprocess(
    (valor) => valor === '' ? undefined : valor,
    z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato AAAA-MM-DD')
        .refine((valor) => {
            const fecha = new Date(`${valor}T00:00:00.000Z`);

            return !Number.isNaN(fecha.getTime()) &&
                fecha.toISOString().slice(0, 10) === valor;
        }, 'La fecha no es válida')
        .optional()
);

export const informeComprasSchema = z.object({
    desde: fechaSchema,
    hasta: fechaSchema,

    estado: z.preprocess(
        (valor) => valor === '' ? undefined : valor,
        z.enum(['pendiente', 'confirmada', 'cancelada']).optional()
    ),

    proveedor_id: z.preprocess(
        (valor) => valor === '' ? undefined : valor,
        z.string().uuid('El proveedor no es válido').optional()
    )
}).superRefine((filtros, contexto) => {
    if (filtros.desde && filtros.hasta && filtros.desde > filtros.hasta) {
        contexto.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'La fecha desde no puede ser posterior a la fecha hasta',
            path: ['desde']
        });
    }
});