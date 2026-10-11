
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStock } from '../Context/ContextoStock'
import Button from '../Components/UI/Button'

function MovimientosStockPage() {
    const navigate = useNavigate()
    const { movimientosStock, obtenerMovimientosStock } = useStock()

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

    return (
        <div className="min-h-screen">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                <h1 className="text-3xl font-bold text-center">
                    Historial de movimientos
                </h1>

                <Button onClick={() => navigate('/stock')}>
                    Volver al stock
                </Button>
            </div>

            <div className="bg-zinc-200 rounded-xl shadow-md p-5 mb-6">
                <h2 className="text-lg font-bold mb-4">Filtros de búsqueda</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-semibold mb-2">
                            Producto o código
                        </label>
                        <input
                            type="text"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            placeholder="Buscar producto..."
                            className="w-full rounded-md border border-zinc-400 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2">
                            Tipo de movimiento
                        </label>
                        <select
                            value={tipoMovimiento}
                            onChange={(e) => setTipoMovimiento(e.target.value)}
                            className="w-full rounded-md border border-zinc-400 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-500"
                        >
                            <option value="todos">Todos los movimientos</option>
                            <option value="entrada">Entradas</option>
                            <option value="salida">Salidas</option>
                            <option value="ajuste">Ajustes</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2">
                            Desde
                        </label>
                        <input
                            type="date"
                            value={fechaDesde}
                            max={fechaHasta || undefined}
                            onChange={(e) => setFechaDesde(e.target.value)}
                            className="w-full rounded-md border border-zinc-400 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2">
                            Hasta
                        </label>
                        <input
                            type="date"
                            value={fechaHasta}
                            min={fechaDesde || undefined}
                            onChange={(e) => setFechaHasta(e.target.value)}
                            className="w-full rounded-md border border-zinc-400 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-500"
                        />
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-5">
                    <p className="text-sm text-zinc-700">
                        Mostrando {movimientosFiltrados.length} de {movimientosStock.length} movimientos
                    </p>

                    <Button
                        className="bg-[#13100F] text-white px-4 py-2 rounded-md hover:bg-[#26211F]"
                        onClick={limpiarFiltros}
                    >
                        Limpiar filtros
                    </Button>
                </div>
            </div>

            <div className="bg-zinc-200 rounded-xl shadow-md p-6 overflow-x-auto">
                {movimientosFiltrados.length === 0 ? (
                    <p className="text-center py-6">
                        {movimientosStock.length === 0
                            ? 'No hay movimientos de stock registrados.'
                            : 'No se encontraron movimientos con los filtros seleccionados.'}
                    </p>
                ) : (
                    <table className="w-full min-w-[1100px] text-sm">
                        <thead>
                            <tr className="border-b border-zinc-400">
                                <th className="p-3 text-left">Fecha</th>
                                <th className="p-3 text-left">Producto</th>
                                <th className="p-3 text-left">Código</th>
                                <th className="p-3 text-left">Tipo</th>
                                <th className="p-3 text-right">Cantidad</th>
                                <th className="p-3 text-right">Stock anterior</th>
                                <th className="p-3 text-right">Stock nuevo</th>
                                <th className="p-3 text-left">Motivo</th>
                                <th className="p-3 text-left">Usuario</th>
                            </tr>
                        </thead>

                        <tbody>
                            {movimientosFiltrados.map((movimiento) => (
                                <tr
                                    key={movimiento.id}
                                    className="border-b border-zinc-300 hover:bg-zinc-100"
                                >
                                    <td className="p-3 whitespace-nowrap">
                                        {formatoFecha(movimiento.created_at)}
                                    </td>
                                    <td className="p-3">
                                        {movimiento.producto_nombre}
                                    </td>
                                    <td className="p-3">
                                        {movimiento.producto_codigo || 'Sin código'}
                                    </td>
                                    <td className="p-3">
                                        {obtenerTipoMovimiento(movimiento.tipo)}
                                    </td>
                                    <td className="p-3 text-right">
                                        {formatoCantidad(movimiento.cantidad)}
                                    </td>
                                    <td className="p-3 text-right">
                                        {formatoCantidad(movimiento.stock_anterior)}
                                    </td>
                                    <td className="p-3 text-right">
                                        {formatoCantidad(movimiento.stock_nuevo)}
                                    </td>
                                    <td className="p-3">
                                        {movimiento.motivo || 'Sin motivo'}
                                    </td>
                                    <td className="p-3 whitespace-nowrap">
                                        {movimiento.usuario_nombre
                                            ? `${movimiento.usuario_nombre} ${movimiento.usuario_apellido || ''}`.trim()
                                            : 'Usuario desconocido'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}

export default MovimientosStockPage