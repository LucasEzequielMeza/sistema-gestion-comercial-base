import {
    FaBoxOpen,
    FaBox,
    FaCashRegister,
    FaTachometerAlt,
    FaTruck,
    FaTags,
    FaFileAlt,
    FaShoppingCart
} from 'react-icons/fa'
import { MdInventory } from 'react-icons/md'

export const privateRoutes = [
    {
        name: 'Panel de control',
        path: '/panel-de-control',
        icon: FaTachometerAlt
    },
    {
        name: 'Ventas',
        path: '/ventas',
        icon: FaCashRegister
    },
    {
        name: 'Compras',
        path: '/compras',
        icon:  FaShoppingCart
    },
    {
        name: 'Productos',
        path: '/productos',
        icon: FaBoxOpen
    },
    {
        name: 'Productos inactivos',
        path: '/productos/inactivos',
        icon: FaBox
    },
    {
        name: 'Stock',
        path: '/stock',
        icon: MdInventory
    },
    {
        name: 'Informes',
        path: '/informes',
        icon: FaFileAlt
    },
    {
        name: 'Categorías',
        path: '/categorias',
        icon: FaTags
    },
    {
        name: 'Proveedores',
        path: '/proveedores',
        icon: FaTruck
    }
]