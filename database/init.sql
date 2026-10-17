
-- Esquema inicial del Sistema de Gestión Comercial.
-- Ejecutar una sola vez sobre una base de datos vacía.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Cada cliente tendrá su propio comercio.
CREATE TABLE comercios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(150) NOT NULL,
    cuit VARCHAR(20),
    direccion VARCHAR(200),
    localidad VARCHAR(100),
    telefono VARCHAR(50),
    mail_contacto VARCHAR(150),
    logo TEXT,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT comercios_logo_tamano_check
        CHECK (logo IS NULL OR length(logo) <= 1500000)
);

-- Usuarios: el usuario y el correo son únicos en el sistema para permitir el inicio de sesión.
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comercio_id UUID NOT NULL REFERENCES comercios(id) ON DELETE RESTRICT,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    usuario VARCHAR(50) NOT NULL UNIQUE,
    mail VARCHAR(150) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (comercio_id, id)
);

-- Categorías de cada comercio.
CREATE TABLE categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comercio_id UUID NOT NULL REFERENCES comercios(id) ON DELETE RESTRICT,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (comercio_id, nombre),
    UNIQUE (comercio_id, id)
);

-- Proveedores de cada comercio.
CREATE TABLE proveedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comercio_id UUID NOT NULL REFERENCES comercios(id) ON DELETE RESTRICT,
    nombre VARCHAR(150) NOT NULL,
    cuit VARCHAR(20),
    telefono VARCHAR(50),
    mail VARCHAR(150),
    direccion VARCHAR(200),
    contacto VARCHAR(150),
    observaciones TEXT,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (comercio_id, cuit),
    UNIQUE (comercio_id, id)
);

-- Productos y existencias.
CREATE TABLE productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comercio_id UUID NOT NULL REFERENCES comercios(id) ON DELETE RESTRICT,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    imagen TEXT,
    codigo VARCHAR(50),
    categoria_id UUID NOT NULL,
    precio_compra NUMERIC(10,2) NOT NULL CHECK (precio_compra >= 0),
    precio_venta NUMERIC(10,2) NOT NULL CHECK (precio_venta >= 0),
    stock NUMERIC(10,3) NOT NULL DEFAULT 0 CHECK (stock >= 0),
    stock_minimo NUMERIC(10,3) NOT NULL DEFAULT 0 CHECK (stock_minimo >= 0),
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (comercio_id, codigo),
    UNIQUE (comercio_id, id),
    FOREIGN KEY (comercio_id, categoria_id)
        REFERENCES categorias(comercio_id, id)
        ON DELETE RESTRICT
);

-- Movimientos de stock.
CREATE TABLE movimientos_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comercio_id UUID NOT NULL REFERENCES comercios(id) ON DELETE RESTRICT,
    producto_id UUID NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('entrada', 'salida', 'ajuste')),
    cantidad NUMERIC(10,3) NOT NULL CHECK (cantidad > 0),
    motivo VARCHAR(50) NOT NULL,
    stock_anterior NUMERIC(10,3) NOT NULL,
    stock_nuevo NUMERIC(10,3) NOT NULL,
    usuario_id UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (comercio_id, producto_id)
        REFERENCES productos(comercio_id, id)
        ON DELETE RESTRICT,
    FOREIGN KEY (comercio_id, usuario_id)
        REFERENCES usuarios(comercio_id, id)
        ON DELETE RESTRICT
);

-- Compras a proveedores.
CREATE TABLE compras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comercio_id UUID NOT NULL REFERENCES comercios(id) ON DELETE RESTRICT,
    proveedor_id UUID NOT NULL,
    usuario_id UUID NOT NULL,
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tipo_comprobante VARCHAR(50),
    numero_comprobante VARCHAR(100),
    total NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'confirmada', 'cancelada')),
    observaciones TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (comercio_id, id),
    FOREIGN KEY (comercio_id, proveedor_id)
        REFERENCES proveedores(comercio_id, id)
        ON DELETE RESTRICT,
    FOREIGN KEY (comercio_id, usuario_id)
        REFERENCES usuarios(comercio_id, id)
        ON DELETE RESTRICT
);

-- Detalle de cada compra.
-- El controlador valida que los productos pertenezcan al comercio de la compra.
CREATE TABLE detalle_compras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    compra_id UUID NOT NULL REFERENCES compras(id) ON DELETE RESTRICT,
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    cantidad NUMERIC(10,3) NOT NULL CHECK (cantidad > 0),
    costo_unitario NUMERIC(12,2) NOT NULL CHECK (costo_unitario >= 0),
    subtotal NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0),
    UNIQUE (compra_id, producto_id)
);

-- Evita duplicar comprobantes para un mismo proveedor dentro de un comercio.
CREATE UNIQUE INDEX uq_compras_comprobante
ON compras (comercio_id, proveedor_id, tipo_comprobante, numero_comprobante)
WHERE numero_comprobante IS NOT NULL
  AND TRIM(numero_comprobante) <> '';

-- Ventas registradas por los usuarios.
-- El número se asigna desde el backend y es independiente por comercio.
CREATE TABLE ventas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comercio_id UUID NOT NULL REFERENCES comercios(id) ON DELETE RESTRICT,
    numero_venta BIGINT NOT NULL CHECK (numero_venta > 0),
    usuario_id UUID NOT NULL,
    total NUMERIC(12,2) NOT NULL CHECK (total > 0),
    estado VARCHAR(20) NOT NULL DEFAULT 'completada'
        CHECK (estado IN ('completada', 'anulada')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (comercio_id, numero_venta),
    UNIQUE (comercio_id, id),
    FOREIGN KEY (comercio_id, usuario_id)
        REFERENCES usuarios(comercio_id, id)
        ON DELETE RESTRICT
);

-- Productos incluidos en cada venta.
-- Los nombres y códigos se guardan para conservar los datos históricos.
CREATE TABLE detalle_ventas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venta_id UUID NOT NULL REFERENCES ventas(id) ON DELETE RESTRICT,
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    producto_nombre VARCHAR(255) NOT NULL,
    producto_codigo VARCHAR(100),
    cantidad NUMERIC(10,3) NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(12,2) NOT NULL CHECK (precio_unitario >= 0),
    subtotal NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Pagos de cada venta.
CREATE TABLE pagos_venta (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venta_id UUID NOT NULL REFERENCES ventas(id) ON DELETE RESTRICT,
    metodo_pago VARCHAR(30) NOT NULL
        CHECK (metodo_pago IN (
            'efectivo',
            'mercado_pago',
            'transferencia',
            'tarjeta_debito',
            'tarjeta_credito',
            'otro'
        )),
    monto NUMERIC(12,2) NOT NULL CHECK (monto > 0),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Relación entre proveedores y productos.
CREATE TABLE proveedores_productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comercio_id UUID NOT NULL REFERENCES comercios(id) ON DELETE RESTRICT,
    proveedor_id UUID NOT NULL,
    producto_id UUID NOT NULL,
    precio_compra NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (precio_compra >= 0),
    codigo_proveedor VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (comercio_id, proveedor_id, producto_id),
    FOREIGN KEY (comercio_id, proveedor_id)
        REFERENCES proveedores(comercio_id, id)
        ON DELETE RESTRICT,
    FOREIGN KEY (comercio_id, producto_id)
        REFERENCES productos(comercio_id, id)
        ON DELETE RESTRICT
);

-- Índices para las consultas más habituales.
CREATE INDEX idx_usuarios_comercio
ON usuarios(comercio_id);

CREATE INDEX idx_categorias_comercio_activo
ON categorias(comercio_id, activo, nombre);

CREATE INDEX idx_proveedores_comercio_activo
ON proveedores(comercio_id, activo, nombre);

CREATE INDEX idx_productos_comercio_activo_nombre
ON productos(comercio_id, activo, nombre);

CREATE INDEX idx_productos_comercio_categoria
ON productos(comercio_id, categoria_id);

CREATE INDEX idx_movimientos_stock_comercio_producto_fecha
ON movimientos_stock(comercio_id, producto_id, created_at DESC);

CREATE INDEX idx_compras_comercio_proveedor
ON compras(comercio_id, proveedor_id);

CREATE INDEX idx_compras_comercio_usuario
ON compras(comercio_id, usuario_id);

CREATE INDEX idx_compras_comercio_fecha
ON compras(comercio_id, fecha);

CREATE INDEX idx_detalle_compras_compra
ON detalle_compras(compra_id);

CREATE INDEX idx_detalle_compras_producto
ON detalle_compras(producto_id);

CREATE INDEX idx_ventas_comercio_fecha
ON ventas(comercio_id, created_at);

CREATE INDEX idx_ventas_comercio_estado
ON ventas(comercio_id, estado);

CREATE INDEX idx_detalle_ventas_producto
ON detalle_ventas(producto_id);

CREATE INDEX idx_detalle_ventas_venta
ON detalle_ventas(venta_id);

CREATE INDEX idx_pagos_venta_venta
ON pagos_venta(venta_id);

CREATE INDEX idx_pagos_venta_metodo
ON pagos_venta(metodo_pago);

CREATE INDEX idx_proveedores_productos_comercio_proveedor
ON proveedores_productos(comercio_id, proveedor_id);

CREATE INDEX idx_proveedores_productos_comercio_producto
ON proveedores_productos(comercio_id, producto_id);