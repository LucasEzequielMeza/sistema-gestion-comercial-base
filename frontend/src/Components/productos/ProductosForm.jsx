import React, { useEffect, useState } from 'react'
import Card from '../UI/Card'
import Input from '../UI/Input'
import Label from '../UI/Label'
import Button from '../UI/Button'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { useProducto } from '../../Context/ContextoProductos'
import { useCategorias } from '../../Context/ContextoCategorias'

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
            categoria_id: '',
            precio_compra: '',
            precio_venta: '',
            porcentaje_ganancia: '25',
            stock: '',
            stock_minimo: ''
        }
    })

    const [errorCodigo, setErrorCodigo] = useState('')
    const [errorCategorias, setErrorCategorias] = useState('')
    const [errorImagen, setErrorImagen] = useState('')

    const navigate = useNavigate()
    const params = useParams()

    const {
        crearProducto,
        actualizarProducto,
        obtenerProductoPorId,
        productoError,
        limpiarProductoError
    } = useProducto()

    const {
        categorias,
        obtenerCategorias,
        categoriaError
    } = useCategorias()

    const precioCompra = watch('precio_compra')
    const porcentajeGanancia = watch('porcentaje_ganancia')
    const categoriaSeleccionada = watch('categoria_id')
    const imagen = watch('imagen')

    const { onChange: registrarCambioImagen, ...registroImagen } = register('imagen')

    const importarImagen = (event) => {
        const archivo = event.target.files[0]

        if (!archivo) return

        if (!archivo.type.startsWith('image/')) {
            setErrorImagen('Seleccioná un archivo de imagen válido.')
            event.target.value = ''
            return
        }

        if (archivo.size > 2 * 1024 * 1024) {
            setErrorImagen('La imagen no puede superar los 2 MB.')
            event.target.value = ''
            return
        }

        setErrorImagen('')

        const lector = new FileReader()

        lector.onload = () => {
            setValue('imagen', lector.result, {
                shouldDirty: true,
                shouldValidate: true
            })
        }

        lector.onerror = () => {
            setErrorImagen('No se pudo leer la imagen seleccionada.')
            event.target.value = ''
        }

        lector.readAsDataURL(archivo)
    }

    const cambiarUrlImagen = (event) => {
        registrarCambioImagen(event)
        setErrorImagen('')

        const archivo = document.getElementById('archivo-imagen')

        if (archivo) {
            archivo.value = ''
        }
    }

    useEffect(() => {
        const cargarDatos = async () => {
            setErrorCategorias('')

            const categoriasRecibidas = await obtenerCategorias()

            if (!categoriasRecibidas) {
                setErrorCategorias('No se pudieron cargar las categorías. Volvé a intentarlo.')
                return
            }

            if (params.id) {
                const productoItem = await obtenerProductoPorId(params.id)

                if (!productoItem) {
                    return
                }

                setValue('nombre', productoItem.nombre || '')
                setValue('descripcion', productoItem.descripcion || '')
                setValue('imagen', productoItem.imagen || '')
                setValue('codigo', productoItem.codigo || '')
                setValue('categoria_id', productoItem.categoria_id || '')
                setValue('precio_compra', productoItem.precio_compra ?? '')
                setValue('precio_venta', productoItem.precio_venta ?? '')

                const precioCompraProducto = Number(productoItem.precio_compra)
                const precioVentaProducto = Number(productoItem.precio_venta)

                if (precioCompraProducto > 0 && precioVentaProducto >= precioCompraProducto) {
                    const porcentaje = ((precioVentaProducto - precioCompraProducto) / precioCompraProducto) * 100
                    setValue('porcentaje_ganancia', porcentaje.toFixed(2))
                }
            }
        }

        cargarDatos()
    }, [params.id])

    useEffect(() => {
        if (precioCompra === '' || porcentajeGanancia === '') {
            setValue('precio_venta', '')
            return
        }

        const precio = Number(precioCompra)
        const porcentaje = Number(porcentajeGanancia)

        if (Number.isFinite(precio) && Number.isFinite(porcentaje) && precio >= 0 && porcentaje >= 0) {
            const precioVenta = precio + (precio * porcentaje / 100)
            setValue('precio_venta', precioVenta.toFixed(2))
        }
    }, [precioCompra, porcentajeGanancia, setValue])

    useEffect(() => {
        if (productoError.length > 0) {
            const mensaje = productoError
                .map((error) => error?.message || error?.error || error)
                .join(' ')

            setErrorCodigo(mensaje)

            const temporizador = setTimeout(() => setErrorCodigo(''), 10000)
            return () => clearTimeout(temporizador)
        }
    }, [productoError])

    useEffect(() => {
        if (categoriaError.length > 0) {
            const mensaje = categoriaError
                .map((error) => error?.message || error?.error || error)
                .join(' ')

            setErrorCategorias(mensaje)
        }
    }, [categoriaError])

    const onSubmit = handleSubmit(async (data) => {
        limpiarProductoError()
        setErrorCodigo('')
        setErrorCategorias('')

        if (!data.categoria_id) {
            setErrorCategorias('Seleccioná una categoría para el producto.')
            return
        }

        const datosProducto = {
            nombre: data.nombre,
            descripcion: data.descripcion,
            imagen: data.imagen,
            codigo: data.codigo,
            categoria_id: data.categoria_id,
            precio_compra: Number(data.precio_compra),
            precio_venta: Number(data.precio_venta)
        }

        let respuesta

        if (params.id) {
            respuesta = await actualizarProducto(params.id, datosProducto)
        } else {
            respuesta = await crearProducto({
                ...datosProducto,
                stock: Number(data.stock),
                stock_minimo: Number(data.stock_minimo)
            })
        }

        if (respuesta) {
            navigate('/productos')
        }
    })

    return (
        <div className="min-h-screen bg-[#F5F5F4] p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-4xl space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm font-medium text-stone-500">
                            Gestión de inventario
                        </p>

                        <h1 className="mt-1 text-2xl font-bold text-stone-900 sm:text-3xl">
                            {params.id ? 'Editar producto' : 'Crear producto'}
                        </h1>

                        <p className="mt-2 text-sm text-stone-600">
                            {params.id
                                ? 'Actualizá la información del producto.'
                                : 'Completá los datos para incorporar un producto al inventario.'}
                        </p>
                    </div>

                    <Button type="button" onClick={() => navigate('/productos')}>
                        Volver a productos
                    </Button>
                </div>

                <Card className="w-full rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-8">
                    <form onSubmit={onSubmit} className="space-y-6">
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
                                        id="nombre"
                                        type="text"
                                        {...register('nombre', { required: 'El nombre del producto es requerido' })}
                                    />
                                </div>
                                {errors.nombre && (
                                    <p className="mt-2 text-sm text-red-600">
                                        {errors.nombre.message}
                                    </p>
                                )}
                            </div>

                            <div className="sm:col-span-2">
                                <Label htmlFor="descripcion">Descripción</Label>
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
                                        id="imagen"
                                        type="text"
                                        placeholder="Pegá la URL de la imagen"
                                        {...registroImagen}
                                        onChange={cambiarUrlImagen}
                                    />
                                </div>

                                <div className="mt-3">
                                    <label
                                        htmlFor="archivo-imagen"
                                        className="inline-flex cursor-pointer items-center rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
                                    >
                                        Importar imagen
                                    </label>

                                    <input
                                        id="archivo-imagen"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={importarImagen}
                                    />
                                </div>

                                {errorImagen && (
                                    <p className="mt-2 text-sm text-red-600">
                                        {errorImagen}
                                    </p>
                                )}

                                {imagen && (
                                    <div className="mt-4">
                                        <p className="mb-2 text-sm text-stone-600">
                                            Vista previa
                                        </p>

                                        <img
                                            src={imagen}
                                            alt="Vista previa del producto"
                                            className="h-40 w-40 rounded-xl border border-stone-200 bg-white object-contain p-2"
                                            onError={(event) => {
                                                event.currentTarget.style.display = 'none'
                                            }}
                                            onLoad={(event) => {
                                                event.currentTarget.style.display = 'block'
                                            }}
                                        />
                                    </div>
                                )}

                                <p className="mt-2 text-xs text-stone-500">
                                    Podés pegar una URL o importar una imagen de hasta 2 MB. Al elegir una opción, se reemplaza la anterior.
                                </p>
                            </div>

                            <div>
                                <Label htmlFor="codigo">Código</Label>
                                <div className="mt-2">
                                    <Input
                                        id="codigo"
                                        type="text"
                                        {...register('codigo')}
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="categoria_id">Categoría</Label>
                                <select
                                    id="categoria_id"
                                    className="mt-2 block w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
                                    {...register('categoria_id', {
                                        required: 'Seleccioná una categoría'
                                    })}
                                >
                                    <option value="">Seleccioná una categoría</option>
                                    {categorias.map((categoriaItem) => (
                                        <option key={categoriaItem.id} value={categoriaItem.id}>
                                            {categoriaItem.nombre}
                                        </option>
                                    ))}
                                </select>

                                {errors.categoria_id && (
                                    <p className="mt-2 text-sm text-red-600">
                                        {errors.categoria_id.message}
                                    </p>
                                )}

                                {categoriaSeleccionada &&
                                    !categorias.some((categoriaItem) => String(categoriaItem.id) === String(categoriaSeleccionada)) && (
                                        <p className="mt-2 text-sm text-amber-700">
                                            La categoría asignada anteriormente está inactiva o ya no está disponible. Seleccioná una categoría activa.
                                        </p>
                                    )}
                            </div>

                            {errorCategorias && (
                                <div className="sm:col-span-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                    {errorCategorias}
                                </div>
                            )}

                            {errorCodigo && (
                                <div className="sm:col-span-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                    {errorCodigo}
                                </div>
                            )}
                        </div>

                        <div className="border-t border-stone-200 pt-6">
                            <h2 className="text-lg font-bold text-stone-900">Precios</h2>
                            <p className="mt-1 text-sm text-stone-500">
                                Definí el costo y el porcentaje de ganancia para calcular el precio de venta.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <div>
                                <Label htmlFor="precio_compra">Precio de compra</Label>
                                <div className="mt-2">
                                    <Input
                                        id="precio_compra"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        {...register('precio_compra', {
                                            required: 'El precio de compra es requerido',
                                            valueAsNumber: true,
                                            min: {
                                                value: 0,
                                                message: 'El precio no puede ser negativo'
                                            }
                                        })}
                                    />
                                </div>
                                {errors.precio_compra && (
                                    <p className="mt-2 text-sm text-red-600">
                                        {errors.precio_compra.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="porcentaje_ganancia">Ganancia sobre el costo</Label>
                                <select
                                    id="porcentaje_ganancia"
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
                                <Label htmlFor="precio_venta">Precio de venta calculado</Label>
                                <div className="mt-2">
                                    <Input
                                        id="precio_venta"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        readOnly
                                        {...register('precio_venta', {
                                            required: 'El precio de venta es requerido',
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
                                        {errors.precio_venta.message}
                                    </p>
                                )}
                            </div>
                        </div>

                        {!params.id && (
                            <>
                                <div className="border-t border-stone-200 pt-6">
                                    <h2 className="text-lg font-bold text-stone-900">Stock inicial</h2>
                                    <p className="mt-1 text-sm text-stone-500">
                                        Indicá la cantidad inicial y el nivel mínimo de stock.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                    <div>
                                        <Label htmlFor="stock">Stock inicial</Label>
                                        <div className="mt-2">
                                            <Input
                                                id="stock"
                                                type="number"
                                                step="0.001"
                                                min="0"
                                                {...register('stock', {
                                                    required: 'El stock inicial es requerido',
                                                    valueAsNumber: true,
                                                    min: {
                                                        value: 0,
                                                        message: 'El stock no puede ser negativo'
                                                    }
                                                })}
                                            />
                                        </div>
                                        {errors.stock && (
                                            <p className="mt-2 text-sm text-red-600">
                                                {errors.stock.message}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="stock_minimo">Stock mínimo</Label>
                                        <div className="mt-2">
                                            <Input
                                                id="stock_minimo"
                                                type="number"
                                                step="0.001"
                                                min="0"
                                                {...register('stock_minimo', {
                                                    required: 'El stock mínimo es requerido',
                                                    valueAsNumber: true,
                                                    min: {
                                                        value: 0,
                                                        message: 'El stock no puede ser negativo'
                                                    }
                                                })}
                                            />
                                        </div>
                                        {errors.stock_minimo && (
                                            <p className="mt-2 text-sm text-red-600">
                                                {errors.stock_minimo.message}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="flex flex-col-reverse gap-3 border-t border-stone-200 pt-6 sm:flex-row sm:justify-end">
                            <Button type="button" onClick={() => navigate('/productos')}>
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