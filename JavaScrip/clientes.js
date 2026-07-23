if (!localStorage.getItem('token') || localStorage.getItem('rol') !== 'ADMIN') { window.location.href = '../index.html'; }
$(document).ready(function () {

    let user = JSON.parse(localStorage.getItem('usuario'));
    document.getElementsByClassName("user-name")[0].innerHTML = user.nombreUsuario;
    document.getElementsByClassName("user-role")[0].innerHTML = user.rol;

    var clientesData = [];
    var clienteEditando = null;

    function cargarClientes() {
        apiGet('/clientes')
            .then(function (respuesta) {
                clientesData = respuesta;
                renderizarTabla(respuesta);
            })
            .catch(function () {
                $('#cuerpoTabla').html('<tr><td colspan="6" style="text-align:center;color:#888;">Sin clientes registrados</td></tr>');
            });
    }

    function renderizarTabla(clientes) {
        var ordenados = clientes.slice().sort(function(a, b) { return b.id - a.id; });
        var html = '';
        $.each(ordenados, function (i, c) {
            var nombre = (c.nombre || '') + ' ' + (c.apellido || '');
            var iniciales = ((c.nombre || '')[0] || '') + ((c.apellido || '')[0] || '');
            var fecha = formatearFecha(c.fechaRegistro);
            var foto = c.fotoUrl || '';
            var avatarHtml = foto
                ? '<img src="' + getImagenUrl(foto) + '" class="cliente-avatar-img" alt="Foto" style="width:32px;height:32px;border-radius:50%;object-fit:cover;">'
                : '<div class="cliente-avatar-placeholder">' + escapeHtml(iniciales.toUpperCase()) + '</div>';
            html += '<tr>';
            html += '<td><strong>#CLI-' + String(c.id).padStart(3, '0') + '</strong></td>';
            html += '<td><div class="cliente-cell">' + avatarHtml + '<strong>' + escapeHtml(nombre.trim()) + '</strong></div></td>';
            html += '<td>' + (c.telefono || '-') + '</td>';
            html += '<td>' + (c.email || 'Sin correo') + '</td>';
            html += '<td>' + fecha + '</td>';
            html += '<td><div class="acciones-botones">';
            html += '<button class="btn-icono btn-visualizar" data-id="' + c.id + '" title="Visualizar">&#128065;</button>';
            html += '<button class="btn-icono btn-editar" data-id="' + c.id + '" title="Editar">&#9998;</button>';
            html += '<button class="btn-icono btn-eliminar-cliente" data-id="' + c.id + '" data-nombre="' + escapeHtml(nombre.trim()) + '" title="Eliminar">&#128465;</button>';
            html += '</div></td>';
            html += '</tr>';
        });
        $('#cuerpoTabla').html(html || '<tr><td colspan="6" style="text-align:center;color:#888;">Sin clientes</td></tr>');
    }

    function formatearFecha(fecha) {
        if (!fecha) return 'N/A';
        try {
            if (Array.isArray(fecha)) {
                return fecha[2] + '/' + String(fecha[1]).padStart(2, '0') + '/' + fecha[0];
            }
            return new Date(fecha).toLocaleDateString('es-MX');
        } catch (e) {
            return 'N/A';
        }
    }

    function escapeHtml(text) {
        return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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

    function limpiarFormulario() {
        $('#modalClienteForm')[0].reset();
        clienteEditando = null;
        $('#modalClienteTitulo').text('Nuevo cliente');
    }

    cargarClientes();

    $('.buscar-cliente input').on('keyup', function () {
        var busqueda = $(this).val().toLowerCase();
        $('.tabla-clientes tbody tr').each(function () {
            var texto = $(this).text().toLowerCase();
            $(this).toggle(texto.indexOf(busqueda) > -1);
        });
    });

    $('.btn-nuevo-cliente').on('click', function () { limpiarFormulario(); abrirModal('modalCliente'); });

    $(document).on('click', '.btn-visualizar', function () {
        var id = $(this).data('id');
        var cliente = clientesData.find(function (c) { return c.id == id; });
        if (!cliente) return;
        var nombre = cliente.nombre + ' ' + cliente.apellido;
        var html = '';
        html += '<div class="detalle-fila"><span class="detalle-label">Nombre</span><span class="detalle-valor">' + nombre + '</span></div>';
        html += '<div class="detalle-fila"><span class="detalle-label">Correo</span><span class="detalle-valor">' + (cliente.email || '-') + '</span></div>';
        html += '<div class="detalle-fila"><span class="detalle-label">Telefono</span><span class="detalle-valor">' + (cliente.telefono || '-') + '</span></div>';
        html += '<div class="detalle-fila"><span class="detalle-label">Direccion</span><span class="detalle-valor">' + (cliente.direccion || '-') + '</span></div>';
        html += '<div class="detalle-fila"><span class="detalle-label">Fecha de registro</span><span class="detalle-valor">' + formatearFecha(cliente.fechaRegistro) + '</span></div>';
        $('#modalClienteDetalle').html(html);
        abrirModal('modalVerCliente');
    });

    $(document).on('click', '.btn-editar', function () {
        var id = $(this).data('id');
        var cliente = clientesData.find(function (c) { return c.id == id; });
        if (!cliente) return;
        clienteEditando = cliente;
        $('#modalClienteTitulo').text('Editar cliente');
        $('#campoClienteNombre').val(cliente.nombre + ' ' + cliente.apellido);
        $('#campoClienteCorreo').val(cliente.email || '');
        $('#campoClienteTelefono').val(cliente.telefono || '');
        $('#campoClienteDireccion').val(cliente.direccion || '');
        $('#campoClienteFechaNac').val(cliente.fechaNacimiento || '');
        abrirModal('modalCliente');
    });

    // --- Eliminar cliente ---
    $(document).on('click', '.btn-eliminar-cliente', function () {
        var id = $(this).data('id');
        var nombre = $(this).data('nombre');
        $('#modalEliminarClienteNombre').text(nombre);
        $('#btnConfirmarEliminarCliente').data('id', id);
        abrirModal('modalEliminarCliente');
    });

    $('#btnConfirmarEliminarCliente').on('click', function () {
        var id = $(this).data('id');
        apiDelete('/clientes/' + id)
            .then(function () {
                mostrarToast('Cliente eliminado', 'exito');
                cerrarModal('modalEliminarCliente');
                cargarClientes();
            })
            .catch(function () { mostrarToast('Error al eliminar cliente', 'error'); });
    });

    $('#btnGuardarCliente').on('click', function () {
        var nombreCompleto = $('#campoClienteNombre').val().trim();
        var correo = $('#campoClienteCorreo').val().trim();
        var telefono = $('#campoClienteTelefono').val().trim();
        var direccion = $('#campoClienteDireccion').val().trim();
        var fechaNac = $('#campoClienteFechaNac').val();

        if (!nombreCompleto || nombreCompleto.length < 3) { mostrarToast('Ingresa un nombre valido', 'error'); return; }
        if (!correo) { mostrarToast('Ingresa un correo electronico', 'error'); return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) { mostrarToast('Correo electronico invalido', 'error'); return; }

        var partes = nombreCompleto.split(' ');
        var nombre = partes[0];
        var apellido = partes.slice(1).join(' ') || ' ';

        var archivo = document.getElementById('campoClienteFoto') ? document.getElementById('campoClienteFoto').files[0] : null;

        function enviarPayload(payload) {
            if (clienteEditando) {
                apiPut('/clientes/' + clienteEditando.id, payload)
                    .then(function () { mostrarToast('Cliente actualizado', 'exito'); cerrarModal('modalCliente'); cargarClientes(); })
                    .catch(function () { mostrarToast('Error al actualizar', 'error'); });
            } else {
                apiPost('/clientes', payload)
                    .then(function () { mostrarToast('Cliente creado', 'exito'); cerrarModal('modalCliente'); cargarClientes(); })
                    .catch(function () { mostrarToast('Error al crear cliente', 'error'); });
            }
        }

        var payloadBase = {
            nombreUsuario: correo,
            contrasena: correo + '123',
            nombre: nombre,
            apellido: apellido,
            email: correo,
            telefono: telefono,
            direccion: direccion,
            fechaNacimiento: fechaNac || null,
            perfil: '3'
        };

        if (archivo) {
            imagenFileAToDataUrl(archivo, function (img) {
                payloadBase.fotoUrl = img.base64;
                enviarPayload(payloadBase);
            });
        } else {
            enviarPayload(payloadBase);
        }
    });

    $(document).on('click', '.btn-cerrar-modal', function () { $(this).closest('.modal-overlay').removeClass('activo'); });
    $(document).on('click', '.btn-modal-cancelar', function () { $(this).closest('.modal-overlay').removeClass('activo'); });
    $(document).on('click', '.modal-overlay', function (e) { if (e.target === this) $(this).removeClass('activo'); });

});
