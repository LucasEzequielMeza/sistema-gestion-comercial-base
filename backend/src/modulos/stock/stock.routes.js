import { Router } from 'express';

import {
    obtenerStock,
    obtenerStockPorProducto,
    aumentarStock,
    disminuirStock,
    obtenerProductosConStockBajo,
    ajustarStock,
    actualizarStockMinimo,
    obtenerInformeMovimientosStock
} from './stock.controller.js';

import { estaAutenticado } from '../../middleware/autenticacion.middleware.js';

const router = Router();

router.get('/', estaAutenticado(), obtenerStock);

router.get('/bajo', estaAutenticado(), obtenerProductosConStockBajo);

router.get('/informe', estaAutenticado(), obtenerInformeMovimientosStock);

router.patch('/minimo/:id', estaAutenticado(), actualizarStockMinimo)

router.get('/:id', estaAutenticado(), obtenerStockPorProducto);

router.post('/aumentar/:id', estaAutenticado(), aumentarStock);

router.post('/disminuir/:id', estaAutenticado(), disminuirStock);

router.post('/ajustar/:id', estaAutenticado(), ajustarStock);

export default router;