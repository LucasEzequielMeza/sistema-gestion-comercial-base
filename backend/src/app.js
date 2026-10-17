import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import autenticacionRoutes from './modulos/autenticacion/autenticacion.routes.js';
import productosRoutes from './modulos/productos/productos.routes.js';
import stockRoutes from './modulos/stock/stock.routes.js';
import movimientosStockRoutes from './modulos/movimientos_stock/movimientos_stock.routes.js';
import categoriasRoutes from './modulos/categorias/categorias.routes.js';
import proveedoresRoutes from './modulos/proveedores/proveedores.routes.js';
import comprasRoutes from './modulos/compras/compras.routes.js';
import ventasRoutes from './modulos/ventas/ventas.routes.js';

const app = express();

// Reconozco el proxy de Render para obtener correctamente la IP del cliente.
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

// Configuro qué frontend puede conectarse al backend.
const origenesPermitidos = (
    process.env.FRONTEND_URL || 'http://localhost:5173'
)
    .split(',')
    .map((origen) => origen.trim());

app.use(cors({
    origin: (origen, callback) => {
        // Permito solicitudes sin origen, como algunas herramientas de prueba.
        if (!origen || origenesPermitidos.includes(origen)) {
            return callback(null, true);
        }

        return callback(new Error('Origen no permitido por CORS'));
    },
    credentials: true
}));

app.use(cookieParser());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '4mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Compruebo que el servidor esté respondiendo.
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Servidor disponible'
    });
});

// Registro las rutas de la aplicación.
app.use('/api', autenticacionRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/movimientos-stock', movimientosStockRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/proveedores', proveedoresRoutes);
app.use('/api/compras', comprasRoutes);
app.use('/api/ventas', ventasRoutes);

// Respondo cuando la ruta solicitada no existe.
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada'
    });
});

// Manejo los errores sin exponer detalles internos.
app.use((err, req, res, next) => {
    console.error('Error en la solicitud:', err.message);

    if (res.headersSent) {
        return next(err);
    }

    const esErrorCors = err.message === 'Origen no permitido por CORS';

    const esJsonInvalido =
        err instanceof SyntaxError &&
        err.status === 400 &&
        err.type === 'entity.parse.failed';

    if (esJsonInvalido) {
        return res.status(400).json({
            success: false,
            message: 'El formato JSON enviado no es válido'
        });
    }

    res.status(esErrorCors ? 403 : 500).json({
        success: false,
        message: esErrorCors
            ? 'Origen no permitido'
            : 'Error interno del servidor'
    });
});

export default app;