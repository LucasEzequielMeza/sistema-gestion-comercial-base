import { Router } from 'express';
import {
    login,
    register,
    logout,
    getProfile,
    cambiarContrasena
} from './autenticacion.controller.js';
import { estaAutenticado } from '../../middleware/autenticacion.middleware.js';
import { validateSchema } from '../../middleware/validacion.middleware.js';
import {
    loginSchema,
    registerSchema,
    cambiarContrasenaSchema
} from '../../schemas/autenticacion/autenticacion.schema.js';
import { limiteLogin } from '../../middleware/limiteLogin.middleware.js';
import { limiteRegistro } from '../../middleware/limiteRegistro.middleware.js';

const router = Router();

router.post('/login', limiteLogin, validateSchema(loginSchema), login);

router.post('/register', limiteRegistro, validateSchema(registerSchema), register);

router.post('/logout', estaAutenticado(), logout);

router.get('/profile', estaAutenticado(), getProfile);

router.patch('/profile/password', estaAutenticado(), validateSchema(cambiarContrasenaSchema), cambiarContrasena);

export default router;