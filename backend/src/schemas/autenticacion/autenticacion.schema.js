import { z } from 'zod';

export const loginSchema = z.object({
    usuario: z.string()
        .trim()
        .min(1, 'Ingresá tu usuario o correo electrónico')
        .max(150, 'El usuario o correo es demasiado largo'),
    contrasena: z.string()
        .min(1, 'Ingresá tu contraseña')
        .max(128, 'La contraseña es demasiado larga')
});

export const registerSchema = z.object({
    nombre: z.string()
        .trim()
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .max(100, 'El nombre es demasiado largo'),
    apellido: z.string()
        .trim()
        .min(2, 'El apellido debe tener al menos 2 caracteres')
        .max(100, 'El apellido es demasiado largo'),
    usuario: z.string()
        .trim()
        .min(3, 'El usuario debe tener al menos 3 caracteres')
        .max(50, 'El usuario es demasiado largo')
        .regex(/^[a-zA-Z0-9_.-]+$/, 'El usuario solo puede contener letras, números, puntos, guiones y guiones bajos'),
    mail: z.string()
        .trim()
        .email('Ingresá un correo válido')
        .max(150, 'El correo es demasiado largo')
        .transform((mail) => mail.toLowerCase()),
    contrasena: z.string()
        .min(8, 'La contraseña debe tener al menos 8 caracteres')
        .max(128, 'La contraseña es demasiado larga')
});

export const cambiarContrasenaSchema = z.object({
    contrasenaActual: z.string()
        .min(1, 'Ingresá tu contraseña actual')
        .max(128, 'La contraseña actual es demasiado larga'),
    contrasenaNueva: z.string()
        .min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
        .max(128, 'La nueva contraseña es demasiado larga')
}).refine(
    (datos) => datos.contrasenaActual !== datos.contrasenaNueva,
    {
        message: 'La nueva contraseña debe ser diferente de la actual',
        path: ['contrasenaNueva']
    }
);

export const actualizarComercioSchema = z.object({
    nombre: z.string()
        .trim()
        .min(2, 'El nombre comercial debe tener al menos 2 caracteres')
        .max(150, 'El nombre comercial es demasiado largo'),

    cuit: z.string()
        .trim()
        .max(20, 'El CUIT es demasiado largo')
        .optional()
        .default(''),

    direccion: z.string()
        .trim()
        .max(200, 'La dirección es demasiado larga')
        .optional()
        .default(''),

    localidad: z.string()
        .trim()
        .max(100, 'La localidad es demasiado larga')
        .optional()
        .default(''),

    telefono: z.string()
        .trim()
        .max(50, 'El teléfono es demasiado largo')
        .optional()
        .default(''),

    mail_contacto: z.union([
        z.string()
            .trim()
            .email('Ingresá un correo comercial válido')
            .max(150),
        z.literal('')
    ]).optional().default(''),

    logo: z.union([
        z.string()
            .max(1500000, 'El logo supera el tamaño permitido')
            .regex(
                /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/,
                'El logo debe ser una imagen PNG, JPG o WebP válida'
            ),
        z.literal(''),
        z.null()
    ]).optional().default('')
});