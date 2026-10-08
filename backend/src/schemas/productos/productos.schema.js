import { z } from 'zod';

export const crearProductoSchema = z.object({
nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(150, 'El nombre es demasiado largo'),
descripcion: z.string().max(5000, 'La descripción es demasiado larga').nullable().optional(),
imagen: z.string().max(2048, 'La imagen es demasiado larga').nullable().optional(),
codigo: z.string().trim().min(1, 'El código es obligatorio').max(50, 'El código es demasiado largo'),
categoria_id: z.string().uuid('La categoría no es válida').nullable().optional(),
precio_compra: z.coerce.number().finite().min(0, 'El precio de compra no puede ser negativo'),
precio_venta: z.coerce.number().finite().min(0, 'El precio de venta no puede ser negativo'),
stock: z.coerce.number().finite().min(0, 'El stock no puede ser negativo').optional(),
stock_minimo: z.coerce.number().finite().min(0, 'El stock mínimo no puede ser negativo').optional()
});

export const actualizarProductoSchema = z.object({
nombre: z.string().trim().min(1).max(150),
descripcion: z.string().max(5000).nullable().optional(),
imagen: z.string().max(2048).nullable().optional(),
codigo: z.string().trim().min(1).max(50),
precio_compra: z.coerce.number().finite().min(0),
precio_venta: z.coerce.number().finite().min(0)
});

export const idProductoSchema = z.object({
id: z.string().uuid('El identificador del producto no es válido')
});

export const buscarProductosSchema = z.object({
search: z.string().trim().min(1, 'Ingresá un término de búsqueda').max(100, 'El término de búsqueda es demasiado largo')
});
