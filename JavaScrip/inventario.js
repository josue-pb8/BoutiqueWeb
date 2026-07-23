if (!localStorage.getItem('token') || localStorage.getItem('rol') !== 'ADMIN') { window.location.href = '../index.html'; }
$(document).ready(function () {

    let user = JSON.parse(localStorage.getItem('usuario')); 
    document.getElementsByClassName("user-name")[0].innerHTML = user.nombreUsuario; 
    document.getElementsByClassName("user-role")[0].innerHTML = user.rol; 

    var inventarioData = [];
    var stockBajoData = [];

    function cargarInventario() {
        apiGet('/inventario')
            .then(function (respuesta) {
                inventarioData = respuesta;
                $('#totalProductos').text(respuesta.length || 0);
                var conStock = respuesta.filter(function (i) { return (i.stock || 0) > 0; }).length;
                $('#entradasMes').text(conStock);
                renderizarInventario(respuesta);
            })
            .catch(function () {
                $('#totalProductos').text('0');
                $('#cuerpoInventario').html('<tr><td colspan="6" style="text-align:center;color:#888;">Sin inventario</td></tr>');
            });

        apiGet('/inventario/alertas-stock')
            .then(function (respuesta) {
                stockBajoData = respuesta;
                $('#stockBajo').text(respuesta.length);
                renderizarStockBajo(respuesta);
            })
            .catch(function () {
                $('#stockBajo').text('0');
                $('#cuerpoStockBajo').html('<tr><td colspan="6" style="text-align:center;color:#888;">Sin alertas</td></tr>');
            });

    }

    function escapeHtml(text) {
        return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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
                    tallasHtml += '<span class="tag-size">' + t + '</span> ';
                });
            } else {
                tallasHtml = '<span style="color:#94a3b8;">-</span>';
            }
            html += '<tr>';
            html += '<td><div class="producto-info"><span>' + g.nombre + '</span></div></td>';
            html += '<td>' + g.categoria + '</td>';
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
            var estadoLabel = estado === 'critico' ? 'Crítico' : 'Alerta';
            html += '<tr>';
            html += '<td><div class="producto-info"><img src="../Image/productos.png" class="img-producto" alt="Producto"><span>' + nombre + '</span></div></td>';
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
    $('.tarjeta-stat-card').eq(2).css('cursor', 'pointer').on('click', function () {
        $('.tab-inventario[data-target="stockBajoLista"]').click();
    });

    // ---- Buscar inventario ----
    $('#campoBuscarInventario').on('keyup', function () {
        var texto = $(this).val().toLowerCase();
        $('#cuerpoInventario tr').each(function () {
            var nombre = $(this).find('td').eq(0).text().toLowerCase();
            var categoria = $(this).find('td').eq(1).text().toLowerCase();
            $(this).toggle(nombre.indexOf(texto) !== -1 || categoria.indexOf(texto) !== -1);
        });
    });

    // ---- Reabastecer desde Stock Bajo ----
    $(document).on('click', '.btn-reabastecer', function () {
        var id = $(this).data('id');
        var item = inventarioData.find(function (i) { return i.id == id; }) || stockBajoData.find(function (i) { return i.id == id; });
        if (!item) return;
        var nombre = item.producto ? item.producto.nombre : '-';
        var falta = (item.stockMinimo || 0) - (item.stock || 0);
        $('#campoReabastecerId').val(item.id);
        $('#campoReabastecerProducto').val(nombre);
        $('#campoReabastecerFalta').text('Faltan ' + Math.max(falta, 0) + ' unidades para alcanzar el stock mínimo.');
        $('#campoReabastecerCantidad').val(Math.max(falta, 1));
        abrirModal('modalReabastecer');
    });

    $('#btnGuardarReabastecer').on('click', function () {
        var id = $('#campoReabastecerId').val();
        var cantidad = parseInt($('#campoReabastecerCantidad').val());
        if (!cantidad || cantidad <= 0) { mostrarToast('Ingresa una cantidad válida', 'error'); return; }

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

    // ---- Editar stock por producto (agrupado) ----
    $(document).on('click', '.btn-editar-inv', function () {
        var productoId = $(this).data('producto-id');
        var items = inventarioData.filter(function (i) { return i.producto && i.producto.id == productoId; });
        if (!items || items.length === 0) return;

        var p = items[0].producto;
        var html = '<div class="detalle-fila" style="border-bottom:2px solid #C8A45D;padding-bottom:10px;margin-bottom:10px;">';
        html += '<span class="detalle-label" style="font-size:15px;">' + p.nombre + '</span></div>';

        $.each(items, function (i, item) {
            html += '<div class="detalle-fila" style="border-bottom:1px solid #eee;padding:8px 0;">';
            html += '<span class="detalle-label" style="width:auto;min-width:60px;">Talla ' + (item.talla || 'Única') + ':</span>';
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
        if (isNaN(stock) || stock < 0) { mostrarToast('Stock inválido', 'error'); return; }

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

    // --- Nueva entrada de inventario ---
    var productosInvCache = [];

    function cargarProductosInv() {
        apiGet('/productos').then(function (r) { productosInvCache = r || []; }).catch(function () {});
    }
    cargarProductosInv();

    $('#btnNuevaEntrada').on('click', function () {
        $('#modalNuevaEntradaForm')[0].reset();
        $('#campoInvProductoId').val('');
        $('#sugerenciasInvProducto').hide();
        cargarProductosInv();
        abrirModal('modalNuevaEntrada');
    });

    var timeoutInvProducto;
    $('#campoInvProducto').on('input', function () {
        clearTimeout(timeoutInvProducto);
        var val = $(this).val().toLowerCase();
        if (val.length < 2) { $('#sugerenciasInvProducto').hide(); return; }
        timeoutInvProducto = setTimeout(function () {
            var listado = productosInvCache;
            if (listado.length === 0) {
                apiGet('/productos').then(function (r) {
                    productosInvCache = r;
                    mostrarSugerenciasInv(r, val);
                }).catch(function () {});
                return;
            }
            mostrarSugerenciasInv(listado, val);
        }, 200);
    });

    function mostrarSugerenciasInv(lista, val) {
        var filtrados = lista.filter(function (p) { return p.nombre.toLowerCase().indexOf(val) > -1; });
        var html = '';
        $.each(filtrados, function (i, p) {
            html += '<div class="sugerencia-item" data-id="' + p.id + '" data-nombre="' + p.nombre + '">';
            html += '<strong>' + p.nombre + '</strong>';
            html += '</div>';
        });
        $('#sugerenciasInvProducto').html(html || '<div class="sugerencia-item" style="color:#888;">Sin coincidencias</div>').show();
    }

    $('#sugerenciasInvProducto').on('click', '.sugerencia-item', function () {
        var $item = $(this);
        $('#sugerenciasInvProducto').hide();
        $('#campoInvProducto').val($item.data('nombre'));
        $('#campoInvProductoId').val($item.data('id'));
    });

    $(document).on('click', function (e) {
        if (!$(e.target).closest('#campoInvProducto').length && !$(e.target).closest('#sugerenciasInvProducto').length) {
            $('#sugerenciasInvProducto').hide();
        }
    });

    $('#btnGuardarNuevaEntrada').on('click', function () {
        var productoId = parseInt($('#campoInvProductoId').val());
        var talla = $('#campoInvTalla').val().trim();
        var stock = parseInt($('#campoInvStock').val());
        var stockMinimo = parseInt($('#campoInvStockMinimo').val()) || 10;

        if (!productoId) { mostrarToast('Selecciona un producto de la lista', 'error'); return; }
        if (isNaN(stock) || stock < 0) { mostrarToast('Ingresa un stock valido', 'error'); return; }

        var data = {
            producto: { id: productoId },
            talla: talla || null,
            stock: stock,
            stockMinimo: stockMinimo
        };

        apiPost('/inventario', data)
            .then(function () {
                mostrarToast('Entrada de inventario creada', 'exito');
                cerrarModal('modalNuevaEntrada');
                cargarInventario();
            })
            .catch(function () { mostrarToast('Error al crear entrada', 'error'); });
    });

    cargarInventario();

});
