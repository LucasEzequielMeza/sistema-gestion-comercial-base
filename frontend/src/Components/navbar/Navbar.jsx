import React from 'react'
import { IoLogOut } from 'react-icons/io5'
import { IoMenu } from 'react-icons/io5'
import { Link, useLocation } from 'react-router-dom'
import { privateRoutes } from './navegacion.js'
import { useAuth } from '../../Context/ContextoAutorizacion'

function Navbar({ menuAbierto, setMenuAbierto }) {

    const location = useLocation()
 
    const {
        logout,
        usuario,
        estaAutorizado
    } = useAuth()

    if (!estaAutorizado) {

        return null

    }

    return (

        <nav
            className={`fixed left-0 top-0 bg-[#13100F] text-white transition-all duration-300 z-50 ${
                menuAbierto
                    ? 'w-full md:w-64 h-auto'
                    : 'w-full md:w-20 h-14'
            } md:h-screen`}
        >
            <div className="flex h-full flex-col">

                <div className="flex h-14 items-center justify-between p-3">

                    {menuAbierto && (

                        <Link
                            to="/productos"
                            className="text-xl font-bold flex items-center"
                        >
                            Gestión Local
                        </Link>

                    )}

                    <button
                        type="button"
                        onClick={() =>
                            setMenuAbierto(!menuAbierto)
                        }
                        className={`rounded-md p-2 hover:bg-[#26211F] ${
                            !menuAbierto
                                ? 'mx-auto'
                                : ''
                        }`}
                    >
                        <IoMenu className="text-xl" />
                    </button>

                </div>

                <div
                    className={`flex flex-col gap-2 px-3 mt-6 ${
                        menuAbierto
                            ? 'pb-4 md:flex-1'
                            : 'hidden md:flex md:flex-1'
                    }`}
                >

                    {privateRoutes.map((route) => {

                        const rutaActiva =
                            location.pathname === route.path ||
                            location.pathname.startsWith(
                                `${route.path}/`
                            )

                        return (

                            <Link
                                key={route.path}
                                to={route.path}
                                onClick={() => {

                                    if (window.innerWidth < 768) {

                                        setMenuAbierto(false)

                                    }

                                }}
                                className={`flex items-center rounded-md p-3 transition ${
                                    rutaActiva
                                        ? 'bg-[#26211F] font-bold'
                                        : 'hover:bg-[#26211F]'
                                } ${
                                    menuAbierto
                                        ? 'justify-start'
                                        : 'justify-center'
                                }`}
                            >

                                {route.icon && (

                                    <route.icon className="text-xl shrink-0" />

                                )}

                                {menuAbierto && (

                                    <span className="ml-3">

                                        {route.name}

                                    </span>

                                )}

                            </Link>

                        )

                    })}

                </div>

                <div
                    className={`border-t border-white/20 p-4 ${
                        menuAbierto
                            ? ''
                            : 'hidden md:block'
                    }`}
                >

                    {menuAbierto && usuario && (

                        <div className="mb-3 px-2">

                            <p className="text-sm text-white/60">
                                Usuario
                            </p>

                            <p className="font-semibold truncate flex items-center">
                                {usuario.nombre} {usuario.apellido}
                            </p>

                        </div>

                    )}

                    <button
                        type="button"
                        onClick={logout}
                        className={`w-full rounded-md p-3 hover:bg-[#26211F] ${
                            menuAbierto
                                ? 'text-left'
                                : 'flex justify-center'
                        }`}
                    >

                        {menuAbierto ? (

                            <div className="flex items-center gap-3">

                                <IoLogOut className="text-xl" />

                                <span>
                                    Cerrar sesión
                                </span>

                            </div>

                        ) : (

                            <IoLogOut className="text-xl" />

                        )}

                    </button>

                </div>

            </div>

        </nav>

    )

}

export default Navbar