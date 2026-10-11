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

                setValue(
                    'nombre',
                    productoItem.nombre || ''
                )

                setValue(
                    'descripcion',
                    productoItem.descripcion || ''
                )

                setValue(
                    'imagen',
                    productoItem.imagen || ''
                )

                setValue(
                    'codigo',
                    productoItem.codigo || ''
                )

                setValue(
                    'precio_compra',
                    productoItem.precio_compra || ''
                )

                setValue(
                    'precio_venta',
                    productoItem.precio_venta || ''
                )

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

            setValue(
                'precio_venta',
                ''
            )

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

        <div>
            <Card>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 my-4">
                    <h2 className="text-3xl font-bold text-[#1C1917]">
                        {params.id
                            ? 'Editar producto'
                            : 'Crear producto'}
                    </h2>
                    <Button type="button" onClick={() => navigate('/productos')}>Volver</Button>
                </div>

                <form onSubmit={onSubmit}>
                    <Label htmlFor="nombre">Nombre</Label>
                    <Input
                        type="text"
                        {...register('nombre', {
                            required: true
                        })}
                    />
                    {errors.nombre && (
                        <p className="text-red-500"> El nombre del producto es requerido</p>
                    )}

                    <Label htmlFor="descripcion">Descripción</Label>

                    <textarea
                        className="bg-white border border-[#D6D3D1] rounded-md px-3 py-2 block my-2 w-full text-[#1C1917] placeholder:text-[#78716C] focus:outline-none focus:border-[#13100F]"
                        {...register('descripcion')}
                    />

                    <Label htmlFor="imagen">Imagen</Label>

                    <Input
                        type="text"
                        placeholder="URL de la imagen"
                        {...register('imagen')}
                    />

                    <Label htmlFor="codigo">Código</Label>
                    {errorCodigo && (
                        <p className="text-red-500">
                            {errorCodigo}
                        </p>
                    )}

                    <Input type="text" {...register('codigo')}/>

                    <Label htmlFor="precio_compra">Precio de compra</Label>
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
                    {errors.precio_compra && (
                        <p className="text-red-500">El precio de compra es requerido</p>
                    )}

                    <Label htmlFor="porcentaje_ganancia">Ganancia sobre el costo</Label>
                    <select
                        className="bg-white border border-[#D6D3D1] rounded-md px-3 py-2 block my-2 w-full text-[#1C1917] focus:outline-none focus:border-[#13100F]"
                        {...register('porcentaje_ganancia')}
                    >
                        <option value="15">15%</option>
                        <option value="20">20%</option>
                        <option value="25">25%</option>
                        <option value="30">30%</option>
                        <option value="35">35%</option>
                        <option value="40">40%</option>
                    </select>

                    <Label htmlFor="precio_venta">Precio de venta</Label>
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
                    {errors.precio_venta && (
                        <p className="text-red-500">El precio de venta es requerido</p>
                    )}

                    {!params.id && (

                        <>
                            <Label htmlFor="stock">Stock inicial</Label>
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
                            {errors.stock && (
                                <p className="text-red-500">El stock inicial es requerido</p>
                            )}

                            <Label htmlFor="stock_minimo">Stock mínimo</Label>
                            <Input
                                type="number"
                                step="0.001"
                                min="0"
                                {...register('stock_minimo', {
                                    required: true,
                                    min: {
                                        value: 0,
                                        message: 'El stock mínimo es requerido'
                                    }
                                })}
                            />
                            {errors.stock_minimo && (
                                <p className="text-red-500">El stock mínimo es requerido</p>
                            )}
                        </>

                    )}

                    <div className="flex justify-center mt-4">

                        <Button type="submit"> {params.id
                                ? 'Actualizar'
                                : 'Crear'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    )
}

export default ProductosForm