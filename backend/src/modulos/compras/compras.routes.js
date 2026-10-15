import { Router } from 'express';

import {
    crearCompra,
    editarCompra,
    obtenerCompras,
    obtenerCompraPorId,
    confirmarCompra,
    cancelarCompra,
    obtenerInformeCompras
} from './compras.controller.js';

import { estaAutenticado } from '../../middleware/autenticacion.middleware.js';

const router = Router();

router.post('/', estaAutenticado(), crearCompra);

router.get('/', estaAutenticado(), obtenerCompras);

router.get('/informe', estaAutenticado(), obtenerInformeCompras);

router.put('/:id', estaAutenticado(), editarCompra);

router.get('/:id', estaAutenticado(), obtenerCompraPorId);

router.put('/:id/confirmar', estaAutenticado(), confirmarCompra);

router.put('/:id/cancelar', estaAutenticado(), cancelarCompra);

export default router;