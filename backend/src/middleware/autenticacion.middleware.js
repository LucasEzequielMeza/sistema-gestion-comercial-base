import jwt from 'jsonwebtoken';

export const estaAutenticado = (roles = []) => {
    return (req, res, next) => {
        // Busco el token de la sesión en la cookie
        const token = req.cookies?.token;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Debés iniciar sesión'
            });
        }

        // Verifico el token y acepto únicamente el algoritmo esperado
        jwt.verify(token, process.env.JWT_SECRET, {
            algorithms: ['HS256'],
            issuer: 'sistema-gestion-comercial',
            audience: 'sistema-gestion-comercial'
        }, (error, decoded) => {
            if (error || !decoded || typeof decoded !== 'object' || !decoded.id) {
                return res.status(401).json({
                    success: false,
                    message: 'La sesión es inválida o expiró'
                });
            }

            // Guardo el ID para que lo usen los controladores
            req.userId = decoded.id;

            // Los roles se implementarán cuando definamos los permisos
            if (roles.length > 0) {
                return res.status(403).json({
                    success: false,
                    message: 'Los permisos todavía no están configurados'
                });
            }

            next();
        });
    };
};