import React from 'react'
import Card from '../Components/UI/Card'
import Input from '../Components/UI/Input'
import Button from '../Components/UI/Button'
import Label from '../Components/UI/Label'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../Context/ContextoAutorizacion.jsx'

function LoginPage() {
    const { login, erroresBackEnd } = useAuth()
    const navigate = useNavigate()

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm()

    const onSubmit = handleSubmit(async (data) => {
        const usuario = await login(data)

        if (usuario) {
            navigate('/productos')
        }
    })

    return (
        <div className="flex min-h-screen items-center justify-center bg-white px-4 py-10">
            <div className="w-full max-w-md">
                <div className="mb-6 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-900 text-lg font-bold tracking-wide text-white">
                        GL
                    </div>

                    <h1 className="mt-4 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
                        Bienvenido
                    </h1>

                    <p className="mt-2 text-sm leading-6 text-stone-500">
                        Ingresá tus credenciales para continuar.
                    </p>
                </div>

                <Card className="w-full border border-stone-300 bg-stone-300 shadow-md shadow-stone-900/[0.08]">
                    {erroresBackEnd?.length > 0 && (
                        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4">
                            <p className="mb-2 text-sm font-semibold text-red-800">
                                No se pudo iniciar sesión
                            </p>

                            {erroresBackEnd.map((error, index) => (
                                <p key={index} className="text-sm leading-6 text-red-700">
                                    {error}
                                </p>
                            ))}
                        </div>
                    )}

                    <form onSubmit={onSubmit} className="space-y-5">
                        <div>
                            <Label htmlFor="usuario">Usuario</Label>

                            <Input
                                id="usuario"
                                type="text"
                                placeholder="Ingresá tu usuario"
                                {...register('usuario', { required: true })}
                            />

                            {errors.usuario && (
                                <p className="mt-1.5 text-xs font-medium text-red-600">
                                    El usuario es requerido.
                                </p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="contrasena">Contraseña</Label>

                            <Input
                                id="contrasena"
                                type="password"
                                placeholder="Ingresá tu contraseña"
                                {...register('contrasena', { required: true })}
                            />

                            {errors.contrasena && (
                                <p className="mt-1.5 text-xs font-medium text-red-600">
                                    La contraseña es requerida.
                                </p>
                            )}
                        </div>

                        <div className="pt-1">
                            <Button type="submit" className="w-full">
                                Iniciar sesión
                            </Button>
                        </div>
                    </form>

                    <div className="mt-6 border-t border-stone-200/70 pt-5 text-center">
                        <p className="text-sm text-stone-500">
                            ¿Todavía no tenés una cuenta?{' '}
                            <Link
                                className="font-semibold text-stone-900 underline-offset-4 transition hover:text-stone-600 hover:underline"
                                to="/registro"
                            >
                                Registrate aquí
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

export default LoginPage