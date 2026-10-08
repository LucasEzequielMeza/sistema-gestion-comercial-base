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

        <Card className="w-full h-full min-h-[380px] flex flex-col">
            <div className="flex-1">
                {producto.imagen && (
                    <img
                        src={producto.imagen}
                        alt={producto.nombre}
                        className="w-full h-40 object-contain rounded-md mb-4"
                    />
                )}

                <h2 className="text-2xl font-bold mb-4">{producto.nombre}</h2>
                <div className="space-y-2">
                    <p><span className="font-bold">Código:</span>{' '}{producto.codigo || 'Sin código'}</p>
                    <p><span className="font-bold">Precio:</span>{' '}${producto.precio_venta}</p>
                    <p><span className="font-bold">Stock:</span>{' '}{Number(producto.stock).toLocaleString('es-AR')}</p>
                </div>

            </div>
            <div className="flex flex-wrap gap-2 mt-6">
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