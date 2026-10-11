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

    return (

        <div className="min-h-screen">
            <div className="flex justify-end my-6">
                <Button
                    className="bg-[#13100F] text-white px-4 py-2 rounded-md hover:bg-[#26211F] whitespace-nowrap"
                    onClick={() => navigate('/stock/movimientos')}
                >
                    Ver movimientos de stock
                </Button>
            </div>

            {stockBajo.length > 0 && (
                <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 border-l-4 border-l-red-500 bg-red-50 p-4 shadow-sm">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
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
                        <p className="mt-1 text-sm text-red-700">
                            Hay {stockBajo.length} {stockBajo.length === 1 ? 'producto que necesita' : 'productos que necesitan'} reposición. Revisá las existencias para evitar faltantes.
                        </p>
                    </div>
                </div>
            )}
            <div className="bg-zinc-200 rounded-xl shadow-md p-6">

                <div className="w-full">

                    {/* Encabezados */}

                    <div className="grid grid-cols-5 gap-4 border-b border-zinc-400 pb-3 font-bold text-center">

                        <div>
                            Nombre
                        </div>

                        <div>
                            Código
                        </div>

                        <div>
                            Stock actual
                        </div>

                        <div>
                            Stock mínimo
                        </div>

                        <div>
                            Acción
                        </div>

                    </div>

                    {/* Productos */}

                    {stock.map((producto) => {

                        const stockBajoProducto =
                            Number(producto.stock) <=
                            Number(producto.stock_minimo)

                        return (

                            <div
                                key={producto.id}
                                className="grid grid-cols-5 gap-4 items-center border-b border-zinc-300 py-4 text-center"
                            >

                                <div>
                                    {producto.nombre}
                                </div>

                                <div>
                                    {producto.codigo || 'Sin código'}
                                </div>

                                <div
                                    className={
                                        stockBajoProducto && producto.activo
                                            ? 'text-red-500 font-bold'
                                            : ''
                                    }
                                >
                                    {Number(producto.stock).toLocaleString('es-AR')}
                                </div>

                                <div>
                                    {Number(producto.stock_minimo).toLocaleString('es-AR')}
                                </div>

                                <div className="flex justify-center">

                                    <Button
                                        onClick={() =>
                                            navigate(
                                                `/stock/detalle/${producto.id}`
                                            )
                                        }
                                    >
                                        Modificar stock
                                    </Button>

                                </div>

                            </div>

                        )
                    })}

                </div>

            </div>

        </div>
    )
}

export default StockPage