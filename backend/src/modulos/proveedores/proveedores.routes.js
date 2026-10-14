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

const router = Router();

router.post('/', estaAutenticado(), crearProveedor);

router.get('/buscar', estaAutenticado(), buscarProveedores);

router.get('/', estaAutenticado(), obtenerProveedores);

router.get('/:id/productos', estaAutenticado(), obtenerProductosProveedor);

router.post('/:id/productos', estaAutenticado(), asociarProductoProveedor);

router.delete('/:id/productos/:productoId', estaAutenticado(), quitarProductoProveedor);

router.get('/:id', estaAutenticado(), obtenerProveedorPorId);

router.put('/:id', estaAutenticado(), actualizarProveedor);

router.put('/:id/desactivar', estaAutenticado(), desactivarProveedor);

router.put('/:id/activar', estaAutenticado(), activarProveedor);

export default router;