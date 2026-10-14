# Sistema de Gestión Comercial

Sistema de gestión comercial desarrollado para pequeños y medianos comercios, orientado al control de productos, stock, proveedores, compras y ventas.

## Funcionalidades

- **Autenticación:** registro, inicio y cierre de sesión, con protección de rutas.
- **Productos:** alta, consulta, búsqueda, edición y administración de productos.
- **Categorías:** organización de los productos por categoría.
- **Stock:** consulta y control de existencias.
- **Movimientos de stock:** registro de movimientos relacionados con el inventario.
- **Proveedores:** administración de proveedores.
- **Compras:** gestión de compras de mercadería.
- **Ventas:** registro y gestión de ventas.

*Las funcionalidades disponibles pueden variar según el estado actual del desarrollo.*

## Tecnologías utilizadas

### Frontend
- React
- Vite
- JavaScript
- Axios
- Tailwind CSS

### Backend
- Node.js
- Express
- PostgreSQL
- JSON Web Token (JWT)
- bcrypt
- Zod

## Estructura del proyecto

```text
sistema-gestion-comercial-base/
├── backend/
│   └── src/
├── frontend/
├── database/
│   └── init.sql
├── render.yaml
└── README.md
```

## Requisitos previos

Para ejecutar el proyecto localmente se necesita:

- Node.js y npm.
- PostgreSQL.
- Git, si se desea clonar el repositorio.

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/LucasEzequielMeza/sistema-gestion-comercial-base.git
cd sistema-gestion-comercial-base
```

### 2. Configurar el backend

```bash
cd backend
npm install
```

Crear un archivo `.env` dentro de la carpeta `backend`, utilizando `.env.example` como referencia si está disponible.

Configurar las variables de entorno necesarias para la conexión a PostgreSQL, la autenticación y la URL del frontend.

### 3. Configurar la base de datos

Crear una base de datos PostgreSQL y ejecutar el script `database/init.sql` desde una herramienta compatible, como DBeaver o pgAdmin.

Verificar que las variables de conexión del archivo `.env` coincidan con los datos de la base de datos.

### 4. Configurar el frontend

Abrir otra terminal, volver a la raíz del proyecto y ejecutar:

```bash
cd frontend
npm install
```

Crear el archivo `.env` del frontend con la URL de la API correspondiente. Para el entorno local, debe apuntar al backend local, utilizando la variable `VITE_API_URL`.

## Ejecución en desarrollo

Iniciar el backend desde la carpeta `backend`:

```bash
npm run dev
```

Iniciar el frontend desde la carpeta `frontend`, en otra terminal:

```bash
npm run dev
```

Vite mostrará la dirección local desde la que se puede acceder a la aplicación.

## Seguridad

- Las credenciales y claves privadas se configuran mediante variables de entorno.
- Los archivos `.env` no deben subirse al repositorio.
- La autenticación utiliza tokens JWT y cookies configuradas desde el backend.
- Las contraseñas se gestionan mediante bcrypt.

## Estado del proyecto

El sistema se encuentra en desarrollo. Se continúa trabajando en sus funcionalidades, validaciones, manejo de errores, seguridad y preparación para su publicación.

## Autor

Lucas Ezequiel Meza

Repositorio: https://github.com/LucasEzequielMeza/sistema-gestion-comercial-base