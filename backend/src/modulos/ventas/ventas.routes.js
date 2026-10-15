import { Router } from 'express';

import {
    crearVenta,
    obtenerVentas,
    obtenerVentaPorId,
    anularVenta,
    obtenerInformeVentas
} from './ventas.controller.js';

import { estaAutenticado } from '../../middleware/autenticacion.middleware.js';

const router = Router();

router.post('/', estaAutenticado(), crearVenta);

router.get('/', estaAutenticado(), obtenerVentas);

router.get('/informe', estaAutenticado(), obtenerInformeVentas);

router.get('/:id', estaAutenticado(), obtenerVentaPorId);

router.put('/:id/anular', estaAutenticado(), anularVenta);

export default router;