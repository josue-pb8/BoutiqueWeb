document.addEventListener('DOMContentLoaded', () => {
 try {
 let user = JSON.parse(localStorage.getItem('usuario'));
    if (user) {
        var nameElCliFav = document.getElementsByClassName("user-name")[0];
        if (nameElCliFav) nameElCliFav.innerHTML = user.nombreUsuario;
        var avatarElCliFav = document.getElementsByClassName("avatar-placeholder")[0];
        if (avatarElCliFav) avatarElCliFav.innerHTML = user.nombreUsuario.charAt(0).toUpperCase();
    }
 } catch(e) {}
    renderizarFavoritos();
    configurarBusqueda();
});
    

function renderizarFavoritos() {
        let favoritos;
        try { favoritos = JSON.parse(localStorage.getItem('bellaFavoritos')) || []; } catch { favoritos = []; }
    const container = document.getElementById('favorites-container');
    const emptyState = document.getElementById('empty-favorites');
    const subtitle = document.getElementById('fav-subtitle');

    if (!container || !emptyState) return;

    if (favoritos.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'flex';
        if (subtitle) subtitle.textContent = 'No tienes artículos guardados.';
        return;
    }

    container.style.display = 'grid';
    emptyState.style.display = 'none';
    if (subtitle) subtitle.textContent = `Tienes ${favoritos.length} artículo(s) en tu lista.`;

    container.innerHTML = '';

    favoritos.forEach(item => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <img src="${item.imagen ? escapeHtml(getImagenUrl(item.imagen)) : '../../Image/productos.png'}" alt="${escapeHtml(item.nombre)}" class="product-img">
            <button class="btn-remove-fav" onclick="eliminarDeFavoritos('${item.id}')" title="Quitar de favoritos">
                <span class="material-symbols-outlined" style="font-size: 20px;">delete</span>
            </button>
            <div class="product-info">
                <h3 class="product-title">${escapeHtml(item.nombre)}</h3>
                <p class="product-price">$${(Number(item.precio) || 0).toFixed(2)}</p>
                <a href="./productos.html" class="btn-go-catalog" style="display: inline-block; margin-top: 0.5rem;">Ver Productos</a>
            </div>
        `;
        container.appendChild(card);
    });
}

window.eliminarDeFavoritos = function(id) {
    let favoritos;
    try { favoritos = JSON.parse(localStorage.getItem('bellaFavoritos')) || []; } catch { favoritos = []; }
    favoritos = favoritos.filter(item => String(item.id) !== String(id));
    localStorage.setItem('bellaFavoritos', JSON.stringify(favoritos));
    renderizarFavoritos();
};

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
    let favoritos;
    try { favoritos = JSON.parse(localStorage.getItem('bellaFavoritos')) || []; } catch { favoritos = []; }
        if (termino === '') {
            renderizarFavoritos();
            return;
        }
        const filtrados = favoritos.filter(f => f.nombre.toLowerCase().includes(termino));
        renderizarFavoritosLista(filtrados);
    });
}

function renderizarFavoritosLista(lista) {
    const container = document.getElementById('favorites-container');
    const emptyState = document.getElementById('empty-favorites');
    const subtitle = document.getElementById('fav-subtitle');
    if (!container || !emptyState) return;

    if (lista.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'flex';
        if (subtitle) subtitle.textContent = 'No se encontraron favoritos.';
        return;
    }

    container.style.display = 'grid';
    emptyState.style.display = 'none';
    if (subtitle) subtitle.textContent = `Mostrando ${lista.length} resultado(s).`;
    container.innerHTML = '';

    lista.forEach(item => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <img src="${item.imagen ? escapeHtml(getImagenUrl(item.imagen)) : '../../Image/productos.png'}" alt="${escapeHtml(item.nombre)}" class="product-img">
            <button class="btn-remove-fav" onclick="eliminarDeFavoritos('${item.id}')" title="Quitar de favoritos">
                <span class="material-symbols-outlined" style="font-size: 20px;">delete</span>
            </button>
            <div class="product-info">
                <h3 class="product-title">${escapeHtml(item.nombre)}</h3>
                <p class="product-price">$${(Number(item.precio) || 0).toFixed(2)}</p>
                <a href="./productos.html" class="btn-go-catalog" style="display: inline-block; margin-top: 0.5rem;">Ver Productos</a>
            </div>
        `;
        container.appendChild(card);
    });
}
