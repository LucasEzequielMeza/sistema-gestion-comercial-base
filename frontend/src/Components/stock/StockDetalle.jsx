import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStock } from '../../Context/ContextoStock'
import Card from '../UI/Card'
import Button from '../UI/Button'
import Input from '../UI/Input'
import Label from '../UI/Label'

function StockDetalle({ menuAbierto }) {
    const { id } = useParams()
    const navigate = useNavigate()

    const {
        stockProducto,
        obtenerStockPorProducto,
        aumentarStock,
        disminuirStock,
        ajustarStock,
        actualizarStockMinimo,
        stockError,
        limpiarStockError
    } = useStock()

    const [cantidad, setCantidad] = useState('')
    const [motivo, setMotivo] = useState('')
    const [tipoMovimiento, setTipoMovimiento] = useState('entrada')
    const [mensaje, setMensaje] = useState('')
    const [mensajeAlerta, setMensajeAlerta] = useState('')
    const [stockMinimo, setStockMinimo] = useState('')
    const [guardandoMinimo, setGuardandoMinimo] = useState(false)

    // Muestro los números sin decimales innecesarios
    const formatoStock = (valor) => Number(valor).toLocaleString('es-AR', {
        maximumFractionDigits: 3
    })

    useEffect(() => {
        obtenerStockPorProducto(id).then((producto) => {
            if (producto) {
                setStockMinimo(String(producto.stock_minimo ?? 0))
            }
        })
    }, [id])

    useEffect(() => {
        if (!mensaje) return

        const temporizador = setTimeout(() => {
            setMensaje('')
        }, 10000)

        return () => clearTimeout(temporizador)
    }, [mensaje])

    useEffect(() => {
        if (stockError.length > 0) {
            setMensajeAlerta(
                stockError.map((error) =>
                    error.message || error.error || error
                ).join(' ')
            )
            limpiarStockError()
        }
    }, [stockError])

    const guardarStockMinimo = async (e) => {
        e.preventDefault()
        setMensaje('')
        setMensajeAlerta('')

        if (
            stockMinimo === '' ||
            !Number.isFinite(Number(stockMinimo)) ||
            Number(stockMinimo) < 0
        ) {
            setMensajeAlerta(
                'El stock mínimo debe ser un número igual o mayor a cero.'
            )
            return
        }

        setGuardandoMinimo(true)

        try {
            const respuesta = await actualizarStockMinimo(id, stockMinimo)

            if (respuesta) {
                setStockMinimo(String(respuesta.stock_minimo))
                setMensaje('Stock mínimo actualizado correctamente.')
            }
        } finally {
            setGuardandoMinimo(false)
        }
    }

    const realizarMovimiento = async (e) => {
        e.preventDefault()
        setMensaje('')
        setMensajeAlerta('')

        if (
            cantidad === '' ||
            !Number.isFinite(Number(cantidad)) ||
            Number(cantidad) < 0 ||
            (tipoMovimiento !== 'ajuste' && Number(cantidad) <= 0)
        ) {
            setMensajeAlerta(
                tipoMovimiento === 'ajuste'
                    ? 'Ingresá una cantidad válida igual o mayor a cero.'
                    : 'La cantidad debe ser mayor a cero.'
            )
            return
        }

        if (!motivo.trim()) {
            setMensajeAlerta('Tenés que indicar el motivo del movimiento.')
            return
        }

        let respuesta

        if (tipoMovimiento === 'entrada') {
            respuesta = await aumentarStock(id, cantidad, motivo)
        } else if (tipoMovimiento === 'salida') {
            respuesta = await disminuirStock(id, cantidad, motivo)
        } else {
            respuesta = await ajustarStock(id, cantidad, motivo)
        }

        if (respuesta) {
            setCantidad('')
            setMotivo('')
            setMensaje(
                tipoMovimiento === 'entrada'
                    ? 'Stock aumentado exitosamente.'
                    : tipoMovimiento === 'salida'
                        ? 'Stock disminuido exitosamente.'
                        : 'Stock ajustado exitosamente.'
            )

            setTimeout(() => {
                navigate('/stock')
            }, 1000)
        }
    }

    const desplazamientoAlerta = menuAbierto
        ? 'md:translate-x-32'
        : 'md:translate-x-10'

    if (!stockProducto) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-stone-500">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-stone-200 border-t-stone-800" />
                    <p className="font-medium">Cargando stock...</p>
                </div>

                {mensajeAlerta && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-950/50 p-4 backdrop-blur-sm">
                        <div className={`w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl transition-transform duration-300 ${desplazamientoAlerta}`}>
                            <h2 className="text-xl font-bold text-stone-900">
                                No se pudo cargar el stock
                            </h2>
                            <p className="mt-3 text-sm leading-6 text-stone-600">
                                {mensajeAlerta}
                            </p>
                            <div className="mt-6 flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setMensajeAlerta('')}
                                    className="rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-700"
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

    const stockBajo =
        Number(stockProducto.stock) <= Number(stockProducto.stock_minimo)

    return (
        <div className="mx-auto w-full max-w-5xl space-y-6 pb-8">
            <div className="flex flex-col gap-4 border-b border-stone-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm font-medium text-stone-500">
                        Inventario / Stock
                    </p>
                    <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
                        Gestión de stock
                    </h1>
                    <p className="mt-1 text-sm text-stone-500">
                        Administrá las existencias y las alertas de este producto.
                    </p>
                </div>

                <Button onClick={() => navigate('/stock')}>
                    Volver al stock
                </Button>
            </div>

            {mensaje && (
                <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 shadow-sm">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold">
                        ✓
                    </div>
                    <p className="text-sm font-medium leading-6">{mensaje}</p>
                </div>
            )}

            <Card className="mx-auto w-full max-w-3xl">
                <div className="mb-6 border-b border-stone-100 pb-5">
                    <p className="text-sm font-medium text-stone-500">
                        Producto seleccionado
                    </p>
                    <h2 className="mt-1 text-xl font-bold text-stone-900">
                        {stockProducto.nombre}
                    </h2>
                    <p className="mt-1 text-sm text-stone-500">
                        Código: {stockProducto.codigo || 'Sin código'}
                    </p>
                </div>

                <div className={`mb-6 rounded-2xl border p-5 ${
                    stockBajo
                        ? 'border-red-200 bg-red-50'
                        : 'border-stone-200 bg-stone-50'
                }`}>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className={`text-sm font-medium ${
                                stockBajo ? 'text-red-700' : 'text-stone-500'
                            }`}>
                                Stock actual
                            </p>
                            <p className={`mt-1 text-3xl font-bold tracking-tight ${
                                stockBajo ? 'text-red-700' : 'text-stone-900'
                            }`}>
                                {formatoStock(stockProducto.stock)}
                            </p>
                        </div>

                        <span className={`inline-flex w-fit items-center rounded-full px-3 py-1.5 text-xs font-semibold ${
                            stockBajo
                                ? 'bg-red-100 text-red-700'
                                : 'bg-emerald-100 text-emerald-700'
                        }`}>
                            {stockBajo ? 'Stock bajo' : 'Stock suficiente'}
                        </span>
                    </div>

                    {stockBajo && (
                        <p className="mt-3 border-t border-red-200 pt-3 text-sm leading-5 text-red-700">
                            El producto está en el nivel mínimo de stock o por debajo.
                        </p>
                    )}
                </div>

                <div className="mb-5">
                    <h3 className="text-lg font-bold text-stone-900">
                        Alerta de stock mínimo
                    </h3>
                    <p className="mt-1 text-sm leading-5 text-stone-500">
                        Definí la cantidad a partir de la cual necesitás revisar las existencias.
                    </p>
                </div>

                <form onSubmit={guardarStockMinimo} className="space-y-4">
                    <div>
                        <Label htmlFor="stockMinimo">
                            Cantidad mínima para la alerta
                        </Label>
                        <Input
                            id="stockMinimo"
                            type="number"
                            step="0.001"
                            min="0"
                            value={stockMinimo}
                            onChange={(e) => setStockMinimo(e.target.value)}
                        />
                        <p className="mt-2 text-xs leading-5 text-stone-500">
                            Se mostrará una alerta cuando el stock actual sea igual o inferior a este valor.
                        </p>
                    </div>

                    <div className="flex justify-end border-t border-stone-100 pt-4">
                        <Button type="submit" disabled={guardandoMinimo}>
                            {guardandoMinimo ? 'Guardando...' : 'Guardar stock mínimo'}
                        </Button>
                    </div>
                </form>
            </Card>

            <Card className="mx-auto w-full max-w-3xl">
                <div className="mb-6 border-b border-stone-100 pb-5">
                    <h2 className="text-xl font-bold text-stone-900">
                        Movimiento de stock
                    </h2>
                    <p className="mt-1 text-sm leading-5 text-stone-500">
                        Registrá una entrada, una salida o corregí la cantidad real disponible.
                    </p>
                </div>

                <form onSubmit={realizarMovimiento} className="space-y-5">
                    <div>
                        <Label htmlFor="tipoMovimiento">
                            Tipo de movimiento
                        </Label>
                        <select
                            id="tipoMovimiento"
                            value={tipoMovimiento}
                            onChange={(e) => setTipoMovimiento(e.target.value)}
                            className="my-2 block w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-800 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
                        >
                            <option value="entrada">Aumentar stock</option>
                            <option value="salida">Disminuir stock</option>
                            <option value="ajuste">Ajustar al stock real</option>
                        </select>
                    </div>

                    <div>
                        <Label htmlFor="cantidad">
                            {tipoMovimiento === 'ajuste'
                                ? 'Cantidad real contada'
                                : 'Cantidad'}
                        </Label>
                        <Input
                            id="cantidad"
                            type="number"
                            step="0.001"
                            min={tipoMovimiento === 'ajuste' ? '0' : '0.001'}
                            value={cantidad}
                            onChange={(e) => setCantidad(e.target.value)}
                        />
                        <p className="mt-2 text-xs text-stone-500">
                            {tipoMovimiento === 'entrada'
                                ? 'Esta cantidad se sumará al stock actual.'
                                : tipoMovimiento === 'salida'
                                    ? 'Esta cantidad se descontará del stock actual.'
                                    : 'Ingresá el total real que hay disponible, no la diferencia.'}
                        </p>
                    </div>

                    <div>
                        <Label htmlFor="motivo">Motivo del movimiento</Label>
                        <Input
                            id="motivo"
                            type="text"
                            placeholder="Ej: Compra a proveedor"
                            value={motivo}
                            onChange={(e) => setMotivo(e.target.value)}
                        />
                    </div>

                    <div className="flex justify-end border-t border-stone-100 pt-5">
                        <Button type="submit">
                            {tipoMovimiento === 'entrada'
                                ? 'Aumentar stock'
                                : tipoMovimiento === 'salida'
                                    ? 'Disminuir stock'
                                    : 'Ajustar stock'}
                        </Button>
                    </div>
                </form>
            </Card>

            {mensajeAlerta && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-950/50 p-4 backdrop-blur-sm">
                    <div className={`w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl transition-transform duration-300 ${desplazamientoAlerta}`}>
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-lg font-bold text-red-600">
                                !
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-stone-900">
                                    No se pudo realizar la operación
                                </h2>
                                <p className="mt-2 text-sm leading-6 text-stone-600">
                                    {mensajeAlerta}
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setMensajeAlerta('')}
                                className="rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-700"
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

export default StockDetalle