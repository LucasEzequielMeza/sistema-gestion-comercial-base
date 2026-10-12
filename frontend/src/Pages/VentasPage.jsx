import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVentas } from '../Context/ContextoVentas';

function VentasPage() {
    const {
        ventas,
        cargando,
        error,
        obtenerVentas,
        anularVenta
    } = useVentas();

    const navigate = useNavigate();

    const [filtros, setFiltros] = useState({
        desde: '',
        hasta: '',
        metodo_pago: ''
    });

    const [procesando, setProcesando] = useState(null);

    useEffect(() => {
        obtenerVentas().catch(() => {});
    }, []);

    const manejarCambio = async (e) => {
        const { name, value } = e.target;

        const nuevosFiltros = {
            ...filtros,
            [name]: value
        };

        // Si cambio la fecha inicial y queda después de la final, limpio la final.
        if (
            name === 'desde' &&
            nuevosFiltros.hasta &&
            value > nuevosFiltros.hasta
        ) {
            nuevosFiltros.hasta = '';
        }

        setFiltros(nuevosFiltros);

        try {
            await obtenerVentas(nuevosFiltros);
        } catch {
            // El contexto se encarga de guardar el error.
        }
    };

    const limpiarFiltros = async () => {
        const filtrosVacios = {
            desde: '',
            hasta: '',
            metodo_pago: ''
        };

        setFiltros(filtrosVacios);

        try {
            await obtenerVentas();
        } catch {
            // El contexto se encarga de guardar el error.
        }
    };

    const manejarAnulacion = async (venta) => {
        const confirmar = window.confirm(
            `¿Querés anular la venta N.º ${venta.numero_venta}? Se devolverán los productos al stock.`
        );

        if (!confirmar) return;

        try {
            setProcesando(venta.id);
            await anularVenta(venta.id);
        } catch {
            // El contexto se encarga de guardar el error.
        } finally {
            setProcesando(null);
        }
    };

    const formatoPrecio = (importe) => {
        return Number(importe).toLocaleString('es-AR', {
            style: 'currency',
            currency: 'ARS'
        });
    };

    const formatoFecha = (fecha) => {
        return new Date(fecha).toLocaleString('es-AR', {
            dateStyle: 'short',
            timeStyle: 'short'
        });
    };

    const nombreMetodoPago = (metodo) => {
        const nombres = {
            efectivo: 'Efectivo',
            mercado_pago: 'Mercado Pago',
            transferencia: 'Transferencia',
            tarjeta_debito: 'Tarjeta de débito',
            tarjeta_credito: 'Tarjeta de crédito',
            otro: 'Otro'
        };

        return nombres[metodo] || metodo;
    };

    return (
        <div className="min-h-screen bg-stone-50 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-6">

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-stone-800">
                            Ventas
                        </h1>
                        <p className="mt-1 text-sm text-stone-500">
                            Historial y control de las ventas realizadas.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => navigate('/ventas/nueva')}
                        className="rounded-xl bg-stone-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-700"
                    >
                        Nueva venta
                    </button>
                </div>

                <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <h2 className="font-semibold text-stone-800">
                            Filtrar ventas
                        </h2>

                        <button
                            type="button"
                            onClick={limpiarFiltros}
                            disabled={cargando}
                            className="rounded-xl border border-stone-300 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 disabled:opacity-50"
                        >
                            Limpiar filtros
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-stone-600">
                                Desde
                            </label>
                            <input
                                type="date"
                                name="desde"
                                value={filtros.desde}
                                onChange={manejarCambio}
                                max={filtros.hasta || undefined}
                                disabled={cargando}
                                className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-stone-500 disabled:bg-stone-100"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-stone-600">
                                Hasta
                            </label>
                            <input
                                type="date"
                                name="hasta"
                                value={filtros.hasta}
                                onChange={manejarCambio}
                                min={filtros.desde || undefined}
                                disabled={cargando}
                                className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-stone-500 disabled:bg-stone-100"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-stone-600">
                                Medio de pago
                            </label>
                            <select
                                name="metodo_pago"
                                value={filtros.metodo_pago}
                                onChange={manejarCambio}
                                disabled={cargando}
                                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-stone-500 disabled:bg-stone-100"
                            >
                                <option value="">Todos</option>
                                <option value="efectivo">Efectivo</option>
                                <option value="mercado_pago">Mercado Pago</option>
                                <option value="transferencia">Transferencia</option>
                                <option value="tarjeta_debito">Tarjeta de débito</option>
                                <option value="tarjeta_credito">Tarjeta de crédito</option>
                                <option value="otro">Otro</option>
                            </select>
                        </div>
                    </div>

                    <p className="mt-3 text-xs text-stone-500">
                        Los resultados se actualizan automáticamente al cambiar los filtros.
                    </p>
                </div>

                {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
                        <h2 className="font-semibold text-stone-800">
                            Historial
                        </h2>
                        <span className="text-sm text-stone-500">
                            {ventas.length} ventas
                        </span>
                    </div>

                    {cargando ? (
                        <p className="p-8 text-center text-sm text-stone-500">
                            Cargando ventas...
                        </p>
                    ) : ventas.length === 0 ? (
                        <p className="p-8 text-center text-sm text-stone-500">
                            No se encontraron ventas.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[850px] text-left text-sm">
                                <thead className="bg-stone-50 text-stone-500">
                                    <tr>
                                        <th className="px-5 py-3 font-medium">N.º</th>
                                        <th className="px-5 py-3 font-medium">Fecha</th>
                                        <th className="px-5 py-3 font-medium">Vendedor</th>
                                        <th className="px-5 py-3 font-medium">Medios de pago</th>
                                        <th className="px-5 py-3 font-medium">Total</th>
                                        <th className="px-5 py-3 font-medium">Estado</th>
                                        <th className="px-5 py-3 text-right font-medium">Acciones</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-stone-100">
                                    {ventas.map((venta) => (
                                        <tr key={venta.id} className="hover:bg-stone-50">
                                            <td className="px-5 py-4 font-semibold text-stone-800">
                                                {venta.numero_venta}
                                            </td>

                                            <td className="whitespace-nowrap px-5 py-4 text-stone-600">
                                                {formatoFecha(venta.created_at)}
                                            </td>

                                            <td className="px-5 py-4 text-stone-600">
                                                {venta.usuario_nombre
                                                    ? `${venta.usuario_nombre} ${venta.usuario_apellido || ''}`
                                                    : 'Sin datos'}
                                            </td>

                                            <td className="px-5 py-4 text-stone-600">
                                                <div className="flex flex-wrap gap-1">
                                                    {(venta.pagos || []).map((pago, indice) => (
                                                        <span
                                                            key={`${pago.metodo_pago}-${indice}`}
                                                            className="rounded-lg bg-stone-100 px-2 py-1 text-xs"
                                                        >
                                                            {nombreMetodoPago(pago.metodo_pago)}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>

                                            <td className="whitespace-nowrap px-5 py-4 font-semibold text-stone-800">
                                                {formatoPrecio(venta.total)}
                                            </td>

                                            <td className="px-5 py-4">
                                                <span
                                                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                                                        venta.estado === 'anulada'
                                                            ? 'bg-red-100 text-red-700'
                                                            : 'bg-emerald-100 text-emerald-700'
                                                    }`}
                                                >
                                                    {venta.estado === 'anulada' ? 'Anulada' : 'Completada'}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/ventas/${venta.id}`)}
                                                        className="rounded-lg border border-stone-300 px-3 py-2 text-xs font-medium text-stone-700 hover:bg-stone-100"
                                                    >
                                                        Ver detalle
                                                    </button>

                                                    {venta.estado === 'completada' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => manejarAnulacion(venta)}
                                                            disabled={procesando === venta.id}
                                                            className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                                                        >
                                                            {procesando === venta.id ? 'Anulando...' : 'Anular'}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default VentasPage;