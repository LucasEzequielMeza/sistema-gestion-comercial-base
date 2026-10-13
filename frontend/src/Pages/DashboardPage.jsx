import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from '../Api/axios'
import {
    FaBoxOpen,
    FaCashRegister,
    FaShoppingCart,
    FaExclamationTriangle,
    FaArrowRight,
    FaSyncAlt,
    FaPlus,
    FaClipboardList,
    FaArrowDown,
    FaArrowUp,
    FaSlidersH
} from 'react-icons/fa'

const formatoPrecio = (valor) => {
    return Number(valor || 0).toLocaleString('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })
}

const formatoFecha = (fecha) => {
    if (!fecha) return 'Sin fecha'

    const valor = new Date(fecha)

    return Number.isNaN(valor.getTime())
        ? 'Sin fecha'
        : valor.toLocaleString('es-AR', {
            dateStyle: 'short',
            timeStyle: 'short'
        })
}

const esActivo = (producto) => {
    return producto.activo === true ||
        producto.activo === 'true' ||
        producto.activo === 1 ||
        producto.activo === '1'
}

const esDeHoy = (fecha) => {
    if (!fecha) return false

    const valor = new Date(fecha)
    const hoy = new Date()

    return !Number.isNaN(valor.getTime()) &&
        valor.getFullYear() === hoy.getFullYear() &&
        valor.getMonth() === hoy.getMonth() &&
        valor.getDate() === hoy.getDate()
}

function DashboardPage() {
    const [productos, setProductos] = useState([])
    const [ventas, setVentas] = useState([])
    const [compras, setCompras] = useState([])
    const [movimientos, setMovimientos] = useState([])
    const [cargando, setCargando] = useState(true)
    const [actualizando, setActualizando] = useState(false)
    const [errores, setErrores] = useState([])

    const cargarDashboard = useCallback(async (mostrarCarga = true) => {
        if (mostrarCarga) {
            setCargando(true)
        } else {
            setActualizando(true)
        }

        const solicitudes = await Promise.allSettled([
            axios.get('/productos'),
            axios.get('/ventas'),
            axios.get('/compras'),
            axios.get('/movimientos-stock')
        ])

        const mensajesError = []

        const leerLista = (indice, nombre, setter) => {
            const resultado = solicitudes[indice]

            if (resultado.status === 'rejected') {
                setter([])
                mensajesError.push(
                    resultado.reason?.response?.data?.message ||
                    `No se pudo cargar la información de ${nombre}.`
                )
                return
            }

            const datos = resultado.value.data
            const lista = Array.isArray(datos)
                ? datos
                : Array.isArray(datos?.[nombre])
                    ? datos[nombre]
                    : []

            setter(lista)
        }

        leerLista(0, 'productos', setProductos)
        leerLista(1, 'ventas', setVentas)
        leerLista(2, 'compras', setCompras)
        leerLista(3, 'movimientos', setMovimientos)

        setErrores(mensajesError)
        setCargando(false)
        setActualizando(false)
    }, [])

    useEffect(() => {
        cargarDashboard()
    }, [cargarDashboard])

    const productosActivos = productos.filter(esActivo)

    const productosConStockBajo = productosActivos.filter((producto) => {
        return Number(producto.stock || 0) <=
            Number(producto.stock_minimo || 0)
    })

    const ventasDeHoy = ventas.filter((venta) => {
        return venta.estado === 'completada' && esDeHoy(venta.created_at)
    })

    const totalVendidoHoy = ventasDeHoy.reduce(
        (total, venta) => total + Number(venta.total || 0),
        0
    )

    const comprasPendientes = compras.filter(
        (compra) => compra.estado === 'pendiente'
    ).length

    const ultimasVentas = [...ventas]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5)

    const ultimasCompras = [...compras]
        .sort((a, b) => {
            const fechaA = a.fecha || a.created_at
            const fechaB = b.fecha || b.created_at
            return new Date(fechaB) - new Date(fechaA)
        })
        .slice(0, 4)

    const ultimosMovimientos = [...movimientos]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5)

    const tarjetas = [
        {
            titulo: 'Productos activos',
            valor: productosActivos.length,
            descripcion: 'Disponibles en el catálogo',
            icono: FaBoxOpen,
            estilo: 'bg-stone-100 text-stone-700',
            ruta: '/productos'
        },
        {
            titulo: 'Ventas de hoy',
            valor: formatoPrecio(totalVendidoHoy),
            descripcion: `${ventasDeHoy.length} ventas completadas`,
            icono: FaCashRegister,
            estilo: 'bg-emerald-50 text-emerald-700',
            ruta: '/ventas'
        },
        {
            titulo: 'Stock bajo',
            valor: productosConStockBajo.length,
            descripcion: 'Productos que requieren revisión',
            icono: FaExclamationTriangle,
            estilo: 'bg-amber-50 text-amber-700',
            ruta: '/stock'
        },
        {
            titulo: 'Compras pendientes',
            valor: comprasPendientes,
            descripcion: 'Pendientes de confirmación',
            icono: FaShoppingCart,
            estilo: 'bg-blue-50 text-blue-700',
            ruta: '/compras'
        }
    ]

    const estiloEstadoCompra = (estado) => {
        if (estado === 'confirmada') {
            return 'bg-emerald-50 text-emerald-700'
        }

        if (estado === 'cancelada') {
            return 'bg-red-50 text-red-700'
        }

        return 'bg-amber-50 text-amber-700'
    }

    const estiloMovimiento = (tipo) => {
        if (tipo === 'entrada') {
            return 'bg-emerald-50 text-emerald-700'
        }

        if (tipo === 'salida') {
            return 'bg-red-50 text-red-700'
        }

        return 'bg-amber-50 text-amber-700'
    }

    const iconoMovimiento = (tipo) => {
        if (tipo === 'entrada') return <FaArrowDown />
        if (tipo === 'salida') return <FaArrowUp />
        return <FaSlidersH />
    }

    if (cargando) {
        return (
            <div className="min-h-screen bg-[#F5F5F4] p-4 sm:p-6 lg:p-8">
                <div className="mx-auto max-w-7xl animate-pulse space-y-6">
                    <div className="h-8 w-56 rounded-lg bg-stone-200" />
                    <div className="h-4 w-80 max-w-full rounded bg-stone-200" />

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {[1, 2, 3, 4].map((item) => (
                            <div
                                key={item}
                                className="h-36 rounded-2xl border border-stone-200 bg-white"
                            />
                        ))}
                    </div>

                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                        <div className="h-80 rounded-2xl bg-white" />
                        <div className="h-80 rounded-2xl bg-white" />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#F5F5F4] p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-7">

                {/* Encabezado */}
                <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm font-medium text-stone-500">
                            Resumen general
                        </p>

                        <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
                            Panel de control
                        </h1>

                        <p className="mt-2 text-sm text-stone-600 sm:text-base">
                            Consultá el estado del comercio y la actividad reciente.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => cargarDashboard(false)}
                        disabled={actualizando}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50 disabled:opacity-60"
                    >
                        <FaSyncAlt className={actualizando ? 'animate-spin' : ''} />
                        {actualizando ? 'Actualizando...' : 'Actualizar datos'}
                    </button>
                </header>

                {errores.length > 0 && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                        <p className="font-semibold">
                            Algunos datos no se pudieron cargar.
                        </p>
                        <p className="mt-1">
                            Revisá la conexión con el servidor y volvé a actualizar el panel.
                        </p>
                    </div>
                )}

                {/* Tarjetas de resumen */}
                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {tarjetas.map((tarjeta) => {
                        const Icono = tarjeta.icono

                        return (
                            <Link
                                key={tarjeta.titulo}
                                to={tarjeta.ruta}
                                className="group rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-md"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-stone-500">
                                            {tarjeta.titulo}
                                        </p>

                                        <p className="mt-3 break-words text-2xl font-bold tracking-tight text-stone-900">
                                            {tarjeta.valor}
                                        </p>
                                    </div>

                                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${tarjeta.estilo}`}>
                                        <Icono className="text-xl" />
                                    </div>
                                </div>

                                <p className="mt-3 text-xs leading-5 text-stone-500">
                                    {tarjeta.descripcion}
                                </p>

                                <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-stone-700 group-hover:text-stone-950">
                                    Ver módulo <FaArrowRight />
                                </span>
                            </Link>
                        )
                    })}
                </section>

                {/* Accesos rápidos */}
                <section>
                    <div className="mb-4">
                        <h2 className="text-lg font-bold text-stone-900">
                            Accesos rápidos
                        </h2>
                        <p className="mt-1 text-sm text-stone-500">
                            Ingresá directamente a las tareas más habituales.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <Link
                            to="/productos/nuevo"
                            className="flex items-center gap-3 rounded-xl bg-[#171412] p-4 text-white transition hover:bg-[#292421]"
                        >
                            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                                <FaPlus />
                            </span>
                            <span>
                                <span className="block text-sm font-semibold">Nuevo producto</span>
                                <span className="mt-1 block text-xs text-stone-300">Agregar al catálogo</span>
                            </span>
                        </Link>

                        <Link
                            to="/ventas/nueva"
                            className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-4 transition hover:bg-stone-50"
                        >
                            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                                <FaCashRegister />
                            </span>
                            <span>
                                <span className="block text-sm font-semibold text-stone-900">Registrar venta</span>
                                <span className="mt-1 block text-xs text-stone-500">Cargar una operación</span>
                            </span>
                        </Link>

                        <Link
                            to="/compras/crear"
                            className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-4 transition hover:bg-stone-50"
                        >
                            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                                <FaShoppingCart />
                            </span>
                            <span>
                                <span className="block text-sm font-semibold text-stone-900">Registrar compra</span>
                                <span className="mt-1 block text-xs text-stone-500">Cargar mercadería</span>
                            </span>
                        </Link>

                        <Link
                            to="/stock/movimientos"
                            className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-4 transition hover:bg-stone-50"
                        >
                            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                                <FaClipboardList />
                            </span>
                            <span>
                                <span className="block text-sm font-semibold text-stone-900">Movimientos de stock</span>
                                <span className="mt-1 block text-xs text-stone-500">Consultar el historial</span>
                            </span>
                        </Link>
                    </div>
                </section>

                {/* Ventas y alertas */}
                <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between gap-3 border-b border-stone-100 px-5 py-4">
                            <div>
                                <h2 className="font-bold text-stone-900">Últimas ventas</h2>
                                <p className="mt-1 text-xs text-stone-500">Actividad comercial reciente</p>
                            </div>
                            <Link to="/ventas" className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-stone-700 hover:text-stone-950">
                                Ver todas <FaArrowRight />
                            </Link>
                        </div>

                        {ultimasVentas.length === 0 ? (
                            <div className="px-5 py-10 text-center text-sm text-stone-500">
                                Todavía no hay ventas registradas.
                            </div>
                        ) : (
                            <div className="divide-y divide-stone-100">
                                {ultimasVentas.map((venta) => (
                                    <Link
                                        key={venta.id}
                                        to={`/ventas/${venta.id}`}
                                        className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-stone-50"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-stone-900">
                                                Venta N.º {venta.numero_venta ?? '—'}
                                            </p>
                                            <p className="mt-1 text-xs text-stone-500">
                                                {formatoFecha(venta.created_at)}
                                            </p>
                                        </div>

                                        <div className="shrink-0 text-right">
                                            <p className="text-sm font-bold text-stone-900">
                                                {formatoPrecio(venta.total)}
                                            </p>
                                            <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${venta.estado === 'anulada' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                                {venta.estado === 'anulada' ? 'Anulada' : 'Completada'}
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between gap-3 border-b border-stone-100 px-5 py-4">
                            <div>
                                <h2 className="font-bold text-stone-900">Productos con stock bajo</h2>
                                <p className="mt-1 text-xs text-stone-500">Productos que llegaron al mínimo</p>
                            </div>
                            <Link to="/stock" className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-stone-700 hover:text-stone-950">
                                Ver stock <FaArrowRight />
                            </Link>
                        </div>

                        {productosConStockBajo.length === 0 ? (
                            <div className="px-5 py-10 text-center text-sm text-stone-500">
                                No hay alertas de stock por el momento.
                            </div>
                        ) : (
                            <div className="divide-y divide-stone-100">
                                {productosConStockBajo.slice(0, 5).map((producto) => (
                                    <div key={producto.id} className="flex items-center justify-between gap-4 px-5 py-4">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-stone-900">
                                                {producto.nombre}
                                            </p>
                                            <p className="mt-1 text-xs text-stone-500">
                                                Código: {producto.codigo || 'Sin código'}
                                            </p>
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <p className="text-sm font-bold text-amber-700">
                                                {Number(producto.stock || 0).toLocaleString('es-AR')}
                                            </p>
                                            <p className="mt-1 text-xs text-stone-500">
                                                Mínimo: {Number(producto.stock_minimo || 0).toLocaleString('es-AR')}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Compras recientes */}
                    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between gap-3 border-b border-stone-100 px-5 py-4">
                            <div>
                                <h2 className="font-bold text-stone-900">Compras recientes</h2>
                                <p className="mt-1 text-xs text-stone-500">Últimos registros de proveedores</p>
                            </div>
                            <Link to="/compras" className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-stone-700 hover:text-stone-950">
                                Ver todas <FaArrowRight />
                            </Link>
                        </div>

                        {ultimasCompras.length === 0 ? (
                            <div className="px-5 py-10 text-center text-sm text-stone-500">
                                Todavía no hay compras registradas.
                            </div>
                        ) : (
                            <div className="divide-y divide-stone-100">
                                {ultimasCompras.map((compra) => (
                                    <div key={compra.id} className="flex items-center justify-between gap-4 px-5 py-4">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-stone-900">
                                                {compra.proveedor_nombre || 'Proveedor'}
                                            </p>
                                            <p className="mt-1 text-xs text-stone-500">
                                                {formatoFecha(compra.fecha || compra.created_at)}
                                            </p>
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <p className="text-sm font-bold text-stone-900">
                                                {formatoPrecio(compra.total)}
                                            </p>
                                            <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${estiloEstadoCompra(compra.estado)}`}>
                                                {compra.estado === 'confirmada' ? 'Confirmada' : compra.estado === 'cancelada' ? 'Cancelada' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Movimientos recientes */}
                    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between gap-3 border-b border-stone-100 px-5 py-4">
                            <div>
                                <h2 className="font-bold text-stone-900">Últimos movimientos</h2>
                                <p className="mt-1 text-xs text-stone-500">Actividad del inventario</p>
                            </div>
                            <Link to="/stock/movimientos" className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-stone-700 hover:text-stone-950">
                                Ver historial <FaArrowRight />
                            </Link>
                        </div>

                        {ultimosMovimientos.length === 0 ? (
                            <div className="px-5 py-10 text-center text-sm text-stone-500">
                                Todavía no hay movimientos registrados.
                            </div>
                        ) : (
                            <div className="divide-y divide-stone-100">
                                {ultimosMovimientos.map((movimiento) => (
                                    <div key={movimiento.id} className="flex items-center gap-3 px-5 py-4">
                                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${estiloMovimiento(movimiento.tipo)}`}>
                                            {iconoMovimiento(movimiento.tipo)}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-stone-900">
                                                {movimiento.producto_nombre}
                                            </p>
                                            <p className="mt-1 truncate text-xs text-stone-500">
                                                {movimiento.motivo || 'Movimiento de stock'} · {formatoFecha(movimiento.created_at)}
                                            </p>
                                        </div>
                                        <span className="shrink-0 text-sm font-semibold text-stone-700">
                                            {movimiento.tipo === 'entrada' ? '+' : movimiento.tipo === 'salida' ? '−' : ''}
                                            {Number(movimiento.cantidad || 0).toLocaleString('es-AR')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                <footer className="border-t border-stone-200 pt-4 text-xs text-stone-500">
                    Los importes y cantidades se calculan a partir de los registros disponibles en el sistema.
                </footer>
            </div>
        </div>
    )
}

export default DashboardPage