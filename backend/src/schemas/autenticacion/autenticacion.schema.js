
import { z } from 'zod';

export const loginSchema = z.object({
    usuario: z.string()
        .trim()
        .min(1, 'Ingresá tu nombre de usuario')
        .max(50, 'El usuario es demasiado largo'),
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