if (!localStorage.getItem('token') || localStorage.getItem('rol') !== 'ADMIN') { window.location.href = '../index.html'; }
$(document).ready(function () {

    try {
        let user = JSON.parse(localStorage.getItem('usuario'));
        if (user) {
            var nameEl6 = document.getElementsByClassName("user-name")[0];
            if (nameEl6) nameEl6.innerHTML = user.nombreUsuario;
            var roleEl6 = document.getElementsByClassName("user-role")[0];
            if (roleEl6) roleEl6.innerHTML = user.rol;
        }
    } catch(e) { window.location.href = '../index.html'; return; }

    var descuentosData = [];
    var descuentoEditando = null;

    function cargarDescuentos() {
        apiGet('/descuentos')
            .then(function (respuesta) {
                var lista = Array.isArray(respuesta) ? respuesta : [];
                descuentosData = lista.map(function (d) {
                    var estado = (d.activo === true || d.activo === 'true') ? 'activo' : 'vencido';
                    return {
                        id: d.id,
                        nombre: d.nombre,
                        descuento: (d.porcentaje || 0) + '%',
                        porcentaje: d.porcentaje || 0,
                        precioOriginal: 0,
                        precioDescuento: 0,
                        inicio: d.fechaInicio || '-',
                        fin: d.fechaFin || '-',
                        estado: estado
                    };
                });
                renderizarTodosLosPaneles(descuentosData);
                actualizarEstadisticas(descuentosData);
            })
            .catch(function () {
                $('#cuerpoTodos').html('<tr><td colspan="8" style="text-align:center;color:#888;">Sin descuentos</td></tr>');
            });
    }

    function actualizarEstadisticas(descuentos) {
        var activos = descuentos.filter(function (d) { return d.estado === 'activo'; }).length;
        var programados = descuentos.filter(function (d) { return d.estado === 'programado'; }).length;
        var vencidos = descuentos.filter(function (d) { return d.estado === 'vencido'; }).length;
        $('#descActivos').text(activos);
        $('#descProximos').text(programados);
        $('#descVencidos').text(vencidos);
        $('#descTotal').text(descuentos.length);
    }

    function formatearFila(d) {
        var estadoClase = 'estado-' + d.estado + '-desc';
        var estadoTexto = d.estado.charAt(0).toUpperCase() + d.estado.slice(1);
        var html = '<tr>';
        html += '<td><div class="producto-info-desc"><img src="../Image/productos.png" class="img-producto-desc" alt="Producto"><span>' + d.nombre + '</span></div></td>';
        html += '<td>' + d.descuento + '</td>';
        html += '<td>$' + formatNumber(d.precioOriginal) + '</td>';
        html += '<td>$' + formatNumber(d.precioDescuento) + '</td>';
        html += '<td>' + d.inicio + '</td>';
        html += '<td>' + d.fin + '</td>';
        html += '<td><span class="' + estadoClase + '">' + estadoTexto + '</span></td>';
        html += '<td><div class="acciones-botones-desc">';
        html += '<button class="btn-icono-desc btn-editar-desc" data-id="' + d.id + '" title="Editar">&#9998;</button>';
        html += '<button class="btn-icono-desc btn-eliminar-desc" data-id="' + d.id + '" title="Eliminar">&#128465;</button>';
        html += '</div></td>';
        html += '</tr>';
        return html;
    }

    function renderizarTodosLosPaneles(descuentos) {
        var htmlTodos = '';
        $.each(descuentos, function (i, d) { htmlTodos += formatearFila(d); });
        $('#cuerpoTodos').html(htmlTodos || '<tr><td colspan="8" style="text-align:center;color:#888;">No hay descuentos</td></tr>');

        var activos = descuentos.filter(function (d) { return d.estado === 'activo'; });
        var htmlActivos = '';
        $.each(activos, function (i, d) { htmlActivos += formatearFila(d); });
        $('#cuerpoActivos').html(htmlActivos || '<tr><td colspan="8" style="text-align:center;color:#888;">No hay activos</td></tr>');

        var programados = descuentos.filter(function (d) { return d.estado === 'programado'; });
        var htmlProgramados = '';
        $.each(programados, function (i, d) { htmlProgramados += formatearFila(d); });
        $('#cuerpoProgramados').html(htmlProgramados || '<tr><td colspan="8" style="text-align:center;color:#888;">No hay programados</td></tr>');

        var vencidos = descuentos.filter(function (d) { return d.estado === 'vencido'; });
        var htmlVencidos = '';
        $.each(vencidos, function (i, d) { htmlVencidos += formatearFila(d); });
        $('#cuerpoVencidos').html(htmlVencidos || '<tr><td colspan="8" style="text-align:center;color:#888;">No hay vencidos</td></tr>');
    }

    function formatNumber(numero) {
        return parseFloat(numero).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function mostrarToast(mensaje, tipo) {
        var $toast = $('#toastGlobal');
        $toast.removeClass('toast-exito toast-error').addClass('toast-' + tipo).text(mensaje).addClass('activo');
        setTimeout(function () { $toast.removeClass('activo'); }, 3000);
    }

    function abrirModal(id) { $('#' + id).addClass('activo'); }
    function cerrarModal(id) { $('#' + id).removeClass('activo'); }

    $('.tab-descuento').on('click', function () {
        var target = $(this).data('target');
        $('.tab-descuento').removeClass('tab-activo');
        $(this).addClass('tab-activo');
        $('.tab-panel-desc').removeClass('tab-activo');
        $('#' + target).addClass('tab-activo');
    });

    $('.buscar-descuento input').on('keyup', function () {
        var busqueda = $(this).val().toLowerCase();
        $('.tab-panel-desc.tab-activo tbody tr').each(function () {
            var texto = $(this).text().toLowerCase();
            $(this).toggle(texto.indexOf(busqueda) > -1);
        });
    });

    cargarDescuentos();

    $('.btn-crear-descuento').on('click', function () {
        descuentoEditando = null;
        $('#modalDescuentoForm')[0].reset();
        $('#modalDescuentoTitulo').text('Crear descuento');
        abrirModal('modalDescuento');
    });

    $(document).on('click', '.btn-editar-desc', function () {
        var id = $(this).data('id');
        var desc = descuentosData.find(function (d) { return d.id == id; });
        if (!desc) return;
        descuentoEditando = desc;
        $('#modalDescuentoTitulo').text('Editar descuento');
        $('#campoDescNombre').val(desc.nombre);
        if (desc.porcentaje) $('#campoDescTipo').val(desc.porcentaje + '%');
        $('#campoDescPrecioOriginal').val(desc.precioOriginal);
        $('#campoDescPrecioDescuento').val(desc.precioDescuento);
        $('#campoDescEstado').val(desc.estado);
        $('#campoDescInicio').val(desc.inicio);
        $('#campoDescFin').val(desc.fin);
        abrirModal('modalDescuento');
    });

    $('#btnGuardarDescuento').on('click', function () {
        var nombre = $('#campoDescNombre').val().trim();
        var porcentajeStr = $('#campoDescTipo').val();
        var precioOriginal = parseFloat($('#campoDescPrecioOriginal').val()) || 0;
        var precioDescuento = parseFloat($('#campoDescPrecioDescuento').val()) || 0;
        var estado = $('#campoDescEstado').val();
        var inicio = $('#campoDescInicio').val().trim();
        var fin = $('#campoDescFin').val().trim();

        if (!nombre) { mostrarToast('Ingresa el nombre', 'error'); return; }

        var porcentaje = 15;
        var m = (porcentajeStr || '').match(/(\d+)/);
        if (m) porcentaje = parseInt(m[1]);

        var payload = {
            nombre: nombre,
            porcentaje: porcentaje,
            fechaInicio: inicio,
            fechaFin: fin,
            activo: estado === 'activo'
        };

        var accion = descuentoEditando ? apiPut('/descuentos/' + descuentoEditando.id, payload) : apiPost('/descuentos', payload);
        accion
            .then(function () {
                mostrarToast(descuentoEditando ? 'Descuento actualizado' : 'Descuento creado', 'exito');
                cerrarModal('modalDescuento');
                location.reload();
            })
            .catch(function () {
                mostrarToast('Error al guardar descuento', 'error');
            });
    });

    $(document).on('click', '.btn-eliminar-desc', function () {
        var id = $(this).data('id');
        var desc = descuentosData.find(function (d) { return d.id == id; });
        if (!desc) return;
        $('#modalEliminarDescNombre').text(desc.nombre);
        $('#btnConfirmarEliminarDesc').attr('data-id', id);
        abrirModal('modalEliminarDesc');
    });

    $(document).on('click', '#btnConfirmarEliminarDesc', function () {
        var id = $(this).attr('data-id');
        if (!id) { mostrarToast('Error: ID no valido', 'error'); return; }
        apiDelete('/descuentos/' + id)
            .then(function () {
                mostrarToast('Descuento eliminado', 'exito');
                cerrarModal('modalEliminarDesc');
                cargarDescuentos();
            })
            .catch(function () {
                mostrarToast('Error al eliminar descuento', 'error');
            });
    });

    $(document).on('click', '.btn-cerrar-modal', function () { $(this).closest('.modal-overlay').removeClass('activo'); });
    $(document).on('click', '.btn-modal-cancelar', function () { $(this).closest('.modal-overlay').removeClass('activo'); });
    $(document).on('click', '.modal-overlay', function (e) { if (e.target === this) $(this).removeClass('activo'); });

});
