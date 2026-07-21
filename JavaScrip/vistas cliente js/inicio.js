let productosDetalle = {};
let productosLista = [];
let tallaSeleccionada = null;

    let user = JSON.parse(localStorage.getItem('usuario')); 
    document.getElementsByClassName("user-name")[0].innerHTML = user.nombreUsuario;   
    //$('.user-name').text(user.nombreUsuario);

    document.getElementsByClassName("avatar-placeholder")[0].innerHTML = user.nombreUsuario.charAt(0).toUpperCase();
    

document.addEventListener('DOMContentLoaded', () => {
    establecerSaludo();
    configurarBusqueda();
    cargarProductosDestacados();
});

function cargarProductosDestacados() {
    apiGet("/productos").then(function(productos) {
        if (!productos) return;
        return apiGet("/inventario").then(function(inventario) {
            var stockMap = {};
            if (inventario) {
                inventario.forEach(function(item) {
                    var pid = item.producto ? item.producto.id : null;
                    if (pid == null) return;
                    stockMap[pid] = (stockMap[pid] || 0) + (item.stock || 0);
                });
            }
            productosLista = productos.filter(function(p) { return p.activo !== false; });

            productosLista.forEach(function(p) {
                var stockTotal = stockMap[p.id] || 0;
                var stockLabel = stockTotal > 0 ? (stockTotal <= 3 ? 'Últimas unidades' : 'En Stock') : 'Agotado';
                productosDetalle[p.id] = {
                    nombre: p.nombre,
                    marca: p.marca || "",
                    precio: Number(p.precio),
                    categoria: p.categoria ? p.categoria.nombre : "",
                    imagen: p.imagenUrl || "",
                    descripcion: p.descripcion || "",
                    stock: stockLabel,
                    stockTotal: stockTotal,
                    tallas: ["S", "M", "L"],
                    tallasAgotadas: []
                };
            });

            renderizarProductosDestacados(productosLista.slice(0, 6));
        });
    }).catch(function(err) {
        console.error("Error cargando productos:", err);
    });
}

function renderizarProductosDestacados(productos) {
    var grid = document.querySelector('.productos-grid');
    if (!grid) return;
    grid.innerHTML = "";

    productos.forEach(function(producto) {
        var imgUrl = producto.imagenUrl || '';
        var det = productosDetalle[producto.id];
        var stockTotal = det ? det.stockTotal : 0;
        var stockLabel = det ? det.stock : 'En Stock';
        var stockClass = stockTotal === 0 ? 'stock-agotado' : (stockTotal <= 3 ? 'stock-poco' : 'stock-disponible');
        var stockIcon = stockTotal === 0 ? '&#10060;' : (stockTotal <= 3 ? '&#9888;' : '&#10004;');
        var card = document.createElement('div');
        card.className = 'producto-card';
        card.innerHTML =
            '<img src="' + (imgUrl ? getImagenUrl(imgUrl) : '../../Image/productos.png') + '" alt="' + escapeHtml(producto.nombre) + '">' +
            '<div class="producto-info">' +
                '<h3>' + escapeHtml(producto.nombre) + '</h3>' +
                '<p class="precio">$' + Number(producto.precio).toLocaleString("es-MX", { minimumFractionDigits: 2 }) + '</p>' +
                '<div class="product-stock ' + stockClass + '">' + stockIcon + ' ' + stockLabel + '</div>' +
                '<div class="producto-btns">' +
                    '<button class="btn-view-details" onclick="abrirDetalle(' + producto.id + ')">Ver Detalles</button>' +
                '</div>' +
            '</div>';
        grid.appendChild(card);
    });
}

function escapeHtml(text) {
    var div = document.createElement("div");
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
}

function establecerSaludo() {
    var horaActual = new Date().getHours();
    var titulo = document.getElementById('greeting-title');
    var saludo = 'Bienvenida';
    var usuario = getUsuario();
    var nombre = usuario ? (usuario.nombre || 'Ana') : 'Ana';

    if (horaActual >= 5 && horaActual < 12) saludo = 'Buenos dias';
    else if (horaActual >= 12 && horaActual < 19) saludo = 'Buenas tardes';
    else saludo = 'Buenas noches';

    if (titulo) titulo.textContent = saludo + ', ' + nombre;
}

/* MODAL DETALLE PRODUCTO */
function abrirDetalle(id) {
    var producto = productosDetalle[id];
    if (!producto) return;

    tallaSeleccionada = null;

    var elImagen = document.getElementById('detalle-imagen');


    var elNombre = document.getElementById('detalle-nombre');
    var elMarca = document.getElementById('detalle-marca');
    var elCategoria = document.getElementById('detalle-categoria');
    var elPrecio = document.getElementById('detalle-precio');
    var elStock = document.getElementById('detalle-stock');
    var elDescripcion = document.getElementById('detalle-descripcion');

    if (elImagen) { elImagen.src = producto.imagen ? getImagenUrl(producto.imagen) : '../../Image/productos.png'; elImagen.alt = producto.nombre; }

    if (elNombre) elNombre.textContent = producto.nombre;
    if (elMarca) elMarca.textContent = producto.marca;
    if (elCategoria) elCategoria.textContent = producto.categoria;
    if (elPrecio) elPrecio.textContent = '$' + producto.precio.toFixed(2);
    if (elStock) elStock.textContent = producto.stock;
    if (elDescripcion) elDescripcion.textContent = producto.descripcion;

    var tallasContainer = document.getElementById('detalle-tallas');
    if (tallasContainer) {
        tallasContainer.innerHTML = '';
        producto.tallas.forEach(function(talla) {
            var btn = document.createElement('button');
            btn.className = 'size-btn';
            if (producto.tallasAgotadas.includes(talla)) btn.classList.add('disabled');
            btn.textContent = talla;
            btn.addEventListener('click', function() {
                if (btn.classList.contains('disabled')) return;
                tallasContainer.querySelectorAll('.size-btn').forEach(function(b) { b.classList.remove('active'); });
                btn.classList.add('active');
                tallaSeleccionada = talla;
            });
            tallasContainer.appendChild(btn);
        });
    }

    var btnApartar = document.getElementById('detalle-apartar');
    if (btnApartar) btnApartar.onclick = function() {
        apartarProducto(id, producto.nombre, producto.precio, producto.imagen);
        cerrarDetalleDirecto();
    };

    var btnFav = document.getElementById('detalle-add-fav');
    var favoritosTemp;
    try { favoritosTemp = JSON.parse(localStorage.getItem('bellaFavoritos')) || []; } catch(e) { favoritosTemp = []; }
    var esFavorito = favoritosTemp.some(function(f) { return f.id == id; });
    if (btnFav) {
        btnFav.innerHTML = esFavorito
            ? '<span class="material-symbols-outlined">favorite</span> En Favoritos'
            : '<span class="material-symbols-outlined">favorite_border</span> Favorito';
        btnFav.onclick = function() {
            var favoritos;
            try { favoritos = JSON.parse(localStorage.getItem('bellaFavoritos')) || []; } catch(e) { favoritos = []; }
            if (esFavorito) {
                favoritos = favoritos.filter(function(f) { return f.id != id; });
                esFavorito = false;
                btnFav.innerHTML = '<span class="material-symbols-outlined">favorite_border</span> Favorito';
                alert('Eliminado de favoritos');
            } else {
                favoritos.push({ id: id, nombre: producto.nombre, precio: producto.precio, imagen: producto.imagen });
                esFavorito = true;
                btnFav.innerHTML = '<span class="material-symbols-outlined">favorite</span> En Favoritos';
                alert('Anadido a favoritos!');
            }
            localStorage.setItem('bellaFavoritos', JSON.stringify(favoritos));
        };
    }

    var modal = document.getElementById('modal-detalle');
    if (modal) modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function cerrarDetalle(e) {
    if (e.target === e.currentTarget) {
        var modal = document.getElementById('modal-detalle');
        if (modal) modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function cerrarDetalleDirecto() {
    var modal = document.getElementById('modal-detalle');
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = '';
}

/* APARTAR PRODUCTO */
window.apartarProducto = function(id, nombre, precio, imagen) {
    var precioNum = Number(precio);
    if (isNaN(precioNum) || precioNum <= 0) {
        alert('No se puede apartar este producto.');
        return;
    }

    var clienteId = getClienteId();
    var empleadoId = getUsuarioId();

    var payload = {
        clienteId: clienteId,
        empleadoId: empleadoId,
        detalles: [{ productoId: parseInt(id), cantidad: 1, precioUnitario: precioNum, talla: tallaSeleccionada || null }]
    };

    apiPost("/apartados", payload).then(function() {
        alert('Apartado registrado! Recoge en tienda y paga el resto.');
        window.location.href = './apartados.html';
    }).catch(function(err) {
        console.error('Error al apartar:', err);
        alert('Error al apartar: ' + (err.error || JSON.stringify(err) || 'Intenta de nuevo.'));
    });
};

/* SIDEBAR */
function toggleSidebar() {
    var sidebar = document.querySelector('.sidebar');
    if (sidebar) sidebar.classList.toggle('collapsed');
}

/* BUSQUEDA */
function configurarBusqueda() {
    var input = document.getElementById('search-input');
    if (!input) return;
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            var termino = input.value.trim();
            if (termino) window.location.href = './productos.html?search=' + encodeURIComponent(termino);
        }
    });
}
