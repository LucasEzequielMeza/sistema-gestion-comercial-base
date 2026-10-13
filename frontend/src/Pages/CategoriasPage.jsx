import { useEffect, useState } from 'react'
import { useCategorias } from '../Context/ContextoCategorias.jsx'
import CategoriasForm from '../Components/categorias/CategoriasForm.jsx'

function CategoriasPage() {
    const {
        categorias,
        categoriasInactivas,
        categoriaError,
        cargando,
        obtenerCategorias,
        crearCategoria,
        actualizarCategoria,
        buscarCategorias,
        desactivarCategoria,
        activarCategoria,
        limpiarCategoriaError,
        setCategoria
    } = useCategorias()

    const [busqueda, setBusqueda] = useState('')
    const [filtroEstado, setFiltroEstado] = useState('activas')
    const [resultadosBusqueda, setResultadosBusqueda] = useState([])
    const [modalFormulario, setModalFormulario] = useState(false)
    const [categoriaEditar, setCategoriaEditar] = useState(null)
    const [categoriaCambioEstado, setCategoriaCambioEstado] = useState(null)
    const [cambiandoEstado, setCambiandoEstado] = useState(false)
    const [guardandoFormulario, setGuardandoFormulario] = useState(false)
    const [mensaje, setMensaje] = useState('')
    const [errorAccion, setErrorAccion] = useState('')

    useEffect(() => {
        obtenerCategorias()
    }, [])

    useEffect(() => {
        let cancelado = false

        const ejecutarBusqueda = async () => {
            if (!busqueda.trim()) {
                setResultadosBusqueda([])
                return
            }

            const resultados = await buscarCategorias(busqueda.trim())

            if (!cancelado && resultados) {
                setResultadosBusqueda(resultados)
            }
        }

        ejecutarBusqueda()

        return () => {
            cancelado = true
        }
    }, [busqueda])

    const categoriasFiltradas = (() => {
        const lista = busqueda.trim()
            ? resultadosBusqueda
            : filtroEstado === 'activas'
                ? categorias
                : categoriasInactivas

        return lista.filter((categoriaItem) => {
            if (filtroEstado === 'activas') {
                return categoriaItem.activo === true
            }

            return categoriaItem.activo === false
        })
    })()

    const abrirFormulario = (categoriaItem = null) => {
        limpiarCategoriaError()
        setErrorAccion('')
        setCategoria(null)
        setCategoriaEditar(categoriaItem)
        setModalFormulario(true)
    }

    const cerrarFormulario = () => {
        if (guardandoFormulario) return

        setModalFormulario(false)
        setCategoriaEditar(null)
        limpiarCategoriaError()
        setErrorAccion('')
    }

    const manejarGuardar = async (datosCategoria) => {
        setGuardandoFormulario(true)
        limpiarCategoriaError()
        setErrorAccion('')
        setMensaje('')

        try {
            const resultado = categoriaEditar
                ? await actualizarCategoria(categoriaEditar.id, datosCategoria)
                : await crearCategoria(datosCategoria)

            if (!resultado) {
                setErrorAccion('No se pudo guardar la categoría. Revisá los datos e intentá nuevamente.')
                return
            }

            await obtenerCategorias()
            setBusqueda('')
            setMensaje(categoriaEditar
                ? 'La categoría se actualizó correctamente.'
                : 'La categoría se creó correctamente.')
            setModalFormulario(false)
            setCategoriaEditar(null)
        } finally {
            setGuardandoFormulario(false)
        }
    }

    const abrirConfirmacionEstado = (categoriaItem) => {
        limpiarCategoriaError()
        setErrorAccion('')
        setCategoriaCambioEstado(categoriaItem)
    }

    const cerrarConfirmacionEstado = () => {
        if (cambiandoEstado) return

        setCategoriaCambioEstado(null)
        limpiarCategoriaError()
        setErrorAccion('')
    }

    const confirmarCambioEstado = async () => {
        if (!categoriaCambioEstado) return

        const categoriaActual = categoriaCambioEstado
        const estabaActiva = categoriaActual.activo === true

        setCambiandoEstado(true)
        limpiarCategoriaError()
        setErrorAccion('')
        setMensaje('')

        try {
            const resultado = estabaActiva
                ? await desactivarCategoria(categoriaActual.id)
                : await activarCategoria(categoriaActual.id)

            if (!resultado) {
                setErrorAccion('No se pudo cambiar el estado de la categoría. Intentá nuevamente.')
                return
            }

            await obtenerCategorias()
            setBusqueda('')
            setFiltroEstado(estabaActiva ? 'inactivas' : 'activas')
            setCategoriaCambioEstado(null)
            setMensaje(estabaActiva
                ? 'La categoría se desactivó correctamente.'
                : 'La categoría se activó correctamente.')
        } finally {
            setCambiandoEstado(false)
        }
    }

    const cambiarFiltro = (nuevoFiltro) => {
        setFiltroEstado(nuevoFiltro)
        setBusqueda('')
        setResultadosBusqueda([])
        setMensaje('')
        setErrorAccion('')
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Categorías</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Organizá los productos de tu comercio por categoría.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => abrirFormulario()}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                        <span className="text-lg leading-none">+</span>
                        Nueva categoría
                    </button>
                </div>

                {mensaje && (
                    <div className="flex items-start justify-between gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800" role="status">
                        <span>{mensaje}</span>
                        <button
                            type="button"
                            onClick={() => setMensaje('')}
                            className="font-semibold text-green-800 hover:text-green-950"
                            aria-label="Cerrar mensaje"
                        >
                            ×
                        </button>
                    </div>
                )}

                {errorAccion && !modalFormulario && !categoriaCambioEstado && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                        {errorAccion}
                    </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                        <p className="text-sm font-medium text-gray-500">Categorías activas</p>
                        <p className="mt-2 text-3xl font-bold text-gray-900">{categorias.length}</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                        <p className="text-sm font-medium text-gray-500">Categorías inactivas</p>
                        <p className="mt-2 text-3xl font-bold text-gray-900">{categoriasInactivas.length}</p>
                    </div>
                </div>

                <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-4 border-b border-gray-200 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => cambiarFiltro('activas')}
                                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                                    filtroEstado === 'activas'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Activas
                            </button>
                            <button
                                type="button"
                                onClick={() => cambiarFiltro('inactivas')}
                                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                                    filtroEstado === 'inactivas'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Inactivas
                            </button>
                        </div>

                        <div className="flex w-full gap-2 lg:max-w-md">
                            <input
                                type="search"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                placeholder="Buscar categoría por nombre..."
                                className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                            {busqueda && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setBusqueda('')
                                        setResultadosBusqueda([])
                                    }}
                                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                    Limpiar
                                </button>
                            )}
                        </div>
                    </div>

                    {categoriaError.length > 0 && !modalFormulario && !categoriaCambioEstado && (
                        <div className="m-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                            {categoriaError.map((error, indice) => (
                                <p key={indice}>{error}</p>
                            ))}
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[650px] text-left text-sm">
                            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                                <tr>
                                    <th className="px-5 py-4 font-semibold">Nombre</th>
                                    <th className="px-5 py-4 font-semibold">Descripción</th>
                                    <th className="px-5 py-4 font-semibold">Estado</th>
                                    <th className="px-5 py-4 text-right font-semibold">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {cargando && !modalFormulario && !categoriaCambioEstado ? (
                                    <tr>
                                        <td colSpan="4" className="px-5 py-10 text-center text-gray-500">
                                            Cargando categorías...
                                        </td>
                                    </tr>
                                ) : categoriasFiltradas.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-5 py-10 text-center text-gray-500">
                                            {busqueda
                                                ? 'No se encontraron categorías con esa búsqueda.'
                                                : filtroEstado === 'activas'
                                                    ? 'Todavía no hay categorías activas.'
                                                    : 'No hay categorías inactivas.'}
                                        </td>
                                    </tr>
                                ) : (
                                    categoriasFiltradas.map((categoriaItem) => (
                                        <tr key={categoriaItem.id} className="transition hover:bg-gray-50">
                                            <td className="px-5 py-4 font-medium text-gray-900">
                                                {categoriaItem.nombre}
                                            </td>
                                            <td className="max-w-md whitespace-normal px-5 py-4 text-gray-600">
                                                {categoriaItem.descripcion || 'Sin descripción'}
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                                                    categoriaItem.activo
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                    {categoriaItem.activo ? 'Activa' : 'Inactiva'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => abrirFormulario(categoriaItem)}
                                                        className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-100"
                                                    >
                                                        Editar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => abrirConfirmacionEstado(categoriaItem)}
                                                        className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                                                            categoriaItem.activo
                                                                ? 'bg-red-50 text-red-700 hover:bg-red-100'
                                                                : 'bg-green-50 text-green-700 hover:bg-green-100'
                                                        }`}
                                                    >
                                                        {categoriaItem.activo ? 'Desactivar' : 'Activar'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="border-t border-gray-200 px-5 py-3 text-xs text-gray-500">
                        {categoriasFiltradas.length} {categoriasFiltradas.length === 1 ? 'categoría encontrada' : 'categorías encontradas'}
                    </div>
                </section>
            </div>

            {modalFormulario && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
                    <div
                        className="my-auto w-full max-w-xl rounded-xl bg-white shadow-xl"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="tituloFormularioCategoria"
                    >
                        <div className="flex items-start justify-between border-b border-gray-200 px-5 py-4 sm:px-6">
                            <div>
                                <h2 id="tituloFormularioCategoria" className="text-lg font-semibold text-gray-900">
                                    {categoriaEditar ? 'Editar categoría' : 'Nueva categoría'}
                                </h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    Completá los datos de la categoría.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={cerrarFormulario}
                                disabled={guardandoFormulario}
                                className="rounded-lg px-2 py-1 text-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
                                aria-label="Cerrar formulario"
                            >
                                ×
                            </button>
                        </div>
                        <div className="p-5 sm:p-6">
                            <CategoriasForm
                                categoria={categoriaEditar}
                                onGuardar={manejarGuardar}
                                onCancelar={cerrarFormulario}
                                cargando={guardandoFormulario}
                                error={categoriaError}
                            />
                            {errorAccion && (
                                <p className="mt-3 text-sm text-red-600" role="alert">{errorAccion}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {categoriaCambioEstado && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
                    <div
                        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="tituloConfirmacionCategoria"
                    >
                        <h2 id="tituloConfirmacionCategoria" className="text-lg font-semibold text-gray-900">
                            {categoriaCambioEstado.activo ? 'Desactivar categoría' : 'Activar categoría'}
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-gray-600">
                            {categoriaCambioEstado.activo
                                ? `¿Querés desactivar la categoría "${categoriaCambioEstado.nombre}"? No estará disponible para asignarla a nuevos productos.`
                                : `¿Querés volver a activar la categoría "${categoriaCambioEstado.nombre}"?`}
                        </p>

                        {categoriaError.length > 0 && (
                            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                                {categoriaError.map((error, indice) => (
                                    <p key={indice}>{error}</p>
                                ))}
                            </div>
                        )}

                        {errorAccion && (
                            <p className="mt-3 text-sm text-red-600" role="alert">{errorAccion}</p>
                        )}

                        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={cerrarConfirmacionEstado}
                                disabled={cambiandoEstado}
                                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={confirmarCambioEstado}
                                disabled={cambiandoEstado}
                                className={`rounded-lg px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 ${
                                    categoriaCambioEstado.activo
                                        ? 'bg-red-600 hover:bg-red-700'
                                        : 'bg-green-600 hover:bg-green-700'
                                }`}
                            >
                                {cambiandoEstado
                                    ? 'Procesando...'
                                    : categoriaCambioEstado.activo
                                        ? 'Sí, desactivar'
                                        : 'Sí, activar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default CategoriasPage