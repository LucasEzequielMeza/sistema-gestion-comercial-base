import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from '../Api/axios'
import Button from '../Components/UI/Button'
import {
    FaShoppingCart,
    FaPlus,
    FaCheck,
    FaTimes,
    FaSyncAlt,
    FaSearch,
    FaReceipt,
    FaClock,
    FaCheckCircle,
    FaDollarSign,
    FaEye,
    FaBoxOpen,
    FaEdit
} from 'react-icons/fa'

function ComprasPage() {
    const [compras, setCompras] = useState([])
    const [cargando, setCargando] = useState(true)
    const [actualizando, setActualizando] = useState(false)
    const [error, setError] = useState('')
    const [mensaje, setMensaje] = useState('')
    const [busqueda, setBusqueda] = useState('')
    const [filtroEstado, setFiltroEstado] = useState('todos')
    const [procesando, setProcesando] = useState(null)
    const [compraSeleccionada, setCompraSeleccionada] = useState(null)

    const [detalleCompra, setDetalleCompra] = useState(null)
    const [cargandoDetalle, setCargandoDetalle] = useState(false)
    const [errorDetalle, setErrorDetalle] = useState('')

    const navigate = useNavigate()

    useEffect(() => {
        if (!mensaje) return

        const temporizador = setTimeout(() => {
            setMensaje('')
        }, 5000)

        return () => clearTimeout(temporizador)
    }, [mensaje])

    const obtenerCompras = useCallback(async (mostrarCarga = true) => {
        try {
            if (mostrarCarga) setCargando(true)
            setError('')

            const respuesta = await axios.get('/compras')
            setCompras(respuesta.data.compras ?? respuesta.data)
        } catch (error) {
            setError(error.response?.data?.message || 'No se pudieron cargar las compras.')
        } finally {
            setCargando(false)
            setActualizando(false)
        }
    }, [])

    useEffect(() => {
        obtenerCompras()
    }, [obtenerCompras])

    const formatoFecha = (fecha) => {
        if (!fecha) return '-'

        const valor = new Date(fecha)

        return Number.isNaN(valor.getTime())
            ? '-'
            : valor.toLocaleDateString('es-AR')
    }

    const formatoFechaHora = (fecha) => {
        if (!fecha) return '-'

        const valor = new Date(fecha)

        return Number.isNaN(valor.getTime())
            ? '-'
            : valor.toLocaleString('es-AR')
    }

    const formatoPrecio = (precio) => {
        return Number(precio || 0).toLocaleString('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 2
        })
    }

    const formatoCantidad = (cantidad) => {
        return Number(cantidad || 0).toLocaleString('es-AR', {
            maximumFractionDigits: 3
        })
    }

    const colorEstado = (estado) => {
        switch (estado) {
            case 'confirmada':
                return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
            case 'cancelada':
                return 'bg-red-50 text-red-700 ring-1 ring-red-200'
            default:
                return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
        }
    }

    const cambiarEstado = async (compra, accion) => {
        try {
            setProcesando(compra.id)
            setError('')
            setMensaje('')

            await axios.put(`/compras/${compra.id}/${accion}`)

            setMensaje(accion === 'confirmar'
                ? 'La compra se confirmó correctamente y el stock fue actualizado.'
                : 'La compra se canceló correctamente.')

            setCompraSeleccionada(null)
            await obtenerCompras(false)
        } catch (error) {
            setError(error.response?.data?.message || `No se pudo ${accion === 'confirmar' ? 'confirmar' : 'cancelar'} la compra.`)
        } finally {
            setProcesando(null)
        }
    }

    const verDetalle = async (compra) => {
        setDetalleCompra(null)
        setErrorDetalle('')
        setCargandoDetalle(true)
        setCompraSeleccionada({ compra, accion: 'detalle' })

        try {
            const respuesta = await axios.get(`/compras/${compra.id}`)
            setDetalleCompra(respuesta.data)
        } catch (error) {
            setErrorDetalle(
                error.response?.data?.message ||
                'No se pudo cargar el detalle de la compra.'
            )
        } finally {
            setCargandoDetalle(false)
        }
    }

    const cerrarDetalle = () => {
        setCompraSeleccionada(null)
        setDetalleCompra(null)
        setErrorDetalle('')
    }

    const comprasFiltradas = compras.filter((compra) => {
        const texto = busqueda.toLowerCase()

        const coincideBusqueda = [
            compra.proveedor_nombre,
            compra.tipo_comprobante,
            compra.numero_comprobante
        ].some(valor => String(valor || '').toLowerCase().includes(texto))

        const coincideEstado = filtroEstado === 'todos' || compra.estado === filtroEstado

        return coincideBusqueda && coincideEstado
    })

    const pendientes = compras.filter(compra => compra.estado === 'pendiente').length
    const confirmadas = compras.filter(compra => compra.estado === 'confirmada').length

    const totalConfirmado = compras
        .filter(compra => compra.estado === 'confirmada')
        .reduce((total, compra) => total + Number(compra.total || 0), 0)

    return (
        <div className="min-h-screen bg-[#F5F5F4] p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">
                <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                    <div>
                        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[#78716C]">
                            <FaShoppingCart />
                            Gestión de inventario
                            <span>/</span>
                            Compras
                        </div>

                        <h1 className="text-3xl font-bold tracking-tight text-[#1C1917]">
                            Compras
                        </h1>

                        <p className="mt-2 text-sm text-[#78716C]">
                            Administrá las compras a proveedores y controlá el ingreso de mercadería.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                setActualizando(true)
                                obtenerCompras(false)
                            }}
                            disabled={actualizando}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D6D3D1] bg-white px-4 py-3 text-sm font-semibold text-[#44403C] transition hover:bg-[#F5F5F4] disabled:opacity-50"
                        >
                            <FaSyncAlt className={actualizando ? 'animate-spin' : ''} />
                            Actualizar
                        </button>

                        <Button onClick={() => navigate('/compras/crear')}>
                            <span className="flex items-center gap-2">
                                <FaPlus />
                                Registrar compra
                            </span>
                        </Button>
                    </div>
                </div>

                {error && (
                    <div className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        <p>{error}</p>
                        <button
                            type="button"
                            onClick={() => setError('')}
                            aria-label="Cerrar error"
                        >
                            <FaTimes />
                        </button>
                    </div>
                )}

                {mensaje && (
                    <div className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                        <p>{mensaje}</p>
                        <button
                            type="button"
                            onClick={() => setMensaje('')}
                            aria-label="Cerrar mensaje"
                        >
                            <FaTimes />
                        </button>
                    </div>
                )}

                <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-[#E7E5E4] bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-[#78716C]">Compras registradas</p>
                            <div className="rounded-xl bg-stone-100 p-3 text-stone-600">
                                <FaReceipt size={18} />
                            </div>
                        </div>
                        <p className="mt-4 text-3xl font-bold text-[#1C1917]">{compras.length}</p>
                        <p className="mt-1 text-xs text-[#A8A29E]">Total de operaciones</p>
                    </div>

                    <div className="rounded-2xl border border-[#E7E5E4] bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-[#78716C]">Pendientes</p>
                            <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
                                <FaClock size={18} />
                            </div>
                        </div>
                        <p className="mt-4 text-3xl font-bold text-amber-600">{pendientes}</p>
                        <p className="mt-1 text-xs text-[#A8A29E]">Esperando confirmación</p>
                    </div>

                    <div className="rounded-2xl border border-[#E7E5E4] bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-[#78716C]">Confirmadas</p>
                            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                                <FaCheckCircle size={18} />
                            </div>
                        </div>
                        <p className="mt-4 text-3xl font-bold text-emerald-600">{confirmadas}</p>
                        <p className="mt-1 text-xs text-[#A8A29E]">Compras ingresadas al stock</p>
                    </div>

                    <div className="rounded-2xl border border-[#E7E5E4] bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-[#78716C]">Importe confirmado</p>
                            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                                <FaDollarSign size={18} />
                            </div>
                        </div>
                        <p className="mt-4 break-words text-2xl font-bold text-[#1C1917]">
                            {formatoPrecio(totalConfirmado)}
                        </p>
                        <p className="mt-1 text-xs text-[#A8A29E]">Suma de compras confirmadas</p>
                    </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-[#E7E5E4] bg-white shadow-sm">
                    <div className="border-b border-[#E7E5E4] p-5 sm:p-6">
                        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
                            <div>
                                <h2 className="text-lg font-bold text-[#1C1917]">Historial de compras</h2>
                                <p className="mt-1 text-sm text-[#78716C]">
                                    Consultá los comprobantes, importes y estados de cada operación.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row">
                                <div className="relative">
                                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A29E]" />
                                    <input
                                        type="text"
                                        value={busqueda}
                                        onChange={e => setBusqueda(e.target.value)}
                                        placeholder="Buscar proveedor o comprobante..."
                                        className="w-full rounded-xl border border-[#D6D3D1] bg-white py-2.5 pl-9 pr-3 text-sm text-[#1C1917] outline-none transition focus:border-[#57534E] focus:ring-2 focus:ring-stone-200 sm:w-72"
                                    />
                                </div>

                                <select
                                    value={filtroEstado}
                                    onChange={e => setFiltroEstado(e.target.value)}
                                    className="rounded-xl border border-[#D6D3D1] bg-white px-3 py-2.5 text-sm text-[#1C1917] outline-none focus:border-[#57534E] focus:ring-2 focus:ring-stone-200"
                                >
                                    <option value="todos">Todos los estados</option>
                                    <option value="pendiente">Pendientes</option>
                                    <option value="confirmada">Confirmadas</option>
                                    <option value="cancelada">Canceladas</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {cargando ? (
                        <div className="p-12 text-center">
                            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-[#E7E5E4] border-t-[#292524]" />
                            <p className="text-sm text-[#78716C]">Cargando compras...</p>
                        </div>
                    ) : comprasFiltradas.length === 0 ? (
                        <div className="px-6 py-16 text-center">
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F5F4] text-[#78716C]">
                                <FaShoppingCart size={23} />
                            </div>
                            <h3 className="text-base font-semibold text-[#292524]">
                                {compras.length === 0 ? 'Todavía no hay compras' : 'No se encontraron resultados'}
                            </h3>
                            <p className="mx-auto mt-2 max-w-md text-sm text-[#78716C]">
                                {compras.length === 0
                                    ? 'Registrá tu primera compra para comenzar a controlar las entradas de stock.'
                                    : 'Probá cambiar el texto de búsqueda o el filtro seleccionado.'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1000px] text-left text-sm">
                                <thead className="bg-[#FAFAF9] text-xs uppercase tracking-wide text-[#78716C]">
                                    <tr>
                                        <th className="px-5 py-4 font-semibold">Fecha</th>
                                        <th className="px-5 py-4 font-semibold">Proveedor</th>
                                        <th className="px-5 py-4 font-semibold">Comprobante</th>
                                        <th className="px-5 py-4 text-right font-semibold">Total</th>
                                        <th className="px-5 py-4 text-center font-semibold">Estado</th>
                                        <th className="px-5 py-4 text-center font-semibold">Acciones</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-[#F0EFED]">
                                    {comprasFiltradas.map(compra => (
                                        <tr key={compra.id} className="transition hover:bg-[#FAFAF9]">
                                            <td className="whitespace-nowrap px-5 py-4 text-[#57534E]">
                                                {formatoFecha(compra.fecha)}
                                            </td>

                                            <td className="px-5 py-4">
                                                <p className="font-semibold text-[#292524]">
                                                    {compra.proveedor_nombre || 'Proveedor sin nombre'}
                                                </p>
                                            </td>

                                            <td className="px-5 py-4">
                                                <p className="font-medium text-[#44403C]">
                                                    {compra.tipo_comprobante || 'Sin comprobante'}
                                                </p>
                                                <p className="mt-1 text-xs text-[#A8A29E]">
                                                    {compra.numero_comprobante || 'Sin número'}
                                                </p>
                                            </td>

                                            <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-[#292524]">
                                                {formatoPrecio(compra.total)}
                                            </td>

                                            <td className="px-5 py-4 text-center">
                                                <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${colorEstado(compra.estado)}`}>
                                                    {compra.estado}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => verDetalle(compra)}
                                                        disabled={procesando !== null || cargandoDetalle}
                                                        title="Ver detalle de la compra"
                                                        aria-label="Ver detalle de la compra"
                                                        className="inline-flex items-center gap-2 rounded-lg border border-[#D6D3D1] bg-white px-3 py-2 text-xs font-semibold text-[#44403C] transition hover:bg-[#F5F5F4] disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        <FaEye />
                                                        Ver detalle
                                                    </button>

                                                    {compra.estado === 'pendiente' ? (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => navigate(`/compras/editar/${compra.id}`)}
                                                                disabled={procesando !== null}
                                                                title="Editar compra"
                                                                className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                            >
                                                                <FaEdit />
                                                                Editar
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() => setCompraSeleccionada({ compra, accion: 'confirmar' })}
                                                                disabled={procesando !== null}
                                                                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                            >
                                                                <FaCheck />
                                                                {procesando === compra.id ? 'Procesando...' : 'Confirmar'}
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() => setCompraSeleccionada({ compra, accion: 'cancelar' })}
                                                                disabled={procesando !== null}
                                                                title="Cancelar compra"
                                                                aria-label="Cancelar compra"
                                                                className="inline-flex items-center justify-center rounded-lg border border-red-200 p-2 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                            >
                                                                <FaTimes />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <span className="whitespace-nowrap text-xs text-[#A8A29E]">
                                                            Sin acciones
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {!cargando && comprasFiltradas.length > 0 && (
                        <div className="flex flex-col gap-2 border-t border-[#E7E5E4] bg-[#FAFAF9] px-5 py-4 text-xs text-[#78716C] sm:flex-row sm:items-center sm:justify-between">
                            <p>Mostrando {comprasFiltradas.length} de {compras.length} compras</p>
                            <p>El stock se actualiza al confirmar una compra.</p>
                        </div>
                    )}
                </div>
            </div>

            {compraSeleccionada && compraSeleccionada.accion !== 'detalle' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
                        <div className="p-6">
                            <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${
                                compraSeleccionada.accion === 'confirmar'
                                    ? 'bg-emerald-50 text-emerald-600'
                                    : 'bg-red-50 text-red-600'
                            }`}>
                                {compraSeleccionada.accion === 'confirmar'
                                    ? <FaCheck size={23} />
                                    : <FaTimes size={23} />}
                            </div>

                            <h2 className="text-xl font-bold text-[#1C1917]">
                                {compraSeleccionada.accion === 'confirmar'
                                    ? 'Confirmar compra'
                                    : 'Cancelar compra'}
                            </h2>

                            <p className="mt-3 text-sm leading-6 text-[#78716C]">
                                {compraSeleccionada.accion === 'confirmar'
                                    ? '¿Estás seguro de confirmar esta compra? Al continuar, se actualizará el stock de los productos.'
                                    : '¿Estás seguro de cancelar esta compra? Esta operación no podrá confirmarse mientras permanezca cancelada.'}
                            </p>

                            <div className="mt-5 rounded-xl border border-[#E7E5E4] bg-[#FAFAF9] p-4">
                                <p className="text-xs font-medium uppercase tracking-wide text-[#78716C]">
                                    Comprobante
                                </p>
                                <p className="mt-1 font-semibold text-[#292524]">
                                    {compraSeleccionada.compra.tipo_comprobante || 'Sin comprobante'}
                                    {' '}
                                    {compraSeleccionada.compra.numero_comprobante || ''}
                                </p>

                                <p className="mt-3 text-xs font-medium uppercase tracking-wide text-[#78716C]">
                                    Importe total
                                </p>
                                <p className="mt-1 text-lg font-bold text-[#1C1917]">
                                    {formatoPrecio(compraSeleccionada.compra.total)}
                                </p>
                            </div>

                            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={() => setCompraSeleccionada(null)}
                                    disabled={procesando !== null}
                                    className="rounded-xl border border-[#D6D3D1] px-4 py-3 text-sm font-semibold text-[#44403C] transition hover:bg-[#F5F5F4] disabled:opacity-50"
                                >
                                    Volver
                                </button>

                                <button
                                    type="button"
                                    onClick={() => cambiarEstado(
                                        compraSeleccionada.compra,
                                        compraSeleccionada.accion
                                    )}
                                    disabled={procesando !== null}
                                    className={`rounded-xl px-4 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                        compraSeleccionada.accion === 'confirmar'
                                            ? 'bg-emerald-600 hover:bg-emerald-700'
                                            : 'bg-red-600 hover:bg-red-700'
                                    }`}
                                >
                                    {procesando !== null
                                        ? 'Procesando...'
                                        : compraSeleccionada.accion === 'confirmar'
                                            ? 'Sí, confirmar compra'
                                            : 'Sí, cancelar compra'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {compraSeleccionada?.accion === 'detalle' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E7E5E4] bg-white px-5 py-4 sm:px-7">
                            <div>
                                <h2 className="text-xl font-bold text-[#1C1917]">
                                    Detalle de la compra
                                </h2>
                                <p className="mt-1 text-sm text-[#78716C]">
                                    Consultá los datos y los productos registrados.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={cerrarDetalle}
                                className="rounded-xl border border-[#E7E5E4] p-2.5 text-[#78716C] transition hover:bg-[#F5F5F4] hover:text-[#292524]"
                                aria-label="Cerrar detalle"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        {cargandoDetalle ? (
                            <div className="p-12 text-center">
                                <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-4 border-[#E7E5E4] border-t-[#292524]" />
                                <p className="text-sm text-[#78716C]">
                                    Cargando detalle de la compra...
                                </p>
                            </div>
                        ) : errorDetalle ? (
                            <div className="p-6 sm:p-7">
                                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                                    {errorDetalle}
                                </div>

                                <div className="mt-5 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={cerrarDetalle}
                                        className="rounded-xl border border-[#D6D3D1] px-4 py-3 text-sm font-semibold text-[#44403C] transition hover:bg-[#F5F5F4]"
                                    >
                                        Cerrar
                                    </button>
                                </div>
                            </div>
                        ) : detalleCompra && (
                            <div className="space-y-6 p-5 sm:p-7">
                                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-[#A8A29E]">
                                            Proveedor
                                        </p>
                                        <h3 className="mt-1 text-lg font-bold text-[#292524]">
                                            {detalleCompra.proveedor_nombre || 'Proveedor sin nombre'}
                                        </h3>
                                        <p className="mt-1 text-sm text-[#78716C]">
                                            Registrada el {formatoFechaHora(detalleCompra.fecha)}
                                        </p>
                                    </div>

                                    <span className={`inline-flex w-fit rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${colorEstado(detalleCompra.estado)}`}>
                                        {detalleCompra.estado}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="rounded-xl border border-[#E7E5E4] p-4">
                                        <p className="text-xs font-medium uppercase tracking-wide text-[#78716C]">
                                            Tipo de comprobante
                                        </p>
                                        <p className="mt-2 font-semibold text-[#292524]">
                                            {detalleCompra.tipo_comprobante || 'Sin comprobante'}
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-[#E7E5E4] p-4">
                                        <p className="text-xs font-medium uppercase tracking-wide text-[#78716C]">
                                            Número de comprobante
                                        </p>
                                        <p className="mt-2 font-semibold text-[#292524]">
                                            {detalleCompra.numero_comprobante || 'Sin número'}
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-[#E7E5E4] p-4">
                                        <p className="text-xs font-medium uppercase tracking-wide text-[#78716C]">
                                            Registrada por
                                        </p>
                                        <p className="mt-2 font-semibold text-[#292524]">
                                            {[detalleCompra.usuario_nombre, detalleCompra.usuario_apellido]
                                                .filter(Boolean)
                                                .join(' ') || 'Usuario no disponible'}
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-[#E7E5E4] p-4">
                                        <p className="text-xs font-medium uppercase tracking-wide text-[#78716C]">
                                            Fecha de registro
                                        </p>
                                        <p className="mt-2 font-semibold text-[#292524]">
                                            {formatoFechaHora(detalleCompra.created_at || detalleCompra.fecha)}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <div className="mb-3 flex items-center gap-2">
                                        <FaBoxOpen className="text-[#78716C]" />
                                        <h3 className="font-bold text-[#292524]">
                                            Productos de la compra
                                        </h3>
                                    </div>

                                    {!detalleCompra.detalles?.length ? (
                                        <div className="rounded-xl border border-[#E7E5E4] bg-[#FAFAF9] p-6 text-center text-sm text-[#78716C]">
                                            Esta compra no tiene productos registrados.
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto rounded-xl border border-[#E7E5E4]">
                                            <table className="w-full min-w-[650px] text-left text-sm">
                                                <thead className="bg-[#FAFAF9] text-xs uppercase tracking-wide text-[#78716C]">
                                                    <tr>
                                                        <th className="px-4 py-3 font-semibold">Producto</th>
                                                        <th className="px-4 py-3 font-semibold">Código</th>
                                                        <th className="px-4 py-3 text-right font-semibold">Cantidad</th>
                                                        <th className="px-4 py-3 text-right font-semibold">Costo unitario</th>
                                                        <th className="px-4 py-3 text-right font-semibold">Subtotal</th>
                                                    </tr>
                                                </thead>

                                                <tbody className="divide-y divide-[#F0EFED]">
                                                    {detalleCompra.detalles.map(detalle => (
                                                        <tr key={detalle.id}>
                                                            <td className="px-4 py-3 font-medium text-[#292524]">
                                                                {detalle.producto_nombre || 'Producto sin nombre'}
                                                            </td>
                                                            <td className="px-4 py-3 text-[#78716C]">
                                                                {detalle.producto_codigo || '-'}
                                                            </td>
                                                            <td className="whitespace-nowrap px-4 py-3 text-right text-[#44403C]">
                                                                {formatoCantidad(detalle.cantidad)}
                                                            </td>
                                                            <td className="whitespace-nowrap px-4 py-3 text-right text-[#44403C]">
                                                                {formatoPrecio(detalle.costo_unitario)}
                                                            </td>
                                                            <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-[#292524]">
                                                                {formatoPrecio(detalle.subtotal)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="rounded-xl border border-[#E7E5E4] p-4">
                                        <p className="text-xs font-medium uppercase tracking-wide text-[#78716C]">
                                            Observaciones
                                        </p>
                                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#44403C]">
                                            {detalleCompra.observaciones?.trim() || 'Sin observaciones.'}
                                        </p>
                                    </div>

                                    <div className="flex flex-col justify-center rounded-xl bg-[#292524] p-5 text-white">
                                        <p className="text-sm font-medium text-stone-300">
                                            Total de la compra
                                        </p>
                                        <p className="mt-2 break-words text-2xl font-bold sm:text-3xl">
                                            {formatoPrecio(detalleCompra.total)}
                                        </p>
                                        <p className="mt-2 text-xs text-stone-400">
                                            {detalleCompra.detalles?.length || 0} productos diferentes
                                        </p>
                                    </div>
                                </div>

                                <div className="flex justify-end border-t border-[#E7E5E4] pt-5">
                                    <button
                                        type="button"
                                        onClick={cerrarDetalle}
                                        className="rounded-xl border border-[#D6D3D1] px-5 py-3 text-sm font-semibold text-[#44403C] transition hover:bg-[#F5F5F4]"
                                    >
                                        Cerrar detalle
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default ComprasPage