if (!localStorage.getItem('token') || localStorage.getItem('rol') !== 'ADMIN') { window.location.href = '../index.html'; }
$(document).ready(function () {

    let user = JSON.parse(localStorage.getItem('usuario'));
    document.getElementsByClassName("user-name")[0].innerHTML = user.nombreUsuario;
    document.getElementsByClassName("user-role")[0].innerHTML = user.rol;

    var descuentosData = [];
    var descuentoEditando = null;

    function cargarDescuentos() {
        apiGet('/descuentos')
            .then(function (respuesta) {
                var lista = Array.isArray(respuesta) ? respuesta : [];
                descuentosData = lista.map(function (d) {
                    var estado = (d.activo === true || d.activo === 'true') ? 'activo' : 'vencido';
                    if (d.fechaInicio && d.fechaFin) {
                        var hoy = new Date().toISOString().split('T')[0];
                        var inicio = d.fechaInicio;
                        var fin = d.fechaFin;
                        if (typeof inicio !== 'string') inicio = new Date(inicio).toISOString().split('T')[0];
                        if (typeof fin !== 'string') fin = new Date(fin).toISOString().split('T')[0];
                        if (hoy < inicio) estado = 'programado';
                        else if (hoy > fin) estado = 'vencido';
                        else estado = 'activo';
                    }
                    return {
                        id: d.id,
                        nombre: d.nombre,
                        descuento: (d.porcentaje || 0) + '%',
                        porcentaje: d.porcentaje || 0,
                        inicio: formatDateShort(d.fechaInicio),
                        fin: formatDateShort(d.fechaFin),
                        rawInicio: d.fechaInicio || '',
                        rawFin: d.fechaFin || '',
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

    function formatDateShort(fecha) {
        if (!fecha) return '-';
        try {
            if (typeof fecha === 'string' && fecha.length >= 10) {
                var parts = fecha.substring(0, 10).split('-');
                if (parts.length === 3) return parts[2] + '/' + parts[1] + '/' + parts[0];
            }
            if (Array.isArray(fecha)) {
                return String(fecha[2]).padStart(2, '0') + '/' + String(fecha[1]).padStart(2, '0') + '/' + fecha[0];
            }
            return new Date(fecha).toLocaleDateString('es-MX');
        } catch (e) { return '-'; }
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
        html += '<td><strong>' + d.nombre + '</strong></td>';
        html += '<td>' + d.descuento + '</td>';
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
        $('#campoDescEstado').val(desc.estado);
        var inicioStr = desc.inicio && desc.inicio !== '-' ? desc.inicio.split('/').reverse().join('-') : '';
        var finStr = desc.fin && desc.fin !== '-' ? desc.fin.split('/').reverse().join('-') : '';
        $('#campoDescInicio').val(inicioStr);
        $('#campoDescFin').val(finStr);
        abrirModal('modalDescuento');
    });

    $('#btnGuardarDescuento').on('click', function () {
        var nombre = $('#campoDescNombre').val().trim();
        var porcentajeStr = $('#campoDescTipo').val();
        var estado = $('#campoDescEstado').val();
        var inicio = $('#campoDescInicio').val();
        var fin = $('#campoDescFin').val();

        if (!nombre) { mostrarToast('Ingresa el nombre', 'error'); return; }
        if (!inicio) { mostrarToast('Selecciona la fecha de inicio', 'error'); return; }
        if (!fin) { mostrarToast('Selecciona la fecha de fin', 'error'); return; }

        var porcentaje = 15;
        var m = (porcentajeStr || '').match(/(\d+)/);
        if (m) porcentaje = parseInt(m[1]);

        var payload = {
            nombre: nombre,
            porcentaje: porcentaje,
            fechaInicio: inicio || null,
            fechaFin: fin || null,
            activo: estado === 'activo'
        };

        var accion = descuentoEditando ? apiPut('/descuentos/' + descuentoEditando.id, payload) : apiPost('/descuentos', payload);
        accion
            .then(function () {
                mostrarToast(descuentoEditando ? 'Descuento actualizado' : 'Descuento creado', 'exito');
                cerrarModal('modalDescuento');
                cargarDescuentos();
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
        $('#btnConfirmarEliminarDesc').data('id', id);
        abrirModal('modalEliminarDesc');
    });

    $('#btnConfirmarEliminarDesc').on('click', function () {
        var id = $(this).data('id');
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
