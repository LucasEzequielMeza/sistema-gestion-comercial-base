import { z } from 'zod';

const MAX_CANTIDAD = 9_999_999.999;
const MAX_IMPORTE = 9_999_999_999.99;

const numeroValido = (mensaje) => z.coerce.number({
    invalid_type_error: mensaje,
    required_error: mensaje
}).finite(mensaje);

const cantidadSchema = numeroValido('La cantidad debe ser un número válido')
    .positive('La cantidad debe ser mayor a cero')
    .max(MAX_CANTIDAD, 'La cantidad supera el máximo permitido')
    .refine(
        (valor) => Math.abs(valor * 1000 - Math.round(valor * 1000)) < 0.000001,
        'La cantidad admite como máximo 3 decimales'
    );

const importeSchema = numeroValido('El importe debe ser un número válido')
    .positive('El importe debe ser mayor a cero')
    .max(MAX_IMPORTE, 'El importe supera el máximo permitido')
    .refine(
        (valor) => Math.abs(valor * 100 - Math.round(valor * 100)) < 0.000001,
        'El importe admite como máximo 2 decimales'
    );

const detalleVentaSchema = z.object({
    producto_id: z.string().uuid('El producto no es válido'),
    cantidad: cantidadSchema
});

const pagoVentaSchema = z.object({
    metodo_pago: z.enum([
        'efectivo',
        'mercado_pago',
        'transferencia',
        'tarjeta_debito',
        'tarjeta_credito',
        'otro'
    ]),
    monto: importeSchema
});

export const crearVentaSchema = z.object({
    detalles: z.array(detalleVentaSchema)
        .min(1, 'La venta debe tener al menos un producto'),

    pagos: z.array(pagoVentaSchema)
        .min(1, 'La venta debe tener al menos un pago')
}).superRefine((venta, contexto) => {
    const productosAgregados = new Set();

    venta.detalles.forEach((detalle, indice) => {
        if (productosAgregados.has(detalle.producto_id)) {
            contexto.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'No se puede agregar el mismo producto más de una vez',
                path: ['detalles', indice, 'producto_id']
            });
        }

        productosAgregados.add(detalle.producto_id);
    });
});

export const idVentaSchema = z.object({
    id: z.string().uuid('El identificador de la venta no es válido')
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

const metodoPagoSchema = z.preprocess(
    (valor) => valor === '' ? undefined : valor,
    z.enum([
        'efectivo',
        'mercado_pago',
        'transferencia',
        'tarjeta_debito',
        'tarjeta_credito',
        'otro'
    ]).optional()
);

const estadoVentaSchema = z.preprocess(
    (valor) => valor === '' ? undefined : valor,
    z.enum(['completada', 'anulada']).optional()
);

const usuarioIdSchema = z.preprocess(
    (valor) => valor === '' ? undefined : valor,
    z.string().uuid('El usuario no es válido').optional()
);

const validarRangoFechas = (filtros, contexto) => {
    if (filtros.desde && filtros.hasta && filtros.desde > filtros.hasta) {
        contexto.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'La fecha inicial no puede ser posterior a la fecha final',
            path: ['desde']
        });
    }
};

export const filtrosVentasSchema = z.object({
    desde: fechaSchema,
    hasta: fechaSchema,
    metodo_pago: metodoPagoSchema
}).superRefine(validarRangoFechas);

export const informeVentasSchema = z.object({
    desde: fechaSchema,
    hasta: fechaSchema,
    estado: estadoVentaSchema,
    usuario_id: usuarioIdSchema
}).superRefine(validarRangoFechas);