import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStock } from '../Context/ContextoStock'
import Button from '../Components/UI/Button'

function StockPage() {
    const navigate = useNavigate()

    const {
        stock,
        stockBajo,
        obtenerStock,
        obtenerStockBajo
    } = useStock()

    useEffect(() => {
        obtenerStock()
        obtenerStockBajo()
    }, [])

    const formatoStock = (valor) => Number(valor).toLocaleString('es-AR', {
        maximumFractionDigits: 3
    })

    return (
        <div className="mx-auto min-h-screen w-full max-w-7xl space-y-6 pb-8">
            <div className="flex flex-col gap-4 border-b border-stone-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm font-medium text-stone-500">
                        Inventario
                    </p>
                    <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
                        Control de stock
                    </h1>
                    <p className="mt-1 text-sm text-stone-500">
                        Consultá las existencias y administrá los niveles mínimos de cada producto.
                    </p>
                </div>

                <Button onClick={() => navigate('/stock/movimientos')}>
                    Ver movimientos de stock
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                    <p className="text-sm font-medium text-stone-500">
                        Productos en inventario
                    </p>
                    <p className="mt-2 text-3xl font-bold text-stone-900">
                        {stock.length}
                    </p>
                    <p className="mt-1 text-xs text-stone-500">
                        Productos incluidos en el listado
                    </p>
                </div>

                <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                    <p className="text-sm font-medium text-stone-500">
                        Productos con stock bajo
                    </p>
                    <p className={`mt-2 text-3xl font-bold ${
                        stockBajo.length > 0 ? 'text-red-600' : 'text-stone-900'
                    }`}>
                        {stockBajo.length}
                    </p>
                    <p className="mt-1 text-xs text-stone-500">
                        Requieren revisar su disponibilidad
                    </p>
                </div>

                <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                    <p className="text-sm font-medium text-stone-500">
                        Estado del inventario
                    </p>
                    <p className={`mt-2 text-xl font-bold ${
                        stockBajo.length > 0 ? 'text-red-600' : 'text-emerald-700'
                    }`}>
                        {stockBajo.length > 0 ? 'Requiere atención' : 'Sin alertas'}
                    </p>
                    <p className="mt-1 text-xs text-stone-500">
                        Según los niveles mínimos configurados
                    </p>
                </div>
            </div>

            {stockBajo.length > 0 && (
                <div className="flex items-start gap-3 rounded-2xl border border-red-200 border-l-4 border-l-red-500 bg-red-50 p-4 shadow-sm">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="m10.29 3.86-8.1 14.02A2 2 0 0 0 3.92 21h16.16a2 2 0 0 0 1.73-3.12l-8.1-14.02a2 2 0 0 0-3.42 0Z" />
                            <path d="M12 9v4" />
                            <path d="M12 17h.01" />
                        </svg>
                    </div>

                    <div className="flex-1">
                        <p className="font-semibold text-red-800">
                            Atención: stock bajo
                        </p>
                        <p className="mt-1 text-sm leading-6 text-red-700">
                            Hay {stockBajo.length} {stockBajo.length === 1
                                ? 'producto que necesita'
                                : 'productos que necesitan'} reposición. Revisá las existencias para evitar faltantes.
                        </p>
                    </div>
                </div>
            )}

            <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
                <div className="flex flex-col gap-1 border-b border-stone-200 px-5 py-5 sm:px-6">
                    <h2 className="text-lg font-bold text-stone-900">
                        Existencias de productos
                    </h2>
                    <p className="text-sm text-stone-500">
                        Seleccioná un producto para modificar su stock o su nivel mínimo.
                    </p>
                </div>

                {stock.length === 0 ? (
                    <div className="flex flex-col items-center px-6 py-16 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-500">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-7 w-7"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.7"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                                <path d="m3.3 7 8.7 5 8.7-5" />
                                <path d="M12 22V12" />
                            </svg>
                        </div>
                        <h3 className="mt-4 font-semibold text-stone-900">
                            No hay productos para mostrar
                        </h3>
                        <p className="mt-1 max-w-sm text-sm leading-6 text-stone-500">
                            Cuando tengas productos cargados, vas a poder consultar sus existencias desde esta sección.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="hidden overflow-x-auto md:block">
                            <table className="w-full min-w-[680px] text-left">
                                <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold">Producto</th>
                                        <th className="px-4 py-4 font-semibold">Código</th>
                                        <th className="px-4 py-4 text-right font-semibold">Stock actual</th>
                                        <th className="px-4 py-4 text-right font-semibold">Stock mínimo</th>
                                        <th className="px-6 py-4 text-right font-semibold">Acción</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-stone-100">
                                    {stock.map((producto) => {
                                        const stockBajoProducto =
                                            Number(producto.stock) <= Number(producto.stock_minimo)

                                        return (
                                            <tr
                                                key={producto.id}
                                                className="transition hover:bg-stone-50/80"
                                            >
                                                <td className="px-6 py-4">
                                                    <p className="font-semibold text-stone-900">
                                                        {producto.nombre}
                                                    </p>
                                                </td>

                                                <td className="px-4 py-4 text-sm text-stone-500">
                                                    {producto.codigo || 'Sin código'}
                                                </td>

                                                <td className="px-4 py-4 text-right">
                                                    <span className={`font-semibold ${
                                                        stockBajoProducto && producto.activo
                                                            ? 'text-red-600'
                                                            : 'text-stone-800'
                                                    }`}>
                                                        {formatoStock(producto.stock)}
                                                    </span>
                                                    {stockBajoProducto && producto.activo && (
                                                        <span className="ml-2 inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                                                            Bajo
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="px-4 py-4 text-right text-sm text-stone-600">
                                                    {formatoStock(producto.stock_minimo)}
                                                </td>

                                                <td className="px-6 py-4 text-right">
                                                    <Button
                                                        onClick={() => navigate(`/stock/detalle/${producto.id}`)}
                                                    >
                                                        Modificar stock
                                                    </Button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="divide-y divide-stone-100 md:hidden">
                            {stock.map((producto) => {
                                const stockBajoProducto =
                                    Number(producto.stock) <= Number(producto.stock_minimo)

                                return (
                                    <div key={producto.id} className="space-y-4 p-5">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <h3 className="break-words font-semibold text-stone-900">
                                                    {producto.nombre}
                                                </h3>
                                                <p className="mt-1 text-sm text-stone-500">
                                                    Código: {producto.codigo || 'Sin código'}
                                                </p>
                                            </div>

                                            {stockBajoProducto && producto.activo && (
                                                <span className="shrink-0 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                                                    Stock bajo
                                                </span>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="rounded-xl bg-stone-50 p-3">
                                                <p className="text-xs font-medium text-stone-500">
                                                    Stock actual
                                                </p>
                                                <p className={`mt-1 text-lg font-bold ${
                                                    stockBajoProducto && producto.activo
                                                        ? 'text-red-600'
                                                        : 'text-stone-900'
                                                }`}>
                                                    {formatoStock(producto.stock)}
                                                </p>
                                            </div>

                                            <div className="rounded-xl bg-stone-50 p-3">
                                                <p className="text-xs font-medium text-stone-500">
                                                    Stock mínimo
                                                </p>
                                                <p className="mt-1 text-lg font-bold text-stone-900">
                                                    {formatoStock(producto.stock_minimo)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex justify-end">
                                            <Button
                                                onClick={() => navigate(`/stock/detalle/${producto.id}`)}
                                            >
                                                Modificar stock
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default StockPage