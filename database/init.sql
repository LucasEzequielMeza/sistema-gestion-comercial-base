-- Esquema inicial del Sistema de Gestión Comercial.
-- Ejecutar una sola vez sobre una base de datos vacía.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Usuarios
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    usuario VARCHAR(50) NOT NULL UNIQUE,
    mail VARCHAR(150) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Categorías
CREATE TABLE categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Proveedores
CREATE TABLE proveedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(150) NOT NULL,
    cuit VARCHAR(20) UNIQUE,
    telefono VARCHAR(50),
    mail VARCHAR(150),
    direccion VARCHAR(200),
    contacto VARCHAR(150),
    observaciones TEXT,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Productos
CREATE TABLE productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    imagen TEXT,
    codigo VARCHAR(50) UNIQUE,
    categoria_id UUID REFERENCES categorias(id),
    precio_compra NUMERIC(10,2) NOT NULL,
    precio_venta NUMERIC(10,2) NOT NULL,
    stock NUMERIC(10,3) NOT NULL DEFAULT 0,
    stock_minimo NUMERIC(10,3) NOT NULL DEFAULT 0,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Movimientos de stock
CREATE TABLE movimientos_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id UUID NOT NULL,
    tipo VARCHAR(20) NOT NULL,
    cantidad NUMERIC(10,3) NOT NULL,
    motivo VARCHAR(50) NOT NULL,
    stock_anterior NUMERIC(10,3) NOT NULL,
    stock_nuevo NUMERIC(10,3) NOT NULL,
    usuario_id UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_movimientos_stock_producto
        FOREIGN KEY (producto_id) REFERENCES productos(id),

    CONSTRAINT fk_movimientos_stock_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id),

    CONSTRAINT chk_movimientos_stock_tipo
        CHECK (tipo IN ('entrada', 'salida', 'ajuste')),

    CONSTRAINT chk_movimientos_stock_cantidad
        CHECK (cantidad > 0)
);

-- Compras
CREATE TABLE compras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proveedor_id UUID NOT NULL,
    usuario_id UUID NOT NULL,
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tipo_comprobante VARCHAR(50),
    numero_comprobante VARCHAR(100),
    total NUMERIC(12,2) NOT NULL DEFAULT 0,
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    observaciones TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_compras_proveedor
        FOREIGN KEY (proveedor_id) REFERENCES proveedores(id),

    CONSTRAINT fk_compras_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id),

    CONSTRAINT chk_compras_total
        CHECK (total >= 0),

    CONSTRAINT chk_compras_estado
        CHECK (estado IN ('pendiente', 'confirmada', 'cancelada'))
);

-- Productos incluidos en cada compra
CREATE TABLE detalle_compras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    compra_id UUID NOT NULL,
    producto_id UUID NOT NULL,
    cantidad NUMERIC(10,3) NOT NULL,
    costo_unitario NUMERIC(12,2) NOT NULL,
    subtotal NUMERIC(12,2) NOT NULL,

    CONSTRAINT fk_detalle_compras_compra
        FOREIGN KEY (compra_id) REFERENCES compras(id),

    CONSTRAINT fk_detalle_compras_producto
        FOREIGN KEY (producto_id) REFERENCES productos(id),

    CONSTRAINT chk_detalle_compras_cantidad
        CHECK (cantidad > 0),

    CONSTRAINT chk_detalle_compras_costo
        CHECK (costo_unitario >= 0),

    CONSTRAINT chk_detalle_compras_subtotal
        CHECK (subtotal >= 0),

    CONSTRAINT uq_detalle_compras_producto
        UNIQUE (compra_id, producto_id)
);

-- Ventas
CREATE TABLE ventas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_venta BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    total NUMERIC(12,2) NOT NULL CHECK (total > 0),
    estado VARCHAR(20) NOT NULL DEFAULT 'completada'
        CHECK (estado IN ('completada', 'anulada')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Detalle de productos vendidos
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

-- Pagos de las ventas
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

-- Índices para acelerar las consultas frecuentes
CREATE INDEX idx_productos_categoria
    ON productos(categoria_id);

CREATE INDEX idx_productos_activo_nombre
    ON productos(activo, nombre);

CREATE INDEX idx_movimientos_stock_producto_fecha
    ON movimientos_stock(producto_id, created_at DESC);

CREATE INDEX idx_compras_proveedor
    ON compras(proveedor_id);

CREATE INDEX idx_compras_usuario
    ON compras(usuario_id);

CREATE INDEX idx_compras_fecha
    ON compras(fecha);

CREATE INDEX idx_detalle_compras_compra
    ON detalle_compras(compra_id);

CREATE INDEX idx_detalle_compras_producto
    ON detalle_compras(producto_id);

CREATE UNIQUE INDEX uq_compras_comprobante
    ON compras(proveedor_id, tipo_comprobante, numero_comprobante)
    WHERE numero_comprobante IS NOT NULL
      AND TRIM(numero_comprobante) <> '';

CREATE INDEX idx_ventas_created_at
    ON ventas(created_at);

CREATE INDEX idx_ventas_estado
    ON ventas(estado);

CREATE INDEX idx_detalle_ventas_producto
    ON detalle_ventas(producto_id);

CREATE INDEX idx_pagos_venta_metodo
    ON pagos_venta(metodo_pago);

CREATE INDEX idx_pagos_venta_venta
    ON pagos_venta(venta_id);