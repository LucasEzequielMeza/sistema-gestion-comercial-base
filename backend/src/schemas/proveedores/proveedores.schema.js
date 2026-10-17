import { z } from 'zod';

const textoOpcional = (maximo, mensaje) =>
    z.preprocess(
        (valor) => typeof valor === 'string' && valor.trim() === '' ? null : valor,
        z.string()
            .trim()
            .max(maximo, mensaje)
            .nullable()
            .optional()
    );

const cuitSchema = textoOpcional(20, 'El CUIT no puede superar los 20 caracteres');
const telefonoSchema = textoOpcional(50, 'El teléfono no puede superar los 50 caracteres');
const mailSchema = z.preprocess(
    (valor) => typeof valor === 'string' && valor.trim() === '' ? null : valor,
    z.string()
        .trim()
        .email('Ingresá un correo válido')
        .max(150, 'El correo no puede superar los 150 caracteres')
        .transform((mail) => mail.toLowerCase())
        .nullable()
        .optional()
);

export const crearProveedorSchema = z.object({
    nombre: z.string()
        .trim()
        .min(1, 'El nombre del proveedor es obligatorio')
        .max(150, 'El nombre no puede superar los 150 caracteres'),

    cuit: cuitSchema,
    telefono: telefonoSchema,
    mail: mailSchema,

    direccion: textoOpcional(200, 'La dirección no puede superar los 200 caracteres'),
    contacto: textoOpcional(150, 'El contacto no puede superar los 150 caracteres'),
    observaciones: z.string()
        .trim()
        .max(5000, 'Las observaciones no pueden superar los 5000 caracteres')
        .nullable()
        .optional()
});

export const actualizarProveedorSchema = crearProveedorSchema;

export const idProveedorSchema = z.object({
    id: z.string().uuid('El identificador del proveedor no es válido')
});

export const productoIdProveedorSchema = z.object({
    id: z.string().uuid('El identificador del proveedor no es válido'),
    productoId: z.string().uuid('El identificador del producto no es válido')
});

export const buscarProveedoresSchema = z.object({
    search: z.string()
        .trim()
        .min(1, 'Ingresá un término de búsqueda')
        .max(100, 'El término de búsqueda no puede superar los 100 caracteres')
});

export const asociarProductoProveedorSchema = z.object({
    producto_id: z.string().uuid('El identificador del producto no es válido'),

    precio_compra: z.coerce.number()
        .finite('Ingresá un precio de compra válido')
        .min(0, 'El precio de compra no puede ser negativo')
        .max(9_999_999_999.99, 'El precio supera el máximo permitido')
        .refine(
            (valor) => Math.abs(valor * 100 - Math.round(valor * 100)) < 0.000001,
            'El precio admite como máximo 2 decimales'
        ),

    codigo_proveedor: textoOpcional(
        100,
        'El código del proveedor no puede superar los 100 caracteres'
    )
});