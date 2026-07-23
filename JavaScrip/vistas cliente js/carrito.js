document.addEventListener('DOMContentLoaded', () => {
    renderizarCarrito();
    actualizarBadgeCarrito();
    configurarBusqueda();

     let user = JSON.parse(localStorage.getItem('usuario')); 
    document.getElementsByClassName("user-name")[0].innerHTML = user.nombreUsuario; 

    document.getElementsByClassName("avatar-placeholder")[0].innerHTML = user.nombreUsuario.charAt(0).toUpperCase();
    

    const btnFolio = document.getElementById('btn-generar-folio');
    if (btnFolio) {
        btnFolio.addEventListener('click', () => {
            let carrito;
            try { carrito = JSON.parse(localStorage.getItem('bellaCarrito')) || []; } catch(e) { carrito = []; }
            if (carrito.length === 0) { alert('El carrito esta vacio.'); return; }
            if (!confirm('Generar folio de compra? Se registrara la venta.')) return;

            btnFolio.disabled = true;
            btnFolio.textContent = 'Procesando...';

            var clienteId = getClienteId();
            var empleadoId = getUsuarioId();
            var detalles = carrito.map(function(item) {
                return {
                    productoId: parseInt(item.id),
                    cantidad: Number(item.cantidad) || 1,
                    precioUnitario: Number(item.precio) || 0
                };
            });

            var payload = {
                empleadoId: empleadoId,
                metodoPagoId: 1,
                detalles: detalles
            };

            if (clienteId) payload.clienteId = clienteId;

            apiPost("/ventas", payload).then(function(venta) {
                var cartContainer = document.getElementById('cart-layout');
                if (cartContainer) {
                    cartContainer.innerHTML =
                        '<div style="background: white; padding: 4rem 2rem; border-radius: 12px; text-align: center; width: 100%; border: 2px dashed #10b981; margin-top: 1rem;">' +
                            '<span class="material-symbols-outlined" style="font-size: 64px; color: #10b981; margin-bottom: 1rem;">check_circle</span>' +
                            '<h2 style="color: #0f172a; margin-bottom: 0.5rem; font-size: 1.8rem;">Pedido Registrado con Exito!</h2>' +
                            '<p style="color: #64748b; margin-bottom: 1.5rem;">Tu numero de venta es:</p>' +
                            '<h1 style="color: #fb923c; font-size: 3.5rem; margin-bottom: 1.5rem; letter-spacing: 2px;">#BB-' + venta.id + '</h1>' +
                            '<p style="color: #64748b; margin-bottom: 2.5rem;">Presentalo en caja para pagar en efectivo y recoger tus articulos.</p>' +
                            '<a href="./inicio.html" style="background: #0f172a; color: white; padding: 1rem 2rem; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">Volver al Inicio</a>' +
                        '</div>';
                }
                localStorage.removeItem('bellaCarrito');
                actualizarBadgeCarrito();
            }).catch(function(err) {
                alert('Error al registrar venta: ' + (err.error || 'Intenta de nuevo.'));
                btnFolio.disabled = false;
                btnFolio.textContent = 'Generar Folio';
            });
        });
    }
});

function renderizarCarrito() {
    let carrito;
    try { carrito = JSON.parse(localStorage.getItem('bellaCarrito')) || []; } catch { carrito = []; }
    const layout = document.getElementById('cart-layout');
    const emptyState = document.getElementById('empty-cart');
    const container = document.getElementById('cart-items-container');
    const subtitulo = document.getElementById('cart-subtitle');
    const subtotalEl = document.getElementById('cart-subtotal');
    const totalEl = document.getElementById('cart-total');
    
    if (!layout || !emptyState || !container) return; 

    if (carrito.length === 0) {
        layout.style.display = 'none';
        emptyState.style.display = 'flex';
        if(subtitulo) subtitulo.textContent = 'No tienes artículos en tu bolsa.';
        return;
    }

    layout.style.display = 'flex';
    emptyState.style.display = 'none';
    
    let totalArticulos = 0;
    let subtotal = 0;
    container.innerHTML = '';

    carrito.forEach(item => {
        const cant = Number(item.cantidad) || 0;
        const prec = Number(item.precio) || 0;
        totalArticulos += cant;
        subtotal += (prec * cant);
        
        const itemDiv = document.createElement('div');
        itemDiv.className = 'cart-item';
        var imgSrc = item.imagen ? getImagenUrl(item.imagen) : '../../Image/productos.png';
        itemDiv.innerHTML = `
            <img src="${imgSrc}" alt="${item.nombre}">
            <div class="item-details">
                <h3>${item.nombre}</h3>
                <p class="precio">$${prec.toFixed(2)}</p>
                <button class="btn-eliminar" onclick="eliminarItem('${item.id}')">
                    <span class="material-symbols-outlined" style="font-size: 18px;">delete</span> Eliminar
                </button>
            </div>
            <div class="quantity-controls">
                <button onclick="modificarCantidad('${item.id}', -1)">-</button>
                <span>${cant}</span>
                <button onclick="modificarCantidad('${item.id}', 1)">+</button>
            </div>
        `;
        container.appendChild(itemDiv);
    });

    if(subtitulo) subtitulo.textContent = `Tienes ${totalArticulos} articulo(s) en tu bolsa.`;
    if(subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    if(totalEl) totalEl.textContent = `$${subtotal.toFixed(2)}`;
}

window.modificarCantidad = function(id, cambio) {
    let carrito;
    try { carrito = JSON.parse(localStorage.getItem('bellaCarrito')) || []; } catch { carrito = []; }
    const item = carrito.find(p => p.id == id);
    if (item) {
        item.cantidad = Number(item.cantidad) + Number(cambio);
        if (item.cantidad > 99) item.cantidad = 99;
        if (item.cantidad <= 0) {
    carrito = carrito.filter(p => p.id != id);
        }
        localStorage.setItem('bellaCarrito', JSON.stringify(carrito));
        renderizarCarrito();
        actualizarBadgeCarrito();
    }
};

window.eliminarItem = function(id) {
    let carrito;
    try { carrito = JSON.parse(localStorage.getItem('bellaCarrito')) || []; } catch { carrito = []; }
    carrito = carrito.filter(p => p.id !== id);
    localStorage.setItem('bellaCarrito', JSON.stringify(carrito));
    renderizarCarrito();
    actualizarBadgeCarrito();
};

function actualizarBadgeCarrito() {
    const badge = document.getElementById('sidebar-cart-count');
    if (!badge) return;
    let carrito;
    try { carrito = JSON.parse(localStorage.getItem('bellaCarrito')) || []; } catch { carrito = []; }
    const totalArticulos = carrito.reduce((acc, item) => acc + (Number(item.cantidad) || 0), 0);
    badge.textContent = totalArticulos;
    badge.style.display = totalArticulos > 0 ? 'inline-block' : 'none';
}

/* ====== SIDEBAR PLEGABLE ====== */
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) sidebar.classList.toggle('collapsed');
}

/* ====== BUSQUEDA ====== */
function configurarBusqueda() {
    const input = document.getElementById('search-input');
    if (!input) return;
    input.addEventListener('input', () => {
        const termino = input.value.toLowerCase().trim();
        let carrito;
        try { carrito = JSON.parse(localStorage.getItem('bellaCarrito')) || []; } catch { carrito = []; }
        if (termino === '') {
            renderizarCarrito();
            return;
        }
        const filtrados = carrito.filter(c => c.nombre.toLowerCase().includes(termino));
        renderizarCarritoLista(filtrados);
    });
}

function renderizarCarritoLista(lista) {
    const layout = document.getElementById('cart-layout');
    const emptyState = document.getElementById('empty-cart');
    const container = document.getElementById('cart-items-container');
    const subtotalEl = document.getElementById('cart-subtotal');
    const totalEl = document.getElementById('cart-total');
    if (!layout || !emptyState || !container) return;

    if (lista.length === 0) {
        layout.style.display = 'none';
        emptyState.style.display = 'flex';
        return;
    }

    layout.style.display = 'flex';
    emptyState.style.display = 'none';
    let subtotal = 0;
    container.innerHTML = '';

    lista.forEach(item => {
        const prec = Number(item.precio) || 0;
        const cant = Number(item.cantidad) || 0;
        subtotal += (prec * cant);
        var imgSrc = item.imagen ? getImagenUrl(item.imagen) : '../../Image/productos.png';
        const itemDiv = document.createElement('div');
        itemDiv.className = 'cart-item';
        itemDiv.innerHTML = `
            <img src="${imgSrc}" alt="${item.nombre}">
            <div class="item-details">
                <h3>${item.nombre}</h3>
                <p class="precio">$${prec.toFixed(2)}</p>
                <button class="btn-eliminar" onclick="eliminarItem('${item.id}')">
                    <span class="material-symbols-outlined" style="font-size: 18px;">delete</span> Eliminar
                </button>
            </div>
            <div class="quantity-controls">
                <button onclick="modificarCantidad('${item.id}', -1)">-</button>
                <span>${cant}</span>
                <button onclick="modificarCantidad('${item.id}', 1)">+</button>
            </div>
        `;
        container.appendChild(itemDiv);
    });

    if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `$${subtotal.toFixed(2)}`;
}
