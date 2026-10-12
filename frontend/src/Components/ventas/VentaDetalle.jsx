import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useVentas } from '../../Context/ContextoVentas';

function VentaDetallePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { obtenerVentaPorId, anularVenta } = useVentas();

    const [venta, setVenta] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [anulando, setAnulando] = useState(false);
    const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
    const [mensajeExito, setMensajeExito] = useState('');
    const [error, setError] = useState('');

    // Cargo el detalle de la venta seleccionada.
    useEffect(() => {
        const cargarVenta = async () => {
            try {
                setCargando(true);
                setError('');

                const respuesta = await obtenerVentaPorId(id);

                setVenta(respuesta.venta || respuesta);
            } catch (error) {
                setError(
                    error.response?.data?.message ||
                    'No se pudo cargar el detalle de la venta.'
                );
            } finally {
                setCargando(false);
            }
        };

        cargarVenta();
    }, [id]);

    const formatearPrecio = (valor) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS'
        }).format(Number(valor) || 0);
    };

    const formatearFecha = (fecha) => {
        if (!fecha) return 'Sin fecha registrada';

        return new Date(fecha).toLocaleString('es-AR', {
            dateStyle: 'short',
            timeStyle: 'short'
        });
    };

    const nombresMediosPago = {
        efectivo: 'Efectivo',
        mercado_pago: 'Mercado Pago',
        transferencia: 'Transferencia',
        tarjeta_debito: 'Tarjeta de débito',
        tarjeta_credito: 'Tarjeta de crédito',
        otro: 'Otro'
    };

    const manejarAnulacion = async () => {
        try {
            setAnulando(true);
            setError('');
            setMensajeExito('');

            await anularVenta(venta.id);

            setVenta((actual) => ({
                ...actual,
                estado: 'anulada'
            }));

            setMostrarConfirmacion(false);
            setMensajeExito(
                'La venta fue anulada correctamente y el stock fue restituido.'
            );
        } catch (error) {
            setMostrarConfirmacion(false);
            setError(
                error.response?.data?.message ||
                'No se pudo anular la venta. Intentá nuevamente.'
            );
        } finally {
            setAnulando(false);
        }
    };

    if (cargando) {
        return (
            <div className="p-6 text-center text-gray-500">
                Cargando detalle de la venta...
            </div>
        );
    }

    if (error && !venta) {
        return (
            <div className="space-y-4 p-6">
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>

                <button
                    type="button"
                    onClick={() => navigate('/ventas')}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                    Volver a ventas
                </button>
            </div>
        );
    }

    if (!venta) {
        return (
            <div className="p-6 text-center text-gray-500">
                No se encontró la venta solicitada.
            </div>
        );
    }

    const detalles = venta.detalles || venta.productos || [];
    const pagos = venta.pagos || [];
    const estaAnulada = venta.estado === 'anulada';

    return (
        <div className="mx-auto max-w-6xl space-y-6 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        Venta N.º {venta.numero_venta ?? 'Sin número'}
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        Detalle completo de la operación.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => navigate('/ventas')}
                    className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-100"
                >
                    Volver a ventas
                </button>
            </div>

            {mensajeExito && (
                <div
                    role="status"
                    className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-green-800"
                >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 font-bold">
                        ✓
                    </div>

                    <div className="min-w-0 flex-1">
                        <p className="font-semibold">
                            Operación completada
                        </p>
                        <p className="mt-1 text-sm">
                            {mensajeExito}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setMensajeExito('')}
                        className="px-1 text-xl text-green-700 hover:text-green-900"
                        aria-label="Cerrar mensaje"
                    >
                        ×
                    </button>
                </div>
            )}

            {error && (
                <div
                    role="alert"
                    className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800"
                >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 font-bold">
                        !
                    </div>

                    <div className="min-w-0 flex-1">
                        <p className="font-semibold">
                            No se pudo completar la operación
                        </p>
                        <p className="mt-1 text-sm">{error}</p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setError('')}
                        className="px-1 text-xl text-red-700 hover:text-red-900"
                        aria-label="Cerrar mensaje"
                    >
                        ×
                    </button>
                </div>
            )}

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">Número de venta</p>
                    <p className="mt-2 text-xl font-semibold text-gray-800">
                        {venta.numero_venta ?? '—'}
                    </p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">Fecha</p>
                    <p className="mt-2 font-semibold text-gray-800">
                        {formatearFecha(venta.created_at)}
                    </p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">Vendedor</p>
                    <p className="mt-2 font-semibold text-gray-800">
                        {[
                            venta.usuario_nombre,
                            venta.usuario_apellido
                        ].filter(Boolean).join(' ') || 'No disponible'}
                    </p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">Estado</p>

                    <span
                        className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                            estaAnulada
                                ? 'bg-red-100 text-red-700'
                                : 'bg-green-100 text-green-700'
                        }`}
                    >
                        {estaAnulada ? 'Anulada' : 'Completada'}
                    </span>
                </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-gray-800">
                    Productos vendidos
                </h2>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[650px] text-left text-sm">
                        <thead className="border-b bg-gray-50 text-gray-600">
                            <tr>
                                <th className="px-3 py-3">Producto</th>
                                <th className="px-3 py-3">Código</th>
                                <th className="px-3 py-3">Precio unitario</th>
                                <th className="px-3 py-3">Cantidad</th>
                                <th className="px-3 py-3">Subtotal</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100">
                            {detalles.map((detalle, indice) => {
                                const nombre =
                                    detalle.producto_nombre ||
                                    detalle.nombre ||
                                    'Producto';

                                const codigo =
                                    detalle.producto_codigo ||
                                    detalle.codigo ||
                                    '—';

                                const precio = Number(
                                    detalle.precio_unitario ??
                                    detalle.precio_venta
                                ) || 0;

                                const cantidad =
                                    Number(detalle.cantidad) || 0;

                                const subtotal =
                                    detalle.subtotal != null
                                        ? Number(detalle.subtotal)
                                        : precio * cantidad;

                                return (
                                    <tr key={detalle.id || indice}>
                                        <td className="px-3 py-3 font-medium text-gray-800">
                                            {nombre}
                                        </td>

                                        <td className="px-3 py-3 text-gray-600">
                                            {codigo}
                                        </td>

                                        <td className="px-3 py-3 whitespace-nowrap">
                                            {formatearPrecio(precio)}
                                        </td>

                                        <td className="px-3 py-3">
                                            {cantidad}
                                        </td>

                                        <td className="px-3 py-3 font-medium whitespace-nowrap">
                                            {formatearPrecio(subtotal)}
                                        </td>
                                    </tr>
                                );
                            })}

                            {detalles.length === 0 && (
                                <tr>
                                    <td
                                        colSpan="5"
                                        className="px-3 py-8 text-center text-gray-500"
                                    >
                                        No hay productos registrados en esta venta.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="mt-5 flex justify-end border-t pt-4">
                    <div className="text-right">
                        <p className="text-sm text-gray-500">
                            Total de la venta
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                            {formatearPrecio(venta.total)}
                        </p>
                    </div>
                </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-gray-800">
                    Medios de pago
                </h2>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[450px] text-left text-sm">
                        <thead className="border-b bg-gray-50 text-gray-600">
                            <tr>
                                <th className="px-3 py-3">Medio de pago</th>
                                <th className="px-3 py-3">Importe</th>
                                <th className="px-3 py-3">Fecha</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100">
                            {pagos.map((pago, indice) => (
                                <tr key={pago.id || indice}>
                                    <td className="px-3 py-3 font-medium text-gray-800">
                                        {nombresMediosPago[pago.metodo_pago] ||
                                            pago.metodo_pago}
                                    </td>

                                    <td className="px-3 py-3 font-medium whitespace-nowrap">
                                        {formatearPrecio(pago.monto)}
                                    </td>

                                    <td className="px-3 py-3 text-gray-600">
                                        {formatearFecha(pago.created_at)}
                                    </td>
                                </tr>
                            ))}

                            {pagos.length === 0 && (
                                <tr>
                                    <td
                                        colSpan="3"
                                        className="px-3 py-8 text-center text-gray-500"
                                    >
                                        No hay pagos registrados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {estaAnulada && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                    <p className="font-semibold">Venta anulada</p>
                    <p className="mt-1">
                        El stock correspondiente fue restituido.
                        La anulación no implica una devolución automática del dinero.
                    </p>
                </div>
            )}

            <div className="flex flex-wrap justify-end gap-3">
                {!estaAnulada && (
                    <button
                        type="button"
                        onClick={() => {
                            setError('');
                            setMostrarConfirmacion(true);
                        }}
                        disabled={anulando}
                        className="rounded-lg bg-red-600 px-5 py-3 font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Anular venta
                    </button>
                )}

                <button
                    type="button"
                    onClick={() => navigate('/ventas')}
                    className="rounded-lg bg-gray-800 px-5 py-3 font-medium text-white hover:bg-gray-900"
                >
                    Volver al historial
                </button>
            </div>

            {mostrarConfirmacion && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onMouseDown={(evento) => {
                        if (
                            evento.target === evento.currentTarget &&
                            !anulando
                        ) {
                            setMostrarConfirmacion(false);
                        }
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="titulo-confirmacion"
                        aria-describedby="descripcion-confirmacion"
                        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
                    >
                        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                            <span className="text-2xl font-bold">!</span>
                        </div>

                        <h2
                            id="titulo-confirmacion"
                            className="text-xl font-bold text-gray-900"
                        >
                            ¿Anular esta venta?
                        </h2>

                        <p
                            id="descripcion-confirmacion"
                            className="mt-3 text-sm leading-6 text-gray-600"
                        >
                            Estás por anular la venta N.º{' '}
                            <span className="font-semibold text-gray-800">
                                {venta.numero_venta ?? '—'}
                            </span>
                            . Esta operación cambiará su estado y restituirá
                            las cantidades vendidas al stock.
                        </p>

                        <div className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                            Esta acción no realiza una devolución automática
                            del dinero al cliente.
                        </div>

                        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={() => setMostrarConfirmacion(false)}
                                disabled={anulando}
                                className="rounded-lg border border-gray-300 px-4 py-2.5 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancelar
                            </button>

                            <button
                                type="button"
                                onClick={manejarAnulacion}
                                disabled={anulando}
                                className="rounded-lg bg-red-600 px-4 py-2.5 font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {anulando
                                    ? 'Anulando venta...'
                                    : 'Confirmar anulación'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default VentaDetallePage;