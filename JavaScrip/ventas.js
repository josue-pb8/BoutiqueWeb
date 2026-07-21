if (!localStorage.getItem('token') || localStorage.getItem('rol') !== 'ADMIN') { window.location.href = '../index.html'; }
$(document).ready(function () {

    try {
        let user = JSON.parse(localStorage.getItem('usuario'));
        if (user) {
            var nameEl2 = document.getElementsByClassName("user-name")[0];
            if (nameEl2) nameEl2.innerHTML = user.nombreUsuario;
            var roleEl2 = document.getElementsByClassName("user-role")[0];
            if (roleEl2) roleEl2.innerHTML = user.rol;
        }
    } catch(e) { window.location.href = '../index.html'; return; }

    var ventasData = [];

    function cargarVentas() {
        apiGet('/ventas')
            .then(function (respuesta) {
                ventasData = respuesta;
                renderizarTabla(respuesta);
            })
            .catch(function () {
                $('#cuerpoTabla').html('<tr><td colspan="8" style="text-align:center;color:#888;">Sin ventas registradas</td></tr>');
            });
    }

    function renderizarTabla(ventas) {
        var html = '';
        $.each(ventas, function (i, v) {
            var cliente = v.cliente ? (v.cliente.nombre + ' ' + v.cliente.apellido) : 'Sin cliente';
            var empleado = v.empleado ? v.empleado.nombreUsuario : '-';
            var numProductos = v.detalles ? v.detalles.length : 0;
            var total = v.total || 0;
            var fecha = v.fechaVenta ? formatearFecha(v.fechaVenta) : '-';
            html += '<tr>';
            html += '<td>#' + v.id + '</td>';
            html += '<td>' + cliente + '</td>';
            html += '<td>' + empleado + '</td>';
            html += '<td>' + fecha + '</td>';
            html += '<td>' + numProductos + ' productos</td>';
            html += '<td>$' + formatNumber(total) + '</td>';
            html += '<td><span class="estado-completada">Completada</span></td>';
            html += '<td><div class="acciones-botones">';
            html += '<button class="btn-icono btn-visualizar" data-id="' + v.id + '" title="Visualizar">&#128065;</button>';
            html += '<button class="btn-icono btn-ver-detalles" data-id="' + v.id + '" title="Detalles">&#128196;</button>';
            html += '</div></td>';
            html += '</tr>';
        });
        $('#cuerpoTabla').html(html || '<tr><td colspan="8" style="text-align:center;color:#888;">Sin ventas</td></tr>');
    }

    function formatearFecha(fecha) {
        if (!fecha) return '-';
        try {
            if (Array.isArray(fecha)) {
                return String(fecha[2]).padStart(2, '0') + '/' + String(fecha[1]).padStart(2, '0') + '/' + fecha[0];
            }
            if (typeof fecha === 'string') {
                return fecha.split('T')[0];
            }
            return new Date(fecha).toLocaleDateString('es-MX');
        } catch (e) {
            return '-';
        }
    }

    function formatNumber(numero) {
        return parseFloat(numero).toLocaleString('es-MX', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    function mostrarToast(mensaje, tipo) {
        var $toast = $('#toastGlobal');
        $toast.removeClass('toast-exito toast-error').addClass('toast-' + tipo).text(mensaje).addClass('activo');
        setTimeout(function () { $toast.removeClass('activo'); }, 3000);
    }

    function abrirModal(id) { $('#' + id).addClass('activo'); }
    function cerrarModal(id) { $('#' + id).removeClass('activo'); }

    cargarVentas();

    $(document).on('input', '.buscar-venta input', function () {
        var busqueda = $(this).val().toLowerCase();
        $('.tabla-ventas tbody tr').each(function () {
            var texto = $(this).text().toLowerCase();
            $(this).toggle(texto.indexOf(busqueda) > -1);
        });
    });

    $(document).on('change', '.filtro-estado', function () {
        var filtro = $(this).val().toLowerCase();
        $('.tabla-ventas tbody tr').each(function () {
            if (filtro === '') { $(this).show(); } else {
                var estadoCelda = $(this).find('td:eq(6)').text().toLowerCase();
                $(this).toggle(estadoCelda === filtro);
            }
        });
    });

    $(document).on('click', '.btn-visualizar', function () {
        var id = $(this).data('id');
        var venta = ventasData.find(function (v) { return v.id == id; });
        if (!venta) return;
        var cliente = venta.cliente ? (venta.cliente.nombre + ' ' + venta.cliente.apellido) : 'Sin cliente';
        var empleado = venta.empleado ? venta.empleado.nombreUsuario : '-';
        var html = '';
        html += '<div class="detalle-fila"><span class="detalle-label">Venta</span><span class="detalle-valor">#' + venta.id + '</span></div>';
        html += '<div class="detalle-fila"><span class="detalle-label">Fecha</span><span class="detalle-valor">' + (venta.fechaVenta ? formatearFecha(venta.fechaVenta) : '-') + '</span></div>';
        html += '<div class="detalle-fila"><span class="detalle-label">Cliente</span><span class="detalle-valor">' + cliente + '</span></div>';
        html += '<div class="detalle-fila"><span class="detalle-label">Empleado</span><span class="detalle-valor">' + empleado + '</span></div>';
        html += '<div class="detalle-fila"><span class="detalle-label">Total</span><span class="detalle-valor">$' + formatNumber(venta.total) + '</span></div>';
        $('#modalVentaDetalle').html(html);
        $('#modalVentaTitulo').text('Venta #' + venta.id);
        abrirModal('modalVerVenta');
    });

    $(document).on('click', '.btn-ver-detalles', function () {
        var id = $(this).data('id');
        var venta = ventasData.find(function (v) { return v.id == id; });
        if (!venta || !venta.detalles) return;
        var html = '';
        venta.detalles.forEach(function (d) {
            var nombre = d.producto ? d.producto.nombre : 'Producto';
            html += '<div class="modal-producto-item">';
            html += '<img src="../Image/productos.png" alt="' + nombre + '">';
            html += '<div class="prod-info"><strong>' + nombre + '</strong><span>Cantidad: ' + d.cantidad + ' | $' + formatNumber(d.precioUnitario) + ' c/u</span></div>';
            html += '<span class="prod-precio">$' + formatNumber(d.precioUnitario * d.cantidad) + '</span>';
            html += '</div>';
        });
        html += '<div class="detalle-fila" style="margin-top:12px; border-top:2px solid #C8A45D; padding-top:12px;"><span class="detalle-label">Total</span><span class="detalle-valor" style="font-size:18px;">$' + formatNumber(venta.total) + '</span></div>';
        $('#modalDetalleLista').html(html);
        abrirModal('modalDetallesVenta');
    });

    $(document).on('click', '.btn-cerrar-modal', function () { $(this).closest('.modal-overlay').removeClass('activo'); });
    $(document).on('click', '.btn-modal-cancelar', function () { $(this).closest('.modal-overlay').removeClass('activo'); });
    $(document).on('click', '.modal-overlay', function (e) { if (e.target === this) $(this).removeClass('activo'); });

    // --- Nueva venta ---
    var productosVenta = [];

    function recargarCacheVenta() {
        apiGet('/clientes').then(function (r) {
            var $select = $('#campoVentaCliente');
            $select.find('option:gt(0)').remove();
            $.each(r || [], function (i, c) {
                $select.append('<option value="' + c.id + '">' + c.nombre + ' ' + c.apellido + '</option>');
            });
        }).catch(function () {});
        apiGet('/productos').then(function (r) {
            var $select = $('#campoVentaProducto');
            $select.find('option:gt(0)').remove();
            $.each(r || [], function (i, p) {
                $select.append('<option value="' + p.id + '" data-precio="' + p.precio + '">' + p.nombre + ' - $' + parseFloat(p.precio).toFixed(2) + '</option>');
            });
        }).catch(function () {});
    }
    recargarCacheVenta();

    $('.btn-nueva-venta').on('click', function () {
        $('#modalNuevaVentaForm')[0].reset();
        productosVenta = [];
        actualizarProductosVenta();
        recargarCacheVenta();
        abrirModal('modalNuevaVenta');
    });

    function actualizarProductosVenta() {
        var html = '';
        var total = 0;
        $.each(productosVenta, function (i, p) {
            var subtotal = p.cantidad * p.precio;
            total += subtotal;
            html += '<div class="producto-agregado-item">';
            html += '<span><strong>' + p.nombre + '</strong> x' + p.cantidad + ' - $' + formatNumber(subtotal) + '</span>';
            html += '<button type="button" class="btn-quitar-producto" data-index="' + i + '">&times;</button>';
            html += '</div>';
        });
        $('#productosNuevaVenta').html(html);
        $('#totalNuevaVenta').text('$' + formatNumber(total));
    }

    $('#campoVentaProducto').on('change', function () {
        var precio = $(this).find(':selected').data('precio');
        if (precio) $('#campoVentaPrecio').val(precio);
    });

    $('#btnAgregarProductoVenta').on('click', function () {
        var $selectProd = $('#campoVentaProducto');
        var productoId = parseInt($selectProd.val());
        var $selected = $selectProd.find(':selected');
        var text = $selected.text() || '';
        var nombre = text.split(' - ')[0].trim();
        var cantidad = parseInt($('#campoVentaCantidad').val()) || 1;
        var precio = parseFloat($('#campoVentaPrecio').val());

        if (!productoId) { mostrarToast('Selecciona un producto', 'error'); return; }
        if (isNaN(precio) || precio <= 0) { mostrarToast('Ingresa un precio valido', 'error'); return; }

        productosVenta.push({ id: productoId, nombre: nombre, cantidad: cantidad, precio: precio });
        $selectProd.val('');
        $('#campoVentaCantidad').val(1);
        $('#campoVentaPrecio').val('');
        actualizarProductosVenta();
    });

    $(document).on('click', '.btn-quitar-producto', function () {
        var index = parseInt($(this).attr('data-index'));
        if (!isNaN(index) && index >= 0 && index < productosVenta.length) {
            productosVenta.splice(index, 1);
            actualizarProductosVenta();
        }
    });

    $('#btnGuardarVenta').on('click', function () {
        var clienteId = parseInt($('#campoVentaCliente').val());

        if (!clienteId) { mostrarToast('Selecciona un cliente', 'error'); return; }
        if (productosVenta.length === 0) { mostrarToast('Agrega al menos un producto', 'error'); return; }

        var empleadoId = getUsuarioId();

        var data = {
            empleadoId: empleadoId,
            clienteId: clienteId,
            metodoPagoId: 1,
            detalles: productosVenta.map(function (p) {
                return {
                    productoId: p.id,
                    cantidad: p.cantidad,
                    precioUnitario: p.precio
                };
            })
        };

        apiPost('/ventas', data)
            .then(function () {
                cerrarModal('modalNuevaVenta');
                mostrarToast('Venta registrada correctamente', 'exito');
                cargarVentas();
            })
            .catch(function (err) {
                var msg = err && (err.error || err.message || JSON.stringify(err)) || 'Error de conexion';
                mostrarToast('Error: ' + msg, 'error');
            });
    });

});
