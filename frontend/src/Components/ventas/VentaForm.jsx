import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../Api/axios';
import { useVentas } from '../../Context/ContextoVentas';

function VentaForm() {
    const navigate = useNavigate();
    const { crearVenta } = useVentas();

    const [productos, setProductos] = useState([]);
    const [carrito, setCarrito] = useState([]);
    const [productoSeleccionado, setProductoSeleccionado] = useState('');
    const [cantidad, setCantidad] = useState('1');
    const [pagos, setPagos] = useState([
        { metodo_pago: 'efectivo', monto: '' }
    ]);
    const [cargandoProductos, setCargandoProductos] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');

    const total = useMemo(() => {
        return carrito.reduce(
            (acumulado, item) =>
                acumulado + Number(item.precio_venta) * Number(item.cantidad),
            0
        );
    }, [carrito]);

    const totalPagado = useMemo(() => {
        return pagos.reduce(
            (acumulado, pago) => acumulado + Number(pago.monto || 0),
            0
        );
    }, [pagos]);

    const saldoPendiente = Math.round((total - totalPagado) * 100) / 100;

    // Cargo los productos disponibles para vender.
    useEffect(() => {
        const cargarProductos = async () => {
            try {
                setCargandoProductos(true);
                setError('');

                const respuesta = await axios.get('/productos');

                const datos = Array.isArray(respuesta.data)
                    ? respuesta.data
                    : respuesta.data.productos || [];

                setProductos(
                    datos.filter((producto) => producto.activo !== false)
                );
            } catch (error) {
                setError(
                    error.response?.data?.message ||
                    'No se pudieron cargar los productos.'
                );
            } finally {
                setCargandoProductos(false);
            }
        };

        cargarProductos();
    }, []);

    const productoElegido = productos.find(
        (producto) => producto.id === productoSeleccionado
    );

    const agregarProducto = () => {
        setError('');

        if (!productoElegido) {
            setError('Seleccioná un producto.');
            return;
        }

        const cantidadIngresada = Number(cantidad);

        if (!Number.isFinite(cantidadIngresada) || cantidadIngresada <= 0) {
            setError('Ingresá una cantidad válida.');
            return;
        }

        const productoExistente = carrito.find(
            (item) => item.id === productoElegido.id
        );

        const cantidadActual = productoExistente
            ? Number(productoExistente.cantidad)
            : 0;

        const cantidadFinal = cantidadActual + cantidadIngresada;

        if (cantidadFinal > Number(productoElegido.stock)) {
            setError(
                `Stock insuficiente para ${productoElegido.nombre}. ` +
                `Disponible: ${productoElegido.stock}.`
            );
            return;
        }

        if (productoExistente) {
            setCarrito((actual) =>
                actual.map((item) =>
                    item.id === productoElegido.id
                        ? { ...item, cantidad: cantidadFinal }
                        : item
                )
            );
        } else {
            setCarrito((actual) => [
                ...actual,
                {
                    ...productoElegido,
                    cantidad: cantidadIngresada
                }
            ]);
        }

        setProductoSeleccionado('');
        setCantidad('1');
    };

    const cambiarCantidad = (productoId, nuevaCantidad) => {
        setError('');

        if (nuevaCantidad === '') {
            setCarrito((actual) =>
                actual.map((item) =>
                    item.id === productoId
                        ? { ...item, cantidad: '' }
                        : item
                )
            );
            return;
        }

        const cantidadIngresada = Number(nuevaCantidad);

        if (!Number.isFinite(cantidadIngresada) || cantidadIngresada <= 0) {
            setError('La cantidad debe ser mayor que cero.');
            return;
        }

        const producto = carrito.find((item) => item.id === productoId);

        if (cantidadIngresada > Number(producto.stock)) {
            setError(`No hay stock suficiente de ${producto.nombre}.`);
            return;
        }

        setCarrito((actual) =>
            actual.map((item) =>
                item.id === productoId
                    ? { ...item, cantidad: nuevaCantidad }
                    : item
            )
        );
    };

    const quitarProducto = (productoId) => {
        setCarrito((actual) =>
            actual.filter((item) => item.id !== productoId)
        );
        setError('');
    };

    const agregarPago = () => {
        setPagos((actual) => [
            ...actual,
            { metodo_pago: 'efectivo', monto: '' }
        ]);
    };

    const cambiarPago = (indice, campo, valor) => {
        setPagos((actual) =>
            actual.map((pago, posicion) =>
                posicion === indice
                    ? { ...pago, [campo]: valor }
                    : pago
            )
        );
    };

    const quitarPago = (indice) => {
        setPagos((actual) =>
            actual.filter((_, posicion) => posicion !== indice)
        );
    };

    const completarSaldo = (indice) => {
        const otrosPagos = pagos.reduce(
            (acumulado, pago, posicion) =>
                posicion === indice
                    ? acumulado
                    : acumulado + Number(pago.monto || 0),
            0
        );

        const saldo = Math.round((total - otrosPagos) * 100) / 100;

        cambiarPago(indice, 'monto', Math.max(0, saldo).toFixed(2));
    };

    const formatearPrecio = (valor) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS'
        }).format(Number(valor) || 0);
    };

    const registrarVenta = async (evento) => {
        evento.preventDefault();
        setError('');

        if (carrito.length === 0) {
            setError('Agregá al menos un producto a la venta.');
            return;
        }

        if (carrito.some((item) =>
            !Number.isFinite(Number(item.cantidad)) ||
            Number(item.cantidad) <= 0
        )) {
            setError('Revisá las cantidades de los productos.');
            return;
        }

        if (pagos.length === 0) {
            setError('Agregá al menos un medio de pago.');
            return;
        }

        if (pagos.some((pago) =>
            !Number.isFinite(Number(pago.monto)) ||
            Number(pago.monto) <= 0
        )) {
            setError('Todos los pagos deben tener un importe mayor que cero.');
            return;
        }

        if (Math.abs(totalPagado - total) > 0.009) {
            setError(
                'La suma de los pagos debe coincidir exactamente con el total.'
            );
            return;
        }

        try {
            setGuardando(true);

            const datosVenta = {
                detalles: carrito.map((item) => ({
                    producto_id: item.id,
                    cantidad: Number(item.cantidad)
                })),
                pagos: pagos.map((pago) => ({
                    metodo_pago: pago.metodo_pago,
                    monto: Number(pago.monto)
                }))
            };

            const respuesta = await crearVenta(datosVenta);
            const ventaId = respuesta.venta?.id || respuesta.id;

            if (ventaId) {
                navigate(`/ventas/${ventaId}`);
            } else {
                navigate('/ventas');
            }
        } catch (error) {
            setError(
                error.response?.data?.message ||
                'No se pudo registrar la venta. Revisá el stock y los pagos.'
            );
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="mx-auto max-w-6xl space-y-6 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        Registrar venta
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Agregá los productos y registrá los medios de pago.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => navigate('/ventas')}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                    Volver a ventas
                </button>
            </div>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>
            )}

            <form onSubmit={registrarVenta} className="space-y-6">
                <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <h2 className="mb-4 text-lg font-semibold text-gray-800">
                        Productos
                    </h2>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_140px_auto] md:items-start">
                        <div className="flex min-w-0 flex-col">
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Seleccionar producto
                            </label>

                            <select
                                value={productoSeleccionado}
                                onChange={(evento) =>
                                    setProductoSeleccionado(evento.target.value)
                                }
                                disabled={cargandoProductos}
                                className="h-[42px] w-full rounded-lg border border-gray-300 px-3 outline-none focus:border-blue-500"
                            >
                                <option value="">
                                    {cargandoProductos
                                        ? 'Cargando productos...'
                                        : 'Seleccioná un producto'}
                                </option>

                                {productos.map((producto) => (
                                    <option
                                        key={producto.id}
                                        value={producto.id}
                                        disabled={Number(producto.stock) <= 0}
                                    >
                                        {producto.nombre} - {producto.codigo}
                                        {' | Stock: '}
                                        {producto.stock}
                                        {' | '}
                                        {formatearPrecio(producto.precio_venta)}
                                    </option>
                                ))}
                            </select>

                            <div className="mt-1 min-h-[20px] text-xs text-gray-500">
                                {productoElegido && (
                                    <>
                                        Disponible: {productoElegido.stock}
                                        {' · Precio: '}
                                        {formatearPrecio(productoElegido.precio_venta)}
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Cantidad
                            </label>

                            <input
                                type="number"
                                value={cantidad}
                                onChange={(evento) =>
                                    setCantidad(evento.target.value)
                                }
                                className="h-[42px] w-full rounded-lg border border-gray-300 px-3 outline-none focus:border-blue-500"
                            />

                            <div className="mt-1 min-h-[20px]" />
                        </div>

                        <div className="flex flex-col">
                            <span className="mb-1 block text-sm font-medium text-transparent">
                                Acción
                            </span>

                            <button
                                type="button"
                                onClick={agregarProducto}
                                disabled={cargandoProductos}
                                className="h-[42px] rounded-lg bg-blue-600 px-5 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Agregar
                            </button>

                            <div className="mt-1 min-h-[20px]" />
                        </div>
                    </div>

                    <div className="mt-6 overflow-x-auto">
                        <table className="w-full min-w-[650px] text-left text-sm">
                            <thead className="border-b bg-gray-50 text-gray-600">
                                <tr>
                                    <th className="px-3 py-3">Producto</th>
                                    <th className="px-3 py-3">Precio unitario</th>
                                    <th className="px-3 py-3">Cantidad</th>
                                    <th className="px-3 py-3">Subtotal</th>
                                    <th className="px-3 py-3">Acciones</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100">
                                {carrito.map((item) => (
                                    <tr key={item.id}>
                                        <td className="px-3 py-3">
                                            <p className="font-medium text-gray-800">
                                                {item.nombre}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Código: {item.codigo}
                                            </p>
                                        </td>

                                        <td className="whitespace-nowrap px-3 py-3">
                                            {formatearPrecio(item.precio_venta)}
                                        </td>

                                        <td className="px-3 py-3">
                                            <input
                                                type="number"
                                                value={item.cantidad}
                                                onChange={(evento) =>
                                                    cambiarCantidad(
                                                        item.id,
                                                        evento.target.value
                                                    )
                                                }
                                                className="w-28 rounded-lg border border-gray-300 px-2 py-1.5"
                                            />
                                        </td>

                                        <td className="whitespace-nowrap px-3 py-3 font-medium">
                                            {formatearPrecio(
                                                Number(item.precio_venta) *
                                                Number(item.cantidad)
                                            )}
                                        </td>

                                        <td className="px-3 py-3">
                                            <button
                                                type="button"
                                                onClick={() => quitarProducto(item.id)}
                                                className="font-medium text-red-600 hover:text-red-800"
                                            >
                                                Quitar
                                            </button>
                                        </td>
                                    </tr>
                                ))}

                                {carrito.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan="5"
                                            className="px-3 py-8 text-center text-gray-500"
                                        >
                                            Todavía no agregaste productos.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-4 flex justify-end border-t pt-4">
                        <div className="text-right">
                            <p className="text-sm text-gray-500">
                                Total de la venta
                            </p>
                            <p className="text-2xl font-bold text-gray-900">
                                {formatearPrecio(total)}
                            </p>
                        </div>
                    </div>
                </section>

                <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">
                                Medios de pago
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Podés dividir el pago entre distintos medios.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={agregarPago}
                            className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
                        >
                            Agregar medio de pago
                        </button>
                    </div>

                    <div className="space-y-4">
                        {pagos.map((pago, indice) => (
                            <div
                                key={indice}
                                className="grid grid-cols-1 items-end gap-3 rounded-lg bg-gray-50 p-4 md:grid-cols-[1fr_1fr_auto_auto]"
                            >
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                        Medio de pago
                                    </label>

                                    <select
                                        value={pago.metodo_pago}
                                        onChange={(evento) =>
                                            cambiarPago(
                                                indice,
                                                'metodo_pago',
                                                evento.target.value
                                            )
                                        }
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5"
                                    >
                                        <option value="efectivo">Efectivo</option>
                                        <option value="mercado_pago">Mercado Pago</option>
                                        <option value="transferencia">Transferencia</option>
                                        <option value="tarjeta_debito">Tarjeta de débito</option>
                                        <option value="tarjeta_credito">Tarjeta de crédito</option>
                                        <option value="otro">Otro</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                        Importe
                                    </label>

                                    <input
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        value={pago.monto}
                                        onChange={(evento) =>
                                            cambiarPago(
                                                indice,
                                                'monto',
                                                evento.target.value
                                            )
                                        }
                                        placeholder="0,00"
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5"
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={() => completarSaldo(indice)}
                                    className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    Completar saldo
                                </button>

                                <button
                                    type="button"
                                    onClick={() => quitarPago(indice)}
                                    disabled={pagos.length === 1}
                                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Quitar
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-3 rounded-lg border border-gray-200 p-4 sm:grid-cols-3">
                        <div>
                            <p className="text-sm text-gray-500">Total venta</p>
                            <p className="text-lg font-semibold text-gray-800">
                                {formatearPrecio(total)}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-gray-500">Total pagado</p>
                            <p className="text-lg font-semibold text-gray-800">
                                {formatearPrecio(totalPagado)}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-gray-500">Saldo pendiente</p>
                            <p className={`text-lg font-semibold ${
                                Math.abs(saldoPendiente) < 0.009
                                    ? 'text-green-600'
                                    : 'text-orange-600'
                            }`}>
                                {formatearPrecio(saldoPendiente)}
                            </p>
                        </div>
                    </div>
                </section>

                <div className="flex flex-wrap justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/ventas')}
                        className="rounded-lg border border-gray-300 px-5 py-3 font-medium text-gray-700 hover:bg-gray-100"
                    >
                        Cancelar
                    </button>

                    <button
                        type="submit"
                        disabled={guardando || cargandoProductos || carrito.length === 0}
                        className="rounded-lg bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {guardando ? 'Registrando venta...' : 'Confirmar venta'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default VentaForm;