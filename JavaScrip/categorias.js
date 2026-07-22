if (!localStorage.getItem('token') || localStorage.getItem('rol') !== 'ADMIN') { window.location.href = '../index.html'; }
$(document).ready(function () {

    var user = JSON.parse(localStorage.getItem('usuario'));
    document.getElementsByClassName("user-name")[0].innerHTML = user.nombreUsuario;
    document.getElementsByClassName("user-role")[0].innerHTML = user.rol;

    var categoriasData = [];
    var categoriaEditando = null;

    function cargarCategorias() {
        apiGet('/categorias')
            .then(function (respuesta) {
                categoriasData = Array.isArray(respuesta) ? respuesta : [];
                renderizarTabla(categoriasData);
            })
            .catch(function () {
                $('#cuerpoTabla').html('<tr><td colspan="5" style="text-align:center;color:#888;">Sin categorías</td></tr>');
            });
    }

    function renderizarTabla(categorias) {
        var html = '';
        $.each(categorias, function (i, c) {
            var activo = c.activa !== false;
            var estadoClase = activo ? 'estado-activo' : 'estado-inactivo';
            var estadoTexto = activo ? 'Activo' : 'Inactivo';
            html += '<tr>';
            html += '<td><strong>#CAT-' + String(c.id).padStart(3, '0') + '</strong></td>';
            html += '<td><strong>' + escapeHtml(c.nombre || '') + '</strong></td>';
            html += '<td>' + (c.descripcion || '-') + '</td>';
            html += '<td><span class="' + estadoClase + '">' + estadoTexto + '</span></td>';
            html += '<td><div class="acciones-botones">';
            html += '<button class="btn-icono btn-editar-cat" data-id="' + c.id + '" title="Editar">&#9998;</button>';
            html += '<button class="btn-icono btn-eliminar-cat" data-id="' + c.id + '" title="Eliminar">&#128465;</button>';
            html += '</div></td>';
            html += '</tr>';
        });
        $('#cuerpoTabla').html(html || '<tr><td colspan="5" style="text-align:center;color:#888;">Sin categorías</td></tr>');
    }

    function escapeHtml(text) {
        return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function mostrarToast(mensaje, tipo) {
        var $toast = $('#toastGlobal');
        $toast.removeClass('toast-exito toast-error').addClass('toast-' + tipo).text(mensaje).addClass('activo');
        setTimeout(function () { $toast.removeClass('activo'); }, 3000);
    }

    function abrirModal(id) { $('#' + id).addClass('activo'); }
    function cerrarModal(id) { $('#' + id).removeClass('activo'); }

    function limpiarFormulario() {
        $('#modalCategoriaForm')[0].reset();
        categoriaEditando = null;
        $('#modalCategoriaTitulo').text('Nueva categoría');
    }

    $('.buscar-producto input').on('keyup', function () {
        var busqueda = $(this).val().toLowerCase();
        $('.tabla-productos tbody tr').each(function () {
            var texto = $(this).text().toLowerCase();
            $(this).toggle(texto.indexOf(busqueda) > -1);
        });
    });

    $('#btnNuevaCategoria').on('click', function () {
        limpiarFormulario();
        abrirModal('modalCategoria');
    });

    $(document).on('click', '.btn-editar-cat', function () {
        var id = $(this).data('id');
        var cat = categoriasData.find(function (c) { return c.id == id; });
        if (!cat) return;
        categoriaEditando = cat;
        $('#modalCategoriaTitulo').text('Editar categoría');
        $('#campoCatNombre').val(cat.nombre);
        $('#campoCatDescripcion').val(cat.descripcion || '');
        $('#campoCatEstado').val(cat.activa !== false ? 'true' : 'false');
        abrirModal('modalCategoria');
    });

    $(document).on('click', '.btn-eliminar-cat', function () {
        var id = $(this).data('id');
        var cat = categoriasData.find(function (c) { return c.id == id; });
        if (!cat) return;
        $('#modalEliminarNombre').text(cat.nombre);
        $('#btnConfirmarEliminar').data('id', id);
        abrirModal('modalEliminar');
    });

    $('#btnConfirmarEliminar').on('click', function () {
        var id = $(this).data('id');
        apiDelete('/categorias/' + id)
            .then(function () {
                mostrarToast('Categoría eliminada', 'exito');
                cerrarModal('modalEliminar');
                cargarCategorias();
            })
            .catch(function () {
                mostrarToast('Error al eliminar categoría', 'error');
            });
    });

    $('#btnGuardarCategoria').on('click', function () {
        var nombre = $('#campoCatNombre').val().trim();
        var descripcion = $('#campoCatDescripcion').val().trim();
        var activa = $('#campoCatEstado').val() === 'true';

        if (!nombre) { mostrarToast('Ingresa el nombre de la categoría', 'error'); return; }

        var archivo = document.getElementById('campoCatImagen').files[0];

        function enviarPayload(payload) {
            if (categoriaEditando) {
                apiPut('/categorias/' + categoriaEditando.id, payload)
                    .then(function () {
                        mostrarToast('Categoría actualizada', 'exito');
                        cerrarModal('modalCategoria');
                        cargarCategorias();
                    })
                    .catch(function () { mostrarToast('Error al actualizar categoría', 'error'); });
            } else {
                apiPost('/categorias', payload)
                    .then(function () {
                        mostrarToast('Categoría creada', 'exito');
                        cerrarModal('modalCategoria');
                        cargarCategorias();
                    })
                    .catch(function () { mostrarToast('Error al crear categoría', 'error'); });
            }
        }

        if (archivo) {
            imagenFileAToDataUrl(archivo, function (img) {
                enviarPayload({ nombre: nombre, descripcion: descripcion, imagenUrl: img.base64, activa: activa });
            });
        } else {
            enviarPayload({ nombre: nombre, descripcion: descripcion, imagenUrl: null, activa: activa });
        }
    });

    $(document).on('click', '.btn-cerrar-modal', function () { $(this).closest('.modal-overlay').removeClass('activo'); });
    $(document).on('click', '.btn-modal-cancelar', function () { $(this).closest('.modal-overlay').removeClass('activo'); });
    $(document).on('click', '.modal-overlay', function (e) { if (e.target === this) $(this).removeClass('activo'); });

    cargarCategorias();
});