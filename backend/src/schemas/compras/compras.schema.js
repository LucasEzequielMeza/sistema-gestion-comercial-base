import { z } from 'zod';

const detalleCompraSchema = z.object({
    producto_id: z.string().uuid('El producto no es válido'),
    cantidad: z.coerce.number()
        .positive('La cantidad debe ser mayor a cero')
        .finite('La cantidad debe ser un número válido'),
    costo_unitario: z.coerce.number()
        .positive('El costo unitario debe ser mayor que cero')
        .finite('El costo debe ser un número válido')
});

export const crearCompraSchema = z.object({
    proveedor_id: z.string().uuid('El proveedor no es válido'),
    tipo_comprobante: z.string().trim().max(50, 'El tipo de comprobante no puede superar los 50 caracteres').optional().nullable(),
    numero_comprobante: z.string().trim().max(100, 'El número de comprobante no puede superar los 100 caracteres').optional().nullable(),
    observaciones: z.string().trim().max(1000, 'Las observaciones no pueden superar los 1000 caracteres').optional().nullable(),
    detalles: z.array(detalleCompraSchema)
        .min(1, 'La compra debe tener al menos un producto')
}).superRefine((compra, contexto) => {
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
});

export const actualizarEstadoCompraSchema = z.object({
    estado: z.enum(['confirmada', 'cancelada'])
});