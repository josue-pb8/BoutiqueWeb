if (!localStorage.getItem('token') || localStorage.getItem('rol') !== 'ADMIN') { window.location.href = '../index.html'; }
$(document).ready(function () {

    let user = JSON.parse(localStorage.getItem('usuario')); 
    document.getElementsByClassName("user-name")[0].innerHTML = user.nombreUsuario; 
        document.getElementsByClassName("user-role")[0].innerHTML = user.rol; 

    
    //document.getElementsByClassName("avatar-placeholder")[0].innerHTML = user.nombreUsuario.charAt(0).toUpperCase();

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
    var clientesVentaCache = [];
    var productosVentaCache = [];

    function recargarCacheVenta() {
        apiGet('/clientes').then(function (r) { clientesVentaCache = r; }).catch(function () {});
        apiGet('/productos').then(function (r) { productosVentaCache = r; }).catch(function () {});
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

    var timeoutVentaCliente;
    $('#campoVentaCliente').on('input', function () {
        clearTimeout(timeoutVentaCliente);
        var val = $(this).val().toLowerCase();
        if (val.length < 2) { return; }
        timeoutVentaCliente = setTimeout(function () {
            var listado = clientesVentaCache;
            if (listado.length === 0) {
                apiGet('/clientes').then(function (r) {
                    clientesVentaCache = r;
                    mostrarSugerenciasVentaCliente(r, val);
                }).catch(function () {});
                return;
            }
            mostrarSugerenciasVentaCliente(listado, val);
        }, 200);
    });

    function mostrarSugerenciasVentaCliente(lista, val) {
        var filtrados = lista.filter(function (c) { return (c.nombre + ' ' + c.apellido).toLowerCase().indexOf(val) > -1; });
        if (filtrados.length === 0) return;
        var sel = document.getElementById('campoVentaCliente');
        var existente = document.getElementById('sugerenciasVentaCliente');
        if (!existente) {
            var div = document.createElement('div');
            div.id = 'sugerenciasVentaCliente';
            div.className = 'lista-sugerencias';
            div.style.cssText = 'position:absolute;top:100%;left:0;right:0;z-index:10;background:#fff;border:1px solid #ddd;border-radius:0 0 8px 8px;max-height:180px;overflow-y:auto;';
            sel.parentNode.style.position = 'relative';
            sel.parentNode.appendChild(div);
            existente = div;
        }
        var html = '';
        $.each(filtrados, function (i, c) {
            html += '<div class="sugerencia-item" data-id="' + c.id + '" data-nombre="' + (c.nombre + ' ' + c.apellido) + '">';
            html += '<strong>' + c.nombre + ' ' + c.apellido + '</strong>';
            html += '</div>';
        });
        existente.innerHTML = html;
        existente.style.display = 'block';
    }

    $(document).on('click', '#sugerenciasVentaCliente .sugerencia-item', function () {
        var $item = $(this);
        $('#sugerenciasVentaCliente').hide();
        $('#campoVentaCliente').val($item.data('nombre')).data('clienteId', $item.data('id'));
    });

    var timeoutVentaProducto;
    $('#campoVentaProducto').on('input', function () {
        clearTimeout(timeoutVentaProducto);
        var val = $(this).val().toLowerCase();
        if (val.length < 2) { return; }
        timeoutVentaProducto = setTimeout(function () {
            var listado = productosVentaCache;
            if (listado.length === 0) {
                apiGet('/productos').then(function (r) {
                    productosVentaCache = r;
                    mostrarSugerenciasVentaProducto(r, val);
                }).catch(function () {});
                return;
            }
            mostrarSugerenciasVentaProducto(listado, val);
        }, 200);
    });

    function mostrarSugerenciasVentaProducto(lista, val) {
        var filtrados = lista.filter(function (p) { return p.nombre.toLowerCase().indexOf(val) > -1; });
        if (filtrados.length === 0) return;
        var sel = document.getElementById('campoVentaProducto');
        var existente = document.getElementById('sugerenciasVentaProducto');
        if (!existente) {
            var div = document.createElement('div');
            div.id = 'sugerenciasVentaProducto';
            div.className = 'lista-sugerencias';
            div.style.cssText = 'position:absolute;top:100%;left:0;right:0;z-index:10;background:#fff;border:1px solid #ddd;border-radius:0 0 8px 8px;max-height:180px;overflow-y:auto;';
            sel.parentNode.style.position = 'relative';
            sel.parentNode.appendChild(div);
            existente = div;
        }
        var html = '';
        $.each(filtrados, function (i, p) {
            html += '<div class="sugerencia-item" data-id="' + p.id + '" data-nombre="' + p.nombre + '" data-precio="' + p.precio + '">';
            html += '<strong>' + p.nombre + '</strong>';
            html += '</div>';
        });
        existente.innerHTML = html;
        existente.style.display = 'block';
    }

    $(document).on('click', '#sugerenciasVentaProducto .sugerencia-item', function () {
        var $item = $(this);
        $('#sugerenciasVentaProducto').hide();
        $('#campoVentaProducto').val($item.data('nombre')).data('productoId', $item.data('id'));
        var precio = $item.data('precio');
        if (precio) $('#campoVentaPrecio').val(precio);
        $('#campoVentaPrecio').focus();
    });

    $(document).on('click', function (e) {
        if (!$(e.target).closest('.campo-grupo').length) {
            $('.lista-sugerencias').hide();
        }
    });

    $('#btnAgregarProductoVenta').on('click', function () {
        var nombre = $('#campoVentaProducto').val().trim();
        var productoId = parseInt($('#campoVentaProducto').data('productoId'));
        var cantidad = parseInt($('#campoVentaCantidad').val()) || 1;
        var precio = parseFloat($('#campoVentaPrecio').val());

        if (!nombre || isNaN(precio) || precio <= 0) {
            mostrarToast('Completa nombre y precio del producto', 'error');
            return;
        }
        if (!productoId) {
            mostrarToast('Escribe el nombre del producto', 'error');
            return;
        }

        productosVenta.push({ id: productoId, nombre: nombre, cantidad: cantidad, precio: precio });
        $('#campoVentaProducto').val('').removeData('productoId');
        $('#campoVentaCantidad').val(1);
        $('#campoVentaPrecio').val('');
        $('#sugerenciasVentaProducto').hide();
        actualizarProductosVenta();
        $('#campoVentaProducto').focus();
    });

    $(document).on('click', '.btn-quitar-producto', function () {
        var index = $(this).data('index');
        productosVenta.splice(index, 1);
        actualizarProductosVenta();
    });

    $('#btnGuardarVenta').on('click', function () {
        var clienteId = $('#campoVentaCliente').data('clienteId');
        var clienteNombre = $('#campoVentaCliente').val().trim();

        if (!clienteId) { mostrarToast('Selecciona un cliente de la lista de sugerencias', 'error'); return; }
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
                var msg = err && (err.error || err.message || JSON.stringify(err)) || 'Error de conexión';
                mostrarToast('Error: ' + msg, 'error');
            });
    });

});
