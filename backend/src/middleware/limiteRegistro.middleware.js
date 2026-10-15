import rateLimit from 'express-rate-limit';

export const limiteRegistro = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Se alcanzó el límite de registros. Intentá nuevamente dentro de una hora.'
    }
});