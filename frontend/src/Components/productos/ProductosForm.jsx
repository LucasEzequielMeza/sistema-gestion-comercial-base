import React, { useEffect, useState } from 'react'
import Card from '../UI/Card'
import Input from '../UI/Input'
import Label from '../UI/Label'
import Button from '../UI/Button'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { useProducto } from '../../Context/ContextoProductos'

function ProductosForm() {

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch
    } = useForm({
        defaultValues: {
            nombre: '',
            descripcion: '',
            imagen: '',
            codigo: '',
            precio_compra: '',
            precio_venta: '',
            porcentaje_ganancia: 25,
            stock: '',
            stock_minimo: ''
        }
    })

    const [errorCodigo, setErrorCodigo] = useState('')

    const navigate = useNavigate()
    const params = useParams()

    const {
        crearProducto,
        actualizarProducto,
        obtenerProductoPorId,
        productoError,
        limpiarProductoError
    } = useProducto()

    const precioCompra = watch('precio_compra')
    const porcentajeGanancia = watch('porcentaje_ganancia')

    const onSubmit = handleSubmit(async (data) => {

        limpiarProductoError()
        setErrorCodigo('')

        let respuesta

        if (params.id) {

            const datosProducto = {
                nombre: data.nombre,
                descripcion: data.descripcion,
                imagen: data.imagen,
                codigo: data.codigo,
                precio_compra: data.precio_compra,
                precio_venta: data.precio_venta
            }

            respuesta = await actualizarProducto(
                params.id,
                datosProducto
            )

        } else {

            const {
                porcentaje_ganancia,
                ...datosProducto
            } = data

            respuesta = await crearProducto(
                datosProducto
            )

        }

        if (respuesta) {
            navigate('/productos')
        }

    })

    useEffect(() => {

        if (params.id) {

            obtenerProductoPorId(params.id).then((productoItem) => {

                if (!productoItem) {
                    return
                }

                setValue('nombre', productoItem.nombre || '')
                setValue('descripcion', productoItem.descripcion || '')
                setValue('imagen', productoItem.imagen || '')
                setValue('codigo', productoItem.codigo || '')
                setValue('precio_compra', productoItem.precio_compra || '')
                setValue('precio_venta', productoItem.precio_venta || '')

                const precioCompra =
                    Number(productoItem.precio_compra)

                const precioVenta =
                    Number(productoItem.precio_venta)

                if (
                    precioCompra > 0 &&
                    precioVenta >= precioCompra
                ) {

                    const porcentaje =
                        ((precioVenta - precioCompra) /
                            precioCompra) * 100

                    setValue(
                        'porcentaje_ganancia',
                        porcentaje.toFixed(2)
                    )

                }

            })

        }

    }, [params.id])

    useEffect(() => {

        if (
            precioCompra === '' ||
            porcentajeGanancia === ''
        ) {

            setValue('precio_venta', '')
            return

        }

        const precio = Number(precioCompra)
        const porcentaje = Number(porcentajeGanancia)

        if (
            precio >= 0 &&
            porcentaje >= 0
        ) {

            const precioVenta =
                precio + (precio * porcentaje / 100)

            setValue(
                'precio_venta',
                precioVenta.toFixed(2)
            )

        }

    }, [
        precioCompra,
        porcentajeGanancia,
        setValue
    ])

    useEffect(() => {

        if (productoError.length > 0) {

            setErrorCodigo(
                productoError[0].message ||
                productoError[0].error ||
                productoError[0]
            )

            const temporizador = setTimeout(() => {
                setErrorCodigo('')
            }, 10000)

            return () => clearTimeout(temporizador)

        }

    }, [productoError])

    return (
        <div className="min-h-screen bg-[#F5F5F4] p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-4xl space-y-6">

                {/* Encabezado */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm font-medium text-stone-500">
                            Gestión de inventario
                        </p>

                        <h1 className="mt-1 text-2xl font-bold text-stone-900 sm:text-3xl">
                            {params.id
                                ? 'Editar producto'
                                : 'Crear producto'}
                        </h1>

                        <p className="mt-2 text-sm text-stone-600">
                            {params.id
                                ? 'Actualizá la información del producto.'
                                : 'Completá los datos para incorporar un producto al inventario.'}
                        </p>
                    </div>

                    <Button
                        type="button"
                        onClick={() => navigate('/productos')}
                    >
                        Volver a productos
                    </Button>
                </div>

                <Card className="w-full rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-8">
                    <form onSubmit={onSubmit} className="space-y-6">

                        {/* Información principal */}
                        <div>
                            <h2 className="text-lg font-bold text-stone-900">
                                Información del producto
                            </h2>

                            <p className="mt-1 text-sm text-stone-500">
                                Datos generales para identificar el producto.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                            <div className="sm:col-span-2">
                                <Label htmlFor="nombre">Nombre</Label>

                                <div className="mt-2">
                                    <Input
                                        type="text"
                                        {...register('nombre', {
                                            required: true
                                        })}
                                    />
                                </div>

                                {errors.nombre && (
                                    <p className="mt-2 text-sm text-red-600">
                                        El nombre del producto es requerido
                                    </p>
                                )}
                            </div>

                            <div className="sm:col-span-2">
                                <Label htmlFor="descripcion">
                                    Descripción
                                </Label>

                                <textarea
                                    id="descripcion"
                                    rows={4}
                                    placeholder="Ingresá una descripción del producto..."
                                    className="mt-2 block w-full resize-y rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
                                    {...register('descripcion')}
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <Label htmlFor="imagen">Imagen</Label>

                                <div className="mt-2">
                                    <Input
                                        type="text"
                                        placeholder="URL de la imagen"
                                        {...register('imagen')}
                                    />
                                </div>

                                <p className="mt-2 text-xs text-stone-500">
                                    Pegá la dirección web de la imagen del producto.
                                </p>
                            </div>

                            <div className="sm:col-span-2">
                                <Label htmlFor="codigo">Código</Label>

                                {errorCodigo && (
                                    <p className="mt-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                        {errorCodigo}
                                    </p>
                                )}

                                <div className="mt-2">
                                    <Input
                                        type="text"
                                        {...register('codigo')}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Precios */}
                        <div className="border-t border-stone-200 pt-6">
                            <h2 className="text-lg font-bold text-stone-900">
                                Precios
                            </h2>

                            <p className="mt-1 text-sm text-stone-500">
                                Definí el costo y el porcentaje de ganancia para calcular el precio de venta.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                            <div>
                                <Label htmlFor="precio_compra">
                                    Precio de compra
                                </Label>

                                <div className="mt-2">
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        {...register('precio_compra', {
                                            required: true,
                                            min: {
                                                value: 0,
                                                message: 'El precio no puede ser negativo'
                                            }
                                        })}
                                    />
                                </div>

                                {errors.precio_compra && (
                                    <p className="mt-2 text-sm text-red-600">
                                        El precio de compra es requerido
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="porcentaje_ganancia">
                                    Ganancia sobre el costo
                                </Label>

                                <select
                                    className="mt-2 block w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
                                    {...register('porcentaje_ganancia')}
                                >
                                    <option value="15">15%</option>
                                    <option value="20">20%</option>
                                    <option value="25">25%</option>
                                    <option value="30">30%</option>
                                    <option value="35">35%</option>
                                    <option value="40">40%</option>
                                </select>
                            </div>

                            <div className="sm:col-span-2">
                                <Label htmlFor="precio_venta">
                                    Precio de venta calculado
                                </Label>

                                <div className="mt-2">
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        readOnly
                                        {...register('precio_venta', {
                                            required: true,
                                            min: {
                                                value: 0,
                                                message: 'El precio no puede ser negativo'
                                            }
                                        })}
                                    />
                                </div>

                                <p className="mt-2 text-xs text-stone-500">
                                    Este importe se calcula automáticamente según el costo y la ganancia seleccionada.
                                </p>

                                {errors.precio_venta && (
                                    <p className="mt-2 text-sm text-red-600">
                                        El precio de venta es requerido
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Stock inicial */}
                        {!params.id && (
                            <>
                                <div className="border-t border-stone-200 pt-6">
                                    <h2 className="text-lg font-bold text-stone-900">
                                        Stock inicial
                                    </h2>

                                    <p className="mt-1 text-sm text-stone-500">
                                        Indicá la cantidad inicial y el nivel mínimo de stock.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                                    <div>
                                        <Label htmlFor="stock">
                                            Stock inicial
                                        </Label>

                                        <div className="mt-2">
                                            <Input
                                                type="number"
                                                step="0.001"
                                                min="0"
                                                {...register('stock', {
                                                    required: true,
                                                    min: {
                                                        value: 0,
                                                        message: 'El stock no puede ser negativo'
                                                    }
                                                })}
                                            />
                                        </div>

                                        {errors.stock && (
                                            <p className="mt-2 text-sm text-red-600">
                                                El stock inicial es requerido
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="stock_minimo">
                                            Stock mínimo
                                        </Label>

                                        <div className="mt-2">
                                            <Input
                                                type="number"
                                                step="0.001"
                                                min="0"
                                                {...register('stock_minimo', {
                                                    required: true,
                                                    min: {
                                                        value: 0,
                                                        message: 'El stock no puede ser negativo'
                                                    }
                                                })}
                                            />
                                        </div>

                                        {errors.stock_minimo && (
                                            <p className="mt-2 text-sm text-red-600">
                                                El stock mínimo es requerido
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Acciones */}
                        <div className="flex flex-col-reverse gap-3 border-t border-stone-200 pt-6 sm:flex-row sm:justify-end">
                            <Button
                                type="button"
                                onClick={() => navigate('/productos')}
                            >
                                Cancelar
                            </Button>

                            <Button type="submit">
                                {params.id ? 'Actualizar producto' : 'Crear producto'}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    )
}

export default ProductosForm