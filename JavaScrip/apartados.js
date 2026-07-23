if (!localStorage.getItem('token') || localStorage.getItem('rol') !== 'ADMIN') { window.location.href = '../index.html'; }
$(document).ready(function () {

    try {
        let user = JSON.parse(localStorage.getItem('usuario'));
        if (user) {
            var nameEl5 = document.getElementsByClassName("user-name")[0];
            if (nameEl5) nameEl5.innerHTML = user.nombreUsuario;
            var roleEl5 = document.getElementsByClassName("user-role")[0];
            if (roleEl5) roleEl5.innerHTML = user.rol;
        }
    } catch(e) { window.location.href = '../index.html'; return; }
    

    var apartadosData = [];
    var productosApartado = [];

    function cargarApartados() {
        apiGet('/apartados')
            .then(function (respuesta) {
                apartadosData = Array.isArray(respuesta) ? respuesta.reverse() : [];
                renderizarTabla(apartadosData);
            })
            .catch(function () {
                $('#cuerpoTabla').html('<tr><td colspan="8" style="text-align:center;color:#888;">Sin apartados</td></tr>');
            });
    }

    function renderizarTabla(apartados) {
        var html = '';
        $.each(apartados, function (i, a) {
            var cliente = a.cliente ? (a.cliente.nombre + ' ' + a.cliente.apellido) : '-';
            var tel = a.cliente ? (a.cliente.telefono || '-') : '-';
            var estado = a.estado || 'ACTIVO';
            var estadoClase = 'estado-' + estado.toLowerCase();
            var total = a.total || 0;
            var abonado = a.abonado || a.abono || 0;
            var pendiente = a.pendiente || 0;
            var primerProducto = (a.detalles && a.detalles.length > 0) ? a.detalles[0] : null;
            var nombreProd = primerProducto && primerProducto.producto ? primerProducto.producto.nombre : 'Sin productos';
            var restoCount = a.detalles ? a.detalles.length - 1 : 0;

            html += '<tr>';
            html += '<td><strong>' + cliente + '</strong><br><span class="telefono-celda">' + tel + '</span></td>';
            html += '<td>';
            html += '<div class="producto-celda">';
            html += '<img src="../Image/productos.png" class="img-producto-apartado" alt="Producto">';
            html += '<div class="producto-info"><strong>' + nombreProd + '</strong></div>';
            html += '</div>';
            if (restoCount > 0) html += '<span class="mas-productos">+' + restoCount + ' productos</span>';
            html += '</td>';
            html += '<td>$' + formatNumber(total) + '</td>';
            html += '<td>$' + formatNumber(abonado) + '</td>';
            html += '<td>$' + formatNumber(pendiente) + '</td>';
            html += '<td>' + (a.fechaLimite || a.fechaApartado ? formatearFechaAp(a.fechaLimite || a.fechaApartado) : '-') + '</td>';
            html += '<td><span class="' + estadoClase + '">' + estado + '</span></td>';
            html += '<td><div class="acciones-botones">';
            html += '<button class="btn-icono btn-visualizar" data-id="' + a.id + '" title="Visualizar">&#128065;</button> ';
            if (estado === 'ACTIVO' && pendiente > 0) {
                html += '<button class="btn-icono btn-abonar" data-id="' + a.id + '" data-pendiente="' + pendiente + '" title="Abonar">&#128176;</button>';
            }
            if (estado === 'ACTIVO') {
                html += '<button class="btn-icono btn-eliminar-apartado" data-id="' + a.id + '" data-cliente="' + cliente + '" title="Cancelar apartado">&#128465;</button>';
            }
            html += '</div></td>';
            html += '</tr>';
        });
        $('#cuerpoTabla').html(html || '<tr><td colspan="8" style="text-align:center;color:#888;">Sin apartados</td></tr>');
    }

    function formatNumber(numero) {
        return parseFloat(numero).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function formatearFechaAp(fecha) {
        if (!fecha) return '-';
        try {
            if (Array.isArray(fecha)) {
                return String(fecha[2]).padStart(2, '0') + '/' + String(fecha[1]).padStart(2, '0') + '/' + fecha[0];
            }
            if (typeof fecha === 'string') {
                return fecha.split('T')[0].split('-').reverse().join('/');
            }
            return new Date(fecha).toLocaleDateString('es-MX');
        } catch (e) { return '-'; }
    }

    function mostrarToast(mensaje, tipo) {
        var $toast = $('#toastGlobal');
        $toast.removeClass('toast-exito toast-error').addClass('toast-' + tipo).text(mensaje).addClass('activo');
        setTimeout(function () { $toast.removeClass('activo'); }, 3000);
    }

    function abrirModal(id) { $('#' + id).addClass('activo'); }
    function cerrarModal(id) { $('#' + id).removeClass('activo'); }

    // --- Eliminar apartado ---
    $(document).on('click', '.btn-eliminar-apartado', function () {
        var id = $(this).data('id');
        var cliente = $(this).data('cliente');
        $('#modalEliminarApartadoCliente').text(cliente);
        $('#btnConfirmarEliminarApartado').data('id', id);
        abrirModal('modalEliminarApartado');
    });

    $('#btnConfirmarEliminarApartado').on('click', function () {
        var id = $(this).data('id');
        apiDelete('/apartados/' + id)
            .then(function () {
                mostrarToast('Apartado eliminado', 'exito');
                cerrarModal('modalEliminarApartado');
                cargarApartados();
            })
            .catch(function () { mostrarToast('Error al eliminar apartado', 'error'); });
    });

    cargarApartados();

    $('.buscar-apartado input').on('keyup', function () {
        var busqueda = $(this).val().toLowerCase();
        $('.tabla-apartados tbody tr').each(function () {
            var texto = $(this).text().toLowerCase();
            $(this).toggle(texto.indexOf(busqueda) > -1);
        });
    });

    $(document).on('click', '.btn-visualizar', function () {
        var id = $(this).data('id');
        var apartado = apartadosData.find(function (a) { return a.id == id; });
        if (!apartado || !apartado.detalles) return;
        var html = '';
        apartado.detalles.forEach(function (d) {
            var nombre = d.producto ? d.producto.nombre : 'Producto';
            html += '<div class="modal-producto-item">';
            html += '<img src="../Image/productos.png" alt="' + nombre + '">';
            html += '<div class="prod-info"><strong>' + nombre + '</strong>';
            if (d.talla) html += ' <span style="color:#888;">Talla: ' + d.talla + '</span>';
            html += '<span>$' + formatNumber(d.precioUnitario) + ' x ' + d.cantidad + '</span></div>';
            html += '</div>';
        });
        html += '<div class="detalle-fila" style="border-top:2px solid #C8A45D; margin-top:12px; padding-top:12px;"><span class="detalle-label">Total</span><span class="detalle-valor" style="font-size:16px;">$' + formatNumber(apartado.total) + '</span></div>';
        html += '<div class="detalle-fila"><span class="detalle-label">Abonado</span><span class="detalle-valor" style="color:#059669;">$' + formatNumber(apartado.abonado) + '</span></div>';
        html += '<div class="detalle-fila"><span class="detalle-label">Restante</span><span class="detalle-valor" style="color:#dc2626;">$' + formatNumber(apartado.pendiente) + '</span></div>';
        $('#modalListaProductos').html(html);
        abrirModal('modalProductos');
    });

    $(document).on('click', '.btn-cerrar-modal', function () { $(this).closest('.modal-overlay').removeClass('activo'); });
    $(document).on('click', '.btn-modal-cancelar', function () { $(this).closest('.modal-overlay').removeClass('activo'); });
    $(document).on('click', '.modal-overlay', function (e) { if (e.target === this) $(this).removeClass('activo'); });

    // --- Abonar logic ---
    var abonarIdActual = null;
    var abonarPendiente = 0;

    $(document).on('click', '.btn-abonar', function () {
        abonarIdActual = $(this).data('id');
        abonarPendiente = parseFloat($(this).data('pendiente'));
        $('#modalSaldoTotal').text('$' + formatNumber(abonarPendiente));
        $('#modalMontoAbono').val('').attr('max', abonarPendiente);
        $('#modalAbonoError').text('');
        $('#modalAbonar').addClass('activo');
        $('#modalMontoAbono').focus();
    });

    $('#btnCerrarModalAbono, #btnCancelarAbono').on('click', function () {
        $('#modalAbonar').removeClass('activo');
    });

    $('#btnConfirmarAbono').on('click', function () {
        var monto = parseFloat($('#modalMontoAbono').val());
        if (isNaN(monto) || monto <= 0) {
            $('#modalAbonoError').text('Ingresa un monto valido mayor a $0.');
            return;
        }
        if (monto > abonarPendiente) {
            $('#modalAbonoError').text('El monto excede el saldo pendiente de $' + formatNumber(abonarPendiente) + '.');
            return;
        }
        apiPut('/apartados/' + abonarIdActual + '/abono', { monto: monto })
            .then(function () {
                $('#modalAbonar').removeClass('activo');
                mostrarToast('Abono registrado correctamente.', 'exito');
                cargarApartados();
            })
            .catch(function (err) {
                $('#modalAbonoError').text('Error: ' + (err.error || 'No se pudo registrar el abono.'));
            });
    });

    $('#modalMontoAbono').on('input', function () { $('#modalAbonoError').text(''); });

    // --- Nuevo apartado ---
    var clientesCache = [];
    var productosCache = [];

    function cargarClientes() {
        apiGet('/clientes').then(function (r) { clientesCache = r; }).catch(function () {});
    }

    function cargarProductos() {
        apiGet('/productos').then(function (r) { productosCache = r; }).catch(function () {});
    }

    cargarClientes();
    cargarProductos();

    $('.btn-nuevo-apartado').on('click', function () {
        $('#modalNuevoApartadoForm')[0].reset();
        $('#campoApartadoClienteId').val('');
        $('#campoApartadoProductoId').val('');
        $('#sugerenciasClientes').hide();
        $('#sugerenciasProductos').hide();
        apiGet('/clientes').then(function (r) { clientesCache = r; }).catch(function () {});
        apiGet('/productos').then(function (r) { productosCache = r; }).catch(function () {});
        productosApartado = [];
        actualizarListaProductos();
        abrirModal('modalNuevoApartado');
    });

    // --- Cliente autocomplete ---
    var timeoutCliente;
    $('#campoApartadoCliente').on('input', function () {
        clearTimeout(timeoutCliente);
        var val = $(this).val().toLowerCase();
        if (val.length < 2) { $('#sugerenciasClientes').hide(); return; }
        timeoutCliente = setTimeout(function () {
            var listado = clientesCache;
            if (listado.length === 0) {
                apiGet('/clientes').then(function (r) {
                    clientesCache = r;
                    mostrarSugerenciasClientes(r, val);
                }).catch(function () {});
                return;
            }
            mostrarSugerenciasClientes(listado, val);
        }, 200);
    });

    function mostrarSugerenciasClientes(lista, val) {
        var filtrados = lista.filter(function (c) { return (c.nombre + ' ' + c.apellido).toLowerCase().indexOf(val) > -1; });
        var html = '';
        $.each(filtrados, function (i, c) {
            html += '<div class="sugerencia-item" data-id="' + c.id + '" data-nombre="' + (c.nombre + ' ' + c.apellido) + '" data-tel="' + (c.telefono || '') + '">';
            html += '<strong>' + c.nombre + ' ' + c.apellido + '</strong>';
            if (c.telefono) html += ' <span class="sugerencia-sub">' + c.telefono + '</span>';
            html += '</div>';
        });
        $('#sugerenciasClientes').html(html || '<div class="sugerencia-item" style="color:#888;">Sin coincidencias</div>').show();
    }

    $('#sugerenciasClientes').on('click', '.sugerencia-item', function () {
        var $item = $(this);
        $('#sugerenciasClientes').hide();
        $('#campoApartadoCliente').val($item.data('nombre'));
        $('#campoApartadoClienteId').val($item.data('id'));
    });

    $('#sugerenciasProductos').on('click', '.sugerencia-item', function () {
        var $item = $(this);
        $('#sugerenciasProductos').hide();
        var nombre = $item.data('nombre');
        var precio = $item.data('precio');
        $('#campoApartadoProducto').val(nombre);
        $('#campoApartadoProductoId').val($item.data('id'));
        if (precio) $('#campoApartadoPrecio').val(precio);
        $('#campoApartadoAtributo').val('');
        $('#campoApartadoPrecio').focus();
    });

    $(document).on('click', function (e) {
        if (!$(e.target).closest('.campo-grupo').length) {
            $('.lista-sugerencias').hide();
        }
    });

    // --- Producto autocomplete ---
    var timeoutProducto;
    $('#campoApartadoProducto').on('input', function () {
        clearTimeout(timeoutProducto);
        var val = $(this).val().toLowerCase();
        if (val.length < 2) { $('#sugerenciasProductos').hide(); return; }
        timeoutProducto = setTimeout(function () {
            var listado = productosCache;
            if (listado.length === 0) {
                apiGet('/productos').then(function (r) {
                    productosCache = r;
                    mostrarSugerenciasProductos(r, val);
                }).catch(function () {});
                return;
            }
            mostrarSugerenciasProductos(listado, val);
        }, 200);
    });

    function mostrarSugerenciasProductos(lista, val) {
        var filtrados = lista.filter(function (p) { return p.nombre.toLowerCase().indexOf(val) > -1; });
        var html = '';
        $.each(filtrados, function (i, p) {
            html += '<div class="sugerencia-item" data-id="' + p.id + '" data-nombre="' + p.nombre + '" data-precio="' + p.precio + '">';
            html += '<strong>' + p.nombre + '</strong>';
            if (p.categoria) {
                var catNombre = typeof p.categoria === 'string' ? p.categoria : (p.categoria.nombre || '');
                if (catNombre) html += ' <span class="sugerencia-sub">' + catNombre + '</span>';
            }
            html += '</div>';
        });
        $('#sugerenciasProductos').html(html || '<div class="sugerencia-item" style="color:#888;">Sin coincidencias</div>').show();
    }

    function actualizarListaProductos() {
        var html = '';
        var total = 0;
        $.each(productosApartado, function (i, p) {
            total += p.precio;
            html += '<div class="producto-agregado-item">';
            html += '<span><strong>' + p.nombre + '</strong>' + (p.atributo ? ' (' + p.atributo + ')' : '') + ' - $' + formatNumber(p.precio) + '</span>';
            html += '<button type="button" class="btn-quitar-producto" data-index="' + i + '">&times;</button>';
            html += '</div>';
        });
        $('#listaProductosApartado').html(html);
        var abono = parseFloat($('#campoApartadoAbono').val()) || 0;
        $('#totalApartado').text('$' + formatNumber(total));
        $('#abonadoApartado').text('$' + formatNumber(abono));
        $('#restanteApartado').text('$' + formatNumber(Math.max(0, total - abono)));
    }

    $('#btnAgregarProductoApartado').on('click', function () {
        var nombre = $('#campoApartadoProducto').val().trim();
        var productoId = parseInt($('#campoApartadoProductoId').val());
        var atributo = $('#campoApartadoAtributo').val().trim();
        var precio = parseFloat($('#campoApartadoPrecio').val());

        if (!nombre || isNaN(precio) || precio <= 0) {
            mostrarToast('Completa nombre y precio del producto', 'error');
            return;
        }
        if (!productoId) {
            mostrarToast('Selecciona un producto de la lista de sugerencias', 'error');
            return;
        }

        productosApartado.push({ id: productoId, nombre: nombre, atributo: atributo, precio: precio });
        $('#campoApartadoProducto').val('');
        $('#campoApartadoProductoId').val('');
        $('#campoApartadoAtributo').val('');
        $('#campoApartadoPrecio').val('');
        $('#sugerenciasProductos').hide();
        actualizarListaProductos();
        $('#campoApartadoProducto').focus();
    });

    $(document).on('click', '.btn-quitar-producto', function () {
        var index = $(this).data('index');
        productosApartado.splice(index, 1);
        actualizarListaProductos();
    });

    $('#campoApartadoAbono').on('input', function () { actualizarListaProductos(); });

    $('#btnGuardarApartado').on('click', function () {
        var clienteId = parseInt($('#campoApartadoClienteId').val());
        var abono = parseFloat($('#campoApartadoAbono').val()) || 0;
        var fechaLimite = $('#campoApartadoFecha').val();

        if (!clienteId) { mostrarToast('Selecciona un cliente de la lista de sugerencias', 'error'); return; }
        if (productosApartado.length === 0) { mostrarToast('Agrega al menos un producto', 'error'); return; }
        if (!fechaLimite) { mostrarToast('Selecciona la fecha limite', 'error'); return; }

        var empleadoId = getUsuarioId();

        var data = {
            clienteId: clienteId,
            empleadoId: empleadoId,
            detalles: productosApartado.map(function (p) {
                return {
                    productoId: p.id,
                    cantidad: 1,
                    precioUnitario: p.precio,
                    talla: p.atributo || null
                };
            }),
            abono: abono,
            abonado: abono,
            fechaLimite: fechaLimite
        };

        apiPost('/apartados', data)
            .then(function () {
                cerrarModal('modalNuevoApartado');
                mostrarToast('Apartado creado correctamente', 'exito');
                cargarApartados();
            })
            .catch(function (err) {
                var msg = err && (err.error || err.message || JSON.stringify(err)) || 'Error de conexion';
                mostrarToast('Error: ' + msg, 'error');
            });
    });

    // --- Filtro por estado ---
    $('.filtro-estado').on('change', function () {
        var valor = $(this).val().toLowerCase();
        $('.tabla-apartados tbody tr').each(function () {
            var estado = $(this).find('td:eq(6)').text().trim().toLowerCase();
            $(this).toggle(!valor || estado.indexOf(valor) > -1);
        });
    });

});
