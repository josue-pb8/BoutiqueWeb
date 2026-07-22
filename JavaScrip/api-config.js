var API_AWS_URL = 'http://35.168.202.45:8081/api';

var API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8081/api'
    : 'https://boutiqueweb-api.onrender.com/api';

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
    if (imagenUrl.startsWith('data:')) return imagenUrl;
    if (imagenUrl.length > 100 && !imagenUrl.startsWith('/')) {
        var mime = 'image/png';
        if (imagenUrl.startsWith('/9j/')) mime = 'image/jpeg';
        else if (imagenUrl.startsWith('UklGR')) mime = 'image/webp';
        else if (imagenUrl.startsWith('iVBOR')) mime = 'image/png';
        else if (imagenUrl.startsWith('R0lGOD')) mime = 'image/gif';
        return 'data:' + mime + ';base64,' + imagenUrl;
    }
    return API_BASE_URL.replace('/api', '') + imagenUrl;
}

function imagenFileAToDataUrl(file, callback) {
    var reader = new FileReader();
    reader.onload = function (e) {
        var dataUrl = e.target.result;
        var partes = dataUrl.split(',');
        var mime = partes[0].match(/data:(.*?);/);
        var mimeStr = mime ? mime[1] : 'image/png';
        var base64 = partes[1];
        callback({ base64: base64, dataUrl: dataUrl, mime: mimeStr });
    };
    reader.readAsDataURL(file);
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
