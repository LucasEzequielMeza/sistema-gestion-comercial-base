import {Router} from 'express';
import {
    crearProducto,
    obtenerProductos,
    obtenerProductosInactivos,
    obtenerProductoPorId,
    actualizarProducto,
    buscarProductos,
    desactivarProducto,
    activarProducto,
    eliminarProducto
} from './productos.controller.js';
import {
    crearProductoSchema,
    actualizarProductoSchema,
    idProductoSchema,
    buscarProductosSchema
} from '../../schemas/productos/productos.schema.js';
import { estaAutenticado } from '../../middleware/autenticacion.middleware.js';
import { validateSchema } from '../../middleware/validacion.middleware.js';

const router = Router();

router.post('/', estaAutenticado(), validateSchema(crearProductoSchema), crearProducto);

router.get('/', estaAutenticado(), obtenerProductos);

router.get('/buscar', estaAutenticado(), validateSchema(buscarProductosSchema, 'query'), buscarProductos);

router.get('/inactivos', estaAutenticado(), obtenerProductosInactivos);

router.get('/:id', estaAutenticado(), validateSchema(idProductoSchema, 'params'), obtenerProductoPorId);

router.put('/:id', estaAutenticado(), validateSchema(idProductoSchema, 'params'), validateSchema(actualizarProductoSchema), actualizarProducto);

router.patch('/:id/desactivar', estaAutenticado(), validateSchema(idProductoSchema, 'params'), desactivarProducto);

router.patch('/:id/activar', estaAutenticado(), validateSchema(idProductoSchema, 'params'), activarProducto);

router.delete('/:id', estaAutenticado(), validateSchema(idProductoSchema, 'params'), eliminarProducto);

export default router;