import { Router } from 'express';

import {
    crearCompra,
    obtenerCompras,
    obtenerCompraPorId,
    confirmarCompra,
    cancelarCompra
} from './compras.controller.js';

import { estaAutenticado } from '../../middleware/autenticacion.middleware.js';

const router = Router();

router.post('/', estaAutenticado(), crearCompra);

router.get('/', estaAutenticado(), obtenerCompras);

router.get('/:id', estaAutenticado(), obtenerCompraPorId);

router.put('/:id/confirmar', estaAutenticado(), confirmarCompra);

router.put('/:id/cancelar', estaAutenticado(), cancelarCompra);

export default router;