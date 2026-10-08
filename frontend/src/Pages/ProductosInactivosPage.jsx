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
        <div>
            <h1 className="text-2xl font-bold text-[#1C1917] my-6">
                Productos inactivos
            </h1>

            {productosInactivos.length === 0 ? (
                <p className="text-[#57534E]">No hay productos inactivos.</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch">
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
                        <h2 className="text-xl font-bold text-[#1C1917]">
                            Eliminar producto
                        </h2>
                        <p className="mt-3 text-sm text-[#57534E]">
                            ¿Estás seguro de que querés eliminar definitivamente
                            <span className="font-semibold text-[#1C1917]">
                                {' '}{productoAEliminar.nombre}
                            </span>?
                        </p>
                        <p className="mt-2 text-sm text-red-600">
                            Esta acción no se puede deshacer.
                        </p>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setProductoAEliminar(null)}
                                className="rounded-md border border-[#D6D3D1] px-4 py-2 text-sm font-medium text-[#44403C] hover:bg-[#F5F5F4]"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={productoEliminado}
                                className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                            >
                                Eliminar producto
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {mensajeAlerta && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
                        <h2 className="text-xl font-bold text-[#1C1917]">
                            No se puede eliminar
                        </h2>
                        <p className="mt-3 text-sm text-[#57534E]">
                            {mensajeAlerta}
                        </p>
                        <div className="mt-6 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setMensajeAlerta('')}
                                className="rounded-md bg-[#13100F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#26211F]"
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