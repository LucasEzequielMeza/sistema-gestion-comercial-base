import React, { useEffect, useState } from 'react'
import { useProveedores } from '../Context/ContextoProveedores'
import ProveedoresForm from '../Components/proveedores/ProveedoresForm'

function ProveedoresPage() {

    const {
        proveedores,
        proveedorError,
        cargando,
        proveedoresInactivos,
        obtenerProveedores,
        obtenerProveedorPorId,
        crearProveedor,
        actualizarProveedor,
        buscarProveedores,
        desactivarProveedor,
        activarProveedor,
        obtenerProveedoresInactivos,
        limpiarProveedorError
    } = useProveedores()

    const [busqueda, setBusqueda] = useState('')
    const [filtroEstado, setFiltroEstado] = useState('activos')
    const [resultadosBusqueda, setResultadosBusqueda] = useState(null)
    const [modalAbierto, setModalAbierto] = useState(false)
    const [proveedorEditar, setProveedorEditar] = useState(null)
    const [mensaje, setMensaje] = useState('')
    const [errorAccion, setErrorAccion] = useState('')
    const [proveedorCambioEstado, setProveedorCambioEstado] = useState(null)
    const [cambiandoEstado, setCambiandoEstado] = useState(false)

    useEffect(() => {
        cargarProveedores()
    }, [])

    const cargarProveedores = async () => {

        setResultadosBusqueda(null)

        await obtenerProveedores()

    }

    const manejarBusqueda = async (e) => {

        e.preventDefault()

        setMensaje('')
        setErrorAccion('')
        setResultadosBusqueda(null)

        if (!busqueda.trim()) {
            await cargarProveedores()
            return
        }

        const resultados = await buscarProveedores(busqueda)

        if (resultados !== null) {
            setResultadosBusqueda(resultados)
        }

    }

    const limpiarBusqueda = async () => {

        setBusqueda('')
        setResultadosBusqueda(null)
        setMensaje('')
        setErrorAccion('')

        await obtenerProveedores()

    }

    const cambiarFiltro = async (filtro) => {

        setFiltroEstado(filtro)
        setMensaje('')
        setErrorAccion('')
        setResultadosBusqueda(null)

        if (filtro === 'inactivos') {
            await obtenerProveedoresInactivos()
        } else if (filtro === 'activos') {
            await obtenerProveedores()
        } else {
            await obtenerProveedores()
            await obtenerProveedoresInactivos()
        }

    }

    const abrirFormularioNuevo = () => {

        limpiarProveedorError()
        setProveedorEditar(null)
        setErrorAccion('')
        setModalAbierto(true)

    }

    const abrirFormularioEdicion = async (id) => {

        limpiarProveedorError()
        setErrorAccion('')

        const proveedorObtenido = await obtenerProveedorPorId(id)

        if (proveedorObtenido) {
            setProveedorEditar(proveedorObtenido)
            setModalAbierto(true)
        }

    }

    const cerrarFormulario = () => {

        setModalAbierto(false)
        setProveedorEditar(null)
        limpiarProveedorError()

    }

    const manejarGuardar = async (datos) => {

        setMensaje('')
        setErrorAccion('')

        const resultado = proveedorEditar
            ? await actualizarProveedor(proveedorEditar.id, datos)
            : await crearProveedor(datos)

        if (resultado) {

            cerrarFormulario()
            setBusqueda('')
            setResultadosBusqueda(null)

            await obtenerProveedores()
            await obtenerProveedoresInactivos()

            setMensaje(
                proveedorEditar
                    ? 'Proveedor actualizado correctamente.'
                    : 'Proveedor registrado correctamente.'
            )

        }

    }

    const abrirConfirmacionEstado = (proveedorItem) => {

        setMensaje('')
        setErrorAccion('')
        setProveedorCambioEstado(proveedorItem)

    }

    const cerrarConfirmacionEstado = () => {

        if (cambiandoEstado) {
            return
        }

        setProveedorCambioEstado(null)

    }

    const confirmarCambioEstado = async () => {

        if (!proveedorCambioEstado || cambiandoEstado) {
            return
        }

        const proveedorActual = proveedorCambioEstado
        const estabaActivo = proveedorActual.activo

        setCambiandoEstado(true)
        setMensaje('')
        setErrorAccion('')

        try {

            const resultado = estabaActivo
                ? await desactivarProveedor(proveedorActual.id)
                : await activarProveedor(proveedorActual.id)

            if (!resultado) {
                setErrorAccion(
                    proveedorError[0] ||
                    'No se pudo cambiar el estado del proveedor.'
                )
                return
            }

            await obtenerProveedores()
            await obtenerProveedoresInactivos()

            setResultadosBusqueda(null)
            setBusqueda('')
            setFiltroEstado(estabaActivo ? 'inactivos' : 'activos')
            setProveedorCambioEstado(null)

            setMensaje(
                estabaActivo
                    ? 'Proveedor desactivado correctamente.'
                    : 'Proveedor activado correctamente.'
            )

        } catch (error) {

            console.error('Error al cambiar el estado del proveedor:', error)

            setErrorAccion(
                'Ocurrió un error al cambiar el estado del proveedor.'
            )

        } finally {

            setCambiandoEstado(false)

        }

    }

    const proveedoresBase = filtroEstado === 'inactivos'
        ? proveedoresInactivos
        : filtroEstado === 'todos'
            ? [...proveedores, ...proveedoresInactivos]
            : proveedores

    const proveedoresFiltrados = resultadosBusqueda !== null
        ? resultadosBusqueda.filter((proveedorItem) => {
            if (filtroEstado === 'activos') return proveedorItem.activo
            if (filtroEstado === 'inactivos') return !proveedorItem.activo
            return true
        })
        : proveedoresBase

    const formatoFecha = (fecha) => {

        if (!fecha) {
            return '—'
        }

        const fechaValida = new Date(fecha)

        if (Number.isNaN(fechaValida.getTime())) {
            return '—'
        }

        return fechaValida.toLocaleDateString('es-AR')

    }

    const tarjetaClase = 'rounded-xl border border-gray-200 bg-white p-5 shadow-sm'

    const botonSecundario = 'rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50'

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">

            <div className="mx-auto max-w-7xl space-y-6">

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm font-medium text-blue-600">
                            Gestión comercial
                        </p>
                        <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
                            Proveedores
                        </h1>
                        <p className="mt-2 text-sm text-gray-500">
                            Administrá los datos y el estado de tus proveedores.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={abrirFormularioNuevo}
                        className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                    >
                        + Nuevo proveedor
                    </button>
                </div>

                {mensaje && (
                    <div role="status" className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                        {mensaje}
                    </div>
                )}

                {errorAccion && (
                    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {errorAccion}
                    </div>
                )}

                {proveedorError.length > 0 && !modalAbierto && (
                    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {proveedorError.map((error, indice) => (
                            <p key={indice}>{error}</p>
                        ))}
                    </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

                    <div className={tarjetaClase}>
                        <p className="text-sm text-gray-500">
                            Proveedores activos
                        </p>
                        <p className="mt-2 text-3xl font-bold text-gray-900">
                            {proveedores.length}
                        </p>
                    </div>

                    <div className={tarjetaClase}>
                        <p className="text-sm text-gray-500">
                            Proveedores inactivos
                        </p>
                        <p className="mt-2 text-3xl font-bold text-gray-900">
                            {proveedoresInactivos.length}
                        </p>
                    </div>

                    <div className={tarjetaClase}>
                        <p className="text-sm text-gray-500">
                            Total de proveedores
                        </p>
                        <p className="mt-2 text-3xl font-bold text-gray-900">
                            {proveedores.length + proveedoresInactivos.length}
                        </p>
                    </div>

                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">

                    <form
                        onSubmit={manejarBusqueda}
                        className="flex flex-col gap-3 sm:flex-row"
                    >
                        <div className="flex-1">
                            <label htmlFor="buscarProveedor" className="sr-only">
                                Buscar proveedor
                            </label>
                            <input
                                id="buscarProveedor"
                                type="search"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                placeholder="Buscar por nombre o CUIT..."
                                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={cargando}
                            className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-50"
                        >
                            Buscar
                        </button>

                        <button
                            type="button"
                            onClick={limpiarBusqueda}
                            className={botonSecundario}
                        >
                            Limpiar
                        </button>
                    </form>

                    <div className="mt-4 flex flex-wrap gap-2">
                        {[
                            { valor: 'activos', texto: 'Activos' },
                            { valor: 'inactivos', texto: 'Inactivos' },
                            { valor: 'todos', texto: 'Todos' }
                        ].map((filtro) => (
                            <button
                                key={filtro.valor}
                                type="button"
                                onClick={() => cambiarFiltro(filtro.valor)}
                                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                                    filtroEstado === filtro.valor
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                {filtro.texto}
                            </button>
                        ))}
                    </div>

                </div>

                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

                    <div className="flex flex-col gap-1 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <h2 className="font-semibold text-gray-900">
                            Listado de proveedores
                        </h2>
                        <p className="text-sm text-gray-500">
                            {proveedoresFiltrados.length} resultado(s)
                        </p>
                    </div>

                    {cargando ? (
                        <div className="px-5 py-12 text-center text-sm text-gray-500">
                            Cargando proveedores...
                        </div>
                    ) : proveedoresFiltrados.length === 0 ? (
                        <div className="px-5 py-12 text-center">
                            <h3 className="font-medium text-gray-800">
                                No hay proveedores para mostrar
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Probá con otra búsqueda o registrá un proveedor nuevo.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[850px] text-left text-sm">
                                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                                    <tr>
                                        <th className="px-5 py-3 font-semibold">Proveedor</th>
                                        <th className="px-5 py-3 font-semibold">CUIT</th>
                                        <th className="px-5 py-3 font-semibold">Contacto</th>
                                        <th className="px-5 py-3 font-semibold">Teléfono</th>
                                        <th className="px-5 py-3 font-semibold">Estado</th>
                                        <th className="px-5 py-3 font-semibold">Actualizado</th>
                                        <th className="px-5 py-3 text-right font-semibold">Acciones</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-100">
                                    {proveedoresFiltrados.map((proveedorItem) => (
                                        <tr key={proveedorItem.id} className="transition hover:bg-gray-50">

                                            <td className="px-5 py-4">
                                                <p className="font-medium text-gray-900">
                                                    {proveedorItem.nombre}
                                                </p>
                                                <p className="mt-1 text-xs text-gray-500">
                                                    {proveedorItem.mail || 'Sin correo registrado'}
                                                </p>
                                            </td>

                                            <td className="px-5 py-4 text-gray-700">
                                                {proveedorItem.cuit || '—'}
                                            </td>

                                            <td className="px-5 py-4 text-gray-700">
                                                {proveedorItem.contacto || '—'}
                                            </td>

                                            <td className="px-5 py-4 text-gray-700">
                                                {proveedorItem.telefono || '—'}
                                            </td>

                                            <td className="px-5 py-4">
                                                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                                                    proveedorItem.activo
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                    {proveedorItem.activo ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4 text-gray-600">
                                                {formatoFecha(proveedorItem.updated_at)}
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => abrirFormularioEdicion(proveedorItem.id)}
                                                        className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-100"
                                                    >
                                                        Editar
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => abrirConfirmacionEstado(proveedorItem)}
                                                        className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                                                            proveedorItem.activo
                                                                ? 'border border-red-200 text-red-700 hover:bg-red-50'
                                                                : 'border border-green-200 text-green-700 hover:bg-green-50'
                                                        }`}
                                                    >
                                                        {proveedorItem.activo ? 'Desactivar' : 'Activar'}
                                                    </button>
                                                </div>
                                            </td>

                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                </div>

            </div>

            {modalAbierto && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-gray-900/50 p-4"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) {
                            cerrarFormulario()
                        }
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="tituloFormularioProveedor"
                        className="my-auto max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:p-7"
                    >
                        <div className="mb-6 flex items-start justify-between gap-4">
                            <div>
                                <h2 id="tituloFormularioProveedor" className="text-xl font-bold text-gray-900">
                                    {proveedorEditar ? 'Editar proveedor' : 'Nuevo proveedor'}
                                </h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    Completá los datos del proveedor.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={cerrarFormulario}
                                className="rounded-lg px-3 py-1 text-2xl leading-none text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                                aria-label="Cerrar formulario"
                            >
                                ×
                            </button>
                        </div>

                        <ProveedoresForm
                            key={proveedorEditar?.id || 'nuevo-proveedor'}
                            proveedor={proveedorEditar}
                            onGuardar={manejarGuardar}
                            onCancelar={cerrarFormulario}
                            cargando={cargando}
                            error={proveedorError}
                        />
                    </div>
                </div>
            )}

            {proveedorCambioEstado && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/50 p-4"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) {
                            cerrarConfirmacionEstado()
                        }
                    }}
                >
                    <div
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="tituloConfirmacionEstado"
                        aria-describedby="descripcionConfirmacionEstado"
                        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
                    >
                        <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full ${
                            proveedorCambioEstado.activo
                                ? 'bg-red-100 text-red-600'
                                : 'bg-green-100 text-green-600'
                        }`}>
                            <span className="text-xl font-bold">
                                {proveedorCambioEstado.activo ? '!' : '✓'}
                            </span>
                        </div>

                        <h2 id="tituloConfirmacionEstado" className="text-lg font-bold text-gray-900">
                            {proveedorCambioEstado.activo
                                ? 'Desactivar proveedor'
                                : 'Activar proveedor'}
                        </h2>

                        <p id="descripcionConfirmacionEstado" className="mt-2 text-sm leading-6 text-gray-600">
                            {proveedorCambioEstado.activo
                                ? `¿Estás seguro de que querés desactivar a "${proveedorCambioEstado.nombre}"? No estará disponible como proveedor activo.`
                                : `¿Querés volver a activar a "${proveedorCambioEstado.nombre}"?`}
                        </p>

                        {proveedorError.length > 0 && (
                            <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                {proveedorError.map((error, indice) => (
                                    <p key={indice}>{error}</p>
                                ))}
                            </div>
                        )}

                        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={cerrarConfirmacionEstado}
                                disabled={cambiandoEstado}
                                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Cancelar
                            </button>

                            <button
                                type="button"
                                onClick={confirmarCambioEstado}
                                disabled={cambiandoEstado}
                                className={`rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                    proveedorCambioEstado.activo
                                        ? 'bg-red-600 hover:bg-red-700'
                                        : 'bg-green-600 hover:bg-green-700'
                                }`}
                            >
                                {cambiandoEstado
                                    ? 'Procesando...'
                                    : proveedorCambioEstado.activo
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

export default ProveedoresPage