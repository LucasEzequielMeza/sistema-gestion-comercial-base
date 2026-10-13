import React, { useEffect, useState } from 'react'

function ProveedoresForm({ proveedor, onGuardar, onCancelar, cargando, error }) {

    const [formulario, setFormulario] = useState({
        nombre: '',
        cuit: '',
        telefono: '',
        mail: '',
        direccion: '',
        contacto: '',
        observaciones: ''
    })

    useEffect(() => {

        if (proveedor) {
            setFormulario({
                nombre: proveedor.nombre || '',
                cuit: proveedor.cuit || '',
                telefono: proveedor.telefono || '',
                mail: proveedor.mail || '',
                direccion: proveedor.direccion || '',
                contacto: proveedor.contacto || '',
                observaciones: proveedor.observaciones || ''
            })
        } else {
            setFormulario({
                nombre: '',
                cuit: '',
                telefono: '',
                mail: '',
                direccion: '',
                contacto: '',
                observaciones: ''
            })
        }

    }, [proveedor])

    const manejarCambio = (e) => {

        const { name, value } = e.target

        setFormulario((formularioActual) => ({
            ...formularioActual,
            [name]: value
        }))

    }

    const manejarEnvio = async (e) => {

        e.preventDefault()

        if (!formulario.nombre.trim() || !formulario.cuit.trim()) {
            return
        }

        await onGuardar({
            nombre: formulario.nombre.trim(),
            cuit: formulario.cuit.trim(),
            telefono: formulario.telefono.trim(),
            mail: formulario.mail.trim(),
            direccion: formulario.direccion.trim(),
            contacto: formulario.contacto.trim(),
            observaciones: formulario.observaciones.trim()
        })

    }

    const campoClase = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

    const etiquetaClase = 'mb-1.5 block text-sm font-medium text-gray-700'

    return (
        <form onSubmit={manejarEnvio} className="space-y-5">

            {error.length > 0 && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error.map((mensaje, indice) => (
                        <p key={indice}>{mensaje}</p>
                    ))}
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div>
                    <label htmlFor="nombre" className={etiquetaClase}>
                        Nombre del proveedor *
                    </label>
                    <input
                        id="nombre"
                        name="nombre"
                        type="text"
                        value={formulario.nombre}
                        onChange={manejarCambio}
                        className={campoClase}
                        placeholder="Nombre o razón social"
                        maxLength={150}
                        required
                    />
                </div>

                <div>
                    <label htmlFor="cuit" className={etiquetaClase}>
                        CUIT *
                    </label>
                    <input
                        id="cuit"
                        name="cuit"
                        type="text"
                        value={formulario.cuit}
                        onChange={manejarCambio}
                        className={campoClase}
                        placeholder="Ej. 20-12345678-9"
                        maxLength={20}
                        required
                    />
                </div>

                <div>
                    <label htmlFor="telefono" className={etiquetaClase}>
                        Teléfono
                    </label>
                    <input
                        id="telefono"
                        name="telefono"
                        type="tel"
                        value={formulario.telefono}
                        onChange={manejarCambio}
                        className={campoClase}
                        placeholder="Número de contacto"
                        maxLength={50}
                    />
                </div>

                <div>
                    <label htmlFor="mail" className={etiquetaClase}>
                        Correo electrónico
                    </label>
                    <input
                        id="mail"
                        name="mail"
                        type="email"
                        value={formulario.mail}
                        onChange={manejarCambio}
                        className={campoClase}
                        placeholder="proveedor@ejemplo.com"
                        maxLength={150}
                    />
                </div>

                <div>
                    <label htmlFor="contacto" className={etiquetaClase}>
                        Persona de contacto
                    </label>
                    <input
                        id="contacto"
                        name="contacto"
                        type="text"
                        value={formulario.contacto}
                        onChange={manejarCambio}
                        className={campoClase}
                        placeholder="Nombre del contacto"
                        maxLength={150}
                    />
                </div>

                <div>
                    <label htmlFor="direccion" className={etiquetaClase}>
                        Dirección
                    </label>
                    <input
                        id="direccion"
                        name="direccion"
                        type="text"
                        value={formulario.direccion}
                        onChange={manejarCambio}
                        className={campoClase}
                        placeholder="Dirección del proveedor"
                        maxLength={250}
                    />
                </div>

                <div className="sm:col-span-2">
                    <label htmlFor="observaciones" className={etiquetaClase}>
                        Observaciones
                    </label>
                    <textarea
                        id="observaciones"
                        name="observaciones"
                        value={formulario.observaciones}
                        onChange={manejarCambio}
                        className={campoClase}
                        placeholder="Información adicional sobre el proveedor"
                        rows={3}
                        maxLength={1000}
                    />
                </div>

            </div>

            <p className="text-xs text-gray-500">
                * Campos obligatorios.
            </p>

            <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">

                <button
                    type="button"
                    onClick={onCancelar}
                    disabled={cargando}
                    className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Cancelar
                </button>

                <button
                    type="submit"
                    disabled={cargando}
                    className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {cargando
                        ? 'Guardando...'
                        : proveedor
                            ? 'Guardar cambios'
                            : 'Registrar proveedor'}
                </button>

            </div>

        </form>
    )
}

export default ProveedoresForm