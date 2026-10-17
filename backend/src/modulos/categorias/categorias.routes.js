import { Router } from 'express';

import {
    crearCategoria,
    obtenerCategorias,
    obtenerCategoriaPorId,
    actualizarCategoria,
    buscarCategorias,
    desactivarCategoria,
    activarCategoria
} from './categorias.controller.js';

import { estaAutenticado } from '../../middleware/autenticacion.middleware.js';
import { validateSchema } from '../../middleware/validacion.middleware.js';

import {
    crearCategoriaSchema,
    actualizarCategoriaSchema,
    idCategoriaSchema,
    buscarCategoriasSchema
} from '../../schemas/categorias/categorias.schema.js';

const router = Router();

router.post('/', estaAutenticado(), validateSchema(crearCategoriaSchema), crearCategoria);

router.get('/buscar', estaAutenticado(), validateSchema(buscarCategoriasSchema, 'query'), buscarCategorias);

router.get('/', estaAutenticado(), obtenerCategorias);

router.get('/:id', estaAutenticado(), validateSchema(idCategoriaSchema, 'params'), obtenerCategoriaPorId);

router.put('/:id', estaAutenticado(), validateSchema(idCategoriaSchema, 'params'), validateSchema(actualizarCategoriaSchema), actualizarCategoria);

router.put('/:id/desactivar', estaAutenticado(), validateSchema(idCategoriaSchema, 'params'), desactivarCategoria);

router.put('/:id/activar', estaAutenticado(), validateSchema(idCategoriaSchema, 'params'), activarCategoria);

export default router;