**************
TABLA USUARIOS
**************
-- Creo la extensión para poder generar UUID automáticamente
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Creo la tabla de usuarios
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    usuario VARCHAR(50) NOT NULL UNIQUE,
    mail VARCHAR(150) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
);

***************
TABLA PRODUCTOS
***************

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

***********************
TABLA MOVIMIENTOS_STOCK
***********************

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
        FOREIGN KEY (producto_id)
        REFERENCES productos(id),

    CONSTRAINT fk_movimientos_stock_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id),

    CONSTRAINT chk_movimientos_stock_tipo
        CHECK (tipo IN ('entrada', 'salida', 'ajuste')),

    CONSTRAINT chk_movimientos_stock_cantidad
        CHECK (cantidad > 0)
);

****************
TABLA CATEGORIAS
****************

CREATE TABLE categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

*****************
TABLA PROVEEDORES
*****************

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

*****************
TABLA COMPRAS
*****************

CREATE TABLE public.compras (
    id UUID DEFAULT gen_random_uuid() NOT NULL,
    proveedor_id UUID NOT NULL,
    usuario_id UUID NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    tipo_comprobante VARCHAR(50) NULL,
    numero_comprobante VARCHAR(100) NULL,
    total NUMERIC(12, 2) DEFAULT 0 NOT NULL,
    estado VARCHAR(20) DEFAULT 'pendiente' NOT NULL,
    observaciones TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT compras_pkey PRIMARY KEY (id),
    CONSTRAINT fk_compras_proveedor
        FOREIGN KEY (proveedor_id) REFERENCES public.proveedores(id),
    CONSTRAINT fk_compras_usuario
        FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id),
    CONSTRAINT chk_compras_total CHECK (total >= 0),
    CONSTRAINT chk_compras_estado
        CHECK (estado IN ('pendiente', 'confirmada', 'cancelada'))
);

CREATE TABLE public.detalle_compras (
    id UUID DEFAULT gen_random_uuid() NOT NULL,
    compra_id UUID NOT NULL,
    producto_id UUID NOT NULL,
    cantidad NUMERIC(10, 3) NOT NULL,
    costo_unitario NUMERIC(12, 2) NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL,
    CONSTRAINT detalle_compras_pkey PRIMARY KEY (id),
    CONSTRAINT fk_detalle_compras_compra
        FOREIGN KEY (compra_id) REFERENCES public.compras(id),
    CONSTRAINT fk_detalle_compras_producto
        FOREIGN KEY (producto_id) REFERENCES public.productos(id),
    CONSTRAINT chk_detalle_compras_cantidad CHECK (cantidad > 0),
    CONSTRAINT chk_detalle_compras_costo CHECK (costo_unitario >= 0),
    CONSTRAINT chk_detalle_compras_subtotal CHECK (subtotal >= 0)
);

CREATE INDEX idx_compras_proveedor
    ON public.compras(proveedor_id);

CREATE INDEX idx_compras_usuario
    ON public.compras(usuario_id);

CREATE INDEX idx_compras_fecha
    ON public.compras(fecha);

CREATE INDEX idx_detalle_compras_compra
    ON public.detalle_compras(compra_id);

CREATE INDEX idx_detalle_compras_producto
    ON public.detalle_compras(producto_id);

-- Evito que se repita el mismo comprobante para un proveedor
CREATE UNIQUE INDEX uq_compras_comprobante
ON compras (
    proveedor_id,
    tipo_comprobante,
    numero_comprobante
)
WHERE numero_comprobante IS NOT NULL
  AND TRIM(numero_comprobante) <> '';

  -- Impido repetir un producto dentro de la misma compra.
ALTER TABLE detalle_compras
ADD CONSTRAINT uq_detalle_compras_producto
UNIQUE (compra_id, producto_id);