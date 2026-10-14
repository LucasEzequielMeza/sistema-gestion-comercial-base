import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Verifico que estén configurados los datos necesarios para conectar la BD.
const variablesNecesarias = [
    'DB_HOST',
    'DB_PORT',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME'
];

const variablesFaltantes = variablesNecesarias.filter(
    (variable) => !process.env[variable]
);

if (variablesFaltantes.length > 0) {
    throw new Error(
        `Faltan variables de entorno para la base de datos: ${variablesFaltantes.join(', ')}`
    );
}

const requiereSSL = process.env.DB_SSL === 'true';

// Configuro el pool para reutilizar conexiones a PostgreSQL.
export const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: requiereSSL ? { rejectUnauthorized: false } : false,
    max: 10,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    application_name: 'sistema-gestion-comercial'
});

// Aviso si una conexión del pool falla inesperadamente.
pool.on('error', (error) => {
    console.error('Error inesperado en el pool de PostgreSQL:', error.message)
});