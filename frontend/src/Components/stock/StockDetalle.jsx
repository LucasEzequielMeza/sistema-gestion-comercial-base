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
            <div className="flex justify-center mt-10">
                <p>Cargando stock...</p>

                {mensajeAlerta && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
                        <div className={`w-full max-w-md rounded-xl bg-white p-6 shadow-2xl transition-transform duration-300 ${desplazamientoAlerta}`}>
                            <h2 className="text-xl font-bold text-[#1C1917]">
                                No se pudo cargar el stock
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
            </div>
        )
    }

    const stockBajo =
        Number(stockProducto.stock) <= Number(stockProducto.stock_minimo)

    return (
        <div>
            <div className="w-full max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 my-6">
                <Button onClick={() => navigate('/stock')}>
                    Volver
                </Button>
            </div>

            {mensaje && (
                <div className="flex justify-center mb-6">
                    <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 font-semibold text-green-700 text-center">
                        {mensaje}
                    </p>
                </div>
            )}

            <Card className="w-full max-w-3xl mx-auto mt-6">
                <h2 className="text-2xl font-bold mb-2">
                    Stock mínimo
                </h2>

                <p className="text-sm text-zinc-600 mb-5">
                    {stockProducto.nombre} · Código: {stockProducto.codigo || 'Sin código'}
                </p>

                <div className="mb-5 rounded-lg bg-zinc-100 p-4">
                    <p className="text-sm text-zinc-600">Stock actual</p>
                    <p className="text-2xl font-bold text-[#1C1917]">
                        {formatoStock(stockProducto.stock)}
                    </p>

                    {stockBajo && (
                        <p className="mt-2 text-sm font-semibold text-red-600">
                            El producto está en el nivel mínimo de stock o por debajo.
                        </p>
                    )}
                </div>

                <form onSubmit={guardarStockMinimo}>
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

                    <p className="mt-1 text-sm text-zinc-500">
                        Se mostrará una alerta cuando el stock actual sea igual o inferior a este valor.
                    </p>

                    <div className="flex justify-center mt-5">
                        <Button type="submit" disabled={guardandoMinimo}>
                            {guardandoMinimo ? 'Guardando...' : 'Guardar stock mínimo'}
                        </Button>
                    </div>
                </form>
            </Card>

            <Card className="w-full max-w-3xl mx-auto mt-6 mb-8">
                <h2 className="text-2xl font-bold mb-6">
                    Movimiento de stock
                </h2>

                <form onSubmit={realizarMovimiento}>
                    <Label htmlFor="tipoMovimiento">
                        Tipo de movimiento
                    </Label>

                    <select
                        id="tipoMovimiento"
                        value={tipoMovimiento}
                        onChange={(e) => setTipoMovimiento(e.target.value)}
                        className="bg-white border border-[#D6D3D1] rounded-md px-3 py-2 block my-2 w-full text-[#1C1917] focus:outline-none focus:border-[#13100F]"
                    >
                        <option value="entrada">Aumentar stock</option>
                        <option value="salida">Disminuir stock</option>
                        <option value="ajuste">Ajustar al stock real</option>
                    </select>

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

                    <Label htmlFor="motivo">Motivo</Label>

                    <Input
                        id="motivo"
                        type="text"
                        placeholder="Ej: Compra a proveedor"
                        value={motivo}
                        onChange={(e) => setMotivo(e.target.value)}
                    />

                    <div className="flex justify-center mt-6">
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
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
                    <div className={`w-full max-w-md rounded-xl bg-white p-6 shadow-2xl transition-transform duration-300 ${desplazamientoAlerta}`}>
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                                !
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-[#1C1917]">
                                    No se pudo realizar la operación
                                </h2>
                                <p className="mt-3 text-sm text-[#57534E]">
                                    {mensajeAlerta}
                                </p>
                            </div>
                        </div>

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
        </div>
    )
}

export default StockDetalle