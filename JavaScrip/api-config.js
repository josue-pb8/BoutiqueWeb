var API_BASE_URL = 'http://13.223.43.187:8081/api';
function getAuthHeaders() {
    var token = localStorage.getItem('token');
    var headers = { 'Content-Type': 'application/json' };
    if (token) {
        headers['Authorization'] = 'Bearer ' + token;
    }
    return headers;
}

function apiRequest(method, path, body) {
    var options = {
        method: method,
        headers: getAuthHeaders()
    };
    if (body && method !== 'GET') {
        options.body = JSON.stringify(body);
    }
    return fetch(API_BASE_URL + path, options).then(function(response) {
        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            localStorage.removeItem('clienteId');
            var currentPath = window.location.pathname;
            if (currentPath.includes('vistas cliente html') || currentPath.includes('empleadoHTML')) {
                window.location.href = '../../index.html';
            } else {
                window.location.href = '../index.html';
            }
            return Promise.reject(new Error('Sesion expirada'));
        }
        if (!response.ok) {
            return response.json().catch(function() { return {}; }).then(function(err) {
                return Promise.reject(err);
            });
        }
        if (response.status === 204) return null;
        return response.json();
    });
}

function apiGet(path) {
    return apiRequest('GET', path);
}

function apiPost(path, body) {
    return apiRequest('POST', path, body);
}

function apiPut(path, body) {
    return apiRequest('PUT', path, body);
}

function apiDelete(path) {
    return apiRequest('DELETE', path);
}

function getUsuario() {
    try {
        var raw = localStorage.getItem('usuario');
        if (!raw) return null;
        return JSON.parse(raw);
    } catch (e) {
        return null;
    }
}

function getClienteId() {
    var id = localStorage.getItem('clienteId');
    return id ? parseInt(id) : 1;
}

function getUsuarioId() {
    var id = localStorage.getItem('usuarioId');
    return id ? parseInt(id) : 1;
}

function getRol() {
    return localStorage.getItem('rol') || '';
}

function getImagenUrl(imagenUrl) {
    if (!imagenUrl) return '';
    if (imagenUrl.startsWith('http')) return imagenUrl;
    return API_BASE_URL.replace('/api', '') + imagenUrl;
}

function requireRole(allowedRoles) {
    var token = localStorage.getItem('token');
    var rol = localStorage.getItem('rol');
    if (!token || !rol || allowedRoles.indexOf(rol) === -1) {
        window.location.href = '../../index.html';
        return false;
    }
    return true;
}

function cerrarSesion(redirectUrl) {
    apiPost('/auth/logout', {}).then(function() {
        limpiarSesion();
    }).catch(function() {
        limpiarSesion();
    });

    function limpiarSesion() {
        var keys = ['bellaCarrito', 'bellaFavoritos', 'bellaUsuario', 'bellaApartados', 'token', 'usuario', 'usuarioId', 'rol', 'clienteId'];
        keys.forEach(function(key) {
            try { localStorage.removeItem(key); } catch(e) {}
        });
        window.location.href = redirectUrl || '../../index.html';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    var isClientePage = window.location.pathname.includes('vistas cliente html');
    if (isClientePage) return;

    var logoutLinks = document.querySelectorAll('.logout-link, a.logout');
    logoutLinks.forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            var href = this.getAttribute('href');
            cerrarSesion(href);
        });
    });
});
