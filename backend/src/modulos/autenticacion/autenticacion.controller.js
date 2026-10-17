import bcrypt from 'bcrypt';
import { pool } from '../../db.js';
import { generarTokenDeAcceso } from './jwt.js';

const opcionesCookieBase = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/'
};

const opcionesCookie = {
    ...opcionesCookieBase,
    maxAge: 24 * 60 * 60 * 1000
};

export const login = async (req, res) => {
    try {
        const { usuario, contrasena } = req.body;

        const result = await pool.query(
            `SELECT id, comercio_id, nombre, apellido, usuario, mail, contrasena
            FROM usuarios
            WHERE usuario = $1 OR LOWER(mail) = LOWER($1)
            LIMIT 1`,
            [usuario]
        );

        if (result.rowCount === 0) {
            return res.status(401).json({
                success: false,
                error: 'Usuario o contraseña incorrectos'
            });
        }

        const usuarioEncontrado = result.rows[0];

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

        if (!usuarioEncontrado.comercio_id) {
            return res.status(403).json({
                success: false,
                error: 'La cuenta no tiene un comercio asignado. Contactá al administrador.'
            });
        }

        const token = await generarTokenDeAcceso({
            id: usuarioEncontrado.id,
            comercioId: usuarioEncontrado.comercio_id
        });

        res.cookie('token', token, opcionesCookie);

        return res.status(200).json({
            success: true,
            usuario: {
                id: usuarioEncontrado.id,
                comercio_id: usuarioEncontrado.comercio_id,
                nombre: usuarioEncontrado.nombre,
                apellido: usuarioEncontrado.apellido,
                usuario: usuarioEncontrado.usuario,
                mail: usuarioEncontrado.mail
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
    let conexion;

    try {
        conexion = await pool.connect();

        const { nombre, apellido, usuario, mail, contrasena } = req.body;

        await conexion.query('BEGIN');

        const hashContrasena = await bcrypt.hash(contrasena, 12);

        // Creo un comercio nuevo para la cuenta que se está registrando.
        const resultadoComercio = await conexion.query(
            `INSERT INTO comercios (nombre)
            VALUES ($1)
            RETURNING id, nombre`,
            [`Comercio de ${nombre} ${apellido}`]
        );

        const nuevoComercio = resultadoComercio.rows[0];

        const resultadoUsuario = await conexion.query(
            `INSERT INTO usuarios (
                comercio_id,
                nombre,
                apellido,
                usuario,
                mail,
                contrasena
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, comercio_id, nombre, apellido, usuario, mail`,
            [
                nuevoComercio.id,
                nombre,
                apellido,
                usuario,
                mail.toLowerCase(),
                hashContrasena
            ]
        );

        const nuevoUsuario = resultadoUsuario.rows[0];

        // Genero el token antes de confirmar la transacción.
        const token = await generarTokenDeAcceso({
            id: nuevoUsuario.id,
            comercioId: nuevoUsuario.comercio_id
        });

        await conexion.query('COMMIT');

        res.cookie('token', token, opcionesCookie);

        return res.status(201).json({
            success: true,
            usuario: nuevoUsuario,
            comercio: nuevoComercio
        });
    } catch (error) {
        if (conexion) {
            try {
                await conexion.query('ROLLBACK');
            } catch (errorRollback) {
                console.error('Error al revertir el registro:', errorRollback.message);
            }
        }

        if (error.code === '23505') {
            return res.status(409).json({
                success: false,
                error: 'El nombre de usuario o el correo ya están registrados'
            });
        }

        console.error('Error al registrar el usuario:', error.message);

        return res.status(500).json({
            success: false,
            error: 'No se pudo registrar la cuenta'
        });
    } finally {
        if (conexion) {
            conexion.release();
        }
    }
};

export const logout = (req, res) => {
    res.clearCookie('token', opcionesCookieBase);

    return res.status(200).json({
        success: true,
        message: 'Sesión cerrada'
    });
};

export const getProfile = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                usuarios.id,
                usuarios.comercio_id,
                usuarios.nombre,
                usuarios.apellido,
                usuarios.usuario,
                usuarios.mail,
                comercios.nombre AS comercio_nombre
            FROM usuarios
            INNER JOIN comercios
                ON comercios.id = usuarios.comercio_id
            WHERE usuarios.id = $1
              AND usuarios.comercio_id = $2`,
            [req.userId, req.comercioId]
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
    const { contrasenaActual, contrasenaNueva } = req.body;

    try {
        const resultado = await pool.query(
            `SELECT contrasena
            FROM usuarios
            WHERE id = $1
              AND comercio_id = $2`,
            [req.userId, req.comercioId]
        );

        if (resultado.rowCount === 0) {
            return res.status(404).json({
                success: false,
                error: 'No se encontró el usuario'
            });
        }

        const contrasenaValida = await bcrypt.compare(
            contrasenaActual,
            resultado.rows[0].contrasena
        );

        if (!contrasenaValida) {
            return res.status(400).json({
                success: false,
                error: 'La contraseña actual es incorrecta'
            });
        }

        const hashContrasena = await bcrypt.hash(contrasenaNueva, 12);

        await pool.query(
            `UPDATE usuarios
            SET contrasena = $1
            WHERE id = $2
              AND comercio_id = $3`,
            [hashContrasena, req.userId, req.comercioId]
        );

        res.clearCookie('token', opcionesCookieBase);

        return res.status(200).json({
            success: true,
            message: 'La contraseña se cambió correctamente. Iniciá sesión nuevamente.'
        });
    } catch (error) {
        console.error('Error al cambiar la contraseña:', error.message);

        return res.status(500).json({
            success: false,
            error: 'No se pudo cambiar la contraseña'
        });
    }
};

export const getConfiguracionComercio = async (req, res) => {
    try {
        const resultado = await pool.query(
            `SELECT
                id,
                nombre,
                cuit,
                direccion,
                localidad,
                telefono,
                mail_contacto,
                logo
            FROM comercios
            WHERE id = $1`,
            [req.comercioId]
        );

        if (resultado.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'No se encontró la configuración del comercio'
            });
        }

        return res.status(200).json({
            success: true,
            comercio: resultado.rows[0]
        });
    } catch (error) {
        console.error('Error al obtener la configuración comercial:', error);

        return res.status(500).json({
            success: false,
            message: 'No se pudo obtener la configuración comercial'
        });
    }
};

export const actualizarConfiguracionComercio = async (req, res) => {
    try {
        const {
            nombre,
            cuit,
            direccion,
            localidad,
            telefono,
            mail_contacto,
            logo
        } = req.body;

        // El comercio se identifica desde la sesión autenticada.
        const resultado = await pool.query(
            `UPDATE comercios
            SET
                nombre = $1,
                cuit = NULLIF($2, ''),
                direccion = NULLIF($3, ''),
                localidad = NULLIF($4, ''),
                telefono = NULLIF($5, ''),
                mail_contacto = NULLIF($6, ''),
                logo = NULLIF($7, ''),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $8
            RETURNING
                id,
                nombre,
                cuit,
                direccion,
                localidad,
                telefono,
                mail_contacto,
                logo`,
            [
                nombre,
                cuit ?? '',
                direccion ?? '',
                localidad ?? '',
                telefono ?? '',
                mail_contacto ?? '',
                logo ?? '',
                req.comercioId
            ]
        );

        if (resultado.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'No se encontró el comercio'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Configuración comercial actualizada correctamente',
            comercio: resultado.rows[0]
        });
    } catch (error) {
        console.error('Error al actualizar la configuración comercial:', error);

        return res.status(500).json({
            success: false,
            message: 'No se pudo actualizar la configuración comercial'
        });
    }
};