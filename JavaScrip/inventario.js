if (!localStorage.getItem('token') || localStorage.getItem('rol') !== 'ADMIN') { window.location.href = '../index.html'; }
$(document).ready(function () {

    try {
        let user = JSON.parse(localStorage.getItem('usuario'));
        if (user) {
            var nameEl4 = document.getElementsByClassName("user-name")[0];
            if (nameEl4) nameEl4.innerHTML = user.nombreUsuario;
            var roleEl4 = document.getElementsByClassName("user-role")[0];
            if (roleEl4) roleEl4.innerHTML = user.rol;
        }
    } catch(e) { window.location.href = '../index.html'; return; }

    var inventarioData = [];
    var stockBajoData = [];

    function cargarInventario() {
        apiGet('/inventario')
            .then(function (respuesta) {
                var lista = Array.isArray(respuesta) ? respuesta : [];
                if (lista.length === 0) {
                    cargarDesdeProductos();
                    return;
                }
                inventarioData = lista;
                $('#totalProductos').text(lista.length || 0);
                var conStock = lista.filter(function (i) { return (i.stock || 0) > 0; }).length;
                $('#entradasMes').text(conStock);
                renderizarInventario(lista);
                cargarAlertasStock(lista);
            })
            .catch(function () {
                cargarDesdeProductos();
            });
    }

    function cargarDesdeProductos() {
        apiGet('/productos')
            .then(function (productos) {
                var lista = Array.isArray(productos) ? productos : [];
                inventarioData = lista.map(function (p) {
                    return {
                        id: p.id,
                        producto: { id: p.id, nombre: p.nombre, precio: p.precio, categoria: p.categoria },
                        stock: p.stock || 0,
                        stockMinimo: 5,
                        talla: 'Unica'
                    };
                });
                $('#totalProductos').text(lista.length);
                var conStock = lista.filter(function (p) { return (p.stock || 0) > 0; }).length;
                $('#entradasMes').text(conStock);
                renderizarInventario(inventarioData);
                cargarAlertasStock(inventarioData);
            })
            .catch(function () {
                $('#totalProductos').text('0');
                $('#entradasMes').text('0');
                $('#cuerpoInventario').html('<tr><td colspan="6" style="text-align:center;color:#888;">Sin inventario</td></tr>');
            });
    }

    function cargarAlertasStock(lista) {
        var stockBajo = (lista || []).filter(function (i) { return (i.stock || 0) <= (i.stockMinimo || 5); });
        stockBajoData = stockBajo;
        $('#stockBajo').text(stockBajo.length);
        renderizarStockBajo(stockBajo);
    }

    function renderizarInventario(data) {
        var grupos = {};
        $.each(data, function (i, item) {
            var pid = item.producto ? item.producto.id : 'x' + i;
            if (!grupos[pid]) {
                var p = item.producto || {};
                grupos[pid] = {
                    productoId: pid,
                    nombre: p.nombre || 'Producto #' + pid,
                    categoria: p.categoria ? (typeof p.categoria === 'string' ? p.categoria : p.categoria.nombre) : '-',
                    precio: Number(p.precio || 0),
                    tallas: [],
                    stockTotal: 0,
                    items: []
                };
            }
            grupos[pid].items.push(item);
            grupos[pid].stockTotal += item.stock || 0;
            if ((item.stock || 0) > 0 && item.talla && grupos[pid].tallas.indexOf(item.talla) === -1) {
                grupos[pid].tallas.push(item.talla);
            }
        });

        var html = '';
        $.each(grupos, function (pid, g) {
            var precioStr = '$' + Number(g.precio).toLocaleString('es-MX', { minimumFractionDigits: 2 });
            var tallasHtml = '';
            if (g.tallas.length > 0) {
                $.each(g.tallas, function (j, t) {
                    tallasHtml += '<span class="tag-size">' + escapeHtml(t) + '</span> ';
                });
            } else {
                tallasHtml = '<span style="color:#94a3b8;">-</span>';
            }
            html += '<tr>';
            html += '<td><div class="producto-info"><span>' + escapeHtml(g.nombre) + '</span></div></td>';
            html += '<td>' + escapeHtml(g.categoria) + '</td>';
            html += '<td>' + precioStr + '</td>';
            html += '<td>' + tallasHtml + '</td>';
            html += '<td>' + g.stockTotal + '</td>';
            html += '<td><div class="acciones-botones">';
            html += '<button class="btn-icono btn-editar-inv" data-producto-id="' + pid + '" title="Editar stock">&#9998;</button>';
            html += '</div></td>';
            html += '</tr>';
        });
        $('#cuerpoInventario').html(html || '<tr><td colspan="6" style="text-align:center;color:#888;">Sin inventario</td></tr>');
    }

    function renderizarStockBajo(data) {
        var html = '';
        $.each(data, function (i, item) {
            var nombre = item.producto ? item.producto.nombre : '-';
            var diferencia = (item.stock || 0) - (item.stockMinimo || 0);
            var estado = diferencia < 0 ? 'critico' : 'alerta';
            var estadoLabel = estado === 'critico' ? 'Critico' : 'Alerta';
            html += '<tr>';
            html += '<td><div class="producto-info"><img src="../Image/productos.png" class="img-producto" alt="Producto"><span>' + escapeHtml(nombre) + '</span></div></td>';
            html += '<td>' + (item.stock || 0) + '</td>';
            html += '<td>' + (item.stockMinimo || 0) + '</td>';
            html += '<td>' + diferencia + '</td>';
            html += '<td><span class="stock-' + estado + ' estado-' + estado + '">' + estadoLabel + '</span></td>';
            html += '<td><button class="btn-icono btn-reabastecer" data-id="' + item.id + '" title="Reabastecer">&#128221;</button></td>';
            html += '</tr>';
        });
        $('#cuerpoStockBajo').html(html || '<tr><td colspan="6" style="text-align:center;color:#888;">Sin alertas</td></tr>');
    }

    function mostrarToast(mensaje, tipo) {
        var $toast = $('#toastGlobal');
        $toast.removeClass('toast-exito toast-error').addClass('toast-' + tipo).text(mensaje).addClass('activo');
        setTimeout(function () { $toast.removeClass('activo'); }, 3000);
    }

    function abrirModal(id) { $('#' + id).addClass('activo'); }
    function cerrarModal(id) { $('#' + id).removeClass('activo'); }

    $('.tab-inventario').on('click', function () {
        var target = $(this).data('target');
        $('.tab-inventario').removeClass('tab-activo');
        $(this).addClass('tab-activo');
        $('.tab-panel').removeClass('tab-activo');
        $('#' + target).addClass('tab-activo');
    });

    $('.tarjeta-stat-card').eq(0).css('cursor', 'pointer').on('click', function () {
        $('.tab-inventario[data-target="inventarioActual"]').click();
    });
    $('.tarjeta-stat-card').eq(1).css('cursor', 'pointer').on('click', function () {
        $('.tab-inventario[data-target="inventarioActual"]').click();
    });
    $('.tarjeta-stat-card').eq(2).css('cursor', 'pointer').on('click', function () {
        $('.tab-inventario[data-target="stockBajoLista"]').click();
    });

    $('#btnAgregarAlInventario').on('click', function () {
        apiGet('/productos').then(function (productos) {
            var $select = $('#campoAgregarInvProducto');
            $select.find('option:gt(0)').remove();
            $.each(productos || [], function (i, p) {
                $select.append('<option value="' + p.id + '">' + p.nombre + '</option>');
            });
        }).catch(function () {});
        $('#campoAgregarInvTalla').val('');
        $('#campoAgregarInvStock').val(0);
        $('#campoAgregarInvStockMin').val(5);
        abrirModal('modalAgregarInv');
    });

    $('#btnGuardarAgregarInv').on('click', function () {
        var productoId = parseInt($('#campoAgregarInvProducto').val());
        var talla = $('#campoAgregarInvTalla').val().trim() || 'Unica';
        var stock = parseInt($('#campoAgregarInvStock').val()) || 0;
        var stockMinimo = parseInt($('#campoAgregarInvStockMin').val()) || 5;

        if (!productoId) { mostrarToast('Selecciona un producto', 'error'); return; }

        var payload = {
            producto: { id: productoId },
            talla: talla,
            stock: stock,
            stockMinimo: stockMinimo
        };

        apiPost('/inventario', payload)
            .then(function () {
                mostrarToast('Producto agregado al inventario', 'exito');
                cerrarModal('modalAgregarInv');
                cargarInventario();
            })
            .catch(function () {
                mostrarToast('Error al agregar al inventario', 'error');
            });
    });

    $(document).on('click', '.btn-reabastecer', function () {
        var id = $(this).data('id');
        var item = inventarioData.find(function (i) { return i.id == id; }) || stockBajoData.find(function (i) { return i.id == id; });
        if (!item) return;
        var nombre = item.producto ? item.producto.nombre : '-';
        var falta = (item.stockMinimo || 0) - (item.stock || 0);
        $('#campoReabastecerId').val(item.id);
        $('#campoReabastecerProducto').val(nombre);
        $('#campoReabastecerFalta').text('Faltan ' + Math.max(falta, 0) + ' unidades para alcanzar el stock minimo.');
        $('#campoReabastecerCantidad').val(Math.max(falta, 1));
        abrirModal('modalReabastecer');
    });

    $('#btnGuardarReabastecer').on('click', function () {
        var id = $('#campoReabastecerId').val();
        var cantidad = parseInt($('#campoReabastecerCantidad').val());
        if (!cantidad || cantidad <= 0) { mostrarToast('Ingresa una cantidad valida', 'error'); return; }

        var item = inventarioData.find(function (i) { return i.id == id; });
        if (!item) { mostrarToast('Producto no encontrado', 'error'); return; }

        var nuevoStock = (item.stock || 0) + cantidad;

        apiPut('/inventario/' + id, { stock: nuevoStock })
            .then(function () {
                mostrarToast('Producto reabastecido', 'exito');
                cerrarModal('modalReabastecer');
                cargarInventario();
            })
            .catch(function () { mostrarToast('Error al reabastecer', 'error'); });
    });

    $(document).on('click', '.btn-editar-inv', function () {
        var productoId = $(this).data('producto-id');
        var items = inventarioData.filter(function (i) { return i.producto && i.producto.id == productoId; });
        if (!items || items.length === 0) return;

        var p = items[0].producto;
        var html = '<div class="detalle-fila" style="border-bottom:2px solid #C8A45D;padding-bottom:10px;margin-bottom:10px;">';
        html += '<span class="detalle-label" style="font-size:15px;">' + escapeHtml(p.nombre) + '</span></div>';

        $.each(items, function (i, item) {
            html += '<div class="detalle-fila" style="border-bottom:1px solid #eee;padding:8px 0;">';
            html += '<span class="detalle-label" style="width:auto;min-width:60px;">Talla ' + escapeHtml(item.talla || 'Unica') + ':</span>';
            html += '<span class="detalle-valor" style="display:flex;align-items:center;gap:8px;">';
            html += '<input type="number" id="edit-stock-' + item.id + '" value="' + (item.stock || 0) + '" min="0" style="width:80px;padding:4px 8px;border:1px solid #ddd;border-radius:4px;text-align:center;">';
            html += '<button class="btn-icono btn-save-stock" data-id="' + item.id + '" title="Guardar" style="border-color:#27a745;color:#27a745;">&#10003;</button>';
            html += '</span></div>';
        });

        $('#modalInvDetalle').html(html);
        abrirModal('modalVerInventario');
    });

    $(document).on('click', '.btn-save-stock', function () {
        var id = $(this).data('id');
        var stock = parseInt($('#edit-stock-' + id).val());
        if (isNaN(stock) || stock < 0) { mostrarToast('Stock invalido', 'error'); return; }

        apiPut('/inventario/' + id, { stock: stock })
            .then(function () {
                mostrarToast('Stock actualizado', 'exito');
                cerrarModal('modalVerInventario');
                cargarInventario();
            })
            .catch(function () { mostrarToast('Error al actualizar', 'error'); });
    });

    $(document).on('click', '.btn-cerrar-modal', function () { $(this).closest('.modal-overlay').removeClass('activo'); });
    $(document).on('click', '.btn-modal-cancelar', function () { $(this).closest('.modal-overlay').removeClass('activo'); });
    $(document).on('click', '.modal-overlay', function (e) { if (e.target === this) $(this).removeClass('activo'); });

    cargarInventario();

});
