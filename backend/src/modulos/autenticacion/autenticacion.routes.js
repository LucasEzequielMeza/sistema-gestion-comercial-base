import { Router } from 'express';
import {
    login,
    register,
    logout,
    getProfile,
    cambiarContrasena,
    getConfiguracionComercio,
    actualizarConfiguracionComercio
} from './autenticacion.controller.js';
import { estaAutenticado } from '../../middleware/autenticacion.middleware.js';
import { validateSchema } from '../../middleware/validacion.middleware.js';
import {
    loginSchema,
    registerSchema,
    cambiarContrasenaSchema,
    actualizarComercioSchema
} from '../../schemas/autenticacion/autenticacion.schema.js';
import { limiteLogin } from '../../middleware/limiteLogin.middleware.js';
import { limiteRegistro } from '../../middleware/limiteRegistro.middleware.js';

const router = Router();

router.post('/login', limiteLogin, validateSchema(loginSchema), login);

router.post('/register', limiteRegistro, validateSchema(registerSchema), register);

router.post('/logout', estaAutenticado(), logout);

router.get('/profile', estaAutenticado(), getProfile);

router.patch('/profile/password', estaAutenticado(), validateSchema(cambiarContrasenaSchema), cambiarContrasena);

router.get('/profile/configuracion-comercio', estaAutenticado(), getConfiguracionComercio);

router.patch('/profile/configuracion-comercio', estaAutenticado(), validateSchema(actualizarComercioSchema), actualizarConfiguracionComercio);

export default router;