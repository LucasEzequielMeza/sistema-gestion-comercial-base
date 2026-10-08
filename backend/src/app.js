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

const app = express();

// Configuro qué frontend puede conectarse al backend
const origenesPermitidos = (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map((origen) => origen.trim());

app.use(cors({
    origin: (origen, callback) => {
        // Permito solicitudes sin origen, como algunas herramientas de prueba
        if (!origen || origenesPermitidos.includes(origen)) {
            return callback(null, true);
        }

        return callback(new Error('Origen no permitido por CORS'));
    },
    credentials: true
}));

app.use(cookieParser());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Registro las rutas de la aplicación
app.use('/api', autenticacionRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/movimientos-stock', movimientosStockRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/proveedores', proveedoresRoutes);

// Respondo cuando la ruta solicitada no existe
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada'
    });
});

// Manejo los errores sin exponer detalles internos
app.use((err, req, res, next) => {
    console.error('Error en la solicitud:', err.message);

    if (res.headersSent) {
        return next(err);
    }

    const esErrorCors = err.message === 'Origen no permitido por CORS';

    res.status(esErrorCors ? 403 : 500).json({
        success: false,
        message: esErrorCors
            ? 'Origen no permitido'
            : 'Error interno del servidor'
    });
});

export default app;