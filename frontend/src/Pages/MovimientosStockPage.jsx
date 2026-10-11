import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStock } from '../Context/ContextoStock'
import Button from '../Components/UI/Button'

import {
    FaArrowLeft,
    FaBoxOpen,
    FaCalendarAlt,
    FaSearch,
    FaFilter,
    FaTimes,
    FaArrowDown,
    FaArrowUp,
    FaSlidersH,
    FaClipboardList
} from 'react-icons/fa'

function MovimientosStockPage() {

    const navigate = useNavigate()

    const {
        movimientosStock,
        obtenerMovimientosStock
    } = useStock()

    const [busqueda, setBusqueda] = useState('')
    const [tipoMovimiento, setTipoMovimiento] = useState('todos')
    const [fechaDesde, setFechaDesde] = useState('')
    const [fechaHasta, setFechaHasta] = useState('')

    useEffect(() => {
        obtenerMovimientosStock()
    }, [])

    const formatoFecha = (fecha) => {
        return new Date(fecha).toLocaleString('es-AR')
    }

    const formatoCantidad = (cantidad) => {
        return Number(cantidad).toLocaleString('es-AR')
    }

    const obtenerTipoMovimiento = (tipo) => {
        if (tipo === 'entrada') return 'Entrada'
        if (tipo === 'salida') return 'Salida'
        if (tipo === 'ajuste') return 'Ajuste'
        return tipo
    }

    const obtenerFechaLocal = (fecha) => {

        const fechaMovimiento = new Date(fecha)
        const año = fechaMovimiento.getFullYear()
        const mes = String(fechaMovimiento.getMonth() + 1).padStart(2, '0')
        const dia = String(fechaMovimiento.getDate()).padStart(2, '0')

        return `${año}-${mes}-${dia}`
    }

    const movimientosFiltrados = movimientosStock.filter((movimiento) => {

        const textoBusqueda = busqueda.trim().toLowerCase()
        const nombreProducto = (movimiento.producto_nombre || '').toLowerCase()
        const codigoProducto = (movimiento.producto_codigo || '').toLowerCase()
        const fechaMovimiento = obtenerFechaLocal(movimiento.created_at)

        const coincideProducto =
            nombreProducto.includes(textoBusqueda) ||
            codigoProducto.includes(textoBusqueda)

        const coincideTipo =
            tipoMovimiento === 'todos' ||
            movimiento.tipo === tipoMovimiento

        const coincideFechaDesde =
            !fechaDesde || fechaMovimiento >= fechaDesde

        const coincideFechaHasta =
            !fechaHasta || fechaMovimiento <= fechaHasta

        return coincideProducto &&
            coincideTipo &&
            coincideFechaDesde &&
            coincideFechaHasta
    })

    const limpiarFiltros = () => {
        setBusqueda('')
        setTipoMovimiento('todos')
        setFechaDesde('')
        setFechaHasta('')
    }

    const hayFiltrosActivos =
        busqueda.trim() !== '' ||
        tipoMovimiento !== 'todos' ||
        fechaDesde !== '' ||
        fechaHasta !== ''

    const obtenerEstiloMovimiento = (tipo) => {

        if (tipo === 'entrada') {
            return 'bg-emerald-50 text-emerald-700 border-emerald-200'
        }

        if (tipo === 'salida') {
            return 'bg-red-50 text-red-700 border-red-200'
        }

        if (tipo === 'ajuste') {
            return 'bg-amber-50 text-amber-700 border-amber-200'
        }

        return 'bg-stone-100 text-stone-700 border-stone-200'
    }

    const obtenerIconoMovimiento = (tipo) => {

        if (tipo === 'entrada') {
            return <FaArrowDown />
        }

        if (tipo === 'salida') {
            return <FaArrowUp />
        }

        return <FaSlidersH />
    }

    return (
        <div className="min-h-screen bg-white pb-10">

            {/* Encabezado */}
            <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                <div>
                    <div className="mb-3 flex items-center gap-2 text-sm text-stone-500">
                        <button
                            type="button"
                            onClick={() => navigate('/stock')}
                            className="transition hover:text-stone-900"
                        >
                            Stock
                        </button>

                        <span>/</span>

                        <span className="font-medium text-stone-800">
                            Movimientos
                        </span>
                    </div>

                    <h1 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
                        Historial de movimientos
                    </h1>

                    <p className="mt-2 text-sm text-stone-500 sm:text-base">
                        Consultá y filtrá los movimientos registrados en el inventario.
                    </p>
                </div>

                <Button
                    onClick={() => navigate('/stock')}
                    className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-[#13100F] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#26211F] sm:self-auto"
                >
                    <FaArrowLeft />
                    Volver al stock
                </Button>

            </div>

            {/* Resumen */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5 shadow-sm shadow-stone-900/[0.03]">

                    <div className="flex items-center justify-between gap-4">

                        <div>
                            <p className="text-sm font-medium text-stone-500">
                                Movimientos registrados
                            </p>

                            <p className="mt-2 text-3xl font-bold tracking-tight text-stone-900">
                                {movimientosStock.length}
                            </p>
                        </div>

                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-stone-200 text-stone-700">
                            <FaClipboardList className="text-xl" />
                        </div>

                    </div>

                </div>

                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5 shadow-sm shadow-stone-900/[0.03]">

                    <div className="flex items-center justify-between gap-4">

                        <div>
                            <p className="text-sm font-medium text-stone-500">
                                Resultados de la búsqueda
                            </p>

                            <p className="mt-2 text-3xl font-bold tracking-tight text-stone-900">
                                {movimientosFiltrados.length}
                            </p>
                        </div>

                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-stone-200 text-stone-700">
                            <FaSearch className="text-xl" />
                        </div>

                    </div>

                </div>

            </div>

            {/* Filtros */}
            <section className="mb-6 rounded-2xl border border-stone-200 bg-stone-100 p-5 shadow-sm shadow-stone-900/[0.04] sm:p-6">

                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                    <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-stone-700 shadow-sm">
                            <FaFilter />
                        </div>

                        <div>
                            <h2 className="font-semibold text-stone-900">
                                Filtros de búsqueda
                            </h2>

                            <p className="text-sm text-stone-500">
                                Encontrá movimientos por producto, tipo o fecha.
                            </p>
                        </div>

                    </div>

                    {hayFiltrosActivos && (
                        <button
                            type="button"
                            onClick={limpiarFiltros}
                            className="inline-flex items-center gap-2 self-start rounded-lg px-3 py-2 text-sm font-medium text-stone-600 transition hover:bg-white hover:text-stone-900 sm:self-auto"
                        >
                            <FaTimes />
                            Limpiar filtros
                        </button>
                    )}

                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

                    <div>
                        <label className="mb-2 block text-sm font-medium text-stone-700">
                            Producto o código
                        </label>

                        <div className="relative">

                            <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-stone-400" />

                            <input
                                type="text"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                placeholder="Buscar producto..."
                                className="w-full rounded-xl border border-stone-300 bg-white py-3 pl-9 pr-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
                            />

                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-stone-700">
                            Tipo de movimiento
                        </label>

                        <select
                            value={tipoMovimiento}
                            onChange={(e) => setTipoMovimiento(e.target.value)}
                            className="w-full rounded-xl border border-stone-300 bg-white px-3 py-3 text-sm text-stone-800 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
                        >
                            <option value="todos">Todos los movimientos</option>
                            <option value="entrada">Entradas</option>
                            <option value="salida">Salidas</option>
                            <option value="ajuste">Ajustes</option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-stone-700">
                            Desde
                        </label>

                        <div className="relative">

                            <FaCalendarAlt className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-stone-400" />

                            <input
                                type="date"
                                value={fechaDesde}
                                max={fechaHasta || undefined}
                                onChange={(e) => setFechaDesde(e.target.value)}
                                className="w-full rounded-xl border border-stone-300 bg-white py-3 pl-9 pr-3 text-sm text-stone-800 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
                            />

                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-stone-700">
                            Hasta
                        </label>

                        <div className="relative">

                            <FaCalendarAlt className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-stone-400" />

                            <input
                                type="date"
                                value={fechaHasta}
                                min={fechaDesde || undefined}
                                onChange={(e) => setFechaHasta(e.target.value)}
                                className="w-full rounded-xl border border-stone-300 bg-white py-3 pl-9 pr-3 text-sm text-stone-800 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
                            />

                        </div>
                    </div>

                </div>

                <div className="mt-5 flex flex-col gap-3 border-t border-stone-200 pt-4 sm:flex-row sm:items-center sm:justify-between">

                    <p className="text-sm text-stone-600">
                        Mostrando{' '}
                        <span className="font-semibold text-stone-900">
                            {movimientosFiltrados.length}
                        </span>
                        {' '}de{' '}
                        <span className="font-semibold text-stone-900">
                            {movimientosStock.length}
                        </span>
                        {' '}movimientos
                    </p>

                    {hayFiltrosActivos && (
                        <span className="inline-flex items-center gap-2 self-start rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-600">
                            <FaFilter />
                            Filtros aplicados
                        </span>
                    )}

                </div>

            </section>

            {/* Tabla de movimientos */}
            <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm shadow-stone-900/[0.04]">

                <div className="flex flex-col gap-2 border-b border-stone-200 bg-stone-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">

                    <div>
                        <h2 className="font-semibold text-stone-900">
                            Movimientos registrados
                        </h2>

                        <p className="mt-1 text-sm text-stone-500">
                            Detalle de entradas, salidas y ajustes del inventario.
                        </p>
                    </div>

                    <span className="self-start rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-600">
                        {movimientosFiltrados.length} resultados
                    </span>

                </div>

                {movimientosFiltrados.length === 0 ? (

                    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">

                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
                            {movimientosStock.length === 0 ? (
                                <FaBoxOpen className="text-2xl" />
                            ) : (
                                <FaSearch className="text-2xl" />
                            )}
                        </div>

                        <h3 className="font-semibold text-stone-900">
                            {movimientosStock.length === 0
                                ? 'Todavía no hay movimientos'
                                : 'No se encontraron resultados'}
                        </h3>

                        <p className="mt-2 max-w-md text-sm leading-6 text-stone-500">
                            {movimientosStock.length === 0
                                ? 'Cuando se registren entradas, salidas o ajustes de stock, vas a poder consultar el historial desde esta sección.'
                                : 'Probá modificar los filtros de búsqueda o limpiarlos para volver a ver todos los movimientos.'}
                        </p>

                        {hayFiltrosActivos && (
                            <button
                                type="button"
                                onClick={limpiarFiltros}
                                className="mt-5 rounded-xl bg-[#13100F] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#26211F]"
                            >
                                Limpiar filtros
                            </button>
                        )}

                    </div>

                ) : (

                    <div className="overflow-x-auto">

                        <table className="w-full min-w-[1150px] text-left text-sm">

                            <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">

                                <tr>
                                    <th className="whitespace-nowrap px-5 py-4 font-semibold">
                                        Fecha
                                    </th>

                                    <th className="px-5 py-4 font-semibold">
                                        Producto
                                    </th>

                                    <th className="px-5 py-4 font-semibold">
                                        Código
                                    </th>

                                    <th className="px-5 py-4 font-semibold">
                                        Tipo
                                    </th>

                                    <th className="px-5 py-4 text-right font-semibold">
                                        Cantidad
                                    </th>

                                    <th className="px-5 py-4 text-right font-semibold">
                                        Stock anterior
                                    </th>

                                    <th className="px-5 py-4 text-right font-semibold">
                                        Stock nuevo
                                    </th>

                                    <th className="px-5 py-4 font-semibold">
                                        Motivo
                                    </th>

                                    <th className="px-5 py-4 font-semibold">
                                        Usuario
                                    </th>
                                </tr>

                            </thead>

                            <tbody className="divide-y divide-stone-100">

                                {movimientosFiltrados.map((movimiento) => (

                                    <tr
                                        key={movimiento.id}
                                        className="transition-colors hover:bg-stone-50"
                                    >

                                        <td className="whitespace-nowrap px-5 py-4 text-stone-600">
                                            {formatoFecha(movimiento.created_at)}
                                        </td>

                                        <td className="px-5 py-4">

                                            <div className="flex items-center gap-3">

                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-600">
                                                    <FaBoxOpen />
                                                </div>

                                                <span className="font-medium text-stone-900">
                                                    {movimiento.producto_nombre}
                                                </span>

                                            </div>

                                        </td>

                                        <td className="px-5 py-4">

                                            <span className="rounded-md bg-stone-100 px-2 py-1 font-mono text-xs text-stone-600">
                                                {movimiento.producto_codigo || 'Sin código'}
                                            </span>

                                        </td>

                                        <td className="px-5 py-4">

                                            <span className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${obtenerEstiloMovimiento(movimiento.tipo)}`}>
                                                {obtenerIconoMovimiento(movimiento.tipo)}
                                                {obtenerTipoMovimiento(movimiento.tipo)}
                                            </span>

                                        </td>

                                        <td className="whitespace-nowrap px-5 py-4 text-right font-semibold tabular-nums text-stone-900">
                                            {formatoCantidad(movimiento.cantidad)}
                                        </td>

                                        <td className="whitespace-nowrap px-5 py-4 text-right tabular-nums text-stone-600">
                                            {formatoCantidad(movimiento.stock_anterior)}
                                        </td>

                                        <td className="whitespace-nowrap px-5 py-4 text-right font-semibold tabular-nums text-stone-900">
                                            {formatoCantidad(movimiento.stock_nuevo)}
                                        </td>

                                        <td className="max-w-[220px] px-5 py-4 text-stone-600">
                                            <span className="block truncate" title={movimiento.motivo || 'Sin motivo'}>
                                                {movimiento.motivo || 'Sin motivo'}
                                            </span>
                                        </td>

                                        <td className="whitespace-nowrap px-5 py-4">

                                            <div className="flex items-center gap-2.5">

                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-200 text-xs font-bold text-stone-700">
                                                    {movimiento.usuario_nombre
                                                        ? movimiento.usuario_nombre.charAt(0).toUpperCase()
                                                        : '?'}
                                                </div>

                                                <span className="text-stone-700">
                                                    {movimiento.usuario_nombre
                                                        ? `${movimiento.usuario_nombre} ${movimiento.usuario_apellido || ''}`.trim()
                                                        : 'Usuario desconocido'}
                                                </span>

                                            </div>

                                        </td>

                                    </tr>

                                ))}

                            </tbody>

                        </table>

                    </div>

                )}

                {movimientosFiltrados.length > 0 && (
                    <div className="border-t border-stone-200 bg-stone-50 px-5 py-3 sm:px-6">
                        <p className="text-xs text-stone-500">
                            Los movimientos se muestran del más reciente al más antiguo.
                        </p>
                    </div>
                )}

            </section>

        </div>
    )
}

export default MovimientosStockPage