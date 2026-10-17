import { z } from 'zod';

export const crearCategoriaSchema = z.object({
    nombre: z.string()
        .trim()
        .min(1, 'El nombre de la categoría es obligatorio')
        .max(100, 'El nombre no puede superar los 100 caracteres'),

    descripcion: z.string()
        .trim()
        .max(5000, 'La descripción no puede superar los 5000 caracteres')
        .nullable()
        .optional()
});

export const actualizarCategoriaSchema = crearCategoriaSchema;

export const idCategoriaSchema = z.object({
    id: z.string()
        .uuid('El identificador de la categoría no es válido')
});

export const buscarCategoriasSchema = z.object({
    search: z.string()
        .trim()
        .min(1, 'Ingresá un término de búsqueda')
        .max(100, 'El término de búsqueda no puede superar los 100 caracteres')
});