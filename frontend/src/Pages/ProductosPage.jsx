import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProducto } from '../Context/ContextoProductos'
import ProductosCard from '../Components/productos/ProductosCard'

function ProductosPage() {

    const {
        productos,
        obtenerProductos,
        productoError,
        buscarProductos,
        desactivarProducto,
        activarProducto,
        eliminarProducto
    } = useProducto()

    const navigate = useNavigate()
    const [busqueda, setBusqueda] = useState('')
    const [resultadosBusqueda, setResultadosBusqueda] = useState([])
    const [productoAEliminar, setProductoAEliminar] = useState(null)
    const [mensajeAlerta, setMensajeAlerta] = useState('')

    useEffect(() => {

        obtenerProductos()

    }, [])

    const realizarBusqueda = async (texto) => {

        setBusqueda(texto)

        if (texto.trim() === '') {

            setResultadosBusqueda([])

            obtenerProductos()

            return

        }

        const resultados = await buscarProductos(texto)

        if (resultados) {

            setResultadosBusqueda(resultados)

        }

    }

    const productoDesactivado = async (id) => {

        const respuesta = await desactivarProducto(id)

        if (respuesta) {

            obtenerProductos()

        }

    }

    const productoActivado = async (id) => {

        const respuesta = await activarProducto(id)

        if (respuesta) {

            obtenerProductos()

        }

    }

    const productoEliminado = async () => {
        if (!productoAEliminar) return

        const respuesta = await eliminarProducto(productoAEliminar.id)
        setProductoAEliminar(null)

        if (respuesta) {
            if (busqueda.trim() === '') {
                obtenerProductos()
            } else {
                const resultados = await buscarProductos(busqueda)
                setResultadosBusqueda(resultados || [])
            }
        } else {
            setMensajeAlerta('No se puede eliminar este producto porque tiene registros asociados.')
        }
    }

    const productosMostrar =
        busqueda.trim() === ''
            ? productos
            : resultadosBusqueda

    return (

        <div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 my-6">

                <input
                    type="text"
                    placeholder="Buscar por nombre o código"
                    value={busqueda}
                    onChange={(e) =>
                        realizarBusqueda(e.target.value)
                    }
                    className="bg-white border border-[#D6D3D1] px-3 py-2 text-[#1C1917] rounded-md placeholder:text-[#78716C] focus:outline-none focus:border-[#13100F] flex-1"
                />
                <button
                    onClick={() =>
                        navigate('/productos/nuevo')
                    }
                    className="bg-[#13100F] text-white px-4 py-2 rounded-md hover:bg-[#26211F] whitespace-nowrap"
                >
                    Nuevo producto
                </button>

            </div>

            {productosMostrar.length === 0 ? (
                <p className="text-[#57534E]">
                    No hay productos para mostrar.
                </p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch">
                    {productosMostrar.map((producto) => (
                        <ProductosCard
                            key={producto.id}
                            producto={producto}
                            desactivarProducto={productoDesactivado}
                            activarProducto={productoActivado}
                            eliminarProducto={() => setProductoAEliminar(producto)}
                            modoBusqueda={busqueda.trim() !== ''}
                        />
                    ))}
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
        </div>
    )
}

export default ProductosPage