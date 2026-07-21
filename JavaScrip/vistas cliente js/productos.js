let productosCatalogo = [];
let productosLocalMap = {};
let tallaSeleccionada = null;

let user = JSON.parse(localStorage.getItem('usuario')); 
    document.getElementsByClassName("user-name")[0].innerHTML = user.nombreUsuario; 

    document.getElementsByClassName("avatar-placeholder")[0].innerHTML = user.nombreUsuario.charAt(0).toUpperCase();
    

document.addEventListener('DOMContentLoaded', () => {
    cargarProductos();
    configurarFiltros();
    configurarBusqueda();
});

function cargarProductos() {
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
            productosCatalogo = productos.filter(function(p) { return p.activo !== false; }).map(function(p) {
                var stockTotal = stockMap[p.id] || 0;
                var obj = {
                    id: String(p.id),
                    nombre: p.nombre,
                    precio: Number(p.precio),
                    categoria: p.categoria ? p.categoria.nombre.toLowerCase() : 'sin categoria',
                    imagen: p.imagenUrl || '',
                    marca: p.marca || '',
                    descripcion: p.descripcion || '',
                    stock: stockTotal > 0 ? (stockTotal <= 3 ? 'Últimas unidades' : 'En Stock') : 'Agotado',
                    stockTotal: stockTotal,
                    tallas: ['S', 'M', 'L'],
                    tallasAgotadas: []
                };
                productosLocalMap[p.id] = obj;
                return obj;
            });
            renderizarProductos(productosCatalogo);
            aplicarBusquedaURL();
        });
    }).catch(function(err) {
        console.error("Error cargando productos:", err);
    });
}

function renderizarProductos(productos) {
    var container = document.getElementById('products-container');
    var emptyState = document.getElementById('empty-products');
    var subtitle = document.getElementById('products-subtitle');

    if (!container || !emptyState) return;

    if (productos.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'flex';
        if (subtitle) subtitle.textContent = 'No se encontraron productos.';
        return;
    }

    container.style.display = 'grid';
    emptyState.style.display = 'none';
    if (subtitle) subtitle.textContent = 'Mostrando ' + productos.length + ' producto(s).';

    container.innerHTML = '';
    var favoritos;
    try { favoritos = JSON.parse(localStorage.getItem('bellaFavoritos')) || []; } catch(e) { favoritos = []; }

    productos.forEach(function(item) {
        var esFavorito = favoritos.some(function(f) { return f.id == item.id; });
        var card = document.createElement('div');
        card.className = 'product-card';
        card.setAttribute('data-categoria', item.categoria);
        var stockClass = item.stockTotal === 0 ? 'stock-agotado' : (item.stockTotal <= 3 ? 'stock-poco' : 'stock-disponible');
        var stockIcon = item.stockTotal === 0 ? '&#10060;' : (item.stockTotal <= 3 ? '&#9888;' : '&#10004;');
        card.innerHTML =
            '<img src="' + (item.imagen ? getImagenUrl(escapeHtml(item.imagen)) : '../../Image/productos.png') + '" alt="' + escapeHtml(item.nombre) + '" class="product-img">' +
            '<div class="product-info">' +
                '<span class="product-category">' + escapeHtml(item.categoria) + '</span>' +
                '<h3 class="product-title">' + escapeHtml(item.nombre) + '</h3>' +
                '<p class="product-price">$' + item.precio.toFixed(2) + '</p>' +
                '<div class="product-stock ' + stockClass + '">' + stockIcon + ' ' + escapeHtml(item.stock) + '</div>' +
                '<div class="product-actions">' +
                    '<button class="btn-view-detail" onclick="abrirDetalle(\'' + item.id + '\')" title="Ver detalles">' +
                        '<span class="material-symbols-outlined" style="font-size: 18px;">visibility</span> Detalles' +
                    '</button>' +
                    '<button class="btn-fav ' + (esFavorito ? 'active' : '') + '" onclick="toggleFavorito(\'' + item.id + '\', \'' + escapeHtml(item.nombre).replace(/'/g, "\\'") + '\', ' + item.precio + ', \'' + escapeHtml(item.imagen) + '\', this)" title="Anadir a favoritos">' +
                        '<span class="material-symbols-outlined" style="font-size: 20px;">' + (esFavorito ? 'favorite' : 'favorite_border') + '</span>' +
                    '</button>' +
                '</div>' +
            '</div>';
        container.appendChild(card);
    });
}

window.toggleFavorito = function(id, nombre, precio, imagen, btn) {
    var favoritos;
    try { favoritos = JSON.parse(localStorage.getItem('bellaFavoritos')) || []; } catch(e) { favoritos = []; }
    var existente = favoritos.find(function(f) { return f.id == id; });

    if (existente) {
        favoritos = favoritos.filter(function(f) { return f.id != id; });
        btn.classList.remove('active');
        btn.querySelector('span').textContent = 'favorite_border';
        alert('Eliminado de favoritos');
    } else {
        favoritos.push({ id: id, nombre: nombre, precio: precio, imagen: imagen || '' });
        btn.classList.add('active');
        btn.querySelector('span').textContent = 'favorite';
        alert('Anadido a favoritos!');
    }
    localStorage.setItem('bellaFavoritos', JSON.stringify(favoritos));
};

function configurarFiltros() {
    var botones = document.querySelectorAll('.filter-btn');
    botones.forEach(function(btn) {
        btn.addEventListener('click', function() {
            botones.forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            var categoria = btn.getAttribute('data-category');
            if (categoria === 'todo') {
                renderizarProductos(productosCatalogo);
            } else {
                var filtrados = productosCatalogo.filter(function(p) { return p.categoria === categoria; });
                renderizarProductos(filtrados);
            }
        });
    });
}

function configurarBusqueda() {
    var input = document.getElementById('search-input');
    if (!input) return;
    input.addEventListener('input', function() {
        var termino = input.value.toLowerCase().trim();
        if (termino === '') {
            renderizarProductos(productosCatalogo);
            return;
        }
        var resultados = productosCatalogo.filter(function(p) {
            return p.nombre.toLowerCase().includes(termino) || p.categoria.toLowerCase().includes(termino);
        });
        renderizarProductos(resultados);
    });
}

function aplicarBusquedaURL() {
    var params = new URLSearchParams(window.location.search);
    var search = params.get('search');
    if (search) {
        var input = document.getElementById('search-input');
        if (input) {
            input.value = search;
            input.dispatchEvent(new Event('input'));
        }
    }
}

/* MODAL DETALLE PRODUCTO */
function abrirDetalle(id) {
    var producto = productosCatalogo.find(function(p) { return p.id == id; });
    if (!producto) return;

    tallaSeleccionada = null;

    var elImagen = document.getElementById('detalle-imagen');
    var elNombre = document.getElementById('detalle-nombre');
    var elMarca = document.getElementById('detalle-marca');
    var elCategoria = document.getElementById('detalle-categoria');
    var elPrecio = document.getElementById('detalle-precio');
    var elStock = document.getElementById('detalle-stock');
    var elDescripcion = document.getElementById('detalle-descripcion');
    if (elImagen) { elImagen.src = producto.imagen ? getImagenUrl(escapeHtml(producto.imagen)) : '../../Image/productos.png'; elImagen.alt = producto.nombre; }
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
    var favTemp;
    try { favTemp = JSON.parse(localStorage.getItem('bellaFavoritos')) || []; } catch(e) { favTemp = []; }
    var esFavorito = favTemp.some(function(f) { return f.id == id; });
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

function escapeHtml(text) {
    var div = document.createElement("div");
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
}
