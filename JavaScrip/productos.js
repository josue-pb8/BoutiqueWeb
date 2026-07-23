if (!localStorage.getItem('token') || localStorage.getItem('rol') !== 'ADMIN') { window.location.href = '../index.html'; }
$(document).ready(function () {

    try {
        let user = JSON.parse(localStorage.getItem('usuario'));
        if (user) {
            var nameEl1 = document.getElementsByClassName("user-name")[0];
            if (nameEl1) nameEl1.innerHTML = user.nombreUsuario;
            var roleEl1 = document.getElementsByClassName("user-role")[0];
            if (roleEl1) roleEl1.innerHTML = user.rol;
        }
    } catch(e) { window.location.href = '../index.html'; return; }

    var productosData = [];
    var productoEditando = null;
    var categoriasCache = [];

    function escapeHtml(text) {
        if (text == null) return '';
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(String(text)));
        return div.innerHTML;
    }

    function cargarCategorias() {
        apiGet('/categorias')
            .then(function (respuesta) {
                categoriasCache = respuesta || [];
                var $select = $('#campoCategoria');
                $select.empty().append('<option value="">Selecciona una categoria</option>');
                var $filtro = $('#filtroCategoria');
                $filtro.empty().append('<option value="">Todas las categorías</option>');
                $.each(categoriasCache, function (i, c) {
                    $select.append('<option value="' + c.id + '">' + c.nombre + '</option>');
                    $filtro.append('<option value="' + c.nombre + '">' + c.nombre + '</option>');
                });
            })
            .catch(function () {
                categoriasCache = [];
                var $select = $('#campoCategoria');
                $select.empty().append('<option value="">Selecciona una categoria</option><option value="1">General</option>');
            });
    }

    function cargarProductos() {
        apiGet('/productos')
            .then(function (respuesta) {
                productosData = respuesta;
                renderizarTabla(respuesta);
            })
            .catch(function () {
                renderizarTabla([]);
            });
    }

    function renderizarTabla(productos) {
        var html = '';
        $.each(productos, function (i, p) {
            var activo = p.activo !== false;
            var estadoClase = activo ? 'estado-activo' : 'estado-inactivo';
            var estadoTexto = activo ? 'Activo' : 'Inactivo';
            var catNombre = p.categoria ? (typeof p.categoria === 'string' ? p.categoria : p.categoria.nombre) : '-';
            var imagen = p.imagen || p.imagenUrl || '../Image/productos.png';

             
            html += '<tr>';
            html += '<td><img src="' + getImagenUrl(imagen) + '" class="img-producto" alt="' + escapeHtml(p.nombre) + '"></td>';
            html += '<td><strong>' + escapeHtml(p.nombre) + '</strong></td>';
            html += '<td>' + escapeHtml(catNombre) + '</td>';
            html += '<td>$' + formatNumber(p.precio) + '</td>';
            html += '<td>$' + formatNumber(p.costo || 0) + '</td>';
            html += '<td>' + (p.stock || 0) + ' u.</td>';
            html += '<td><span class="' + estadoClase + '">' + estadoTexto + '</span></td>';
            html += '<td>';
            html += '<div class="acciones-botones">';
            html += '<button class="btn-icono btn-editar" data-id="' + p.id + '" title="Editar">&#9998;</button>';
            html += '<button class="btn-icono btn-eliminar" data-id="' + p.id + '" title="Eliminar">&#128465;</button>';
            html += '</div>';
            html += '</td>';
            html += '</tr>';
        });
        $('#cuerpoTabla').html(html);
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

    function limpiarFormulario() {
        $('#modalProductoForm')[0].reset();
        productoEditando = null;
        $('#modalProductoTitulo').text('Agregar producto');
    }

    cargarProductos();
    cargarCategorias();

    $('.buscar-producto input').on('keyup', function () {
        var busqueda = $(this).val().toLowerCase();
        $('.tabla-productos tbody tr').each(function () {
            var texto = $(this).text().toLowerCase();
            $(this).toggle(texto.indexOf(busqueda) > -1);
        });
    });

    $('.filtro-categoria').on('change', function () {
        var filtro = $(this).val().toLowerCase();
        $('.tabla-productos tbody tr').each(function () {
            if (filtro === '') {
                $(this).show();
            } else {
                var catCelda = $(this).find('td:eq(2)').text().toLowerCase();
                $(this).toggle(catCelda === filtro);
            }
        });
    });

    $('.btn-agregar').on('click', function () {
        limpiarFormulario();
        abrirModal('modalProducto');
    });

    $(document).on('click', '.btn-editar', function () {
        var id = $(this).data('id');
        var producto = productosData.find(function (p) { return p.id == id; });
        if (!producto) return;
        productoEditando = producto;
        $('#modalProductoTitulo').text('Editar producto');
        $('#campoNombre').val(producto.nombre);
        var catId = producto.categoria ? (typeof producto.categoria === 'object' ? producto.categoria.id : '') : '';
        $('#campoCategoria').val(catId);
        $('#campoPrecio').val(producto.precio);
        $('#campoCosto').val(producto.costo || 0);
        $('#campoEstado').val(producto.activo !== false ? 'activo' : 'inactivo');
        abrirModal('modalProducto');
    });

    $(document).on('click', '.btn-eliminar', function () {
        var id = $(this).data('id');
        var producto = productosData.find(function (p) { return p.id == id; });
        if (!producto) return;
        $('#modalEliminarNombre').text(producto.nombre);
        $('#btnConfirmarEliminar').data('id', id);
        abrirModal('modalEliminar');
    });

    $('#btnConfirmarEliminar').on('click', function () {
        var id = $(this).data('id');
        apiDelete('/productos/' + id)
            .then(function () {
                mostrarToast('Producto eliminado correctamente', 'exito');
                cargarProductos();
            })
            .catch(function () {
                mostrarToast('Error al eliminar producto', 'error');
            });
        cerrarModal('modalEliminar');
    });

    $('#btnGuardarProducto').on('click', function () {
        var nombre = $('#campoNombre').val().trim();
        var categoriaId = parseInt($('#campoCategoria').val());
        var precio = parseFloat($('#campoPrecio').val());
        var costo = parseFloat($('#campoCosto').val()) || 0;
        var estado = $('#campoEstado').val();

         const archivo = document.getElementById("imagen").files[0];

        if (!nombre) { mostrarToast('Ingresa el nombre del producto', 'error'); return; }
        if (!categoriaId) { mostrarToast('Selecciona una categoria', 'error'); return; }
        if (isNaN(precio) || precio <= 0) { mostrarToast('El precio debe ser mayor a $0', 'error'); return; }

        if (!productoEditando && !archivo) {
            mostrarToast("Selecciona una imagen para el producto", 'error');
            return;
        }

        function enviarPayload(payload) {
            if (productoEditando) {
                apiPut('/productos/' + productoEditando.id, payload)
                    .then(function () {
                        mostrarToast('Producto actualizado correctamente', 'exito');
                        cerrarModal('modalProducto');
                        cargarProductos();
                    })
                    .catch(function () {
                        mostrarToast('Error al actualizar producto', 'error');
                    });
            } else {
                apiPost('/productos', payload)
                    .then(function () {
                        mostrarToast('Producto agregado correctamente', 'exito');
                        cerrarModal('modalProducto');
                        cargarProductos();
                    })
                    .catch(function () {
                        mostrarToast('Error al crear producto', 'error');
                    });
            }
        }

        if (archivo) {
            const reader = new FileReader();
            reader.onload = function(e) {
                var payload = {
                    nombre: nombre,
                    precio: precio,
                    costo: costo,
                    categoria: { id: categoriaId },
                    activo: estado === 'activo',
                    imagen: e.target.result,
                };
                enviarPayload(payload);
            };
            reader.readAsDataURL(archivo);
        } else {
            var payload = {
                nombre: nombre,
                precio: precio,
                costo: costo,
                categoria: { id: categoriaId },
                activo: estado === 'activo',
            };
            enviarPayload(payload);
        }
    });

    $(document).on('click', '.btn-cerrar-modal', function () {
        $(this).closest('.modal-overlay').removeClass('activo');
    });

    $(document).on('click', '.btn-modal-cancelar', function () {
        $(this).closest('.modal-overlay').removeClass('activo');
    });

    $(document).on('click', '.modal-overlay', function (e) {
        if (e.target === this) $(this).removeClass('activo');
    });

});
