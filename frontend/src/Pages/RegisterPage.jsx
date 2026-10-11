import React from 'react'
import Card from '../Components/UI/Card'
import Input from '../Components/UI/Input'
import Label from '../Components/UI/Label'
import Button from '../Components/UI/Button'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../Context/ContextoAutorizacion.jsx'

function RegisterPage() {
    const { register: registerContexto, erroresBackEnd } = useAuth()
    const navigate = useNavigate()

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch
    } = useForm()

    const onSubmit = handleSubmit(async (data) => {
        const usuario = await registerContexto(data)

        if (usuario) {
            navigate('/productos')
        }
    })

    return (
        <div className="flex min-h-screen items-center justify-center bg-white px-4 py-10">
            <div className="w-full max-w-lg">
                <div className="mb-6 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-900 text-lg font-bold tracking-wide text-white">
                        GL
                    </div>

                    <h1 className="mt-4 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
                        Crear una cuenta
                    </h1>

                    <p className="mt-2 text-sm leading-6 text-stone-500">
                        Completá tus datos para acceder al sistema de gestión.
                    </p>
                </div>

                <Card className="w-full border border-stone-300 bg-stone-300 shadow-md shadow-stone-900/[0.08]">
                    {erroresBackEnd?.length > 0 && (
                        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4">
                            <p className="mb-2 text-sm font-semibold text-red-800">
                                No se pudo crear la cuenta
                            </p>

                            {erroresBackEnd.map((error, index) => (
                                <p key={index} className="text-sm leading-6 text-red-700">
                                    {error}
                                </p>
                            ))}
                        </div>
                    )}

                    <form onSubmit={onSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <Label htmlFor="nombre">Nombre</Label>

                                <Input
                                    id="nombre"
                                    {...register('nombre', { required: true })}
                                    type="text"
                                    placeholder="Ingresá tu nombre"
                                />

                                {errors.nombre && (
                                    <p className="mt-1.5 text-xs font-medium text-red-600">
                                        El nombre es requerido.
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="apellido">Apellido</Label>

                                <Input
                                    id="apellido"
                                    {...register('apellido', { required: true })}
                                    type="text"
                                    placeholder="Ingresá tu apellido"
                                />

                                {errors.apellido && (
                                    <p className="mt-1.5 text-xs font-medium text-red-600">
                                        El apellido es requerido.
                                    </p>
                                )}
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="usuario">Usuario</Label>

                            <Input
                                id="usuario"
                                {...register('usuario', { required: true })}
                                type="text"
                                placeholder="Elegí un nombre de usuario"
                            />

                            {errors.usuario && (
                                <p className="mt-1.5 text-xs font-medium text-red-600">
                                    El usuario es requerido.
                                </p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="mail">Correo electrónico</Label>

                            <Input
                                id="mail"
                                {...register('mail', { required: true })}
                                type="email"
                                placeholder="tu@correo.com"
                            />

                            {errors.mail && (
                                <p className="mt-1.5 text-xs font-medium text-red-600">
                                    El correo es requerido.
                                </p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="contrasena">Contraseña</Label>

                            <Input
                                id="contrasena"
                                {...register('contrasena', { required: true })}
                                type="password"
                                placeholder="Ingresá una contraseña"
                            />

                            {errors.contrasena && (
                                <p className="mt-1.5 text-xs font-medium text-red-600">
                                    La contraseña es requerida.
                                </p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="repetirContrasena">
                                Repetir contraseña
                            </Label>

                            <Input
                                id="repetirContrasena"
                                {...register('repetirContrasena', {
                                    required: true,
                                    validate: (valor) =>
                                        valor === watch('contrasena') ||
                                        'Las contraseñas no coinciden'
                                })}
                                type="password"
                                placeholder="Volvé a ingresar la contraseña"
                            />

                            {errors.repetirContrasena && (
                                <p className="mt-1.5 text-xs font-medium text-red-600">
                                    {errors.repetirContrasena.message ||
                                        'Debés repetir la contraseña.'}
                                </p>
                            )}
                        </div>

                        <div className="pt-2">
                            <Button type="submit" className="w-full">
                                Crear cuenta
                            </Button>
                        </div>
                    </form>

                    <div className="mt-6 border-t border-stone-200/70 pt-5 text-center">
                        <p className="text-sm text-stone-500">
                            ¿Ya tenés una cuenta?{' '}
                            <Link
                                className="font-semibold text-stone-900 underline-offset-4 transition hover:text-stone-600 hover:underline"
                                to="/iniciar-sesion"
                            >
                                Iniciá sesión
                            </Link>
                        </p>
                    </div>
                </Card>

                <p className="mt-6 text-center text-xs text-stone-400">
                    Gestión Local · Sistema de gestión e inventario
                </p>
            </div>
        </div>
    )
}

export default RegisterPage