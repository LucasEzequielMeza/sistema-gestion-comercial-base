import React, { useEffect, useState } from 'react'
import axios from '../Api/axios'
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

    const [proveedorProductos, setProveedorProductos] = useState(null)
    const [productosAsociados, setProductosAsociados] = useState([])
    const [catalogoProductos, setCatalogoProductos] = useState([])
    const [productoSeleccionado, setProductoSeleccionado] = useState('')
    const [precioCompra, setPrecioCompra] = useState('')
    const [codigoProveedor, setCodigoProveedor] = useState('')
    const [cargandoProductos, setCargandoProductos] = useState(false)
    const [guardandoAsociacion, setGuardandoAsociacion] = useState(false)
    const [productoEnEdicion, setProductoEnEdicion] = useState(null)
    const [mensajeProductos, setMensajeProductos] = useState('')
    const [errorProductos, setErrorProductos] = useState('')

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

    const abrirProductosProveedor = async (proveedorItem) => {

        setProveedorProductos(proveedorItem)
        setProductosAsociados([])
        setCatalogoProductos([])
        setProductoSeleccionado('')
        setPrecioCompra('')
        setCodigoProveedor('')
        setProductoEnEdicion(null)
        setMensajeProductos('')
        setErrorProductos('')
        setCargandoProductos(true)

        try {

            const [respuestaAsociados, respuestaCatalogo] = await Promise.all([
                axios.get(`/proveedores/${proveedorItem.id}/productos`),
                axios.get('/productos')
            ])

            const datosAsociados = respuestaAsociados.data
            const datosCatalogo = respuestaCatalogo.data

            setProductosAsociados(
                Array.isArray(datosAsociados)
                    ? datosAsociados
                    : Array.isArray(datosAsociados.productos)
                        ? datosAsociados.productos
                        : []
            )

            setCatalogoProductos(
                Array.isArray(datosCatalogo)
                    ? datosCatalogo
                    : Array.isArray(datosCatalogo.productos)
                        ? datosCatalogo.productos
                        : []
            )

        } catch (error) {

            console.error('Error al cargar los productos del proveedor:', error)

            setErrorProductos(
                error.response?.data?.mensaje ||
                error.response?.data?.error ||
                'No se pudieron cargar los productos. Verificá la conexión con el servidor.'
            )

        } finally {

            setCargandoProductos(false)

        }

    }

    const recargarProductosProveedor = async () => {

        if (!proveedorProductos) {
            return
        }

        const respuesta = await axios.get(
            `/proveedores/${proveedorProductos.id}/productos`
        )

        const datos = respuesta.data

        setProductosAsociados(
            Array.isArray(datos)
                ? datos
                : Array.isArray(datos.productos)
                    ? datos.productos
                    : []
        )

    }

    const obtenerIdProducto = (producto) => {
        return producto.producto_id || producto.id
    }

    const prepararEdicionProducto = (producto) => {

        setProductoEnEdicion(producto)
        setProductoSeleccionado(String(obtenerIdProducto(producto)))
        setPrecioCompra(String(producto.precio_compra_proveedor ?? ''))
        setCodigoProveedor(producto.codigo_proveedor || '')
        setMensajeProductos('')
        setErrorProductos('')

    }

    const cancelarEdicionProducto = () => {

        setProductoEnEdicion(null)
        setProductoSeleccionado('')
        setPrecioCompra('')
        setCodigoProveedor('')
        setMensajeProductos('')
        setErrorProductos('')

    }

    const guardarProductoProveedor = async (e) => {

        e.preventDefault()

        if (!proveedorProductos || guardandoAsociacion) {
            return
        }

        if (!productoSeleccionado) {
            setErrorProductos('Seleccioná un producto.')
            return
        }

        if (precioCompra.trim() === '' || !Number.isFinite(Number(precioCompra)) || Number(precioCompra) < 0) {
            setErrorProductos('Ingresá un precio de compra válido.')
            return
        }

        setGuardandoAsociacion(true)
        setErrorProductos('')
        setMensajeProductos('')

        try {

            await axios.post(
                `/proveedores/${proveedorProductos.id}/productos`,
                {
                    producto_id: productoSeleccionado,
                    precio_compra: Number(precioCompra),
                    codigo_proveedor: codigoProveedor.trim() || null
                }
            )

            await recargarProductosProveedor()

            setProductoEnEdicion(null)
            setProductoSeleccionado('')
            setPrecioCompra('')
            setCodigoProveedor('')
            setMensajeProductos('Producto asociado al proveedor correctamente.')

        } catch (error) {

            console.error('Error al asociar el producto:', error)

            setErrorProductos(
                error.response?.data?.mensaje ||
                error.response?.data?.error ||
                'No se pudo guardar la asociación del producto.'
            )

        } finally {

            setGuardandoAsociacion(false)

        }

    }

    const quitarProductoProveedor = async (producto) => {

        if (!proveedorProductos) {
            return
        }

        const idProducto = obtenerIdProducto(producto)

        const confirmar = window.confirm(
            `¿Querés quitar "${producto.nombre}" de este proveedor? El producto no se eliminará del sistema.`
        )

        if (!confirmar) {
            return
        }

        setErrorProductos('')
        setMensajeProductos('')

        try {

            await axios.delete(
                `/proveedores/${proveedorProductos.id}/productos/${idProducto}`
            )

            setProductosAsociados((actuales) =>
                actuales.filter(
                    (item) => obtenerIdProducto(item) !== idProducto
                )
            )

            if (productoEnEdicion && obtenerIdProducto(productoEnEdicion) === idProducto) {
                cancelarEdicionProducto()
            }

            setMensajeProductos('Se quitó el producto de este proveedor.')

        } catch (error) {

            console.error('Error al quitar el producto del proveedor:', error)

            setErrorProductos(
                error.response?.data?.mensaje ||
                error.response?.data?.error ||
                'No se pudo quitar el producto de este proveedor.'
            )

        }

    }

    const cerrarProductosProveedor = () => {

        if (guardandoAsociacion) {
            return
        }

        setProveedorProductos(null)
        setProductosAsociados([])
        setCatalogoProductos([])
        setProductoEnEdicion(null)
        setMensajeProductos('')
        setErrorProductos('')

    }

    const productosDisponibles = catalogoProductos.filter((producto) => {

        const idProducto = String(obtenerIdProducto(producto))

        if (producto.activo === false) {
            return false
        }

        if (productoEnEdicion) {
            return idProducto === String(obtenerIdProducto(productoEnEdicion))
        }

        return !productosAsociados.some(
            (asociado) => String(obtenerIdProducto(asociado)) === idProducto
        )

    })

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

    const formatoPrecio = (precio) => {
        return Number(precio || 0).toLocaleString('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 2
        })
    }

    const tarjetaClase = 'rounded-xl border border-gray-200 bg-white p-5 shadow-sm'

    const botonSecundario = 'rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50'

    const campoClase = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

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
                                className={campoClase}
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
                            <table className="w-full min-w-[950px] text-left text-sm">
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
                                                        onClick={() => abrirProductosProveedor(proveedorItem)}
                                                        className="rounded-md border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-50"
                                                    >
                                                        Productos
                                                    </button>

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

            {proveedorProductos && (
                <div
                    className="fixed inset-0 z-[55] flex items-center justify-center overflow-y-auto bg-gray-900/50 p-4"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) {
                            cerrarProductosProveedor()
                        }
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="tituloProductosProveedor"
                        className="my-auto max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:p-7"
                    >
                        <div className="mb-6 flex items-start justify-between gap-4">
                            <div>
                                <h2 id="tituloProductosProveedor" className="text-xl font-bold text-gray-900">
                                    Productos del proveedor
                                </h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    {proveedorProductos.nombre}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={cerrarProductosProveedor}
                                disabled={guardandoAsociacion}
                                className="rounded-lg px-3 py-1 text-2xl leading-none text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
                                aria-label="Cerrar productos del proveedor"
                            >
                                ×
                            </button>
                        </div>

                        {mensajeProductos && (
                            <div role="status" className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                                {mensajeProductos}
                            </div>
                        )}

                        {errorProductos && (
                            <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {errorProductos}
                            </div>
                        )}

                        {proveedorProductos.activo ? (
                            <form
                                onSubmit={guardarProductoProveedor}
                                className="mb-7 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:p-5"
                            >
                                <h3 className="mb-4 font-semibold text-gray-900">
                                    {productoEnEdicion ? 'Editar producto asociado' : 'Asociar un producto'}
                                </h3>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

                                    <div className="sm:col-span-3">
                                        <label htmlFor="productoProveedor" className="mb-1.5 block text-sm font-medium text-gray-700">
                                            Producto *
                                        </label>
                                        <select
                                            id="productoProveedor"
                                            value={productoSeleccionado}
                                            onChange={(e) => setProductoSeleccionado(e.target.value)}
                                            className={campoClase}
                                            disabled={cargandoProductos || guardandoAsociacion || Boolean(productoEnEdicion)}
                                            required
                                        >
                                            <option value="">Seleccioná un producto</option>
                                            {productosDisponibles.map((producto) => (
                                                <option
                                                    key={obtenerIdProducto(producto)}
                                                    value={obtenerIdProducto(producto)}
                                                >
                                                    {producto.nombre} {producto.codigo ? `(${producto.codigo})` : ''}
                                                </option>
                                            ))}
                                        </select>

                                        {!cargandoProductos && productosDisponibles.length === 0 && !productoEnEdicion && (
                                            <p className="mt-1.5 text-xs text-gray-500">
                                                No hay productos disponibles para asociar. Podés revisar los productos ya asociados en el listado.
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="precioCompraProveedor" className="mb-1.5 block text-sm font-medium text-gray-700">
                                            Precio de compra *
                                        </label>
                                        <input
                                            id="precioCompraProveedor"
                                            type="number"
                                            value={precioCompra}
                                            onChange={(e) => setPrecioCompra(e.target.value)}
                                            className={campoClase}
                                            placeholder="0,00"
                                            required
                                            disabled={guardandoAsociacion}
                                        />
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label htmlFor="codigoProveedor" className="mb-1.5 block text-sm font-medium text-gray-700">
                                            Código del producto según el proveedor
                                        </label>
                                        <input
                                            id="codigoProveedor"
                                            type="text"
                                            value={codigoProveedor}
                                            onChange={(e) => setCodigoProveedor(e.target.value)}
                                            className={campoClase}
                                            placeholder="Opcional"
                                            maxLength={100}
                                            disabled={guardandoAsociacion}
                                        />
                                    </div>

                                </div>

                                <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                    {productoEnEdicion && (
                                        <button
                                            type="button"
                                            onClick={cancelarEdicionProducto}
                                            disabled={guardandoAsociacion}
                                            className={botonSecundario}
                                        >
                                            Cancelar edición
                                        </button>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={guardandoAsociacion || cargandoProductos}
                                        className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {guardandoAsociacion
                                            ? 'Guardando...'
                                            : productoEnEdicion
                                                ? 'Guardar cambios'
                                                : 'Asociar producto'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="mb-7 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                                Este proveedor está inactivo. Podés consultar sus asociaciones, pero tenés que activarlo para agregar o modificar productos.
                            </div>
                        )}

                        <div className="overflow-hidden rounded-xl border border-gray-200">
                            <div className="flex flex-col gap-1 border-b border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                                <h3 className="font-semibold text-gray-900">
                                    Productos asociados
                                </h3>
                                <p className="text-sm text-gray-500">
                                    {productosAsociados.length} producto(s)
                                </p>
                            </div>

                            {cargandoProductos ? (
                                <div className="px-4 py-10 text-center text-sm text-gray-500">
                                    Cargando productos...
                                </div>
                            ) : productosAsociados.length === 0 ? (
                                <div className="px-4 py-10 text-center">
                                    <p className="font-medium text-gray-800">
                                        Todavía no hay productos asociados
                                    </p>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Seleccioná un producto arriba para comenzar.
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[650px] text-left text-sm">
                                        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                                            <tr>
                                                <th className="px-4 py-3 font-semibold">Producto</th>
                                                <th className="px-4 py-3 font-semibold">Código proveedor</th>
                                                <th className="px-4 py-3 font-semibold">Precio de compra</th>
                                                <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                                            </tr>
                                        </thead>

                                        <tbody className="divide-y divide-gray-100">
                                            {productosAsociados.map((producto) => (
                                                <tr key={obtenerIdProducto(producto)} className="hover:bg-gray-50">
                                                    <td className="px-4 py-4">
                                                        <p className="font-medium text-gray-900">
                                                            {producto.nombre}
                                                        </p>
                                                        <p className="mt-1 text-xs text-gray-500">
                                                            {producto.codigo || 'Sin código general'}
                                                        </p>
                                                    </td>

                                                    <td className="px-4 py-4 text-gray-700">
                                                        {producto.codigo_proveedor || '—'}
                                                    </td>

                                                    <td className="px-4 py-4 font-medium text-gray-900">
                                                        {formatoPrecio(producto.precio_compra_proveedor)}
                                                    </td>

                                                    <td className="px-4 py-4">
                                                        <div className="flex justify-end gap-2">
                                                            {proveedorProductos.activo && (
                                                                <>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => prepararEdicionProducto(producto)}
                                                                        className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-100"
                                                                    >
                                                                        Editar
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() => quitarProductoProveedor(producto)}
                                                                        className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50"
                                                                    >
                                                                        Quitar
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex justify-end border-t border-gray-100 pt-4">
                            <button
                                type="button"
                                onClick={cerrarProductosProveedor}
                                disabled={guardandoAsociacion}
                                className={botonSecundario}
                            >
                                Cerrar
                            </button>
                        </div>
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