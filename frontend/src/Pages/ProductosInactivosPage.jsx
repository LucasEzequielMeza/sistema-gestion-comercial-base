import React, { useEffect, useState } from 'react'
import { useProducto } from '../Context/ContextoProductos'
import ProductosCard from '../Components/productos/ProductosCard'

function ProductosInactivosPage() {
    const {
        productosInactivos,
        obtenerProductosInactivos,
        activarProducto,
        eliminarProducto
    } = useProducto()

    const [productoAEliminar, setProductoAEliminar] = useState(null)
    const [mensajeAlerta, setMensajeAlerta] = useState('')

    useEffect(() => {
        obtenerProductosInactivos()
    }, [])

    const productoReactivado = async (id) => {
        const respuesta = await activarProducto(id)
        if (respuesta) obtenerProductosInactivos()
    }

    const productoEliminado = async () => {
        if (!productoAEliminar) return

        const respuesta = await eliminarProducto(productoAEliminar.id)
        setProductoAEliminar(null)

        if (respuesta) {
            obtenerProductosInactivos()
        } else {
            setMensajeAlerta('No se puede eliminar este producto porque tiene registros asociados.')
        }
    }

    return (
        <div className="mx-auto min-h-screen w-full max-w-7xl space-y-6 pb-8">
            <div className="flex flex-col gap-4 border-b border-stone-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm font-medium text-stone-500">
                        Inventario / Productos
                    </p>
                    <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
                        Productos inactivos
                    </h1>
                    <p className="mt-1 max-w-2xl text-sm leading-6 text-stone-500">
                        Consultá los productos dados de baja, reactivá los que vuelvas a utilizar o eliminá definitivamente los que corresponda.
                    </p>
                </div>

                <div className="flex w-fit items-center gap-3 rounded-2xl border border-stone-200 bg-white px-5 py-3 shadow-sm">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 text-stone-600">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M3 6h18" />
                            <path d="M8 6V4h8v2" />
                            <path d="m19 6-1 14H6L5 6" />
                            <path d="M10 11v5" />
                            <path d="M14 11v5" />
                        </svg>
                    </div>

                    <div>
                        <p className="text-xs font-medium text-stone-500">
                            Total inactivos
                        </p>
                        <p className="text-xl font-bold text-stone-900">
                            {productosInactivos.length}
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 8v4" />
                        <path d="M12 16h.01" />
                    </svg>
                </div>

                <div>
                    <p className="text-sm font-semibold text-amber-900">
                        Productos fuera del inventario activo
                    </p>
                    <p className="mt-1 text-sm leading-5 text-amber-800">
                        Los productos inactivos se conservan en el sistema. Podés reactivarlos cuando vuelvan a estar disponibles.
                    </p>
                </div>
            </div>

            {productosInactivos.length === 0 ? (
                <div className="flex flex-col items-center rounded-2xl border border-stone-200 bg-white px-6 py-16 text-center shadow-sm">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100 text-stone-500">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-8 w-8"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                            <path d="m3.3 7 8.7 5 8.7-5" />
                            <path d="M12 22V12" />
                        </svg>
                    </div>

                    <h2 className="mt-5 text-lg font-bold text-stone-900">
                        No hay productos inactivos
                    </h2>

                    <p className="mt-2 max-w-md text-sm leading-6 text-stone-500">
                        Todos los productos están fuera de esta sección. Cuando desactives alguno, aparecerá acá.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {productosInactivos.map((producto) => (
                        <ProductosCard
                            key={producto.id}
                            producto={producto}
                            activarProducto={productoReactivado}
                            eliminarProducto={() => setProductoAEliminar(producto)}
                            modoBusqueda={true}
                            modoInactivo={true}
                        />
                    ))}
                </div>
            )}

            {productoAEliminar && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl">
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-6 w-6"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M3 6h18" />
                                    <path d="M8 6V4h8v2" />
                                    <path d="m19 6-1 14H6L5 6" />
                                    <path d="M10 11v5" />
                                    <path d="M14 11v5" />
                                </svg>
                            </div>

                            <div>
                                <h2 className="text-lg font-bold text-stone-900">
                                    Eliminar producto
                                </h2>
                                <p className="mt-2 text-sm leading-6 text-stone-600">
                                    ¿Estás seguro de que querés eliminar definitivamente{' '}
                                    <span className="font-semibold text-stone-900">
                                        {productoAEliminar.nombre}
                                    </span>?
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3">
                            <p className="text-sm leading-5 text-red-700">
                                Esta acción no se puede deshacer. Si el producto tiene registros asociados, no podrá eliminarse.
                            </p>
                        </div>

                        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={() => setProductoAEliminar(null)}
                                className="rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
                            >
                                Cancelar
                            </button>

                            <button
                                type="button"
                                onClick={productoEliminado}
                                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2"
                            >
                                Eliminar definitivamente
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {mensajeAlerta && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-950/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl">
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-6 w-6"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M12 8v4" />
                                    <path d="M12 16h.01" />
                                </svg>
                            </div>

                            <div>
                                <h2 className="text-lg font-bold text-stone-900">
                                    No se puede eliminar
                                </h2>
                                <p className="mt-2 text-sm leading-6 text-stone-600">
                                    {mensajeAlerta}
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setMensajeAlerta('')}
                                className="rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2"
                            >
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ProductosInactivosPage