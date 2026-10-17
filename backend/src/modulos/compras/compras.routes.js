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
import { validateSchema } from '../../middleware/validacion.middleware.js';

import {
    crearCompraSchema,
    idCompraSchema,
    informeComprasSchema
} from '../../schemas/compras/compras.schema.js';

const router = Router();

router.post('/', estaAutenticado(), validateSchema(crearCompraSchema), crearCompra);

router.get('/', estaAutenticado(), obtenerCompras);

router.get('/informe', estaAutenticado(), validateSchema(informeComprasSchema, 'query'), obtenerInformeCompras);

router.put('/:id', estaAutenticado(), validateSchema(idCompraSchema, 'params'), validateSchema(crearCompraSchema), editarCompra);

router.get('/:id', estaAutenticado(), validateSchema(idCompraSchema, 'params'), obtenerCompraPorId);

router.put('/:id/confirmar', estaAutenticado(), validateSchema(idCompraSchema, 'params'), confirmarCompra);

router.put('/:id/cancelar', estaAutenticado(), validateSchema(idCompraSchema, 'params'), cancelarCompra);

export default router;