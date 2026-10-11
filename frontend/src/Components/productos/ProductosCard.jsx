import React from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../UI/Card'
import Button from '../UI/Button'

function ProductosCard({
    producto,
    desactivarProducto,
    activarProducto,
    eliminarProducto,
    modoBusqueda,
    modoInactivo = false
}) {

    const navigate = useNavigate()

    return (
        <Card className="flex h-full min-h-[380px] w-full flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md">
            <div className="flex-1">
                <div className="mb-5 flex h-44 items-center justify-center overflow-hidden rounded-xl bg-stone-50 p-3">
                    {producto.imagen ? (
                        <img
                            src={producto.imagen}
                            alt={producto.nombre}
                            className="h-full w-full object-contain"
                        />
                    ) : (
                        <div className="flex flex-col items-center gap-2 text-stone-400">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="38"
                                height="38"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <path d="m21 15-5-5L5 21" />
                            </svg>
                            <span className="text-xs">Sin imagen</span>
                        </div>
                    )}
                </div>

                <div className="mb-4 flex items-start justify-between gap-3">
                    <h2 className="break-words text-xl font-bold text-stone-900">
                        {producto.nombre}
                    </h2>

                    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                        modoInactivo
                            ? 'bg-stone-200 text-stone-600'
                            : 'bg-emerald-100 text-emerald-700'
                    }`}>
                        {modoInactivo ? 'Inactivo' : 'Activo'}
                    </span>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3 border-b border-stone-100 pb-2">
                        <span className="text-sm text-stone-500">Código</span>
                        <span className="break-all text-right text-sm font-medium text-stone-800">
                            {producto.codigo || 'Sin código'}
                        </span>
                    </div>

                    <div className="flex items-center justify-between gap-3 border-b border-stone-100 pb-2">
                        <span className="text-sm text-stone-500">Precio de venta</span>
                        <span className="text-right text-base font-bold text-stone-900">
                            ${Number(producto.precio_venta).toLocaleString('es-AR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}
                        </span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-stone-500">Stock disponible</span>
                        <span className="text-right text-sm font-semibold text-stone-800">
                            {Number(producto.stock).toLocaleString('es-AR')}
                        </span>
                    </div>
                </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2 border-t border-stone-100 pt-4">
                <Button onClick={() => navigate(`/producto/detalle/${producto.id}`)}>
                    Ver detalle
                </Button>

                {!modoBusqueda && !modoInactivo && (
                    <Button onClick={() => navigate(`/productos/${producto.id}/edit`)}>
                        Editar
                    </Button>
                )}

                {modoInactivo ? (
                    <Button onClick={() => activarProducto(producto.id)}>
                        Reactivar
                    </Button>
                ) : (
                    <Button onClick={() => desactivarProducto(producto.id)}>
                        Desactivar
                    </Button>
                )}

                <Button onClick={() => eliminarProducto(producto.id)}>
                    Eliminar definitivamente
                </Button>
            </div>
        </Card>
    )
}

export default ProductosCard