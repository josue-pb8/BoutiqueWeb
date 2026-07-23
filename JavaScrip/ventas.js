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
                ventasData = Array.isArray(respuesta) ? respuesta : [];
                renderizarTabla(ventasData);
            })
            .catch(function () {
                $('#cuerpoTabla').html('<tr><td colspan="8" style="text-align:center;color:#888;">Sin ventas registradas</td></tr>');
            });
    }

    function renderizarTabla(ventas) {
        var html = '';
        $.each(ventas, function (i, v) {
            var cliente = v.cliente ? (v.cliente.nombre + ' ' + v.cliente.apellido) : (v.clienteNombre || 'Sin cliente');
            var empleado = v.empleado ? v.empleado.nombreUsuario : '-';
            var total = v.total || 0;
            var fecha = v.fechaVenta ? formatearFecha(v.fechaVenta) : '-';
            var nombresProductos = '';
            if (v.detalles && v.detalles.length > 0) {
                var nombres = v.detalles.map(function (d) {
                    return d.producto ? d.producto.nombre : 'Producto';
                });
                nombresProductos = nombres.join(', ');
            } else {
                nombresProductos = 'Sin productos';
            }
            html += '<tr>';
            html += '<td>#' + v.id + '</td>';
            html += '<td>' + cliente + '</td>';
            html += '<td>' + empleado + '</td>';
            html += '<td>' + fecha + '</td>';
            html += '<td class="td-productos" title="' + escapeHtml(nombresProductos) + '">' + escapeHtml(nombresProductos) + '</td>';
            html += '<td>$' + formatNumber(total) + '</td>';
            var estadoVenta = v.estado || 'COMPLETADA';
            var estadoVentaClase = 'estado-completada';
            if (estadoVenta === 'CANCELADA') estadoVentaClase = 'estado-cancelada';
            else if (estadoVenta === 'PENDIENTE') estadoVentaClase = 'estado-pendiente';
            html += '<td><span class="' + estadoVentaClase + '">' + estadoVenta + '</span></td>';
            html += '<td><div class="acciones-botones">';
            html += '<button class="btn-icono btn-ver-venta" data-id="' + v.id + '" title="Ver detalle">&#128065;</button>';
            html += '<button class="btn-icono btn-eliminar-venta" data-id="' + v.id + '" title="Eliminar">&#128465;</button>';
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

    function escapeHtml(text) {
        var div = document.createElement("div");
        div.appendChild(document.createTextNode(text));
        return div.innerHTML;
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

    $(document).on('click', '.btn-ver-venta', function () {
        var id = $(this).data('id');
        var venta = ventasData.find(function (v) { return v.id == id; });
        if (!venta) return;
        var cliente = venta.cliente ? (venta.cliente.nombre + ' ' + venta.cliente.apellido) : (venta.clienteNombre || 'Sin cliente');
        var empleado = venta.empleado ? venta.empleado.nombreUsuario : '-';
        var html = '';
        html += '<div class="detalle-fila"><span class="detalle-label">Venta</span><span class="detalle-valor">#' + venta.id + '</span></div>';
        html += '<div class="detalle-fila"><span class="detalle-label">Fecha</span><span class="detalle-valor">' + (venta.fechaVenta ? formatearFecha(venta.fechaVenta) : '-') + '</span></div>';
        html += '<div class="detalle-fila"><span class="detalle-label">Cliente</span><span class="detalle-valor">' + cliente + '</span></div>';
        html += '<div class="detalle-fila"><span class="detalle-label">Empleado</span><span class="detalle-valor">' + empleado + '</span></div>';
        if (venta.detalles && venta.detalles.length > 0) {
            html += '<div style="border-top:2px solid #C8A45D;margin:12px 0;padding-top:12px;">';
            html += '<strong style="font-size:14px;color:#333;">Productos</strong>';
            venta.detalles.forEach(function (d) {
                var nombre = d.producto ? d.producto.nombre : 'Producto';
                html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #eee;">';
                html += '<div><strong>' + escapeHtml(nombre) + '</strong><br><span style="color:#888;font-size:13px;">Cantidad: ' + d.cantidad + ' | $' + formatNumber(d.precioUnitario) + ' c/u</span></div>';
                html += '<span style="font-weight:600;">$' + formatNumber(d.precioUnitario * d.cantidad) + '</span>';
                html += '</div>';
            });
            html += '</div>';
        }
        html += '<div class="detalle-fila" style="border-top:2px solid #C8A45D;padding-top:12px;"><span class="detalle-label">Total</span><span class="detalle-valor" style="font-size:18px;">$' + formatNumber(venta.total) + '</span></div>';
        $('#modalVentaDetalle').html(html);
        $('#modalVentaTitulo').text('Venta #' + venta.id);
        abrirModal('modalVerVenta');
    });

    $(document).on('click', '.btn-eliminar-venta', function () {
        var id = $(this).data('id');
        var venta = ventasData.find(function (v) { return v.id == id; });
        if (!venta) return;
        $('#modalEliminarVentaId').text('#' + venta.id);
        $('#btnConfirmarEliminarVenta').data('id', id);
        abrirModal('modalEliminarVenta');
    });

    $(document).on('click', '#btnConfirmarEliminarVenta', function () {
        var id = $(this).data('id');
        apiDelete('/ventas/' + id)
            .then(function () {
                mostrarToast('Venta eliminada correctamente', 'exito');
                cerrarModal('modalEliminarVenta');
                cargarVentas();
            })
            .catch(function () {
                mostrarToast('Error al eliminar venta', 'error');
            });
    });


    $(document).on('click', '.btn-cerrar-modal', function () { $(this).closest('.modal-overlay').removeClass('activo'); });
    $(document).on('click', '.btn-modal-cancelar', function () { $(this).closest('.modal-overlay').removeClass('activo'); });
    $(document).on('click', '.modal-overlay', function (e) { if (e.target === this) $(this).removeClass('activo'); });

    // --- Nueva venta ---
    var productosVenta = [];
    var cacheClientes = [];
    var cacheProductos = [];
    var clienteSeleccionadoId = null;
    var productoSeleccionadoId = null;

    function recargarCacheVenta() {
        apiGet('/clientes').then(function (r) {
            cacheClientes = r || [];
        }).catch(function () { cacheClientes = []; });
        apiGet('/productos').then(function (r) {
            cacheProductos = r || [];
        }).catch(function () { cacheProductos = []; });
    }
    recargarCacheVenta();

    function mostrarListaAutocomplete(input, lista, items, onSelect) {
        var $input = $(input);
        var $lista = $(lista);
        $lista.empty();
        if (items.length === 0) { $lista.hide(); return; }
        $.each(items, function (i, item) {
            var $li = $('<li>').text(item.label).attr('data-index', i);
            $li.on('mousedown', function (e) {
                e.preventDefault();
                $input.val(item.label);
                $lista.hide();
                onSelect(item);
            });
            $lista.append($li);
        });
        $lista.show();
    }

    $('#campoVentaCliente').on('input', function () {
        var texto = $(this).val().toLowerCase().trim();
        clienteSeleccionadoId = null;
        $('#listaClientes').hide();
        if (texto.length < 1) return;
        var coincidencias = cacheClientes.filter(function (c) {
            var nombre = ((c.nombre || '') + ' ' + (c.apellido || '')).toLowerCase();
            return nombre.indexOf(texto) > -1;
        }).slice(0, 8);
        mostrarListaAutocomplete('#campoVentaCliente', '#listaClientes', coincidencias.map(function (c) {
            return { id: c.id, label: c.nombre + ' ' + c.apellido };
        }), function (sel) { clienteSeleccionadoId = sel.id; });
        var exacto = coincidencias.find(function (c) {
            return ((c.nombre || '') + ' ' + (c.apellido || '')).toLowerCase() === texto;
        });
        if (exacto) {
            clienteSeleccionadoId = exacto.id;
            $(this).val(exacto.nombre + ' ' + exacto.apellido);
            $('#listaClientes').hide();
        }
    });

    $('#campoVentaProducto').on('input', function () {
        var texto = $(this).val().toLowerCase().trim();
        productoSeleccionadoId = null;
        $('#campoVentaPrecio').val('');
        $('#listaProductos').hide();
        if (texto.length < 1) return;
        var coincidencias = cacheProductos.filter(function (p) {
            return (p.nombre || '').toLowerCase().indexOf(texto) > -1;
        }).slice(0, 8);
        mostrarListaAutocomplete('#campoVentaProducto', '#listaProductos', coincidencias.map(function (p) {
            return { id: p.id, label: p.nombre + ' - $' + parseFloat(p.precio).toFixed(2), precio: p.precio, nombre: p.nombre };
        }), function (sel) {
            productoSeleccionadoId = sel.id;
            if (sel.precio) $('#campoVentaPrecio').val(sel.precio);
        });
        var exacto = coincidencias.find(function (p) {
            return (p.nombre || '').toLowerCase() === texto;
        });
        if (exacto) {
            productoSeleccionadoId = exacto.id;
            $(this).val(exacto.nombre);
            $('#campoVentaPrecio').val(exacto.precio);
            $('#listaProductos').hide();
        }
    });

    $(document).on('mousedown', function (e) {
        if (!$(e.target).closest('.campo-autocomplete').length) {
            $('.autocomplete-lista').hide();
        }
    });

    $('.btn-nueva-venta').on('click', function () {
        $('#modalNuevaVentaForm')[0].reset();
        productosVenta = [];
        clienteSeleccionadoId = null;
        productoSeleccionadoId = null;
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

    $('#btnAgregarProductoVenta').on('click', function () {
        var nombreInput = $('#campoVentaProducto').val().trim();
        var cantidad = parseInt($('#campoVentaCantidad').val()) || 1;
        var precio = parseFloat($('#campoVentaPrecio').val());

        if (!nombreInput) { mostrarToast('Escribe un producto', 'error'); return; }

        if (!productoSeleccionadoId) {
            var nombreBuscado = nombreInput.toLowerCase();
            var encontrado = cacheProductos.find(function (p) {
                return (p.nombre || '').toLowerCase() === nombreBuscado;
            }) || cacheProductos.find(function (p) {
                return (p.nombre || '').toLowerCase().indexOf(nombreBuscado) > -1;
            });
            if (encontrado) {
                productoSeleccionadoId = encontrado.id;
                nombreInput = encontrado.nombre;
                if (!precio || isNaN(precio)) precio = parseFloat(encontrado.precio);
            }
        } else {
            var prod = cacheProductos.find(function (p) { return p.id == productoSeleccionadoId; });
            if (prod) nombreInput = prod.nombre;
        }

        if (isNaN(precio) || precio <= 0) { mostrarToast('Ingresa un precio valido', 'error'); return; }

        productosVenta.push({ id: productoSeleccionadoId || 0, nombre: nombreInput, cantidad: cantidad, precio: precio });
        $('#campoVentaProducto').val('');
        $('#campoVentaPrecio').val('');
        $('#campoVentaCantidad').val(1);
        productoSeleccionadoId = null;
        $('#listaProductos').hide();
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
        var clienteId = clienteSeleccionadoId;
        var clienteNombre = $('#campoVentaCliente').val().trim();

        if (!clienteId) {
            var textoCliente = clienteNombre.toLowerCase();
            if (textoCliente) {
                var encontrado = cacheClientes.find(function (c) {
                    return ((c.nombre || '') + ' ' + (c.apellido || '')).toLowerCase() === textoCliente;
                }) || cacheClientes.find(function (c) {
                    return ((c.nombre || '') + ' ' + (c.apellido || '')).toLowerCase().indexOf(textoCliente) > -1;
                });
                if (encontrado) clienteId = encontrado.id;
            }
        }

        if (!clienteNombre) { mostrarToast('Escribe el nombre del cliente', 'error'); return; }
        if (productosVenta.length === 0) { mostrarToast('Agrega al menos un producto', 'error'); return; }

        var empleadoId = getUsuarioId();

        var data = {
            empleadoId: empleadoId,
            clienteId: clienteId || null,
            clienteNombre: clienteNombre,
            metodoPagoId: 1,
            detalles: productosVenta.map(function (p) {
                return {
                    productoId: p.id || null,
                    productoNombre: p.nombre,
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

    // --- Eliminar venta ---
    $(document).on('click', '.btn-eliminar-venta', function () {
        var id = $(this).data('id');
        var cliente = $(this).data('cliente');
        $('#modalEliminarVentaId').text('#' + id + ' (' + cliente + ')');
        $('#btnConfirmarEliminarVenta').data('id', id);
        abrirModal('modalEliminarVenta');
    });

    $('#btnConfirmarEliminarVenta').on('click', function () {
        var id = $(this).data('id');
        apiDelete('/ventas/' + id)
            .then(function () {
                mostrarToast('Venta eliminada', 'exito');
                cerrarModal('modalEliminarVenta');
                cargarVentas();
            })
            .catch(function () { mostrarToast('Error al eliminar venta', 'error'); });
    });

});
