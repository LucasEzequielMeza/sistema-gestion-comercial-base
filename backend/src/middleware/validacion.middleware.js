export const validateSchema = (schema, fuente = 'body') => {
return (req, res, next) => {
    const resultado = schema.safeParse(req[fuente]);

        if (!resultado.success) {
            const errores = {};

            resultado.error.issues.forEach((error) => {
                const campo = error.path.join('.') || 'general';

                if (!errores[campo]) errores[campo] = [];
                errores[campo].push(error.message);
            });

            return res.status(400).json({
                success: false,
                message: 'Los datos enviados no son válidos',
                errors: errores
            });
        }

        if (fuente === 'body') {
            req.body = resultado.data;
        }

        if (fuente === 'params') {
            req.params = resultado.data;
        }

        if (fuente === 'query') {
            res.locals.queryValidada = resultado.data;
        }

        next();
    };
};