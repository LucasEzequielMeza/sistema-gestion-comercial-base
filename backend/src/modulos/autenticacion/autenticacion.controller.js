import bcrypt from 'bcrypt';
import { pool } from '../../db.js';
import { generarTokenDeAcceso } from './jwt.js';

const opcionesCookie = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000,
    path: '/'
};

export const login = async (req, res) => {
    try {
        const { usuario, contrasena } = req.body;

        // Busco el usuario por su nombre de usuario
        const result = await pool.query(
            `SELECT id, usuario, contrasena
            FROM usuarios
            WHERE usuario = $1`,
            [usuario]
        );

        // Uso el mismo mensaje para no revelar si el usuario existe
        if (result.rowCount === 0) {
            return res.status(401).json({
                success: false,
                error: 'Usuario o contraseña incorrectos'
            });
        }

        const usuarioEncontrado = result.rows[0];

        // Comparo la contraseña con el hash guardado
        const contrasenaValida = await bcrypt.compare(
            contrasena,
            usuarioEncontrado.contrasena
        );

        if (!contrasenaValida) {
            return res.status(401).json({
                success: false,
                error: 'Usuario o contraseña incorrectos'
            });
        }

        // Creo el token para identificar la sesión
        const token = await generarTokenDeAcceso({
            id: usuarioEncontrado.id
        });

        res.cookie('token', token, opcionesCookie);

        return res.status(200).json({
            success: true,
            usuario: {
                id: usuarioEncontrado.id,
                usuario: usuarioEncontrado.usuario
            }
        });
    } catch (error) {
        console.error('Error al iniciar sesión:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
};

export const register = async (req, res) => {
    try {
        const { nombre, apellido, usuario, mail, contrasena } = req.body;

        // Compruebo si el usuario o el correo ya están registrados
        const existeUsuario = await pool.query(
            `SELECT id
            FROM usuarios
            WHERE usuario = $1 OR LOWER(mail) = LOWER($2)
            LIMIT 1`,
            [usuario, mail]
        );

        if (existeUsuario.rowCount > 0) {
            return res.status(409).json({
                success: false,
                error: 'El nombre de usuario o el correo ya están registrados'
            });
        }

        // Encripto la contraseña antes de guardarla
        const hashContrasena = await bcrypt.hash(contrasena, 12);

        // Guardo el usuario y devuelvo solo los datos necesarios
        const result = await pool.query(
            `INSERT INTO usuarios (
                nombre,
                apellido,
                usuario,
                mail,
                contrasena
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, nombre, apellido, usuario, mail`,
            [nombre, apellido, usuario, mail.toLowerCase(), hashContrasena]
        );

        const nuevoUsuario = result.rows[0];

        const token = await generarTokenDeAcceso({
            id: nuevoUsuario.id
        });

        res.cookie('token', token, opcionesCookie);

        return res.status(201).json({
            success: true,
            usuario: nuevoUsuario
        });
    } catch (error) {
        // PostgreSQL usa 23505 cuando se viola una restricción UNIQUE
        if (error.code === '23505') {
            return res.status(409).json({
                success: false,
                error: 'El nombre de usuario o el correo ya están registrados'
            });
        }

        console.error('Error al registrar el usuario:', error.message);

        return res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
};

export const logout = (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/'
    });

    return res.status(200).json({
        success: true,
        message: 'Sesión cerrada'
    });
};

export const getProfile = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                id,
                nombre,
                apellido,
                usuario,
                mail
            FROM usuarios
            WHERE id = $1`,
            [req.userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        return res.status(200).json({
            success: true,
            usuario: result.rows[0]
        });
    } catch (error) {
        console.error('Error al obtener el perfil:', error.message);

        return res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
};

export const cambiarContrasena = async (req, res) => {
    const { contrasenaActual, contrasenaNueva } = req.body

    if (
        typeof contrasenaActual !== 'string' ||
        typeof contrasenaNueva !== 'string' ||
        !contrasenaActual ||
        !contrasenaNueva
    ) {
        return res.status(400).json({
            error: 'Completá la contraseña actual y la nueva contraseña.'
        })
    }

    if (contrasenaNueva.length < 8) {
        return res.status(400).json({
            error: 'La nueva contraseña debe tener al menos 8 caracteres.'
        })
    }

    if (contrasenaActual === contrasenaNueva) {
        return res.status(400).json({
            error: 'La nueva contraseña debe ser diferente de la actual.'
        })
    }

    try {
        const resultado = await pool.query(
            'SELECT contrasena FROM usuarios WHERE id = $1',
            [req.userId]
        )

        if (resultado.rowCount === 0) {
            return res.status(404).json({
                error: 'No se encontró el usuario.'
            })
        }

        const contrasenaValida = await bcrypt.compare(
            contrasenaActual,
            resultado.rows[0].contrasena
        )

        if (!contrasenaValida) {
            return res.status(400).json({
                error: 'La contraseña actual es incorrecta.'
            })
        }

        const hashContrasena = await bcrypt.hash(contrasenaNueva, 12)

        await pool.query(
            'UPDATE usuarios SET contrasena = $1 WHERE id = $2',
            [hashContrasena, req.userId]
        )

        return res.status(200).json({
            success: true,
            message: 'La contraseña se cambió correctamente.'
        })
    } catch (error) {
        console.error('Error al cambiar la contraseña:', error)

        return res.status(500).json({
            error: 'No se pudo cambiar la contraseña.'
        })
    }
}