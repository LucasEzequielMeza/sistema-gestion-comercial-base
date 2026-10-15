import { useCallback, useEffect, useState } from 'react'
import {
    FaChartBar,
    FaShoppingCart,
    FaCashRegister,
    FaBoxes,
    FaFilePdf
} from 'react-icons/fa'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import axios from '../Api/axios'

const tiposInforme = [
    { id: 'ventas', nombre: 'Ventas', descripcion: 'Consultar ventas realizadas y anuladas.', icono: FaShoppingCart },
    { id: 'compras', nombre: 'Compras', descripcion: 'Consultar compras y productos ingresados.', icono: FaBoxes },
    { id: 'caja', nombre: 'Caja y cobranzas', descripcion: 'Revisar cobros y medios de pago.', icono: FaCashRegister },
    { id: 'stock', nombre: 'Movimientos de stock', descripcion: 'Consultar ingresos, egresos y ajustes.', icono: FaChartBar },
]

const metodosPago = [
    { id: 'efectivo', nombre: 'Efectivo' },
    { id: 'mercado_pago', nombre: 'Mercado Pago' },
    { id: 'transferencia', nombre: 'Transferencia' },
    { id: 'tarjeta_debito', nombre: 'Tarjeta de débito' },
    { id: 'tarjeta_credito', nombre: 'Tarjeta de crédito' },
    { id: 'otro', nombre: 'Otro' }
]

const formatoMoneda = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS'
})

const formatearMoneda = importe => formatoMoneda.format(Number(importe) || 0)

const formatearFecha = fecha => {
    if (!fecha) return '-'

    const fechaConvertida = new Date(fecha)

    if (Number.isNaN(fechaConvertida.getTime())) return '-'

    return fechaConvertida.toLocaleString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

const nombreEstado = estado => {
    const estados = {
        completada: 'Completada',
        anulada: 'Anulada',
        pendiente: 'Pendiente',
        confirmada: 'Confirmada',
        cancelada: 'Cancelada'
    }

    return estados[estado] || estado || '-'
}

const nombreMetodoPago = metodo => {
    const encontrado = metodosPago.find(item => item.id === metodo)
    return encontrado?.nombre || metodo || '-'
}

const nombreComprobante = compra => {
    return [compra.tipo_comprobante, compra.numero_comprobante]
        .filter(Boolean)
        .join(' ') || '-'
}

const nombreTipoMovimiento = tipo => {
    const tipos = {
        entrada: 'Entrada',
        salida: 'Salida',
        ajuste: 'Ajuste'
    }

    return tipos[tipo] || tipo || '-'
}

const sumarImportes = lista => Math.round(
    lista.reduce(
        (total, registro) => total + Number(registro.total || registro.monto || 0),
        0
    ) * 100
) / 100

const nombreUsuario = registro =>
    `${registro.usuario_nombre || ''} ${registro.usuario_apellido || ''}`.trim() || '-'

function InformesPage() {
    const [tipoInforme, setTipoInforme] = useState('ventas')
    const [desde, setDesde] = useState('')
    const [hasta, setHasta] = useState('')
    const [estado, setEstado] = useState('')
    const [usuarioId, setUsuarioId] = useState('')
    const [proveedorId, setProveedorId] = useState('')
    const [metodoPago, setMetodoPago] = useState('')
    const [tipoMovimiento, setTipoMovimiento] = useState('')
    const [productoId, setProductoId] = useState('')
    const [informe, setInforme] = useState(null)
    const [vendedores, setVendedores] = useState([])
    const [proveedores, setProveedores] = useState([])
    const [productos, setProductos] = useState([])
    const [cargando, setCargando] = useState(false)
    const [error, setError] = useState('')
    const [mensaje, setMensaje] = useState('')

    const consultarInforme = useCallback(async (filtros = {}, tipo = 'ventas') => {
        if (!['ventas', 'compras', 'caja', 'stock'].includes(tipo)) {
            setInforme(null)
            setMensaje('Este tipo de informe todavía no está implementado.')
            setError('')
            return
        }

        setCargando(true)
        setError('')
        setMensaje('')

        try {
            let respuesta

            if (tipo === 'stock') {
                respuesta = await axios.get('/stock/informe', {
                    params: {
                        desde: filtros.desde || undefined,
                        hasta: filtros.hasta || undefined,
                        tipo: filtros.tipoMovimiento || undefined,
                        producto_id: filtros.productoId || undefined,
                        usuario_id: filtros.usuarioId || undefined
                    }
                })

                setInforme(respuesta.data)
                setProductos(productosActuales => productosActuales)
            } else {
                const tipoConsulta = tipo === 'caja' ? 'ventas' : tipo

                respuesta = await axios.get(`/${tipoConsulta}/informe`, {
                    params: {
                        desde: filtros.desde || undefined,
                        hasta: filtros.hasta || undefined,
                        estado: tipo === 'caja' ? undefined : filtros.estado || undefined,
                        usuario_id: ['ventas', 'caja'].includes(tipo)
                            ? filtros.usuarioId || undefined
                            : undefined,
                        proveedor_id: tipo === 'compras'
                            ? filtros.proveedorId || undefined
                            : undefined
                    }
                })

                setInforme(respuesta.data)

                if (tipo === 'ventas' || tipo === 'caja') {
                    setVendedores(respuesta.data.vendedores || [])
                }

                if (tipo === 'compras') {
                    setProveedores(respuesta.data.proveedores || [])
                }
            }
        } catch (errorConsulta) {
            setInforme(null)
            setError(
                errorConsulta.response?.data?.message ||
                `No se pudo obtener el informe de ${tipo}.`
            )
        } finally {
            setCargando(false)
        }
    }, [])

    useEffect(() => {
        consultarInforme({}, 'ventas')
    }, [consultarInforme])

    // Cargo los productos para poder filtrar el informe de stock.
    useEffect(() => {
        const cargarProductos = async () => {
            try {
                const respuesta = await axios.get('/productos')
                const lista = Array.isArray(respuesta.data)
                    ? respuesta.data
                    : respuesta.data?.productos || []

                setProductos(lista)
            } catch (errorProductos) {
                console.error('Error al cargar los productos para el informe:', errorProductos)
            }
        }

        cargarProductos()
    }, [])

    const generarInforme = async event => {
        event.preventDefault()

        if (desde && hasta && desde > hasta) {
            setError('La fecha inicial no puede ser posterior a la fecha final.')
            return
        }

        await consultarInforme({
            desde,
            hasta,
            estado,
            usuarioId,
            proveedorId,
            tipoMovimiento,
            productoId
        }, tipoInforme)
    }

    const limpiarFiltros = async () => {
        setDesde('')
        setHasta('')
        setEstado('')
        setUsuarioId('')
        setProveedorId('')
        setMetodoPago('')
        setTipoMovimiento('')
        setProductoId('')
        setError('')
        setMensaje('')

        await consultarInforme({}, tipoInforme)
    }

    const seleccionarTipoInforme = tipo => {
        setTipoInforme(tipo)
        setInforme(null)
        setEstado('')
        setUsuarioId('')
        setProveedorId('')
        setMetodoPago('')
        setTipoMovimiento('')
        setProductoId('')
        setError('')
        setMensaje('')
    }

    const esCompra = tipoInforme === 'compras'
    const esCaja = tipoInforme === 'caja'
    const esVenta = tipoInforme === 'ventas'
    const esStock = tipoInforme === 'stock'
    const tipoDisponible = ['ventas', 'compras', 'caja', 'stock'].includes(tipoInforme)

    const resumen = informe?.resumen
    const movimientosStock = esStock && Array.isArray(informe?.movimientos)
        ? informe.movimientos
        : []

    const registrosOriginales = esCompra
        ? informe?.compras
        : informe?.ventas

    const registrosBase = Array.isArray(registrosOriginales)
        ? registrosOriginales
        : []

    const registros = esCaja
        ? registrosBase
            .filter(venta => venta.estado === 'completada')
            .map(venta => ({
                ...venta,
                pagos: (venta.pagos || []).filter(pago =>
                    !metodoPago || pago.metodo_pago === metodoPago
                )
            }))
            .filter(venta => venta.pagos.length > 0)
        : registrosBase

    const pagosCaja = esCaja
        ? registros.flatMap(venta =>
            (venta.pagos || []).map((pago, indice) => ({
                ...pago,
                numero_venta: venta.numero_venta,
                venta_id: venta.id,
                fecha: pago.created_at || pago.fecha || venta.created_at,
                vendedor: nombreUsuario(venta),
                clave: `${venta.id}-${pago.id || indice}`
            }))
        )
        : []

    const totalRecaudado = sumarImportes(
        pagosCaja.map(pago => ({ monto: pago.monto }))
    )

    const totalesPorMetodo = metodosPago.map(metodo => {
        const pagosMetodo = pagosCaja.filter(
            pago => pago.metodo_pago === metodo.id
        )

        return {
            ...metodo,
            total: sumarImportes(pagosMetodo.map(pago => ({ monto: pago.monto }))),
            cantidad: pagosMetodo.length
        }
    })

    const descargarPDF = () => {
        if (!informe) {
            setError('Primero tenés que consultar el informe.')
            return
        }

        if (!tipoDisponible) {
            setError('Este informe todavía no está disponible para descargar.')
            return
        }

        try {
            const documento = new jsPDF()
            const fechaGeneracion = new Date().toLocaleString('es-AR')
            const nombreInforme = esCompra
                ? 'compras'
                : esCaja
                    ? 'caja-y-cobranzas'
                    : esStock
                        ? 'movimientos-de-stock'
                        : 'ventas'

            const anchoPagina = documento.internal.pageSize.getWidth()
            const altoPagina = documento.internal.pageSize.getHeight()
            const margen = 14
            const limiteInferior = altoPagina - 14

            let posicionY = 18

            const asegurarEspacio = (y, espacioNecesario = 20) => {
                if (y + espacioNecesario > limiteInferior) {
                    documento.addPage()
                    return 18
                }

                return y
            }

            const escribirTexto = (texto, x, y, anchoMaximo = anchoPagina - margen * 2) => {
                const lineas = documento.splitTextToSize(String(texto || '-'), anchoMaximo)
                documento.text(lineas, x, y)
                return y + lineas.length * 4.5
            }

            const agregarTabla = (opciones, espacioNecesario = 20) => {
                const inicio = asegurarEspacio(opciones.startY, espacioNecesario)

                autoTable(documento, {
                    ...opciones,
                    startY: inicio,
                    margin: {
                        left: margen,
                        right: margen,
                        bottom: 14,
                        ...(opciones.margin || {})
                    },
                    styles: {
                        fontSize: 8,
                        cellPadding: 2.5,
                        overflow: 'linebreak',
                        ...(opciones.styles || {})
                    },
                    headStyles: {
                        fillColor: [41, 37, 36],
                        ...(opciones.headStyles || {})
                    },
                    theme: opciones.theme || 'grid'
                })

                return documento.lastAutoTable.finalY + 7
            }

            documento.setFontSize(18)
            documento.setFont('helvetica', 'bold')

            documento.text(
                esStock
                    ? 'Informe de movimientos de stock'
                    : esCaja
                        ? 'Informe de Caja y cobranzas'
                        : `Informe de ${esCompra ? 'compras' : 'ventas'}`,
                margen,
                posicionY
            )

            posicionY += 8
            documento.setFontSize(9)
            documento.setFont('helvetica', 'normal')

            posicionY = escribirTexto(`Generado el: ${fechaGeneracion}`, margen, posicionY)
            posicionY = escribirTexto(
                `Desde: ${desde || 'Sin límite'}   Hasta: ${hasta || 'Sin límite'}`,
                margen,
                posicionY + 1
            )

            if (esStock) {
                const productoSeleccionado = productos.find(
                    producto => producto.id === productoId
                )
                const usuarioSeleccionado = vendedores.find(
                    vendedor => vendedor.id === usuarioId
                )

                posicionY = escribirTexto(
                    `Tipo: ${tipoMovimiento ? nombreTipoMovimiento(tipoMovimiento) : 'Todos'}   Producto: ${productoSeleccionado?.nombre || 'Todos'}`,
                    margen,
                    posicionY + 1
                )

                posicionY = escribirTexto(
                    `Usuario: ${usuarioSeleccionado ? `${usuarioSeleccionado.nombre} ${usuarioSeleccionado.apellido}` : 'Todos'}`,
                    margen,
                    posicionY + 1
                )
            } else if (esCompra) {
                const proveedorSeleccionado = proveedores.find(
                    proveedor => proveedor.id === proveedorId
                )

                posicionY = escribirTexto(
                    `Estado: ${estado ? nombreEstado(estado) : 'Todos'}   Proveedor: ${proveedorSeleccionado?.nombre || 'Todos'}`,
                    margen,
                    posicionY + 1
                )
            } else if (esVenta) {
                const vendedorSeleccionado = vendedores.find(
                    vendedor => vendedor.id === usuarioId
                )

                posicionY = escribirTexto(
                    `Estado: ${estado ? nombreEstado(estado) : 'Todos'}   Vendedor: ${
                        vendedorSeleccionado
                            ? `${vendedorSeleccionado.nombre} ${vendedorSeleccionado.apellido}`
                            : 'Todos'
                    }`,
                    margen,
                    posicionY + 1
                )
            } else {
                posicionY = escribirTexto(
                    `Medio de pago: ${metodoPago ? nombreMetodoPago(metodoPago) : 'Todos'}`,
                    margen,
                    posicionY + 1
                )
            }

            posicionY = asegurarEspacio(posicionY + 4, 30)

            documento.setFontSize(12)
            documento.setFont('helvetica', 'bold')
            documento.text('Resumen', margen, posicionY)

            let filasResumen

            if (esStock) {
                filasResumen = [
                    ['Total de movimientos', String(resumen?.total_movimientos || 0), '-'],
                    ['Entradas', String(resumen?.cantidad_entradas || 0), `${Number(resumen?.unidades_entradas || 0)} unidades`],
                    ['Salidas', String(resumen?.cantidad_salidas || 0), `${Number(resumen?.unidades_salidas || 0)} unidades`],
                    ['Ajustes', String(resumen?.cantidad_ajustes || 0), '-']
                ]
            } else if (esCompra) {
                filasResumen = [
                    ['Compras pendientes', String(resumen?.cantidad_pendientes || 0), formatearMoneda(resumen?.importe_pendiente)],
                    ['Compras confirmadas', String(resumen?.cantidad_confirmadas || 0), formatearMoneda(resumen?.importe_confirmado)],
                    ['Compras canceladas', String(resumen?.cantidad_canceladas || 0), formatearMoneda(resumen?.importe_cancelado)],
                    ['Total de registros', String(resumen?.cantidad_total ?? registros.length), formatearMoneda(resumen?.importe_total)]
                ]
            } else if (esCaja) {
                filasResumen = [
                    ['Cobros registrados', String(pagosCaja.length), formatearMoneda(totalRecaudado)],
                    ...totalesPorMetodo.map(metodo => [
                        metodo.nombre,
                        String(metodo.cantidad),
                        formatearMoneda(metodo.total)
                    ])
                ]
            } else {
                filasResumen = [
                    ['Ventas completadas', String(resumen?.cantidad_completadas || 0), formatearMoneda(resumen?.total_completadas)],
                    ['Ventas anuladas', String(resumen?.cantidad_anuladas || 0), formatearMoneda(resumen?.total_anuladas)],
                    ['Total de registros', String(resumen?.cantidad_ventas ?? registros.length), '-']
                ]
            }

            posicionY = agregarTabla({
                startY: posicionY + 3,
                head: [['Indicador', 'Cantidad', 'Importe / detalle']],
                body: filasResumen
            }, 30)

            posicionY = asegurarEspacio(posicionY, 25)
            documento.setFontSize(12)
            documento.setFont('helvetica', 'bold')

            documento.text(
                esStock
                    ? 'Listado de movimientos'
                    : esCaja
                        ? 'Listado de cobros'
                        : `Listado de ${nombreInforme}`,
                margen,
                posicionY
            )

            if (esStock) {
                posicionY = agregarTabla({
                    startY: posicionY + 3,
                    head: [[
                        'Fecha',
                        'Producto',
                        'Código',
                        'Tipo',
                        'Cantidad',
                        'Stock anterior',
                        'Stock nuevo'
                    ]],
                    body: movimientosStock.map(movimiento => [
                        formatearFecha(movimiento.created_at),
                        movimiento.producto_nombre || '-',
                        movimiento.producto_codigo || '-',
                        nombreTipoMovimiento(movimiento.tipo),
                        String(movimiento.cantidad ?? 0),
                        String(movimiento.stock_anterior ?? 0),
                        String(movimiento.stock_nuevo ?? 0)
                    ]),
                    styles: { fontSize: 7 }
                }, 25)

                posicionY = asegurarEspacio(posicionY, 20)
                documento.setFontSize(10)
                documento.setFont('helvetica', 'bold')
                documento.text('Motivo y usuario de cada movimiento', margen, posicionY)

                posicionY = agregarTabla({
                    startY: posicionY + 3,
                    head: [['Fecha', 'Producto', 'Motivo', 'Usuario']],
                    body: movimientosStock.map(movimiento => [
                        formatearFecha(movimiento.created_at),
                        movimiento.producto_nombre || '-',
                        movimiento.motivo || '-',
                        nombreUsuario(movimiento)
                    ])
                }, 20)
            } else if (esCaja) {
                posicionY = agregarTabla({
                    startY: posicionY + 3,
                    head: [['Venta', 'Fecha', 'Vendedor', 'Medio de pago', 'Importe']],
                    body: pagosCaja.map(pago => [
                        String(pago.numero_venta ?? '-'),
                        formatearFecha(pago.fecha),
                        pago.vendedor || '-',
                        nombreMetodoPago(pago.metodo_pago),
                        formatearMoneda(pago.monto)
                    ])
                }, 25)
            } else {
                posicionY = agregarTabla({
                    startY: posicionY + 3,
                    head: esCompra
                        ? [['Fecha', 'Proveedor', 'Comprobante', 'Estado', 'Total']]
                        : [['N.º', 'Fecha', 'Vendedor', 'Estado', 'Total']],
                    body: registros.map(registro => esCompra
                        ? [
                            formatearFecha(registro.fecha),
                            registro.proveedor_nombre || '-',
                            nombreComprobante(registro),
                            nombreEstado(registro.estado),
                            formatearMoneda(registro.total)
                        ]
                        : [
                            String(registro.numero_venta ?? '-'),
                            formatearFecha(registro.created_at),
                            nombreUsuario(registro),
                            nombreEstado(registro.estado),
                            formatearMoneda(registro.total)
                        ])
                }, 25)
            }

            // Agrego los detalles de cada venta o compra después del listado general.
            if (!esStock && !esCaja) {
                registros.forEach(registro => {
                    posicionY = asegurarEspacio(posicionY, 42)

                    documento.setFontSize(11)
                    documento.setFont('helvetica', 'bold')
                    documento.text(
                        esCompra
                            ? `Detalle de compra ${nombreComprobante(registro)}`
                            : `Detalle de venta N.º ${registro.numero_venta ?? '-'}`,
                        margen,
                        posicionY
                    )

                    posicionY += 6
                    documento.setFontSize(8.5)
                    documento.setFont('helvetica', 'normal')

                    const datos = esCompra
                        ? [
                            `Fecha: ${formatearFecha(registro.fecha)}`,
                            `Proveedor: ${registro.proveedor_nombre || '-'}`,
                            `Comprobante: ${nombreComprobante(registro)}`,
                            `Registrado por: ${nombreUsuario(registro)}`,
                            `Estado: ${nombreEstado(registro.estado)}`,
                            `Total: ${formatearMoneda(registro.total)}`
                        ]
                        : [
                            `Fecha: ${formatearFecha(registro.created_at)}`,
                            `Vendedor: ${nombreUsuario(registro)}`,
                            `Estado: ${nombreEstado(registro.estado)}`,
                            `Total: ${formatearMoneda(registro.total)}`
                        ]

                    datos.forEach(dato => {
                        posicionY = escribirTexto(dato, margen, posicionY)
                    })

                    if (esCompra && registro.observaciones) {
                        posicionY = escribirTexto(
                            `Observaciones: ${registro.observaciones}`,
                            margen,
                            posicionY + 1
                        )
                    }

                    posicionY += 2

                    posicionY = agregarTabla({
                        startY: posicionY,
                        head: [[
                            'Producto',
                            'Código',
                            'Cantidad',
                            esCompra ? 'Costo unitario' : 'Precio unitario',
                            'Subtotal'
                        ]],
                        body: (registro.detalles || []).map(detalle => [
                            detalle.producto_nombre || '-',
                            detalle.producto_codigo || '-',
                            String(detalle.cantidad ?? 0),
                            formatearMoneda(
                                esCompra ? detalle.costo_unitario : detalle.precio_unitario
                            ),
                            formatearMoneda(detalle.subtotal)
                        ])
                    }, 18)

                    if (!esCompra) {
                        posicionY = asegurarEspacio(posicionY, 18)
                        documento.setFontSize(9)
                        documento.setFont('helvetica', 'bold')
                        documento.text('Medios de pago', margen, posicionY)
                        posicionY += 3

                        posicionY = agregarTabla({
                            startY: posicionY,
                            head: [['Método', 'Importe']],
                            body: (registro.pagos || []).map(pago => [
                                nombreMetodoPago(pago.metodo_pago),
                                formatearMoneda(pago.monto)
                            ]),
                            margin: {
                                left: margen,
                                right: anchoPagina / 2
                            }
                        }, 12)
                    }

                    posicionY += 5
                })
            }

            documento.save(
                `informe-${nombreInforme}-${new Date().toISOString().slice(0, 10)}.pdf`
            )

            setMensaje('El PDF se generó correctamente.')
            setError('')
        } catch (errorPDF) {
            console.error('Error al generar el PDF:', errorPDF)
            setError('No se pudo generar el PDF. Revisá los datos del informe e intentá nuevamente.')
        }
    }

    return (
        <div className="space-y-6 py-6">
            <div>
                <p className="text-sm font-medium text-stone-500">Administración</p>
                <h1 className="mt-1 text-3xl font-bold tracking-tight text-stone-900">
                    Informes
                </h1>
                <p className="mt-2 text-sm text-stone-600">
                    Consultá la información del negocio y descargá informes en PDF.
                </p>
            </div>

            <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-stone-900">Tipo de informe</h2>
                <p className="mt-1 text-sm text-stone-500">
                    Seleccioná la información que querés consultar.
                </p>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {tiposInforme.map(tipo => {
                        const Icono = tipo.icono
                        const seleccionado = tipoInforme === tipo.id

                        return (
                            <button
                                key={tipo.id}
                                type="button"
                                onClick={() => seleccionarTipoInforme(tipo.id)}
                                className={`rounded-xl border p-4 text-left transition ${
                                    seleccionado
                                        ? 'border-stone-900 bg-stone-100 ring-1 ring-stone-900'
                                        : 'border-stone-200 hover:border-stone-400 hover:bg-stone-50'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                                        seleccionado
                                            ? 'bg-stone-900 text-white'
                                            : 'bg-stone-100 text-stone-600'
                                    }`}>
                                        <Icono className="text-lg" />
                                    </div>
                                    <span className="font-semibold text-stone-900">
                                        {tipo.nombre}
                                    </span>
                                </div>
                                <p className="mt-3 text-sm text-stone-600">
                                    {tipo.descripcion}
                                </p>
                            </button>
                        )
                    })}
                </div>
            </section>

            <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-stone-900">Filtros del informe</h2>
                <p className="mt-1 text-sm text-stone-500">
                    Informe seleccionado: {tiposInforme.find(tipo => tipo.id === tipoInforme)?.nombre}
                </p>

                <form onSubmit={generarInforme} className="mt-5 space-y-5">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <div>
                            <label htmlFor="desde" className="mb-2 block text-sm font-medium text-stone-700">
                                Desde
                            </label>
                            <input
                                id="desde"
                                type="date"
                                value={desde}
                                onChange={event => setDesde(event.target.value)}
                                className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-stone-700 focus:ring-2 focus:ring-stone-200"
                            />
                        </div>

                        <div>
                            <label htmlFor="hasta" className="mb-2 block text-sm font-medium text-stone-700">
                                Hasta
                            </label>
                            <input
                                id="hasta"
                                type="date"
                                value={hasta}
                                onChange={event => setHasta(event.target.value)}
                                className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-stone-700 focus:ring-2 focus:ring-stone-200"
                            />
                        </div>

                        {esStock ? (
                            <>
                                <div>
                                    <label htmlFor="tipoMovimiento" className="mb-2 block text-sm font-medium text-stone-700">
                                        Tipo de movimiento
                                    </label>
                                    <select
                                        id="tipoMovimiento"
                                        value={tipoMovimiento}
                                        onChange={event => setTipoMovimiento(event.target.value)}
                                        className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-stone-700 focus:ring-2 focus:ring-stone-200"
                                    >
                                        <option value="">Todos los movimientos</option>
                                        <option value="entrada">Entradas</option>
                                        <option value="salida">Salidas</option>
                                        <option value="ajuste">Ajustes</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="productoStock" className="mb-2 block text-sm font-medium text-stone-700">
                                        Producto
                                    </label>
                                    <select
                                        id="productoStock"
                                        value={productoId}
                                        onChange={event => setProductoId(event.target.value)}
                                        className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-stone-700 focus:ring-2 focus:ring-stone-200"
                                    >
                                        <option value="">Todos los productos</option>
                                        {productos.map(producto => (
                                            <option key={producto.id} value={producto.id}>
                                                {producto.nombre}{producto.codigo ? ` (${producto.codigo})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="usuarioStock" className="mb-2 block text-sm font-medium text-stone-700">
                                        Usuario
                                    </label>
                                    <select
                                        id="usuarioStock"
                                        value={usuarioId}
                                        onChange={event => setUsuarioId(event.target.value)}
                                        className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-stone-700 focus:ring-2 focus:ring-stone-200"
                                    >
                                        <option value="">Todos los usuarios</option>
                                        {Array.from(
                                            new Map(
                                                movimientosStock
                                                    .filter(movimiento => movimiento.usuario_id)
                                                    .map(movimiento => [
                                                        movimiento.usuario_id,
                                                        {
                                                            id: movimiento.usuario_id,
                                                            nombre: movimiento.usuario_nombre,
                                                            apellido: movimiento.usuario_apellido
                                                        }
                                                    ])
                                            ).values()
                                        ).map(usuario => (
                                            <option key={usuario.id} value={usuario.id}>
                                                {`${usuario.nombre || ''} ${usuario.apellido || ''}`.trim() || usuario.id}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        ) : (
                            <>
                                {!esCaja && (
                                    <div>
                                        <label htmlFor="estado" className="mb-2 block text-sm font-medium text-stone-700">
                                            Estado de {esCompra ? 'las compras' : 'las ventas'}
                                        </label>
                                        <select
                                            id="estado"
                                            value={estado}
                                            onChange={event => setEstado(event.target.value)}
                                            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-stone-700 focus:ring-2 focus:ring-stone-200"
                                        >
                                            <option value="">Todos los estados</option>
                                            {esCompra ? (
                                                <>
                                                    <option value="pendiente">Pendientes</option>
                                                    <option value="confirmada">Confirmadas</option>
                                                    <option value="cancelada">Canceladas</option>
                                                </>
                                            ) : (
                                                <>
                                                    <option value="completada">Completadas</option>
                                                    <option value="anulada">Anuladas</option>
                                                </>
                                            )}
                                        </select>
                                    </div>
                                )}

                                {esCompra && (
                                    <div>
                                        <label htmlFor="proveedor" className="mb-2 block text-sm font-medium text-stone-700">
                                            Proveedor
                                        </label>
                                        <select
                                            id="proveedor"
                                            value={proveedorId}
                                            onChange={event => setProveedorId(event.target.value)}
                                            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-stone-700 focus:ring-2 focus:ring-stone-200"
                                        >
                                            <option value="">Todos los proveedores</option>
                                            {proveedores.map(proveedor => (
                                                <option key={proveedor.id} value={proveedor.id}>
                                                    {proveedor.nombre}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {(esVenta || esCaja) && (
                                    <div>
                                        <label htmlFor="vendedor" className="mb-2 block text-sm font-medium text-stone-700">
                                            Vendedor
                                        </label>
                                        <select
                                            id="vendedor"
                                            value={usuarioId}
                                            onChange={event => setUsuarioId(event.target.value)}
                                            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-stone-700 focus:ring-2 focus:ring-stone-200"
                                        >
                                            <option value="">Todos los vendedores</option>
                                            {vendedores.map(vendedor => (
                                                <option key={vendedor.id} value={vendedor.id}>
                                                    {vendedor.nombre} {vendedor.apellido}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {esCaja && (
                                    <div>
                                        <label htmlFor="metodoPago" className="mb-2 block text-sm font-medium text-stone-700">
                                            Medio de pago
                                        </label>
                                        <select
                                            id="metodoPago"
                                            value={metodoPago}
                                            onChange={event => setMetodoPago(event.target.value)}
                                            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-stone-700 focus:ring-2 focus:ring-stone-200"
                                        >
                                            <option value="">Todos los medios</option>
                                            {metodosPago.map(metodo => (
                                                <option key={metodo.id} value={metodo.id}>
                                                    {metodo.nombre}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {error && (
                        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {mensaje && (
                        <div role="status" className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700">
                            {mensaje}
                        </div>
                    )}

                    <div className="flex flex-wrap justify-end gap-3 border-t border-stone-100 pt-4">
                        <button
                            type="button"
                            onClick={limpiarFiltros}
                            disabled={cargando}
                            className="rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Limpiar filtros
                        </button>

                        <button
                            type="submit"
                            disabled={cargando}
                            className="rounded-lg bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {cargando ? 'Consultando...' : 'Consultar informe'}
                        </button>

                        <button
                            type="button"
                            onClick={descargarPDF}
                            disabled={cargando || !informe || !tipoDisponible}
                            className="flex items-center gap-2 rounded-lg bg-stone-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <FaFilePdf />
                            Descargar PDF
                        </button>
                    </div>
                </form>
            </section>

            {cargando && (
                <p className="text-sm text-stone-500">
                    Consultando el informe de {tipoInforme}...
                </p>
            )}

            {!cargando && informe && esStock && tipoDisponible && (
                <>
                    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                            <p className="text-sm text-stone-500">Total de movimientos</p>
                            <p className="mt-2 text-2xl font-bold text-stone-900">
                                {resumen?.total_movimientos || 0}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                            <p className="text-sm text-stone-500">Entradas</p>
                            <p className="mt-2 text-2xl font-bold text-stone-900">
                                {resumen?.cantidad_entradas || 0}
                            </p>
                            <p className="mt-1 text-sm text-stone-600">
                                {Number(resumen?.unidades_entradas || 0)} unidades ingresadas
                            </p>
                        </div>

                        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                            <p className="text-sm text-stone-500">Salidas</p>
                            <p className="mt-2 text-2xl font-bold text-stone-900">
                                {resumen?.cantidad_salidas || 0}
                            </p>
                            <p className="mt-1 text-sm text-stone-600">
                                {Number(resumen?.unidades_salidas || 0)} unidades retiradas
                            </p>
                        </div>

                        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                            <p className="text-sm text-stone-500">Ajustes</p>
                            <p className="mt-2 text-2xl font-bold text-stone-900">
                                {resumen?.cantidad_ajustes || 0}
                            </p>
                            <p className="mt-1 text-sm text-stone-600">
                                Ajustes de inventario
                            </p>
                        </div>
                    </section>

                    <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
                        <div className="border-b border-stone-200 p-5">
                            <h2 className="text-lg font-semibold text-stone-900">
                                Historial de movimientos de stock
                            </h2>
                            <p className="mt-1 text-sm text-stone-500">
                                Se muestran los movimientos que coinciden con los filtros seleccionados.
                            </p>
                        </div>

                        {movimientosStock.length === 0 ? (
                            <p className="p-5 text-sm text-stone-500">
                                No se encontraron movimientos con los filtros seleccionados.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-stone-50 text-stone-600">
                                        <tr>
                                            <th className="px-5 py-3 font-medium">Fecha</th>
                                            <th className="px-5 py-3 font-medium">Producto</th>
                                            <th className="px-5 py-3 font-medium">Código</th>
                                            <th className="px-5 py-3 font-medium">Tipo</th>
                                            <th className="px-5 py-3 text-right font-medium">Cantidad</th>
                                            <th className="px-5 py-3 text-right font-medium">Stock anterior</th>
                                            <th className="px-5 py-3 text-right font-medium">Stock nuevo</th>
                                            <th className="px-5 py-3 font-medium">Motivo</th>
                                            <th className="px-5 py-3 font-medium">Usuario</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-100">
                                        {movimientosStock.map(movimiento => (
                                            <tr key={movimiento.id} className="align-top hover:bg-stone-50">
                                                <td className="whitespace-nowrap px-5 py-4 text-stone-600">
                                                    {formatearFecha(movimiento.created_at)}
                                                </td>
                                                <td className="px-5 py-4 font-medium text-stone-900">
                                                    {movimiento.producto_nombre || '-'}
                                                </td>
                                                <td className="px-5 py-4 text-stone-600">
                                                    {movimiento.producto_codigo || '-'}
                                                </td>
                                                <td className="whitespace-nowrap px-5 py-4">
                                                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                                                        movimiento.tipo === 'entrada'
                                                            ? 'bg-stone-100 text-stone-800'
                                                            : movimiento.tipo === 'salida'
                                                                ? 'bg-amber-50 text-amber-800'
                                                                : 'bg-blue-50 text-blue-800'
                                                    }`}>
                                                        {nombreTipoMovimiento(movimiento.tipo)}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-5 py-4 text-right font-medium text-stone-900">
                                                    {Number(movimiento.cantidad ?? 0)}
                                                </td>
                                                <td className="whitespace-nowrap px-5 py-4 text-right text-stone-600">
                                                    {Number(movimiento.stock_anterior ?? 0)}
                                                </td>
                                                <td className="whitespace-nowrap px-5 py-4 text-right text-stone-600">
                                                    {Number(movimiento.stock_nuevo ?? 0)}
                                                </td>
                                                <td className="min-w-48 px-5 py-4 text-stone-600">
                                                    {movimiento.motivo || '-'}
                                                </td>
                                                <td className="whitespace-nowrap px-5 py-4 text-stone-600">
                                                    {nombreUsuario(movimiento)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                </>
            )}

            {!cargando && informe && tipoDisponible && !esStock && (
                <>
                    {esCaja ? (
                        <>
                            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                                    <p className="text-sm text-stone-500">Total recaudado</p>
                                    <p className="mt-2 text-2xl font-bold text-stone-900">
                                        {formatearMoneda(totalRecaudado)}
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                                    <p className="text-sm text-stone-500">Cantidad de cobros</p>
                                    <p className="mt-2 text-2xl font-bold text-stone-900">
                                        {pagosCaja.length}
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                                    <p className="text-sm text-stone-500">Ventas con cobros</p>
                                    <p className="mt-2 text-2xl font-bold text-stone-900">
                                        {registros.length}
                                    </p>
                                </div>
                            </section>

                            <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                                <h2 className="text-lg font-semibold text-stone-900">
                                    Recaudación por medio de pago
                                </h2>

                                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                    {totalesPorMetodo.map(metodo => (
                                        <div key={metodo.id} className="rounded-xl border border-stone-200 p-4">
                                            <p className="text-sm text-stone-500">{metodo.nombre}</p>
                                            <p className="mt-1 text-xl font-semibold text-stone-900">
                                                {formatearMoneda(metodo.total)}
                                            </p>
                                            <p className="mt-1 text-xs text-stone-500">
                                                {metodo.cantidad} {metodo.cantidad === 1 ? 'cobro' : 'cobros'}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                <p className="mt-4 text-xs text-stone-500">
                                    Se contabilizan los pagos registrados en ventas completadas. Las ventas anuladas no se incluyen en la recaudación.
                                </p>
                            </section>

                            <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
                                <div className="border-b border-stone-200 p-5">
                                    <h2 className="text-lg font-semibold text-stone-900">Detalle de cobros</h2>
                                    <p className="mt-1 text-sm text-stone-500">
                                        Cada medio de pago se muestra por separado, incluso si una venta se abonó con más de un método.
                                    </p>
                                </div>

                                {pagosCaja.length === 0 ? (
                                    <p className="p-5 text-sm text-stone-500">
                                        No se encontraron cobros con los filtros seleccionados.
                                    </p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-stone-50 text-stone-600">
                                                <tr>
                                                    <th className="px-5 py-3 font-medium">Venta</th>
                                                    <th className="px-5 py-3 font-medium">Fecha</th>
                                                    <th className="px-5 py-3 font-medium">Vendedor</th>
                                                    <th className="px-5 py-3 font-medium">Medio de pago</th>
                                                    <th className="px-5 py-3 text-right font-medium">Importe</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-stone-100">
                                                {pagosCaja.map(pago => (
                                                    <tr key={pago.clave} className="hover:bg-stone-50">
                                                        <td className="px-5 py-4 font-medium text-stone-900">
                                                            N.º {pago.numero_venta ?? '-'}
                                                        </td>
                                                        <td className="whitespace-nowrap px-5 py-4 text-stone-600">
                                                            {formatearFecha(pago.fecha)}
                                                        </td>
                                                        <td className="px-5 py-4 text-stone-600">
                                                            {pago.vendedor || '-'}
                                                        </td>
                                                        <td className="px-5 py-4 text-stone-600">
                                                            {nombreMetodoPago(pago.metodo_pago)}
                                                        </td>
                                                        <td className="whitespace-nowrap px-5 py-4 text-right font-medium text-stone-900">
                                                            {formatearMoneda(pago.monto)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </section>

                            {registros.map(venta => (
                                <details key={`caja-${venta.id}`} className="rounded-2xl border border-stone-200 bg-white shadow-sm">
                                    <summary className="cursor-pointer p-5 font-semibold text-stone-900">
                                        Venta N.º {venta.numero_venta} — {formatearMoneda(
                                            sumarImportes(venta.pagos.map(pago => ({ monto: pago.monto })))
                                        )}
                                    </summary>
                                    <div className="border-t border-stone-100 p-5">
                                        <p className="mb-3 text-sm text-stone-600">
                                            Fecha: {formatearFecha(venta.created_at)} · Vendedor: {nombreUsuario(venta)}
                                        </p>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-stone-50 text-stone-600">
                                                    <tr>
                                                        <th className="px-3 py-2 font-medium">Medio de pago</th>
                                                        <th className="px-3 py-2 text-right font-medium">Importe</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-stone-100">
                                                    {venta.pagos.map((pago, indice) => (
                                                        <tr key={`${venta.id}-${pago.id || indice}`}>
                                                            <td className="px-3 py-2">{nombreMetodoPago(pago.metodo_pago)}</td>
                                                            <td className="px-3 py-2 text-right">{formatearMoneda(pago.monto)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </details>
                            ))}
                        </>
                    ) : (
                        <>
                            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                                    <p className="text-sm text-stone-500">Registros encontrados</p>
                                    <p className="mt-2 text-2xl font-bold text-stone-900">
                                        {esCompra
                                            ? resumen?.cantidad_total ?? registros.length
                                            : resumen?.cantidad_ventas ?? registros.length}
                                    </p>
                                </div>

                                {esCompra ? (
                                    <>
                                        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                                            <p className="text-sm text-stone-500">Compras pendientes</p>
                                            <p className="mt-2 text-2xl font-bold text-stone-900">
                                                {resumen?.cantidad_pendientes || 0}
                                            </p>
                                            <p className="mt-1 text-sm text-stone-600">
                                                {formatearMoneda(resumen?.importe_pendiente)}
                                            </p>
                                        </div>

                                        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                                            <p className="text-sm text-stone-500">Compras confirmadas</p>
                                            <p className="mt-2 text-2xl font-bold text-stone-900">
                                                {resumen?.cantidad_confirmadas || 0}
                                            </p>
                                            <p className="mt-1 text-sm text-stone-600">
                                                {formatearMoneda(resumen?.importe_confirmado)}
                                            </p>
                                        </div>

                                        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                                            <p className="text-sm text-stone-500">Compras canceladas</p>
                                            <p className="mt-2 text-2xl font-bold text-stone-900">
                                                {resumen?.cantidad_canceladas || 0}
                                            </p>
                                            <p className="mt-1 text-sm text-stone-600">
                                                {formatearMoneda(resumen?.importe_cancelado)}
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                                            <p className="text-sm text-stone-500">Ventas completadas</p>
                                            <p className="mt-2 text-2xl font-bold text-stone-900">
                                                {resumen?.cantidad_completadas || 0}
                                            </p>
                                            <p className="mt-1 text-sm text-stone-600">
                                                {formatearMoneda(resumen?.total_completadas)}
                                            </p>
                                        </div>

                                        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                                            <p className="text-sm text-stone-500">Ventas anuladas</p>
                                            <p className="mt-2 text-2xl font-bold text-stone-900">
                                                {resumen?.cantidad_anuladas || 0}
                                            </p>
                                            <p className="mt-1 text-sm text-stone-600">
                                                {formatearMoneda(resumen?.total_anuladas)}
                                            </p>
                                        </div>
                                    </>
                                )}
                            </section>

                            <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
                                <div className="border-b border-stone-200 p-5">
                                    <h2 className="text-lg font-semibold text-stone-900">
                                        Resultados del informe
                                    </h2>
                                    <p className="mt-1 text-sm text-stone-500">
                                        Seleccioná un registro para consultar el detalle de sus productos.
                                    </p>
                                </div>

                                {registros.length === 0 ? (
                                    <p className="p-5 text-sm text-stone-500">
                                        No se encontraron registros con los filtros seleccionados.
                                    </p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-stone-50 text-stone-600">
                                                <tr>
                                                    <th className="px-5 py-3 font-medium">
                                                        {esCompra ? 'Comprobante' : 'N.º'}
                                                    </th>
                                                    <th className="px-5 py-3 font-medium">Fecha</th>
                                                    <th className="px-5 py-3 font-medium">
                                                        {esCompra ? 'Proveedor' : 'Vendedor'}
                                                    </th>
                                                    <th className="px-5 py-3 font-medium">Estado</th>
                                                    <th className="px-5 py-3 text-right font-medium">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-stone-100">
                                                {registros.map(registro => (
                                                    <tr key={registro.id} className="align-top hover:bg-stone-50">
                                                        <td className="whitespace-nowrap px-5 py-4 font-medium text-stone-900">
                                                            {esCompra
                                                                ? nombreComprobante(registro)
                                                                : registro.numero_venta}
                                                        </td>
                                                        <td className="whitespace-nowrap px-5 py-4 text-stone-600">
                                                            {formatearFecha(esCompra ? registro.fecha : registro.created_at)}
                                                        </td>
                                                        <td className="px-5 py-4 text-stone-600">
                                                            {esCompra
                                                                ? registro.proveedor_nombre || '-'
                                                                : nombreUsuario(registro)}
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                                                                ['completada', 'confirmada'].includes(registro.estado)
                                                                    ? 'bg-stone-100 text-stone-800'
                                                                    : registro.estado === 'pendiente'
                                                                        ? 'bg-amber-50 text-amber-800'
                                                                        : 'bg-red-50 text-red-700'
                                                            }`}>
                                                                {nombreEstado(registro.estado)}
                                                            </span>
                                                        </td>
                                                        <td className="whitespace-nowrap px-5 py-4 text-right font-medium text-stone-900">
                                                            {formatearMoneda(registro.total)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </section>

                            {registros.map(registro => (
                                <details key={`detalle-${registro.id}`} className="rounded-2xl border border-stone-200 bg-white shadow-sm">
                                    <summary className="cursor-pointer p-5 font-semibold text-stone-900">
                                        {esCompra
                                            ? `Compra ${nombreComprobante(registro)}`
                                            : `Venta N.º ${registro.numero_venta}`}
                                        {' — '}
                                        {nombreEstado(registro.estado)}
                                        {' — '}
                                        {formatearMoneda(registro.total)}
                                    </summary>

                                    <div className="space-y-5 border-t border-stone-100 p-5">
                                        <div className="grid grid-cols-1 gap-2 text-sm text-stone-600 sm:grid-cols-2">
                                            <p>
                                                <span className="font-medium text-stone-800">Fecha:</span>{' '}
                                                {formatearFecha(esCompra ? registro.fecha : registro.created_at)}
                                            </p>
                                            <p>
                                                <span className="font-medium text-stone-800">
                                                    {esCompra ? 'Proveedor:' : 'Vendedor:'}
                                                </span>{' '}
                                                {esCompra
                                                    ? registro.proveedor_nombre || '-'
                                                    : nombreUsuario(registro)}
                                            </p>

                                            {esCompra && (
                                                <p>
                                                    <span className="font-medium text-stone-800">Registrado por:</span>{' '}
                                                    {nombreUsuario(registro)}
                                                </p>
                                            )}

                                            <p>
                                                <span className="font-medium text-stone-800">Estado:</span>{' '}
                                                {nombreEstado(registro.estado)}
                                            </p>

                                            {esCompra && registro.observaciones && (
                                                <p className="sm:col-span-2">
                                                    <span className="font-medium text-stone-800">Observaciones:</span>{' '}
                                                    {registro.observaciones}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <h3 className="mb-2 font-semibold text-stone-800">Productos</h3>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-sm">
                                                    <thead className="bg-stone-50 text-stone-600">
                                                        <tr>
                                                            <th className="px-3 py-2 font-medium">Producto</th>
                                                            <th className="px-3 py-2 font-medium">Código</th>
                                                            <th className="px-3 py-2 text-right font-medium">Cantidad</th>
                                                            <th className="px-3 py-2 text-right font-medium">
                                                                {esCompra ? 'Costo unitario' : 'Precio unitario'}
                                                            </th>
                                                            <th className="px-3 py-2 text-right font-medium">Subtotal</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-stone-100">
                                                        {(registro.detalles || []).map((detalle, indice) => (
                                                            <tr key={`${registro.id}-${indice}`}>
                                                                <td className="px-3 py-2">{detalle.producto_nombre || '-'}</td>
                                                                <td className="px-3 py-2">{detalle.producto_codigo || '-'}</td>
                                                                <td className="px-3 py-2 text-right">{detalle.cantidad ?? 0}</td>
                                                                <td className="px-3 py-2 text-right">
                                                                    {formatearMoneda(
                                                                        esCompra
                                                                            ? detalle.costo_unitario
                                                                            : detalle.precio_unitario
                                                                    )}
                                                                </td>
                                                                <td className="px-3 py-2 text-right">
                                                                    {formatearMoneda(detalle.subtotal)}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {!esCompra && (
                                            <div>
                                                <h3 className="mb-2 font-semibold text-stone-800">Medios de pago</h3>
                                                {(registro.pagos || []).length === 0 ? (
                                                    <p className="text-sm text-stone-500">
                                                        Esta venta no tiene pagos registrados.
                                                    </p>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {registro.pagos.map((pago, indice) => (
                                                            <div
                                                                key={`${registro.id}-pago-${pago.id || indice}`}
                                                                className="flex justify-between gap-4 text-sm"
                                                            >
                                                                <span className="text-stone-600">
                                                                    {nombreMetodoPago(pago.metodo_pago)}
                                                                </span>
                                                                <span className="font-medium text-stone-900">
                                                                    {formatearMoneda(pago.monto)}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </details>
                            ))}
                        </>
                    )}
                </>
            )}

            {!cargando && !tipoDisponible && (
                <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-stone-600">
                        Este tipo de informe todavía no está implementado.
                    </p>
                </section>
            )}
        </div>
    )
}

export default InformesPage