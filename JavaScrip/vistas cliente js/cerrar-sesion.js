document.addEventListener('DOMContentLoaded', () => {
    cargarDatosUsuario();
    configurarBusqueda();

    var btnCerrar = document.getElementById('btn-cerrar-sesion');
    var btnCancelar = document.getElementById('btn-cancelar');

    if (btnCerrar) {
        btnCerrar.addEventListener('click', function() {
            cerrarSesion('../../index.html');
        });
    }

    if (btnCancelar) {
        btnCancelar.addEventListener('click', function() {
            window.location.href = './inicio.html';
        });
    }
});

function cargarDatosUsuario() {
    var user = getUsuario();
    if (!user) return;
    var nombre = user.nombreUsuario || '';
    var avatarEl = document.getElementById('logout-avatar');
    var usernameEl = document.getElementById('logout-username');
    if (avatarEl) avatarEl.textContent = (nombre[0] || '').toUpperCase();
    if (usernameEl) usernameEl.textContent = nombre;
}

function toggleSidebar() {
    var sidebar = document.querySelector('.sidebar');
    if (sidebar) sidebar.classList.toggle('collapsed');
}

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
