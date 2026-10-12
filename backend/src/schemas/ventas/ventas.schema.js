import { z } from 'zod';

const detalleVentaSchema = z.object({
    producto_id: z.string().uuid('El producto no es válido'),
    cantidad: z.coerce.number()
        .positive('La cantidad debe ser mayor a cero')
        .finite('La cantidad debe ser un número válido')
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
    monto: z.coerce.number()
        .positive('El importe del pago debe ser mayor a cero')
        .finite('El importe debe ser un número válido')
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