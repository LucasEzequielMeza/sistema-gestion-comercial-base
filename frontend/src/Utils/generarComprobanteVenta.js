import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';

const formatoPrecio = (importe) => {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS'
    }).format(Number(importe) || 0);
};

const formatoFecha = (fecha) => {
    if (!fecha) return 'Sin fecha registrada';

    return new Date(fecha).toLocaleString('es-AR', {
        dateStyle: 'short',
        timeStyle: 'short'
    });
};

const nombresMediosPago = {
    efectivo: 'Efectivo',
    mercado_pago: 'Mercado Pago',
    transferencia: 'Transferencia',
    tarjeta_debito: 'Tarjeta de débito',
    tarjeta_credito: 'Tarjeta de crédito',
    otro: 'Otro'
};

// Convierto el logo a PNG para que el PDF pueda mostrarlo.
const convertirLogoAPng = (logo) => {
    return new Promise((resolve, reject) => {
        const imagen = new Image();

        imagen.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = imagen.naturalWidth;
            canvas.height = imagen.naturalHeight;

            const contexto = canvas.getContext('2d');

            if (!contexto) {
                reject(new Error('No se pudo procesar el logo'));
                return;
            }

            contexto.drawImage(imagen, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };

        imagen.onerror = () => reject(
            new Error('No se pudo cargar el logo')
        );

        imagen.src = logo;
    });
};

export const generarComprobanteVenta = async (venta, comercio) => {
    const documento = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const anchoPagina = documento.internal.pageSize.getWidth();
    const margen = 15;

    const detalles = venta.detalles || venta.productos || [];
    const pagos = venta.pagos || [];
    const estaAnulada = venta.estado === 'anulada';

    // Encabezado comercial.
    documento.setFont('helvetica', 'bold');
    documento.setFontSize(18);

    documento.text(
        String(comercio?.nombre || 'Comercio'),
        margen,
        20,
        { maxWidth: 125 }
    );

    documento.setFont('helvetica', 'normal');
    documento.setFontSize(9);

    let posicionY = 28;

    const datosComercio = [
        comercio?.cuit ? `CUIT: ${comercio.cuit}` : '',
        comercio?.direccion || '',
        comercio?.localidad || '',
        comercio?.telefono ? `Teléfono: ${comercio.telefono}` : '',
        comercio?.mail_contacto || ''
    ].filter(Boolean);

    datosComercio.forEach((dato) => {
        documento.text(dato, margen, posicionY);
        posicionY += 5;
    });

    if (comercio?.logo) {
        try {
            const logoPng = await convertirLogoAPng(comercio.logo);

            documento.addImage(
                logoPng,
                'PNG',
                anchoPagina - margen - 35,
                10,
                35,
                25,
                undefined,
                'FAST'
            );
        } catch (error) {
            // El comprobante se genera igualmente si el logo falla.
            console.warn('No se pudo incluir el logo en el PDF.');
        }
    }

    posicionY = Math.max(posicionY + 5, 48);

    documento.setDrawColor(210, 210, 210);
    documento.line(margen, posicionY, anchoPagina - margen, posicionY);

    posicionY += 10;

    documento.setFont('helvetica', 'bold');
    documento.setFontSize(15);

    documento.text(
        'COMPROBANTE INTERNO DE VENTA',
        anchoPagina / 2,
        posicionY,
        { align: 'center' }
    );

    posicionY += 8;

    documento.setFontSize(10);

    if (estaAnulada) {
        documento.setTextColor(190, 35, 35);
        documento.text(
            'VENTA ANULADA',
            anchoPagina / 2,
            posicionY,
            { align: 'center' }
        );
        documento.setTextColor(0, 0, 0);
        posicionY += 8;
    }

    documento.setFont('helvetica', 'normal');

    documento.text(
        `Número de venta: ${venta.numero_venta ?? 'Sin número'}`,
        margen,
        posicionY
    );

    documento.text(
        `Fecha: ${formatoFecha(venta.created_at)}`,
        margen,
        posicionY + 6
    );

    const vendedor = [
        venta.usuario_nombre,
        venta.usuario_apellido
    ].filter(Boolean).join(' ') || 'No disponible';

    documento.text(
        `Vendedor: ${vendedor}`,
        margen,
        posicionY + 12
    );

    posicionY += 21;

    // Detalle de los productos vendidos.
    autoTable(documento, {
        startY: posicionY,
        margin: { left: margen, right: margen },
        head: [[
            'Producto',
            'Código',
            'Cantidad',
            'Precio unitario',
            'Subtotal'
        ]],
        body: detalles.map((detalle) => {
            const cantidad = Number(detalle.cantidad) || 0;
            const precio = Number(
                detalle.precio_unitario ?? detalle.precio_venta
            ) || 0;

            const subtotal = detalle.subtotal != null
                ? Number(detalle.subtotal)
                : cantidad * precio;

            return [
                detalle.producto_nombre || detalle.nombre || 'Producto',
                detalle.producto_codigo || detalle.codigo || '-',
                String(cantidad),
                formatoPrecio(precio),
                formatoPrecio(subtotal)
            ];
        }),
        theme: 'grid',
        styles: {
            font: 'helvetica',
            fontSize: 8,
            cellPadding: 3,
            overflow: 'linebreak'
        },
        headStyles: {
            fillColor: [55, 65, 81],
            textColor: [255, 255, 255]
        },
        columnStyles: {
            0: { cellWidth: 58 },
            1: { cellWidth: 25 },
            2: { cellWidth: 20, halign: 'right' },
            3: { cellWidth: 32, halign: 'right' },
            4: { cellWidth: 32, halign: 'right' }
        }
    });

    let finalY = documento.lastAutoTable.finalY + 10;

    // Total de la operación.
    documento.setFont('helvetica', 'bold');
    documento.setFontSize(13);

    documento.text(
        `TOTAL: ${formatoPrecio(venta.total)}`,
        anchoPagina - margen,
        finalY,
        { align: 'right' }
    );

    finalY += 10;

    // Medios de pago utilizados.
    documento.setFontSize(11);
    documento.text('Medios de pago', margen, finalY);

    finalY += 6;

    documento.setFont('helvetica', 'normal');
    documento.setFontSize(9);

    pagos.forEach((pago) => {
        if (finalY > 270) {
            documento.addPage();
            finalY = 20;
        }

        const metodo = nombresMediosPago[pago.metodo_pago]
            || pago.metodo_pago
            || 'Otro';

        documento.text(
            `${metodo}: ${formatoPrecio(pago.monto)}`,
            margen,
            finalY
        );

        finalY += 5;
    });

    // Aclaración para no confundirlo con una factura fiscal.
    finalY += 8;

    if (finalY > 275) {
        documento.addPage();
        finalY = 20;
    }

    documento.setFontSize(8);
    documento.setTextColor(100, 100, 100);

    documento.text(
        'Comprobante interno de operación. No válido como factura fiscal.',
        anchoPagina / 2,
        finalY,
        { align: 'center', maxWidth: anchoPagina - margen * 2 }
    );

    const numeroVenta = String(venta.numero_venta ?? venta.id ?? 'venta');

    documento.save(`comprobante-venta-${numeroVenta}.pdf`);
};