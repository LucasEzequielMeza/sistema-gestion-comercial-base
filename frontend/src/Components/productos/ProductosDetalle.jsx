import React, { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useProducto } from '../../Context/ContextoProductos'
import Card from '../UI/Card'
import Button from '../UI/Button'

function ProductosDetalle() {

    const { id } = useParams()
    const navigate = useNavigate()

    const {
        producto,
        obtenerProductoPorId,
        productoError
    } = useProducto()

    useEffect(() => {
        obtenerProductoPorId(id)
    }, [id])

    if (!producto) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center p-6">
                <div className="rounded-2xl border border-stone-200 bg-white px-8 py-10 text-center shadow-sm">
                    <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-stone-200 border-t-stone-800" />
                    <p className="text-sm font-medium text-stone-600">
                        Cargando producto...
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#F5F5F4] p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-4xl space-y-6">

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm font-medium text-stone-500">
                            Gestión de inventario
                        </p>

                        <h1 className="mt-1 text-2xl font-bold text-stone-900 sm:text-3xl">
                            Detalle del producto
                        </h1>

                        <p className="mt-2 text-sm text-stone-600">
                            Consultá la información y el estado del producto.
                        </p>
                    </div>

                    <Button onClick={() => navigate('/productos')}>
                        Volver a productos
                    </Button>
                </div>

                {productoError.length > 0 && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                        {productoError.map((error, index) => (
                            <p key={index} className="text-sm text-red-700">
                                {error.message || error.error || error}
                            </p>
                        ))}
                    </div>
                )}

                <Card className="w-full overflow-hidden rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-8">
                    <div className="mb-8 flex flex-col gap-5 border-b border-stone-200 pb-6 sm:flex-row sm:items-center">
                        <div className="flex h-40 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-stone-50 p-4 sm:h-44 sm:w-44">
                            {producto.imagen ? (
                                <img
                                    src={producto.imagen}
                                    alt={producto.nombre}
                                    className="h-full w-full object-contain"
                                />
                            ) : (
                                <div className="text-center text-sm text-stone-400">
                                    Sin imagen disponible
                                </div>
                            )}
                        </div>

                        <div className="min-w-0 flex-1">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                producto.activo
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-stone-200 text-stone-600'
                            }`}>
                                {producto.activo ? 'Activo' : 'Inactivo'}
                            </span>

                            <h2 className="mt-3 break-words text-2xl font-bold text-stone-900 sm:text-3xl">
                                {producto.nombre}
                            </h2>

                            <p className="mt-2 break-all text-sm text-stone-500">
                                Código: {producto.codigo || 'Sin código'}
                            </p>
                        </div>
                    </div>

                    <div>
                        <h3 className="mb-4 text-base font-bold text-stone-900">
                            Información general
                        </h3>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="rounded-xl bg-stone-50 p-4">
                                <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
                                    Descripción
                                </p>
                                <p className="mt-2 break-words text-sm leading-6 text-stone-800">
                                    {producto.descripcion || 'Sin descripción'}
                                </p>
                            </div>

                            <div className="rounded-xl bg-stone-50 p-4">
                                <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
                                    Código
                                </p>
                                <p className="mt-2 break-all text-sm font-semibold text-stone-800">
                                    {producto.codigo || 'Sin código'}
                                </p>
                            </div>

                            <div className="rounded-xl border border-stone-200 p-4">
                                <p className="text-sm text-stone-500">
                                    Precio de compra
                                </p>
                                <p className="mt-2 text-xl font-bold text-stone-900">
                                    ${Number(producto.precio_compra).toLocaleString('es-AR', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })}
                                </p>
                            </div>

                            <div className="rounded-xl border border-stone-200 p-4">
                                <p className="text-sm text-stone-500">
                                    Precio de venta
                                </p>
                                <p className="mt-2 text-xl font-bold text-stone-900">
                                    ${Number(producto.precio_venta).toLocaleString('es-AR', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })}
                                </p>
                            </div>

                            <div className="rounded-xl border border-stone-200 p-4">
                                <p className="text-sm text-stone-500">
                                    Stock disponible
                                </p>
                                <p className="mt-2 text-xl font-bold text-stone-900">
                                    {Number(producto.stock).toLocaleString('es-AR')}
                                </p>
                            </div>

                            <div className="rounded-xl border border-stone-200 p-4">
                                <p className="text-sm text-stone-500">
                                    Stock mínimo
                                </p>
                                <p className="mt-2 text-xl font-bold text-stone-900">
                                    {Number(producto.stock_minimo).toLocaleString('es-AR')}
                                </p>
                            </div>

                            <div className="rounded-xl bg-stone-50 p-4 sm:col-span-2">
                                <p className="text-sm text-stone-500">
                                    Estado del producto
                                </p>
                                <p className={`mt-2 text-sm font-semibold ${
                                    producto.activo
                                        ? 'text-emerald-700'
                                        : 'text-stone-600'
                                }`}>
                                    {producto.activo ? 'Activo' : 'Inactivo'}
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
}

export default ProductosDetalle