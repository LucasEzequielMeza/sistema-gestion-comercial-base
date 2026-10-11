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

    const estaActivo = (producto) => {
        return producto.activo === true ||
            producto.activo === 'true' ||
            producto.activo === 1 ||
            producto.activo === '1'
    }

    const productosActivos = productos.filter(estaActivo)

    const productosInactivos = productos.filter(
        (producto) =>
            producto.activo === false ||
            producto.activo === 'false' ||
            producto.activo === 0 ||
            producto.activo === '0'
    )

    const realizarBusqueda = async (texto) => {
        setBusqueda(texto)

        if (texto.trim() === '') {
            setResultadosBusqueda([])
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
            await obtenerProductos()

            if (busqueda.trim() !== '') {
                const resultados = await buscarProductos(busqueda)
                setResultadosBusqueda(resultados || [])
            }
        }
    }

    const productoActivado = async (id) => {
        const respuesta = await activarProducto(id)

        if (respuesta) {
            await obtenerProductos()

            if (busqueda.trim() !== '') {
                const resultados = await buscarProductos(busqueda)
                setResultadosBusqueda(resultados || [])
            }
        }
    }

    const productoEliminado = async () => {
        if (!productoAEliminar) return

        const respuesta = await eliminarProducto(productoAEliminar.id)

        setProductoAEliminar(null)

        if (respuesta) {
            await obtenerProductos()

            if (busqueda.trim() !== '') {
                const resultados = await buscarProductos(busqueda)
                setResultadosBusqueda(resultados || [])
            }
        } else {
            setMensajeAlerta(
                'No se puede eliminar este producto porque tiene registros asociados.'
            )
        }
    }

    const mensajeError = Array.isArray(productoError)
        ? productoError
            .filter(
                (mensaje) =>
                    typeof mensaje === 'string' &&
                    mensaje.trim() !== ''
            )
            .join('. ')
        : typeof productoError === 'string'
            ? productoError.trim()
            : ''

    const productosMostrar = (
        busqueda.trim() === ''
            ? productosActivos
            : resultadosBusqueda
    ).filter(estaActivo)

    return (
        <div className="min-h-screen bg-[#F5F5F4] p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-6">

                {/* Encabezado */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm font-medium text-stone-500">
                            Gestión de inventario
                        </p>

                        <h1 className="mt-1 text-2xl font-bold text-stone-900 sm:text-3xl">
                            Productos
                        </h1>

                        <p className="mt-2 text-sm text-stone-600">
                            Administrá tus productos, consultá su estado y mantené actualizado el inventario.
                        </p>
                    </div>

                    <button
                        onClick={() => navigate('/productos/nuevo')}
                        className="inline-flex items-center justify-center rounded-xl bg-[#13100F] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#292421]"
                    >
                        + Nuevo producto
                    </button>
                </div>

                {/* Mensaje de error */}
                {mensajeError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {mensajeError}
                    </div>
                )}

                {/* Resumen de productos */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                        <p className="text-sm font-medium text-stone-500">
                            Productos registrados
                        </p>

                        <p className="mt-3 text-3xl font-bold text-stone-900">
                            {productos.length}
                        </p>

                        <p className="mt-1 text-sm text-stone-500">
                            Total de productos registrados
                        </p>
                    </div>

                    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                        <p className="text-sm font-medium text-stone-500">
                            Productos activos
                        </p>

                        <p className="mt-3 text-3xl font-bold text-emerald-700">
                            {productosActivos.length}
                        </p>

                        <p className="mt-1 text-sm text-stone-500">
                            Disponibles para la gestión habitual
                        </p>
                    </div>

                    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                        <p className="text-sm font-medium text-stone-500">
                            Productos inactivos
                        </p>

                        <p className="mt-3 text-3xl font-bold text-red-700">
                            {productosInactivos.length}
                        </p>

                        <p className="mt-1 text-sm text-stone-500">
                            Productos desactivados
                        </p>
                    </div>
                </div>

                {/* Búsqueda */}
                <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
                    <label
                        htmlFor="buscar-producto"
                        className="mb-2 block text-sm font-semibold text-stone-700"
                    >
                        Buscar productos
                    </label>

                    <input
                        id="buscar-producto"
                        type="text"
                        placeholder="Buscar por nombre o código..."
                        value={busqueda}
                        onChange={(e) => realizarBusqueda(e.target.value)}
                        className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
                    />

                    <p className="mt-2 text-xs text-stone-500">
                        La búsqueda muestra únicamente productos activos.
                    </p>
                </div>

                {/* Listado */}
                <div className="space-y-4">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <h2 className="text-lg font-bold text-stone-900">
                            Listado de productos activos
                        </h2>

                        <p className="text-sm text-stone-500">
                            {productosMostrar.length}{' '}
                            {productosMostrar.length === 1
                                ? 'producto'
                                : 'productos'}
                        </p>
                    </div>

                    {productosMostrar.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-12 text-center">
                            <h3 className="text-base font-semibold text-stone-800">
                                No hay productos para mostrar
                            </h3>

                            <p className="mt-2 text-sm text-stone-500">
                                {busqueda.trim() !== ''
                                    ? 'No se encontraron productos activos que coincidan con la búsqueda.'
                                    : 'Todavía no hay productos activos registrados.'}
                            </p>

                            {busqueda.trim() === '' && (
                                <button
                                    onClick={() => navigate('/productos/nuevo')}
                                    className="mt-5 rounded-xl bg-[#13100F] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#292421]"
                                >
                                    Crear producto
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-3">
                            {productosMostrar.map((producto) => (
                                <ProductosCard
                                    key={producto.id}
                                    producto={producto}
                                    desactivarProducto={productoDesactivado}
                                    activarProducto={productoActivado}
                                    eliminarProducto={() =>
                                        setProductoAEliminar(producto)
                                    }
                                    modoBusqueda={busqueda.trim() !== ''}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Resumen inferior */}
                <div className="flex flex-col gap-2 border-t border-stone-200 pt-4 text-sm text-stone-500 sm:flex-row sm:items-center sm:justify-between">
                    <p>
                        Total registrado: {productos.length} productos
                    </p>

                    <p>
                        Activos: {productosActivos.length} · Inactivos: {productosInactivos.length}
                    </p>
                </div>
            </div>

            {/* Modal de error al eliminar */}
            {mensajeAlerta && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <h3 className="text-lg font-bold text-stone-900">
                            No se pudo eliminar
                        </h3>

                        <p className="mt-3 text-sm leading-6 text-stone-600">
                            {mensajeAlerta}
                        </p>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setMensajeAlerta('')}
                                className="rounded-xl bg-[#13100F] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#292421]"
                            >
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de confirmación */}
            {productoAEliminar && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <h3 className="text-lg font-bold text-stone-900">
                            Eliminar producto
                        </h3>

                        <p className="mt-3 text-sm leading-6 text-stone-600">
                            ¿Estás seguro de que querés eliminar el producto{' '}
                            <span className="font-semibold text-stone-900">
                                {productoAEliminar.nombre}
                            </span>
                            ? Esta acción no se puede deshacer.
                        </p>

                        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button
                                onClick={() => setProductoAEliminar(null)}
                                className="rounded-xl border border-stone-300 px-5 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
                            >
                                Cancelar
                            </button>

                            <button
                                onClick={productoEliminado}
                                className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
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