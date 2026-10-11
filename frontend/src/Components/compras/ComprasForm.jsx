import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaExclamationTriangle, FaTimes } from 'react-icons/fa'
import Card from '../UI/Card'
import Input from '../UI/Input'
import Label from '../UI/Label'
import Button from '../UI/Button'
import axios from '../../Api/axios'

function CompraForm() {
    const navigate = useNavigate()
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

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                const [respuestaProveedores, respuestaProductos] = await Promise.all([
                    axios.get('/proveedores'),
                    axios.get('/productos')
                ])

                const listaProveedores = respuestaProveedores.data.proveedores ?? respuestaProveedores.data
                const listaProductos = respuestaProductos.data.productos ?? respuestaProductos.data

                setProveedores(listaProveedores.filter(proveedor => proveedor.activo))
                setProductos(listaProductos.filter(producto => producto.activo))
            } catch (error) {
                setError(error.response?.data?.message || 'No se pudieron cargar los proveedores y productos.')
            }
        }

        cargarDatos()
    }, [])

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
            await axios.post('/compras', {
                proveedor_id: proveedorId,
                tipo_comprobante: tipoComprobante,
                numero_comprobante: numeroComprobante,
                observaciones,
                detalles: detalles.map(detalle => ({
                    ...detalle,
                    cantidad: Number(detalle.cantidad),
                    costo_unitario: Number(detalle.costo_unitario)
                }))
            })

            navigate('/compras')
        } catch (error) {
            const respuesta = error.response?.data
            const erroresValidacion = respuesta?.errores

            if (erroresValidacion?.length > 0) {
                const primerError = erroresValidacion[0]
                setError(primerError.message || respuesta.message || 'Revisá los datos ingresados.')
            } else {
                setError(respuesta?.message || 'No se pudo registrar la compra. Revisá los datos e intentá nuevamente.')
            }
        } finally {
            setGuardando(false)
        }
    }

    return (
        <Card>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 my-4">
                <h2 className="text-3xl font-bold text-[#1C1917]">Registrar compra</h2>
                <Button type="button" onClick={() => navigate('/compras')}>Volver</Button>
            </div>

            {error && (
                <div className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    <p>{error}</p>
                    <button
                        type="button"
                        onClick={() => setError('')}
                        aria-label="Cerrar error"
                        className="rounded-md p-1 transition hover:bg-red-100"
                    >
                        <FaTimes />
                    </button>
                </div>
            )}

            <form onSubmit={registrarCompra}>
                <Label htmlFor="proveedor">Proveedor</Label>
                <select
                    id="proveedor"
                    value={proveedorId}
                    onChange={e => setProveedorId(e.target.value)}
                    className="bg-white border border-[#D6D3D1] rounded-md px-3 py-2 block my-2 w-full"
                    required
                >
                    <option value="">Seleccionar proveedor</option>
                    {proveedores.map(proveedor => (
                        <option key={proveedor.id} value={proveedor.id}>
                            {proveedor.nombre}
                        </option>
                    ))}
                </select>

                <Label htmlFor="tipo_comprobante">Tipo de comprobante</Label>
                <select
                    id="tipo_comprobante"
                    value={tipoComprobante}
                    onChange={e => setTipoComprobante(e.target.value)}
                    className="bg-white border border-[#D6D3D1] rounded-md px-3 py-2 block my-2 w-full"
                >
                    <option value="Factura">Factura</option>
                    <option value="Remito">Remito</option>
                    <option value="Ticket">Ticket</option>
                    <option value="Otro">Otro</option>
                </select>

                <Label htmlFor="numero_comprobante">Número de comprobante</Label>
                <Input
                    type="text"
                    value={numeroComprobante}
                    onChange={e => setNumeroComprobante(e.target.value)}
                />

                <Label htmlFor="observaciones">Observaciones</Label>
                <textarea
                    id="observaciones"
                    value={observaciones}
                    onChange={e => setObservaciones(e.target.value)}
                    className="bg-white border border-[#D6D3D1] rounded-md px-3 py-2 block my-2 w-full"
                />

                <h3 className="text-xl font-bold mt-6 mb-3">Productos de la compra</h3>

                {detalles.map((detalle, indice) => (
                    <div key={indice} className="border border-[#D6D3D1] rounded-lg p-4 mb-4">
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

                                const producto = productos.find(item => item.id === productoId)

                                actualizarDetalle(indice, 'producto_id', productoId)
                                actualizarDetalle(indice, 'costo_unitario', producto ? producto.precio_compra : 0)
                            }}
                            className="bg-white border border-[#D6D3D1] rounded-md px-3 py-2 block my-2 w-full"
                            required
                        >
                            <option value="">Seleccionar producto</option>
                            {productos.map(producto => (
                                <option key={producto.id} value={producto.id}>
                                    {producto.nombre} ({producto.codigo})
                                </option>
                            ))}
                        </select>

                        <Label>Cantidad</Label>
                        <Input
                            type="number"
                            min="0.001"
                            step="0.001"
                            value={detalle.cantidad}
                            onChange={e => actualizarDetalle(indice, 'cantidad', e.target.value)}
                            required
                        />

                        <Label>Costo unitario</Label>
                        <Input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={detalle.costo_unitario}
                            onChange={e => actualizarDetalle(indice, 'costo_unitario', e.target.value)}
                            required
                        />

                        <p className="text-right font-medium mt-2">
                            Subtotal: {(Number(detalle.cantidad) * Number(detalle.costo_unitario)).toLocaleString('es-AR', {
                                style: 'currency',
                                currency: 'ARS'
                            })}
                        </p>

                        {detalles.length > 1 && (
                            <div className="mt-3">
                                <Button type="button" onClick={() => quitarProducto(indice)}>
                                    Quitar producto
                                </Button>
                            </div>
                        )}
                    </div>
                ))}

                <Button type="button" onClick={agregarProducto}>Agregar otro producto</Button>

                <div className="text-right text-xl font-bold my-6">
                    Total: {total.toLocaleString('es-AR', {
                        style: 'currency',
                        currency: 'ARS'
                    })}
                </div>

                <div className="flex justify-center">
                    <Button type="submit" disabled={guardando}>
                        {guardando ? 'Registrando...' : 'Registrar compra'}
                    </Button>
                </div>
            </form>

            {filaDuplicada !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
                        <div className="p-6">
                            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                                <FaExclamationTriangle size={23} />
                            </div>

                            <h2 className="text-xl font-bold text-[#1C1917]">
                                Producto repetido
                            </h2>

                            <p className="mt-3 text-sm leading-6 text-[#78716C]">
                                Este producto ya está agregado a la compra. Cada producto debe aparecer una sola vez. Si continuás, se quitará el renglón en el que intentaste seleccionarlo.
                            </p>

                            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={() => setFilaDuplicada(null)}
                                    className="rounded-xl border border-[#D6D3D1] px-4 py-3 text-sm font-semibold text-[#44403C] transition hover:bg-[#F5F5F4]"
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
        </Card>
    )
}

export default CompraForm