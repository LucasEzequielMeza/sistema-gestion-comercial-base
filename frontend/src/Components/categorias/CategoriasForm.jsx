import { useEffect, useState } from 'react'

function CategoriasForm({ categoria, onGuardar, onCancelar, cargando, error }) {
    const [nombre, setNombre] = useState('')
    const [descripcion, setDescripcion] = useState('')
    const [erroresFormulario, setErroresFormulario] = useState({})

    useEffect(() => {
        setNombre(categoria?.nombre || '')
        setDescripcion(categoria?.descripcion || '')
        setErroresFormulario({})
    }, [categoria])

    const manejarEnvio = async (e) => {
        e.preventDefault()

        const nuevosErrores = {}

        if (!nombre.trim()) {
            nuevosErrores.nombre = 'El nombre es obligatorio.'
        } else if (nombre.trim().length > 100) {
            nuevosErrores.nombre = 'El nombre no puede superar los 100 caracteres.'
        }

        if (descripcion.trim().length > 500) {
            nuevosErrores.descripcion = 'La descripción no puede superar los 500 caracteres.'
        }

        setErroresFormulario(nuevosErrores)

        if (Object.keys(nuevosErrores).length > 0) {
            return
        }

        await onGuardar({
            nombre: nombre.trim(),
            descripcion: descripcion.trim() || null
        })
    }

    return (
        <form onSubmit={manejarEnvio} className="space-y-5">
            {error?.length > 0 && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                    {error.map((mensaje, indice) => (
                        <p key={indice}>{mensaje}</p>
                    ))}
                </div>
            )}

            <div>
                <label htmlFor="nombreCategoria" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Nombre <span className="text-red-600">*</span>
                </label>
                <input
                    id="nombreCategoria"
                    type="text"
                    value={nombre}
                    onChange={(e) => {
                        setNombre(e.target.value)
                        setErroresFormulario((errores) => ({ ...errores, nombre: '' }))
                    }}
                    maxLength={100}
                    placeholder="Ej. Alimentos"
                    disabled={cargando}
                    className={`w-full rounded-lg border px-3 py-2.5 outline-none transition focus:ring-2 focus:ring-blue-500 ${
                        erroresFormulario.nombre ? 'border-red-500' : 'border-gray-300'
                    }`}
                />
                {erroresFormulario.nombre && (
                    <p className="mt-1 text-sm text-red-600">{erroresFormulario.nombre}</p>
                )}
            </div>

            <div>
                <label htmlFor="descripcionCategoria" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Descripción
                </label>
                <textarea
                    id="descripcionCategoria"
                    value={descripcion}
                    onChange={(e) => {
                        setDescripcion(e.target.value)
                        setErroresFormulario((errores) => ({ ...errores, descripcion: '' }))
                    }}
                    maxLength={500}
                    rows={4}
                    placeholder="Descripción opcional de la categoría"
                    disabled={cargando}
                    className={`w-full resize-y rounded-lg border px-3 py-2.5 outline-none transition focus:ring-2 focus:ring-blue-500 ${
                        erroresFormulario.descripcion ? 'border-red-500' : 'border-gray-300'
                    }`}
                />
                {erroresFormulario.descripcion && (
                    <p className="mt-1 text-sm text-red-600">{erroresFormulario.descripcion}</p>
                )}
                <p className="mt-1 text-right text-xs text-gray-500">{descripcion.length}/500 caracteres</p>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:justify-end">
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
                    {cargando ? 'Guardando...' : categoria ? 'Guardar cambios' : 'Crear categoría'}
                </button>
            </div>
        </form>
    )
}

export default CategoriasForm