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

            <div className="flex justify-center mt-10">
                <p>Cargando producto...</p>
            </div>
        )

    }

    return (
        <div>

            <div className="w-full max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 my-6">
                <h1 className="text-2xl font-bold text-[#1C1917]">Detalle del producto</h1>
                <Button onClick={() => navigate('/productos')}>Volver</Button>
            </div>

            {productoError.length > 0 && (
                <div className="mb-4">
                    {productoError.map((error, index) => (
                        <p key={index} className="text-red-500">{error.message || error.error || error}</p>
                    ))}
                </div>
            )}

            <Card className="w-full max-w-2xl mx-auto p-6">
                {producto.imagen && (
                    <div className="flex justify-center mb-6">
                        <img
                            src={producto.imagen}
                            alt={producto.nombre}
                            className="w-48 h-48 sm:w-64 sm:h-64 object-contain rounded-md"
                        />
                    </div>
                )}

                <h2 className="text-2xl sm:text-3xl font-bold mb-6 break-words">
                    {producto.nombre}
                </h2>

                <div className="space-y-3">
                    <p><span className="font-bold">Código:</span>{' '}{producto.codigo || 'Sin código'}</p>
                    <p><span className="font-bold">Descripción:</span>{' '}{producto.descripcion || 'Sin descripción'}</p>
                    <p><span className="font-bold">Precio de compra:</span>{' '}${producto.precio_compra}</p>
                    <p><span className="font-bold">Precio de venta:</span>{' '}${producto.precio_venta}</p>
                    <p><span className="font-bold">Stock:</span>{' '}{Number(producto.stock).toLocaleString('es-AR')}</p>
                    <p><span className="font-bold">Stock mínimo:</span>{' '}{Number(producto.stock_minimo).toLocaleString('es-AR')}</p>
                    <p><span className="font-bold">Estado:</span>{' '}{producto.activo
                            ? 'Activo'
                            : 'Inactivo'}
                    </p>
                </div>
            </Card>
        </div>
    )
}

export default ProductosDetalle