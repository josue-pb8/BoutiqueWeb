if (!localStorage.getItem('token') || localStorage.getItem('rol') !== 'ADMIN') { window.location.href = '../index.html'; }
$(document).ready(function () {

    let user = JSON.parse(localStorage.getItem('usuario')); 
    document.getElementsByClassName("user-name")[0].innerHTML = user.nombreUsuario; 
        document.getElementsByClassName("user-role")[0].innerHTML = user.rol; 

    
    //document.getElementsByClassName("avatar-placeholder")[0].innerHTML = user.nombreUsuario.charAt(0).toUpperCase();

    var categoriasData = [];
    var categoriaEditando = null;

    function cargarCategorias() {
        apiGet('/categorias')
            .then(function (respuesta) {
                categoriasData = respuesta;
                renderizarTabla(respuesta);
            })
            .catch(function () {
                $('#cuerpoTabla').html('<tr><td colspan="4" style="text-align:center;color:#888;">Sin categorias</td></tr>');
            });
    }

    function renderizarTabla(categorias) {
        var html = '';
        $.each(categorias, function (i, c) {
            html += '<tr>';
            html += '<td><div class="categoria-info"><img src="../Image/categoria.png" alt="Categoria" class="img-categoria"><span>' + c.nombre + '</span></div></td>';
            html += '<td>' + (c.descripcion || '-') + '</td>';
            html += '<td>-</td>';
            html += '<td><div class="acciones-botones">';
            html += '<button class="btn-icono btn-editar-cat" data-id="' + c.id + '" title="Editar">&#9998;</button>';
            html += '<button class="btn-icono btn-eliminar-cat" data-id="' + c.id + '" title="Eliminar">&#128465;</button>';
            html += '</div></td>';
            html += '</tr>';
        });
        $('#cuerpoTabla').html(html || '<tr><td colspan="4" style="text-align:center;color:#888;">Sin categorias</td></tr>');
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
        $('#modalCategoriaTitulo').text('Nueva categoria');
    }

    cargarCategorias();

    $('.buscar-categoria input').on('keyup', function () {
        var busqueda = $(this).val().toLowerCase();
        $('.tabla-categorias tbody tr').each(function () {
            var texto = $(this).text().toLowerCase();
            $(this).toggle(texto.indexOf(busqueda) > -1);
        });
    });

    $('.btn-agregar-categoria').on('click', function () { limpiarFormulario(); abrirModal('modalCategoria'); });

    $(document).on('click', '.btn-editar-cat', function () {
        var id = $(this).data('id');
        var cat = categoriasData.find(function (c) { return c.id == id; });
        if (!cat) return;
        categoriaEditando = cat;
        $('#modalCategoriaTitulo').text('Editar categoria');
        $('#campoCatNombre').val(cat.nombre);
        $('#campoCatDescripcion').val(cat.descripcion || '');
        abrirModal('modalCategoria');
    });

    $('#btnGuardarCategoria').on('click', function () {
        var nombre = $('#campoCatNombre').val().trim();
        var descripcion = $('#campoCatDescripcion').val().trim();

        if (!nombre || !descripcion) { mostrarToast('Completa todos los campos', 'error'); return; }

        if (categoriaEditando) {
            apiPut('/categorias/' + categoriaEditando.id, { nombre: nombre, descripcion: descripcion })
                .then(function () { mostrarToast('Categoria actualizada', 'exito'); cerrarModal('modalCategoria'); cargarCategorias(); })
                .catch(function () { mostrarToast('Error al actualizar', 'error'); });
        } else {
            apiPost('/categorias', { nombre: nombre, descripcion: descripcion })
                .then(function () { mostrarToast('Categoria creada', 'exito'); cerrarModal('modalCategoria'); cargarCategorias(); })
                .catch(function () { mostrarToast('Error al crear', 'error'); });
        }
    });

    $(document).on('click', '.btn-eliminar-cat', function () {
        var id = $(this).data('id');
        var cat = categoriasData.find(function (c) { return c.id == id; });
        if (!cat) return;
        $('#modalEliminarCatNombre').text(cat.nombre);
        $('#btnConfirmarEliminarCat').data('id', id);
        abrirModal('modalEliminarCat');
    });

    $('#btnConfirmarEliminarCat').on('click', function () {
        var id = $(this).data('id');
        apiDelete('/categorias/' + id)
            .then(function () { mostrarToast('Categoria eliminada', 'exito'); cerrarModal('modalEliminarCat'); cargarCategorias(); })
            .catch(function () { mostrarToast('Error al eliminar', 'error'); });
    });

    $(document).on('click', '.btn-cerrar-modal', function () { $(this).closest('.modal-overlay').removeClass('activo'); });
    $(document).on('click', '.btn-modal-cancelar', function () { $(this).closest('.modal-overlay').removeClass('activo'); });
    $(document).on('click', '.modal-overlay', function (e) { if (e.target === this) $(this).removeClass('activo'); });

});
