import React, { useEffect, useState } from 'react'
import { FaUserCircle, FaLock } from 'react-icons/fa'
import axios from '../Api/axios'

function PerfilPage() {
    const [usuario, setUsuario] = useState(null)
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState('')
    const [mensaje, setMensaje] = useState('')
    const [cambiandoContrasena, setCambiandoContrasena] = useState(false)

    const [contrasenas, setContrasenas] = useState({
        contrasenaActual: '',
        contrasenaNueva: '',
        confirmarContrasena: ''
    })

    useEffect(() => {
        const obtenerPerfil = async () => {
            try {
                const respuesta = await axios.get('/profile')
                setUsuario(respuesta.data.usuario)
            } catch (error) {
                setError(
                    error.response?.data?.error ||
                    'No se pudieron cargar los datos del usuario.'
                )
            } finally {
                setCargando(false)
            }
        }

        obtenerPerfil()
    }, [])

    const manejarCambio = (evento) => {
        const { name, value } = evento.target

        setContrasenas((previas) => ({
            ...previas,
            [name]: value
        }))

        setError('')
        setMensaje('')
    }

    const cambiarContrasena = async (evento) => {
        evento.preventDefault()
        setError('')
        setMensaje('')

        if (
            !contrasenas.contrasenaActual ||
            !contrasenas.contrasenaNueva ||
            !contrasenas.confirmarContrasena
        ) {
            setError('Completá todos los campos de contraseña.')
            return
        }

        if (contrasenas.contrasenaNueva.length < 8) {
            setError('La nueva contraseña debe tener al menos 8 caracteres.')
            return
        }

        if (contrasenas.contrasenaNueva !== contrasenas.confirmarContrasena) {
            setError('La nueva contraseña y su confirmación no coinciden.')
            return
        }

        if (contrasenas.contrasenaActual === contrasenas.contrasenaNueva) {
            setError('La nueva contraseña debe ser diferente de la actual.')
            return
        }

        try {
            setCambiandoContrasena(true)

            const respuesta = await axios.patch('/profile/password', {
                contrasenaActual: contrasenas.contrasenaActual,
                contrasenaNueva: contrasenas.contrasenaNueva
            })

            setMensaje(
                respuesta.data.message ||
                'La contraseña se cambió correctamente.'
            )

            setContrasenas({
                contrasenaActual: '',
                contrasenaNueva: '',
                confirmarContrasena: ''
            })
        } catch (error) {
            setError(
                error.response?.data?.error ||
                'No se pudo cambiar la contraseña.'
            )
        } finally {
            setCambiandoContrasena(false)
        }
    }

    if (cargando) {
        return (
            <div className="p-6 text-stone-300">
                Cargando perfil...
            </div>
        )
    }

    if (!usuario) {
        return (
            <div className="p-6">
                <p className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
                    {error || 'No se pudieron cargar los datos del perfil.'}
                </p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#f5f5f4] p-4 text-stone-900 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-5xl">

                <div className="mb-8">
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                        Mi cuenta
                    </h1>
                    <p className="mt-2 text-sm text-stone-500">
                        Consultá tus datos personales y administrá la seguridad de tu cuenta.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

                    {/* Datos del usuario */}
                    <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm lg:col-span-1">
                        <div className="mb-6 flex items-center gap-3">
                            <FaUserCircle className="text-3xl text-stone-700" />
                            <div>
                                <h2 className="font-semibold">
                                    Datos del usuario
                                </h2>
                                <p className="text-xs text-stone-500">
                                    Información de tu cuenta
                                </p>
                            </div>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-stone-500">
                                    Nombre
                                </p>
                                <p className="break-words text-sm font-medium">
                                    {usuario.nombre || 'No informado'}
                                </p>
                            </div>

                            <div>
                                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-stone-500">
                                    Apellido
                                </p>
                                <p className="break-words text-sm font-medium">
                                    {usuario.apellido || 'No informado'}
                                </p>
                            </div>

                            <div>
                                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-stone-500">
                                    Usuario
                                </p>
                                <p className="break-words text-sm font-medium">
                                    {usuario.usuario || 'No informado'}
                                </p>
                            </div>

                            <div>
                                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-stone-500">
                                    Correo electrónico
                                </p>
                                <p className="break-words text-sm font-medium">
                                    {usuario.mail || 'No informado'}
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Cambio de contraseña */}
                    <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm lg:col-span-2">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-stone-100">
                                <FaLock className="text-lg text-stone-700" />
                            </div>

                            <div>
                                <h2 className="font-semibold">
                                    Cambiar contraseña
                                </h2>
                                <p className="text-xs text-stone-500">
                                    Mantené segura tu cuenta
                                </p>
                            </div>
                        </div>

                        {error && (
                            <div
                                role="alert"
                                className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                            >
                                {error}
                            </div>
                        )}

                        {mensaje && (
                            <div
                                role="status"
                                className="mb-5 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700"
                            >
                                {mensaje}
                            </div>
                        )}

                        <form onSubmit={cambiarContrasena} className="space-y-5">
                            <div>
                                <label
                                    htmlFor="contrasenaActual"
                                    className="mb-2 block text-sm font-medium text-stone-700"
                                >
                                    Contraseña actual
                                </label>
                                <input
                                    id="contrasenaActual"
                                    name="contrasenaActual"
                                    type="password"
                                    autoComplete="current-password"
                                    value={contrasenas.contrasenaActual}
                                    onChange={manejarCambio}
                                    required
                                    className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-stone-600 focus:ring-2 focus:ring-stone-200"
                                    placeholder="Ingresá tu contraseña actual"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="contrasenaNueva"
                                    className="mb-2 block text-sm font-medium text-stone-700"
                                >
                                    Nueva contraseña
                                </label>
                                <input
                                    id="contrasenaNueva"
                                    name="contrasenaNueva"
                                    type="password"
                                    autoComplete="new-password"
                                    value={contrasenas.contrasenaNueva}
                                    onChange={manejarCambio}
                                    minLength={8}
                                    required
                                    className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-stone-600 focus:ring-2 focus:ring-stone-200"
                                    placeholder="Mínimo 8 caracteres"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="confirmarContrasena"
                                    className="mb-2 block text-sm font-medium text-stone-700"
                                >
                                    Confirmar nueva contraseña
                                </label>
                                <input
                                    id="confirmarContrasena"
                                    name="confirmarContrasena"
                                    type="password"
                                    autoComplete="new-password"
                                    value={contrasenas.confirmarContrasena}
                                    onChange={manejarCambio}
                                    minLength={8}
                                    required
                                    className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-stone-600 focus:ring-2 focus:ring-stone-200"
                                    placeholder="Repetí la nueva contraseña"
                                />
                            </div>

                            <div className="border-t border-stone-100 pt-5">
                                <button
                                    type="submit"
                                    disabled={cambiandoContrasena}
                                    className="w-full rounded-xl bg-[#171412] px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                                >
                                    {cambiandoContrasena
                                        ? 'Actualizando...'
                                        : 'Actualizar contraseña'}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            </div>
        </div>
    )
}

export default PerfilPage