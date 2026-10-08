import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const SECRET = process.env.JWT_SECRET;

// Compruebo que exista una clave suficientemente larga
if (!SECRET || Buffer.byteLength(SECRET, 'utf8') < 32) {
    throw new Error('JWT_SECRET debe tener al menos 32 bytes');
}

// Genero el token de acceso con una duración de un día
export const generarTokenDeAcceso = (payload) => {
    return new Promise((resolve, reject) => {
        jwt.sign(
            payload,
            SECRET,
            {
                algorithm: 'HS256',
                expiresIn: '1d',
                issuer: 'sistema-gestion-comercial',
                audience: 'sistema-gestion-comercial'
            },
            (error, token) => {
                if (error) {
                    return reject(error);
                }

                resolve(token);
            }
        );
    });
};