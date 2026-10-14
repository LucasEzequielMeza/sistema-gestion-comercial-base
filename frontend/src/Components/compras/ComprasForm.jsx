import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FaExclamationTriangle, FaTimes, FaPlus, FaTrash, FaShoppingCart } from 'react-icons/fa'
import Card from '../UI/Card'
import Input from '../UI/Input'
import Label from '../UI/Label'
import Button from '../UI/Button'
import axios from '../../Api/axios'

function CompraForm() {
    const navigate = useNavigate()
    const { id } = useParams()
    const modoEdicion = Boolean(id)

    const [proveedores, setProveedores] = useState([])
    const [productos, setProductos] = useState([])
    const [proveedorId, setProveedorId] = useState('')
    const [detalles, setDetalles] = useState([
        { producto_id: '', cantidad: 1, costo_unitario: 0 }
    ])
    const [tipoComprobante, setTipoComprobante] = useState('Factura')
    const [numeroComprobante, setNumeroComprobante] = useState('')
    const [observaciones, setObservaciones] = useState('')
    const [error, setError] = useState('')
    const [filaDuplicada, setFilaDuplicada] = useState(null)
    const [guardando, setGuardando] = useState(false)
    const [cargandoCompra, setCargandoCompra] = useState(Boolean(id))
    const [cargandoProductos, setCargandoProductos] = useState(false)

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                const respuestaProveedores = await axios.get('/proveedores')
                const listaProveedores = respuestaProveedores.data.proveedores ?? respuestaProveedores.data

                setProveedores(listaProveedores.filter(proveedor => proveedor.activo))

                if (modoEdicion) {
                    const respuestaCompra = await axios.get(`/compras/${id}`)
                    const compra = respuestaCompra.data

                    if (compra.estado !== 'pendiente') {
                        setError('Solo se pueden editar compras pendientes.')
                        return
                    }

                    setProveedorId(compra.proveedor_id)
                    setTipoComprobante(compra.tipo_comprobante || 'Factura')
                    setNumeroComprobante(compra.numero_comprobante || '')
                    setObservaciones(compra.observaciones || '')

                    const respuestaProductosProveedor = await axios.get(
                        `/proveedores/${compra.proveedor_id}/productos`
                    )

                    setProductos(
                        (respuestaProductosProveedor.data.productos ?? respuestaProductosProveedor.data)
                    )

                    setDetalles(compra.detalles.map(detalle => ({
                        producto_id: detalle.producto_id,
                        cantidad: detalle.cantidad,
                        costo_unitario: detalle.costo_unitario
                    })))
                }
            } catch (error) {
                setError(
                    error.response?.data?.message ||
                    'No se pudieron cargar los proveedores, productos o datos de la compra.'
                )
            } finally {
                setCargandoCompra(false)
            }
        }

        cargarDatos()
    }, [id, modoEdicion])

    const cambiarProveedor = async (nuevoProveedorId) => {
        setProveedorId(nuevoProveedorId)
        setProductos([])
        setDetalles([
            { producto_id: '', cantidad: 1, costo_unitario: 0 }
        ])
        setError('')
        setFilaDuplicada(null)

        if (!nuevoProveedorId) {
            return
        }

        setCargandoProductos(true)

        try {
            const respuesta = await axios.get(
                `/proveedores/${nuevoProveedorId}/productos`
            )

            const listaProductos = respuesta.data.productos ?? respuesta.data

            setProductos(listaProductos.filter(producto => producto.activo))

            if (listaProductos.filter(producto => producto.activo).length === 0) {
                setError('Este proveedor todavía no tiene productos activos asociados.')
            }
        } catch (error) {
            setError(
                error.response?.data?.message ||
                'No se pudieron cargar los productos de este proveedor.'
            )
        } finally {
            setCargandoProductos(false)
        }
    }

    const actualizarDetalle = (indice, campo, valor) => {
        setDetalles(detallesActuales =>
            detallesActuales.map((detalle, i) =>
                i === indice
                    ? { ...detalle, [campo]: valor }
                    : detalle
            )
        )
    }

    const agregarProducto = () => {
        setDetalles(detallesActuales => [
            ...detallesActuales,
            { producto_id: '', cantidad: 1, costo_unitario: 0 }
        ])
        setError('')
    }

    const quitarProducto = (indice) => {
        setDetalles(detallesActuales =>
            detallesActuales.filter((_, i) => i !== indice)
        )
        setFilaDuplicada(null)
        setError('')
    }

    const total = detalles.reduce(
        (acumulado, detalle) =>
            acumulado + Number(detalle.cantidad || 0) * Number(detalle.costo_unitario || 0),
        0
    )

    const registrarCompra = async (e) => {
        e.preventDefault()
        setError('')

        if (!proveedorId) {
            setError('Seleccioná un proveedor para registrar la compra.')
            return
        }

        if (detalles.length === 0) {
            setError('Agregá al menos un producto a la compra.')
            return
        }

        if (detalles.some(detalle => !detalle.producto_id)) {
            setError('Seleccioná un producto en cada renglón de la compra.')
            return
        }

        const productosSeleccionados = detalles.map(detalle => detalle.producto_id)

        if (new Set(productosSeleccionados).size !== productosSeleccionados.length) {
            setError('Hay productos repetidos. Cada producto debe aparecer una sola vez en la compra.')
            return
        }

        if (detalles.some(detalle =>
            !Number.isFinite(Number(detalle.cantidad)) ||
            Number(detalle.cantidad) <= 0
        )) {
            setError('Todas las cantidades deben ser mayores que cero.')
            return
        }

        if (detalles.some(detalle =>
            !Number.isFinite(Number(detalle.costo_unitario)) ||
            Number(detalle.costo_unitario) <= 0
        )) {
            setError('Todos los costos unitarios deben ser mayores que cero.')
            return
        }

        setGuardando(true)

        try {
            const datosCompra = {
                proveedor_id: proveedorId,
                tipo_comprobante: tipoComprobante,
                numero_comprobante: numeroComprobante,
                observaciones,
                detalles: detalles.map(detalle => ({
                    ...detalle,
                    cantidad: Number(detalle.cantidad),
                    costo_unitario: Number(detalle.costo_unitario)
                }))
            }

            if (modoEdicion) {
                await axios.put(`/compras/${id}`, datosCompra)
            } else {
                await axios.post('/compras', datosCompra)
            }

            navigate('/compras')
        } catch (error) {
            const respuesta = error.response?.data
            const erroresValidacion = respuesta?.errores

            if (erroresValidacion?.length > 0) {
                const primerError = erroresValidacion[0]
                setError(primerError.message || respuesta.message || 'Revisá los datos ingresados.')
            } else {
                setError(
                    respuesta?.message ||
                    `No se pudo ${modoEdicion ? 'actualizar' : 'registrar'} la compra. Revisá los datos e intentá nuevamente.`
                )
            }
        } finally {
            setGuardando(false)
        }
    }

    const formatoMoneda = (importe) => {
        return Number(importe || 0).toLocaleString('es-AR', {
            style: 'currency',
            currency: 'ARS'
        })
    }

    const claseSelect = "my-2 block w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 transition focus:border-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-100"

    if (cargandoCompra) {
        return (
            <div className="mx-auto w-full max-w-5xl p-8 text-center text-stone-600">
                Cargando compra...
            </div>
        )
    }

    return (
        <div className="mx-auto w-full max-w-5xl space-y-6 pb-8">
            <div className="flex flex-col gap-4 border-b border-stone-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm font-medium text-stone-500">
                        Inventario / Compras
                    </p>
                    <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
                        {modoEdicion ? 'Editar compra' : 'Registrar compra'}
                    </h1>
                    <p className="mt-1 text-sm leading-6 text-stone-500">
                        {modoEdicion
                            ? 'Modificá los datos y los productos de la compra pendiente.'
                            : 'Cargá el proveedor, el comprobante y los productos recibidos.'}
                    </p>
                </div>

                <Button
                    type="button"
                    onClick={() => navigate('/compras')}
                    className="w-full sm:w-auto"
                >
                    Volver a compras
                </Button>
            </div>

            {error && (
                <div className="flex items-start justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    <div className="flex items-start gap-3">
                        <FaExclamationTriangle className="mt-0.5 shrink-0" />
                        <p className="leading-6">{error}</p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setError('')}
                        aria-label="Cerrar error"
                        className="rounded-lg p-1 transition hover:bg-red-100"
                    >
                        <FaTimes />
                    </button>
                </div>
            )}

            <form onSubmit={registrarCompra} className="space-y-6">
                <Card className="border border-stone-200 bg-white shadow-sm">
                    <div className="mb-5 flex items-center gap-3 border-b border-stone-100 pb-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 text-stone-700">
                            <FaShoppingCart />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-stone-900">
                                Información de la compra
                            </h2>
                            <p className="mt-0.5 text-sm text-stone-500">
                                Datos del proveedor y del comprobante.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
                        <div className="md:col-span-2">
                            <Label htmlFor="proveedor">Proveedor</Label>
                            <select
                                id="proveedor"
                                value={proveedorId}
                                onChange={e => cambiarProveedor(e.target.value)}
                                className={claseSelect}
                                required
                                disabled={guardando}
                            >
                                <option value="">Seleccionar proveedor</option>
                                {proveedores.map(proveedor => (
                                    <option key={proveedor.id} value={proveedor.id}>
                                        {proveedor.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <Label htmlFor="tipo_comprobante">Tipo de comprobante</Label>
                            <select
                                id="tipo_comprobante"
                                value={tipoComprobante}
                                onChange={e => setTipoComprobante(e.target.value)}
                                className={claseSelect}
                            >
                                <option value="Factura">Factura</option>
                                <option value="Remito">Remito</option>
                                <option value="Ticket">Ticket</option>
                                <option value="Otro">Otro</option>
                            </select>
                        </div>

                        <div>
                            <Label htmlFor="numero_comprobante">Número de comprobante</Label>
                            <Input
                                id="numero_comprobante"
                                type="text"
                                value={numeroComprobante}
                                onChange={e => setNumeroComprobante(e.target.value)}
                                placeholder="Ej. 0001-00001234"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <Label htmlFor="observaciones">Observaciones</Label>
                            <textarea
                                id="observaciones"
                                value={observaciones}
                                onChange={e => setObservaciones(e.target.value)}
                                placeholder="Información adicional de la compra (opcional)"
                                rows={3}
                                className="my-2 block w-full resize-y rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 placeholder:text-stone-400 transition focus:border-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-100"
                            />
                        </div>
                    </div>
                </Card>

                <Card className="border border-stone-200 bg-white shadow-sm">
                    <div className="mb-5 flex flex-col gap-3 border-b border-stone-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-stone-900">
                                Productos de la compra
                            </h2>
                            <p className="mt-1 text-sm text-stone-500">
                                Agregá cada producto una sola vez e indicá cantidad y costo.
                            </p>
                        </div>

                        <span className="w-fit rounded-full bg-stone-100 px-3 py-1 text-sm font-semibold text-stone-600">
                            {detalles.length} {detalles.length === 1 ? 'producto' : 'productos'}
                        </span>
                    </div>

                    {!proveedorId ? (
                        <p className="rounded-xl bg-stone-50 p-4 text-sm text-stone-500">
                            Seleccioná un proveedor para consultar sus productos.
                        </p>
                    ) : cargandoProductos ? (
                        <p className="rounded-xl bg-stone-50 p-4 text-sm text-stone-500">
                            Cargando productos del proveedor...
                        </p>
                    ) : productos.length === 0 ? (
                        <p className="rounded-xl bg-stone-50 p-4 text-sm text-stone-500">
                            Este proveedor no tiene productos disponibles asociados.
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {detalles.map((detalle, indice) => (
                                <div
                                    key={indice}
                                    className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4 sm:p-5"
                                >
                                    <div className="mb-4 flex items-center justify-between gap-3">
                                        <h3 className="text-sm font-bold text-stone-800">
                                            Producto {indice + 1}
                                        </h3>

                                        {detalles.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => quitarProducto(indice)}
                                                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                                            >
                                                <FaTrash size={12} />
                                                Quitar
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 gap-x-5 gap-y-3 md:grid-cols-3">
                                        <div className="md:col-span-3">
                                            <Label>Producto</Label>
                                            <select
                                                value={detalle.producto_id}
                                                onChange={e => {
                                                    const productoId = e.target.value

                                                    if (
                                                        productoId &&
                                                        detalles.some((item, i) =>
                                                            i !== indice && item.producto_id === productoId
                                                        )
                                                    ) {
                                                        setFilaDuplicada(indice)
                                                        return
                                                    }

                                                    setError('')

                                                    const producto = productos.find(
                                                        item => item.id === productoId
                                                    )

                                                    actualizarDetalle(indice, 'producto_id', productoId)
                                                    actualizarDetalle(
                                                        indice,
                                                        'costo_unitario',
                                                        producto ? producto.precio_compra_proveedor : 0
                                                    )
                                                }}
                                                className={claseSelect}
                                                required
                                            >
                                                <option value="">Seleccionar producto</option>
                                                {productos.map(producto => (
                                                    <option key={producto.id} value={producto.id}>
                                                        {producto.nombre} ({producto.codigo}) — {formatoMoneda(producto.precio_compra_proveedor)}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <Label>Cantidad</Label>
                                            <Input
                                                type="number"
                                                min="1"
                                                step="1"
                                                value={detalle.cantidad}
                                                onChange={e =>
                                                    actualizarDetalle(indice, 'cantidad', e.target.value)
                                                }
                                            />
                                        </div>

                                        <div>
                                            <Label>Costo unitario</Label>
                                            <Input
                                                type="number"
                                                value={detalle.costo_unitario}
                                                readOnly
                                                required
                                            />
                                        </div>

                                        <div className="flex flex-col justify-center rounded-xl border border-stone-200 bg-white px-4 py-3 md:mt-2">
                                            <span className="text-xs font-medium text-stone-500">
                                                Subtotal
                                            </span>
                                            <span className="mt-1 text-lg font-bold text-stone-900">
                                                {formatoMoneda(Number(detalle.cantidad) * Number(detalle.costo_unitario))}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={agregarProducto}
                        disabled={!proveedorId || cargandoProductos || productos.length === 0}
                        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-stone-300 px-4 py-3 text-sm font-semibold text-stone-700 transition hover:border-stone-500 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                    >
                        <FaPlus size={12} />
                        Agregar otro producto
                    </button>

                    <div className="mt-6 flex flex-col gap-2 rounded-2xl border border-stone-200 bg-stone-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm font-medium text-stone-500">
                                Total de la compra
                            </p>
                            <p className="mt-1 text-xs text-stone-500">
                                Suma de todos los subtotales.
                            </p>
                        </div>

                        <p className="text-2xl font-bold tracking-tight text-stone-900">
                            {formatoMoneda(total)}
                        </p>
                    </div>
                </Card>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <Button
                        type="button"
                        onClick={() => navigate('/compras')}
                        className="w-full sm:w-auto"
                    >
                        Cancelar
                    </Button>

                    <Button
                        type="submit"
                        disabled={guardando || cargandoProductos}
                        className="w-full sm:w-auto"
                    >
                        {guardando
                            ? (modoEdicion ? 'Guardando cambios...' : 'Registrando...')
                            : (modoEdicion ? 'Guardar cambios' : 'Registrar compra')}
                    </Button>
                </div>
            </form>

            {filaDuplicada !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl">
                        <div className="p-6">
                            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                                <FaExclamationTriangle size={23} />
                            </div>

                            <h2 className="text-xl font-bold text-stone-900">
                                Producto repetido
                            </h2>

                            <p className="mt-3 text-sm leading-6 text-stone-600">
                                Este producto ya está agregado a la compra. Cada producto debe aparecer una sola vez. Si continuás, se quitará el renglón en el que intentaste seleccionarlo.
                            </p>

                            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={() => setFilaDuplicada(null)}
                                    className="rounded-xl border border-stone-300 px-4 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
                                >
                                    Volver
                                </button>

                                <button
                                    type="button"
                                    onClick={() => quitarProducto(filaDuplicada)}
                                    className="rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                                >
                                    Entendido, quitar renglón
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default CompraForm