import jwt from 'jsonwebtoken';

export const estaAutenticado = (roles = []) => {
    return (req, res, next) => {
        const token = req.cookies?.token;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Debés iniciar sesión'
            });
        }

        jwt.verify(
            token,
            process.env.JWT_SECRET,
            {
                algorithms: ['HS256'],
                issuer: 'sistema-gestion-comercial',
                audience: 'sistema-gestion-comercial'
            },
            (error, decoded) => {
                if (
                    error ||
                    !decoded ||
                    typeof decoded !== 'object' ||
                    typeof decoded.id !== 'string' ||
                    typeof decoded.comercioId !== 'string'
                ) {
                    return res.status(401).json({
                        success: false,
                        message: 'La sesión es inválida o expiró'
                    });
                }

                req.userId = decoded.id;
                req.comercioId = decoded.comercioId;

                // Los permisos por rol se configurarán más adelante.
                if (roles.length > 0) {
                    return res.status(403).json({
                        success: false,
                        message: 'Los permisos todavía no están configurados'
                    });
                }

                next();
            }
        );
    };
};