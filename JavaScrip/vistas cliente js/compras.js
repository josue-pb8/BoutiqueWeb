let comprasData = [];

document.addEventListener('DOMContentLoaded', () => {
    cargarCompras();
    configurarBusqueda();
});
 let user = JSON.parse(localStorage.getItem('usuario')); 
    document.getElementsByClassName("user-name")[0].innerHTML = user.nombreUsuario; 

    document.getElementsByClassName("avatar-placeholder")[0].innerHTML = user.nombreUsuario.charAt(0).toUpperCase();
    

function cargarCompras() {
    var clienteId = getClienteId();
    apiGet("/ventas/cliente/" + clienteId).then(function(ventas) {
        if (!ventas) return;
        comprasData = ventas;
        renderizarCompras(comprasData);
    }).catch(function(err) {
        console.error("Error cargando compras:", err);
        renderizarCompras([]);
    });
}

function renderizarCompras(compras) {
    var container = document.getElementById('compras-container');
    var emptyState = document.getElementById('empty-compras');
    var subtitle = document.getElementById('compras-subtitle');

    if (!container || !emptyState) return;

    if (!compras || compras.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'flex';
        if (subtitle) subtitle.textContent = 'No tienes compras registradas.';
        return;
    }

    container.style.display = 'flex';
    emptyState.style.display = 'none';
    if (subtitle) subtitle.textContent = compras.length + ' compra(s) en tu historial.';

    container.innerHTML = '';

    compras.forEach(function(compra) {
        var estatus = (compra.estado || 'completada').toLowerCase();
        var estatusHTML = '';
        if (estatus === 'completada') {
            estatusHTML = '<span class="status-badge status-completada">Completada</span>';
        } else if (estatus === 'proceso') {
            estatusHTML = '<span class="status-badge status-proceso">En proceso</span>';
        } else {
            estatusHTML = '<span class="status-badge status-pendiente">Pendiente</span>';
        }

        var total = Number(compra.total || 0);
        var fecha = formatFecha(compra.fechaVenta);
        var itemsHTML = '';
        if (Array.isArray(compra.detalles)) {
            compra.detalles.forEach(function(item) {
                var nombre = item.producto ? item.producto.nombre : 'Producto';
                var cant = Number(item.cantidad) || 1;
                var prec = Number(item.precioUnitario) || 0;
                itemsHTML += '<li><span>' + escapeHtml(nombre) + ' <span class="item-cantidad">x' + cant + '</span></span><span>$' + (prec * cant).toFixed(2) + '</span></li>';
            });
        }

        var card = document.createElement('div');
        card.className = 'compra-card';
        card.innerHTML =
            '<div class="compra-header">' +
                '<div>' +
                    '<span class="compra-folio">#BB-' + compra.id + '</span>' +
                    '<span class="compra-fecha"> — ' + fecha + '</span>' +
                '</div>' +
                estatusHTML +
            '</div>' +
            '<div class="compra-body">' +
                '<ul class="compra-items">' + itemsHTML + '</ul>' +
                '<div class="compra-footer">' +
                    '<span style="color: #64748b; font-size: 0.9rem;">Pago en efectivo en sucursal</span>' +
                    '<span class="compra-total">Total: $' + total.toFixed(2) + '</span>' +
                '</div>' +
            '</div>';
        container.appendChild(card);
    });
}

function formatFecha(fecha) {
    if (!fecha) return "N/A";
    try {
        if (Array.isArray(fecha)) {
            return fecha[2] + "/" + String(fecha[1]).padStart(2, "0") + "/" + fecha[0];
        }
        return new Date(fecha).toLocaleDateString("es-MX", { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) {
        return "N/A";
    }
}

function escapeHtml(text) {
    var div = document.createElement("div");
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
}

function toggleSidebar() {
    var sidebar = document.querySelector('.sidebar');
    if (sidebar) sidebar.classList.toggle('collapsed');
}

function configurarBusqueda() {
    var input = document.getElementById('search-input');
    if (!input) return;
    input.addEventListener('input', function() {
        var termino = input.value.toLowerCase().trim();
        if (termino === '') {
            renderizarCompras(comprasData);
            return;
        }
        var filtrados = comprasData.filter(function(c) {
            if (!c.detalles) return false;
            return c.detalles.some(function(item) {
                return item.producto && item.producto.nombre && item.producto.nombre.toLowerCase().includes(termino);
            });
        });
        renderizarCompras(filtrados);
    });
}
