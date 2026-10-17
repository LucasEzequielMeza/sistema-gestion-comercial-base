import React, { useEffect, useState } from 'react';
import { FaUserCircle, FaLock, FaStore, FaImage, FaSave } from 'react-icons/fa';
import axios from '../Api/axios';

function PerfilPage() {
    const [usuario, setUsuario] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [guardandoComercio, setGuardandoComercio] = useState(false);
    const [cambiandoContrasena, setCambiandoContrasena] = useState(false);
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [errorComercio, setErrorComercio] = useState('');
    const [mensajeComercio, setMensajeComercio] = useState('');
    const [logo, setLogo] = useState('');
    const [vistaLogo, setVistaLogo] = useState('');

    const [comercio, setComercio] = useState({
        nombre: '',
        cuit: '',
        direccion: '',
        localidad: '',
        telefono: '',
        mail_contacto: ''
    });

    const [contrasenas, setContrasenas] = useState({
        contrasenaActual: '',
        nuevaContrasena: '',
        confirmarContrasena: ''
    });

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                setCargando(true);
                setError('');

                const [respuestaUsuario, respuestaComercio] = await Promise.all([
                    axios.get('/profile'),
                    axios.get('/profile/configuracion-comercio')
                ]);

                setUsuario(respuestaUsuario.data.usuario);

                const datosComercio = respuestaComercio.data.comercio;

                setComercio({
                    nombre: datosComercio.nombre || '',
                    cuit: datosComercio.cuit || '',
                    direccion: datosComercio.direccion || '',
                    localidad: datosComercio.localidad || '',
                    telefono: datosComercio.telefono || '',
                    mail_contacto: datosComercio.mail_contacto || ''
                });

                setLogo(datosComercio.logo || '');
                setVistaLogo(datosComercio.logo || '');
            } catch (err) {
                console.error('Error al cargar el perfil:', err);
                setError('No se pudieron cargar los datos del perfil. Actualizá la página e intentá nuevamente.');
            } finally {
                setCargando(false);
            }
        };

        cargarDatos();
    }, []);

    const manejarCambioComercio = (e) => {
        const { name, value } = e.target;

        setComercio((anterior) => ({
            ...anterior,
            [name]: value
        }));
    };

    const manejarCambioLogo = (e) => {
        const archivo = e.target.files?.[0];

        if (!archivo) return;

        setErrorComercio('');
        setMensajeComercio('');

        const tiposPermitidos = ['image/png', 'image/jpeg', 'image/webp'];

        if (!tiposPermitidos.includes(archivo.type)) {
            setErrorComercio('El logo debe estar en formato PNG, JPG o WebP.');
            e.target.value = '';
            return;
        }

        if (archivo.size > 1024 * 1024) {
            setErrorComercio('El logo no puede superar 1 MB.');
            e.target.value = '';
            return;
        }

        const lector = new FileReader();

        lector.onload = () => {
            const resultado = lector.result;

            if (typeof resultado !== 'string') {
                setErrorComercio('No se pudo procesar la imagen seleccionada.');
                return;
            }

            setLogo(resultado);
            setVistaLogo(resultado);
        };

        lector.onerror = () => {
            setErrorComercio('No se pudo leer el archivo seleccionado.');
        };

        lector.readAsDataURL(archivo);
    };

    const quitarLogo = () => {
        setLogo('');
        setVistaLogo('');
        setMensajeComercio('');
        setErrorComercio('');
    };

    const guardarConfiguracionComercio = async (e) => {
        e.preventDefault();

        setGuardandoComercio(true);
        setErrorComercio('');
        setMensajeComercio('');

        try {
            const respuesta = await axios.patch('/profile/configuracion-comercio', {
                ...comercio,
                logo
            });

            const datosGuardados = respuesta.data.comercio;

            setComercio({
                nombre: datosGuardados.nombre || '',
                cuit: datosGuardados.cuit || '',
                direccion: datosGuardados.direccion || '',
                localidad: datosGuardados.localidad || '',
                telefono: datosGuardados.telefono || '',
                mail_contacto: datosGuardados.mail_contacto || ''
            });

            setLogo(datosGuardados.logo || '');
            setVistaLogo(datosGuardados.logo || '');

            setMensajeComercio('Configuración comercial guardada correctamente.');
        } catch (err) {
            console.error('Error al guardar la configuración comercial:', err);

            const errores = err.response?.data?.errors;

            if (errores) {
                const primerError = Object.values(errores).flat()[0];
                setErrorComercio(primerError || 'Revisá los datos ingresados.');
            } else {
                setErrorComercio(
                    err.response?.data?.message ||
                    'No se pudo guardar la configuración comercial.'
                );
            }
        } finally {
            setGuardandoComercio(false);
        }
    };

    const manejarCambioContrasena = (e) => {
        const { name, value } = e.target;

        setContrasenas((anterior) => ({
            ...anterior,
            [name]: value
        }));
    };

    const cambiarContrasena = async (e) => {
        e.preventDefault();

        setError('');
        setMensaje('');

        if (
            !contrasenas.contrasenaActual ||
            !contrasenas.nuevaContrasena ||
            !contrasenas.confirmarContrasena
        ) {
            setError('Completá todos los campos de contraseña.');
            return;
        }

        if (contrasenas.nuevaContrasena.length < 8) {
            setError('La nueva contraseña debe tener al menos 8 caracteres.');
            return;
        }

        if (contrasenas.nuevaContrasena !== contrasenas.confirmarContrasena) {
            setError('Las contraseñas nuevas no coinciden.');
            return;
        }

        if (contrasenas.contrasenaActual === contrasenas.nuevaContrasena) {
            setError('La nueva contraseña debe ser diferente de la actual.');
            return;
        }

        setCambiandoContrasena(true);

        try {
            await axios.patch('/profile/password', {
                contrasenaActual: contrasenas.contrasenaActual,
                nuevaContrasena: contrasenas.nuevaContrasena
            });

            setMensaje('Contraseña actualizada correctamente.');

            setContrasenas({
                contrasenaActual: '',
                nuevaContrasena: '',
                confirmarContrasena: ''
            });
        } catch (err) {
            console.error('Error al cambiar la contraseña:', err);

            const errores = err.response?.data?.errors;

            if (errores) {
                const primerError = Object.values(errores).flat()[0];
                setError(primerError || 'Revisá los datos ingresados.');
            } else {
                setError(
                    err.response?.data?.message ||
                    'No se pudo actualizar la contraseña.'
                );
            }
        } finally {
            setCambiandoContrasena(false);
        }
    };

    if (cargando) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <p className="text-gray-600">Cargando perfil...</p>
            </div>
        );
    }

    if (error && !usuario) {
        return (
            <div className="mx-auto max-w-3xl p-6">
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f5f5f4] px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">
                        Mi perfil
                    </h1>
                    <p className="mt-2 text-gray-600">
                        Administrá tus datos personales y la información de tu comercio.
                    </p>
                </div>

                <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
                    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="mb-5 flex items-center gap-3">
                            <FaUserCircle className="text-2xl text-gray-600" />
                            <h2 className="text-xl font-semibold text-gray-800">
                                Datos personales
                            </h2>
                        </div>

                        {usuario && (
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-gray-500">Nombre</p>
                                    <p className="font-medium text-gray-800">
                                        {usuario.nombre || '-'}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-500">Apellido</p>
                                    <p className="font-medium text-gray-800">
                                        {usuario.apellido || '-'}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-500">Usuario</p>
                                    <p className="font-medium text-gray-800">
                                        {usuario.usuario || '-'}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-500">Correo de la cuenta</p>
                                    <p className="break-words font-medium text-gray-800">
                                        {usuario.mail || '-'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </section>

                    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
                        <div className="mb-6 flex items-center gap-3">
                            <FaStore className="text-2xl text-gray-600" />
                            <div>
                                <h2 className="text-xl font-semibold text-gray-800">
                                    Configuración comercial
                                </h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    Estos datos aparecerán en los comprobantes de venta.
                                </p>
                            </div>
                        </div>

                        {errorComercio && (
                            <div
                                role="alert"
                                className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                            >
                                {errorComercio}
                            </div>
                        )}

                        {mensajeComercio && (
                            <div
                                role="status"
                                className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700"
                            >
                                {mensajeComercio}
                            </div>
                        )}

                        <form onSubmit={guardarConfiguracionComercio} className="space-y-5">
                            <div>
                                <label
                                    htmlFor="nombre"
                                    className="mb-1 block text-sm font-medium text-gray-700"
                                >
                                    Nombre comercial *
                                </label>
                                <input
                                    id="nombre"
                                    name="nombre"
                                    type="text"
                                    value={comercio.nombre}
                                    onChange={manejarCambioComercio}
                                    maxLength={150}
                                    minLength={2}
                                    required
                                    autoComplete="organization"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="cuit" className="mb-1 block text-sm font-medium text-gray-700">
                                        CUIT
                                    </label>
                                    <input
                                        id="cuit"
                                        name="cuit"
                                        type="text"
                                        value={comercio.cuit}
                                        onChange={manejarCambioComercio}
                                        maxLength={20}
                                        placeholder="XX-XXXXXXXX-X"
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="telefono" className="mb-1 block text-sm font-medium text-gray-700">
                                        Teléfono comercial
                                    </label>
                                    <input
                                        id="telefono"
                                        name="telefono"
                                        type="tel"
                                        value={comercio.telefono}
                                        onChange={manejarCambioComercio}
                                        maxLength={50}
                                        autoComplete="tel"
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                                    />
                                </div>

                                <div className="sm:col-span-2">
                                    <label htmlFor="direccion" className="mb-1 block text-sm font-medium text-gray-700">
                                        Dirección
                                    </label>
                                    <input
                                        id="direccion"
                                        name="direccion"
                                        type="text"
                                        value={comercio.direccion}
                                        onChange={manejarCambioComercio}
                                        maxLength={200}
                                        autoComplete="street-address"
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="localidad" className="mb-1 block text-sm font-medium text-gray-700">
                                        Localidad
                                    </label>
                                    <input
                                        id="localidad"
                                        name="localidad"
                                        type="text"
                                        value={comercio.localidad}
                                        onChange={manejarCambioComercio}
                                        maxLength={100}
                                        autoComplete="address-level2"
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="mail_contacto" className="mb-1 block text-sm font-medium text-gray-700">
                                        Correo comercial
                                    </label>
                                    <input
                                        id="mail_contacto"
                                        name="mail_contacto"
                                        type="email"
                                        value={comercio.mail_contacto}
                                        onChange={manejarCambioComercio}
                                        maxLength={150}
                                        autoComplete="email"
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                                    />
                                </div>
                            </div>

                            <div className="border-t border-gray-200 pt-5">
                                <div className="mb-3 flex items-center gap-2">
                                    <FaImage className="text-gray-600" />
                                    <h3 className="font-medium text-gray-800">Logo del comercio</h3>
                                </div>

                                {vistaLogo && (
                                    <div className="mb-4 flex flex-wrap items-center gap-4">
                                        <img
                                            src={vistaLogo}
                                            alt="Logo del comercio"
                                            className="h-24 w-24 rounded-lg border border-gray-200 bg-white object-contain p-2"
                                        />

                                        <button
                                            type="button"
                                            onClick={quitarLogo}
                                            className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                                        >
                                            Quitar logo
                                        </button>
                                    </div>
                                )}

                                <label
                                    htmlFor="logo"
                                    className="mb-1 block text-sm font-medium text-gray-700"
                                >
                                    Seleccionar imagen
                                </label>
                                <input
                                    id="logo"
                                    name="logo"
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp"
                                    onChange={manejarCambioLogo}
                                    className="block w-full rounded-lg border border-gray-300 p-2 text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:font-medium file:text-gray-700 hover:file:bg-gray-200"
                                />
                                <p className="mt-2 text-xs text-gray-500">
                                    Formatos admitidos: PNG, JPG y WebP. Tamaño máximo: 1 MB.
                                </p>
                            </div>

                            <div className="flex justify-end border-t border-gray-200 pt-5">
                                <button
                                    type="submit"
                                    disabled={guardandoComercio}
                                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-800 px-5 py-3 font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <FaSave />
                                    {guardandoComercio ? 'Guardando...' : 'Guardar configuración'}
                                </button>
                            </div>
                        </form>
                    </section>

                    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-3">
                        <div className="mb-6 flex items-center gap-3">
                            <FaLock className="text-2xl text-gray-600" />
                            <div>
                                <h2 className="text-xl font-semibold text-gray-800">
                                    Cambiar contraseña
                                </h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    Elegí una contraseña segura de al menos 8 caracteres.
                                </p>
                            </div>
                        </div>

                        {error && (
                            <div
                                role="alert"
                                className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                            >
                                {error}
                            </div>
                        )}

                        {mensaje && (
                            <div
                                role="status"
                                className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700"
                            >
                                {mensaje}
                            </div>
                        )}

                        <form onSubmit={cambiarContrasena} className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div>
                                    <label htmlFor="contrasenaActual" className="mb-1 block text-sm font-medium text-gray-700">
                                        Contraseña actual
                                    </label>
                                    <input
                                        id="contrasenaActual"
                                        name="contrasenaActual"
                                        type="password"
                                        value={contrasenas.contrasenaActual}
                                        onChange={manejarCambioContrasena}
                                        autoComplete="current-password"
                                        maxLength={128}
                                        required
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="nuevaContrasena" className="mb-1 block text-sm font-medium text-gray-700">
                                        Nueva contraseña
                                    </label>
                                    <input
                                        id="nuevaContrasena"
                                        name="nuevaContrasena"
                                        type="password"
                                        value={contrasenas.nuevaContrasena}
                                        onChange={manejarCambioContrasena}
                                        autoComplete="new-password"
                                        minLength={8}
                                        maxLength={128}
                                        required
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="confirmarContrasena" className="mb-1 block text-sm font-medium text-gray-700">
                                        Confirmar nueva contraseña
                                    </label>
                                    <input
                                        id="confirmarContrasena"
                                        name="confirmarContrasena"
                                        type="password"
                                        value={contrasenas.confirmarContrasena}
                                        onChange={manejarCambioContrasena}
                                        autoComplete="new-password"
                                        minLength={8}
                                        maxLength={128}
                                        required
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end border-t border-gray-200 pt-5">
                                <button
                                    type="submit"
                                    disabled={cambiandoContrasena}
                                    className="rounded-lg bg-gray-800 px-5 py-3 font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {cambiandoContrasena ? 'Actualizando...' : 'Cambiar contraseña'}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            </div>
        </div>
    );
}

export default PerfilPage;