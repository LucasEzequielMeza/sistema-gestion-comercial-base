import { Router } from 'express';

import {
    crearProveedor,
    obtenerProveedores,
    obtenerProveedorPorId,
    actualizarProveedor,
    buscarProveedores,
    desactivarProveedor,
    activarProveedor,
    obtenerProductosProveedor,
    asociarProductoProveedor,
    quitarProductoProveedor
} from './proveedores.controller.js';

import { estaAutenticado } from '../../middleware/autenticacion.middleware.js';
import { validateSchema } from '../../middleware/validacion.middleware.js';

import {
    crearProveedorSchema,
    actualizarProveedorSchema,
    idProveedorSchema,
    productoIdProveedorSchema,
    buscarProveedoresSchema,
    asociarProductoProveedorSchema
} from '../../schemas/proveedores/proveedores.schema.js';

const router = Router();

router.post('/', estaAutenticado(), validateSchema(crearProveedorSchema), crearProveedor);

router.get('/buscar', estaAutenticado(), validateSchema(buscarProveedoresSchema, 'query'), buscarProveedores);

router.get('/', estaAutenticado(), obtenerProveedores);

router.get('/:id/productos', estaAutenticado(), validateSchema(idProveedorSchema, 'params'), obtenerProductosProveedor);

router.post('/:id/productos', estaAutenticado(), validateSchema(idProveedorSchema, 'params'), validateSchema(asociarProductoProveedorSchema), asociarProductoProveedor);

router.delete('/:id/productos/:productoId', estaAutenticado(), validateSchema(productoIdProveedorSchema, 'params'), quitarProductoProveedor);

router.get('/:id', estaAutenticado(), validateSchema(idProveedorSchema, 'params'), obtenerProveedorPorId);

router.put('/:id', estaAutenticado(), validateSchema(idProveedorSchema, 'params'), validateSchema(actualizarProveedorSchema), actualizarProveedor);

router.put('/:id/desactivar', estaAutenticado(), validateSchema(idProveedorSchema, 'params'), desactivarProveedor);

router.put('/:id/activar', estaAutenticado(), validateSchema(idProveedorSchema, 'params'), activarProveedor);

export default router;