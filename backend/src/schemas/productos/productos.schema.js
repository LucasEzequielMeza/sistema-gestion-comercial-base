import { z } from 'zod';

// Valido los precios según NUMERIC(10,2) de PostgreSQL.
const precioSchema = z.coerce.number()
    .finite('Ingresá un precio válido')
    .min(0, 'El precio no puede ser negativo')
    .max(99_999_999.99, 'El precio supera el máximo permitido')
    .refine(
        (valor) => Math.abs(valor * 100 - Math.round(valor * 100)) < 0.000001,
        'El precio admite como máximo 2 decimales'
    );

// Valido las cantidades según NUMERIC(10,3) de PostgreSQL.
const cantidadSchema = z.coerce.number()
    .finite('Ingresá una cantidad válida')
    .min(0, 'La cantidad no puede ser negativa')
    .max(9_999_999.999, 'La cantidad supera el máximo permitido')
    .refine(
        (valor) => Math.abs(valor * 1000 - Math.round(valor * 1000)) < 0.000001,
        'La cantidad admite como máximo 3 decimales'
    );

export const crearProductoSchema = z.object({
    nombre: z.string()
        .trim()
        .min(1, 'El nombre es obligatorio')
        .max(150, 'El nombre es demasiado largo'),

    descripcion: z.string()
        .max(5000, 'La descripción es demasiado larga')
        .nullable()
        .optional(),

    imagen: z.string()
        .max(3_000_000, 'La imagen es demasiado grande')
        .nullable()
        .optional(),

    codigo: z.string()
        .trim()
        .min(1, 'El código es obligatorio')
        .max(50, 'El código es demasiado largo'),

    categoria_id: z.string()
        .uuid('La categoría no es válida')
        .nullable()
        .optional(),

    precio_compra: precioSchema,
    precio_venta: precioSchema,
    stock: cantidadSchema.optional(),
    stock_minimo: cantidadSchema.optional()
});

export const actualizarProductoSchema = z.object({
    nombre: z.string()
        .trim()
        .min(1, 'El nombre es obligatorio')
        .max(150, 'El nombre es demasiado largo'),

    descripcion: z.string()
        .max(5000, 'La descripción es demasiado larga')
        .nullable()
        .optional(),

    imagen: z.string()
        .max(3_000_000, 'La imagen es demasiado grande')
        .nullable()
        .optional(),

    codigo: z.string()
        .trim()
        .min(1, 'El código es obligatorio')
        .max(50, 'El código es demasiado largo'),

    categoria_id: z.string()
        .uuid('La categoría no es válida'),

    precio_compra: precioSchema,
    precio_venta: precioSchema
});

export const idProductoSchema = z.object({
    id: z.string()
        .uuid('El identificador del producto no es válido')
});

export const buscarProductosSchema = z.object({
    search: z.string()
        .trim()
        .min(1, 'Ingresá un término de búsqueda')
        .max(100, 'El término de búsqueda es demasiado largo')
});