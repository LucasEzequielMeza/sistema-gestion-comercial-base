export const validateSchema = (schema) => {
    
    return (req, res, next) => {
        // Valido los datos que llegan desde el cliente
        const resultado = schema.safeParse(req.body);

        if (!resultado.success) {
            const errores = {};

            resultado.error.issues.forEach((error) => {
                const campo = error.path.join('.') || 'general';

                if (!errores[campo]) {
                    errores[campo] = [];
                }

                errores[campo].push(error.message);
            });

            return res.status(400).json({
                success: false,
                message: 'Los datos enviados no son válidos',
                errors: errores
            });
        }

        // Reemplazo los datos originales por los que validó Zod
        req.body = resultado.data;

        next();
    };
};