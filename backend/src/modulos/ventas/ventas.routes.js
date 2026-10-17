import { Router } from 'express';
import {
    crearVenta,
    obtenerVentas,
    obtenerVentaPorId,
    anularVenta,
    obtenerInformeVentas
} from './ventas.controller.js';
import { estaAutenticado } from '../../middleware/autenticacion.middleware.js';
import { validateSchema } from '../../middleware/validacion.middleware.js';
import {
    crearVentaSchema,
    filtrosVentasSchema,
    informeVentasSchema,
    idVentaSchema
} from '../../schemas/ventas/ventas.schema.js';

const router = Router();

router.post('/', estaAutenticado(), validateSchema(crearVentaSchema), crearVenta);

router.get('/', estaAutenticado(), validateSchema(filtrosVentasSchema, 'query'), obtenerVentas);

router.get('/informe', estaAutenticado(), validateSchema(informeVentasSchema, 'query'), obtenerInformeVentas);

router.get('/:id', estaAutenticado(), validateSchema(idVentaSchema, 'params'), obtenerVentaPorId);

router.put('/:id/anular', estaAutenticado(), validateSchema(idVentaSchema, 'params'), anularVenta);

export default router;