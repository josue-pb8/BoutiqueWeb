let apartadosData = [];

document.addEventListener('DOMContentLoaded', function() {
try {
var user = JSON.parse(localStorage.getItem('usuario'));
if (user) {
    document.getElementsByClassName("user-name")[0].innerHTML = user.nombreUsuario;
    document.getElementsByClassName("avatar-placeholder")[0].innerHTML = user.nombreUsuario.charAt(0).toUpperCase();
}
} catch(e) {}
    cargarApartadosDesdeServidor();
    configurarBusqueda();
});

function cargarApartadosDesdeServidor() {
    var container = document.getElementById('apartados-container');
    var emptyState = document.getElementById('empty-apartados');
    var subtitle = document.getElementById('apartados-subtitle');
    var searchInput = document.getElementById('search-input');

    if (!container || !emptyState) return;

    var clienteId = getClienteId();
    if (!clienteId) return;

    apiGet("/apartados/cliente/" + clienteId).then(function(apartados) {
        console.log('Apartados cargados:', apartados);
        if (!apartados || apartados.length === 0) {
            container.style.display = 'none';
            emptyState.style.display = 'flex';
            if (subtitle) subtitle.textContent = 'No tienes apartados.';
            apartadosData = [];
            return;
        }

        apartadosData = apartados;

        if (searchInput && searchInput.value.trim() !== '') {
            filtrarApartados(searchInput.value.trim().toLowerCase());
        } else {
            renderizarApartadosLista(apartados);
        }
    }).catch(function(error) {
        console.error('Error:', error);
        container.style.display = 'none';
        emptyState.style.display = 'flex';
        if (subtitle) subtitle.textContent = 'No tienes apartados registrados.';
        apartadosData = [];
    });
}

function filtrarApartados(busqueda) {
    var container = document.getElementById('apartados-container');
    var emptyState = document.getElementById('empty-apartados');
    var subtitle = document.getElementById('apartados-subtitle');

    var filtrados = apartadosData.filter(function(a) {
        var nombre = '';
        if (a.detalles && a.detalles.length > 0 && a.detalles[0].producto) {
            nombre = a.detalles[0].producto.nombre || '';
        }
        var folio = 'BB-' + a.id;
        var estado = a.estado || '';
        var texto = (nombre + ' ' + folio + ' ' + estado).toLowerCase();
        return texto.indexOf(busqueda) !== -1;
    });

    if (filtrados.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'flex';
        if (subtitle) subtitle.textContent = 'No se encontraron apartados para "' + busqueda + '".';
    } else {
        container.style.display = 'flex';
        emptyState.style.display = 'none';
        if (subtitle) subtitle.textContent = 'Se encontraron ' + filtrados.length + ' apartado(s).';
        renderizarApartadosLista(filtrados);
    }
}

function renderizarApartadosLista(lista) {
    var container = document.getElementById('apartados-container');
    var emptyState = document.getElementById('empty-apartados');
    var subtitle = document.getElementById('apartados-subtitle');
    if (!container) return;

    if (lista.length === 0) {
        container.style.display = 'none';
        if (emptyState) emptyState.style.display = 'flex';
        if (subtitle) subtitle.textContent = 'No se encontraron apartados.';
        return;
    }

    container.style.display = 'flex';
    if (emptyState) emptyState.style.display = 'none';
    if (subtitle) subtitle.textContent = 'Tienes ' + lista.length + ' apartado(s).';
    container.innerHTML = '';

    lista.forEach(function(apartado) {
        var primerDetalle = apartado.detalles && apartado.detalles.length > 0 ? apartado.detalles[0] : null;
        var nombreProducto = primerDetalle && primerDetalle.producto ? primerDetalle.producto.nombre : 'Producto Boutique';
        var imagenProducto = primerDetalle && primerDetalle.producto && primerDetalle.producto.imagenUrl ? getImagenUrl(primerDetalle.producto.imagenUrl) : '../../Image/productos.png';

        var total = Number(apartado.total || 0);
        var abonado = Number(apartado.abonado || 0);
        var pendiente = total - abonado;
        var estado = apartado.estado || 'ACTIVO';

        var estatusHTML = '<span class="status-badge status-pendiente">Pendiente</span>';
        if (estado === 'PAGADO') {
            estatusHTML = '<span class="status-badge status-completada">Pagado</span>';
        } else if (estado === 'CANCELADO') {
            estatusHTML = '<span class="status-badge status-cancelado">Cancelado</span>';
        }

        var card = document.createElement('div');
        card.className = 'apartado-card';
        card.innerHTML =
            '<img src="' + escapeHtml(imagenProducto) + '" alt="' + escapeHtml(nombreProducto) + '" class="apartado-img">' +
            '<div class="apartado-details">' +
                '<div class="apartado-header">' +
                    '<span class="apartado-name">' + escapeHtml(nombreProducto) + '</span>' +
                    '<span class="apartado-precio">$' + total.toFixed(2) + '</span>' +
                '</div>' +
                '<div class="apartado-meta">Pendiente: $' + pendiente.toFixed(2) + ' de $' + total.toFixed(2) + '</div>' +
                '<div class="apartado-folio">Folio: #BB-' + apartado.id + ' &nbsp; ' + estatusHTML + '</div>' +
                '<div class="apartado-actions">' +
                    '<button class="btn-pagar" onclick="verDetalleApartado(' + apartado.id + ')">Ver Detalles</button>' +
                    (estado === 'ACTIVO' ? '<button class="btn-cancelar-apartado" onclick="cancelarApartado(' + apartado.id + ')">Cancelar</button>' : '') +
                '</div>' +
            '</div>';
        container.appendChild(card);
    });
}

function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    var div = document.createElement("div");
    div.appendChild(document.createTextNode(String(text)));
    return div.innerHTML;
}

function toggleSidebar() {
    var sidebar = document.querySelector('.sidebar');
    if (sidebar) sidebar.classList.toggle('collapsed');
}

function configurarBusqueda() {
    var input = document.getElementById('search-input');
    if (!input) return;
    var debounceTimer = null;
    input.addEventListener('input', function() {
        clearTimeout(debounceTimer);
        var val = input.value.trim().toLowerCase();
        debounceTimer = setTimeout(function() {
            if (apartadosData.length === 0) return;
            if (val === '') {
                renderizarApartadosLista(apartadosData);
                var subtitle = document.getElementById('apartados-subtitle');
                var container = document.getElementById('apartados-container');
                var emptyState = document.getElementById('empty-apartados');
                container.style.display = 'flex';
                emptyState.style.display = 'none';
                if (subtitle) subtitle.textContent = 'Tienes ' + apartadosData.length + ' apartado(s) registrado(s).';
            } else {
                filtrarApartados(val);
            }
        }, 300);
    });
}

function buscarApartadoPorId(id) {
    for (var i = 0; i < apartadosData.length; i++) {
        if (apartadosData[i].id === id) return apartadosData[i];
    }
    return null;
}

window.verDetalleApartado = function(id) {
    var apartado = buscarApartadoPorId(id);
    if (!apartado) {
        alert('No se encontro el apartado.');
        return;
    }

    var total = Number(apartado.total || 0);
    var abonado = Number(apartado.abonado || 0);
    var pendiente = total - abonado;
    var estado = apartado.estado || 'ACTIVO';
    var fechaRegistro = apartado.fechaApartado || apartado.fechaRegistro || apartado.fecha_registro || '';
    if (Array.isArray(fechaRegistro)) {
        fechaRegistro = fechaRegistro[2] + '/' + String(fechaRegistro[1]).padStart(2, '0') + '/' + fechaRegistro[0];
    } else if (typeof fechaRegistro === 'string' && fechaRegistro.includes('T')) {
        fechaRegistro = fechaRegistro.split('T')[0].split('-').reverse().join('/');
    }

    var estatusClass = 'status-pendiente';
    var estatusLabel = 'Pendiente';
    if (estado === 'PAGADO') { estatusClass = 'status-completada'; estatusLabel = 'Pagado'; }
    else if (estado === 'CANCELADO') { estatusClass = 'status-cancelado'; estatusLabel = 'Cancelado'; }

    var detallesHTML = '';
    if (apartado.detalles && apartado.detalles.length > 0) {
        apartado.detalles.forEach(function(det) {
            var nombre = det.producto ? det.producto.nombre : 'Producto';
            var imagen = det.producto && det.producto.imagenUrl ? getImagenUrl(det.producto.imagenUrl) : '../../Image/productos.png';
            var cantidad = det.cantidad || 1;
            var precio = det.precioUnitario || 0;
            var subtotal = precio * cantidad;
            detallesHTML +=
                '<div class="detalle-producto">' +
                    (imagen ? '<img src="' + escapeHtml(imagen) + '" alt="' + escapeHtml(nombre) + '" class="detalle-img">' : '') +
                    '<div class="detalle-info">' +
                        '<span class="detalle-nombre">' + escapeHtml(nombre) + '</span>' +
                        (det.talla ? '<span class="detalle-talla">Talla: ' + escapeHtml(det.talla) + '</span>' : '') +
                        '<span class="detalle-cant">Cantidad: ' + cantidad + '</span>' +
                        '<span class="detalle-prec">Precio: $' + precio.toFixed(2) + '</span>' +
                        '<span class="detalle-subtotal">Subtotal: $' + subtotal.toFixed(2) + '</span>' +
                    '</div>' +
                '</div>';
        });
    }

    var html =
        '<h2 class="modal-title">Detalle del Apartado</h2>' +
        '<div class="modal-folio">Folio: #BB-' + apartado.id + ' &nbsp; <span class="status-badge ' + estatusClass + '">' + estatusLabel + '</span></div>' +
        (fechaRegistro ? '<div class="modal-fecha">Fecha: ' + escapeHtml(fechaRegistro) + '</div>' : '') +
        '<div class="modal-resumen">' +
            '<div class="resumen-row"><span>Total:</span><span>$' + total.toFixed(2) + '</span></div>' +
            '<div class="resumen-row resumen-abonado"><span>Abonado:</span><span>$' + abonado.toFixed(2) + '</span></div>' +
            '<div class="resumen-row resumen-pendiente"><span>Pendiente:</span><span>$' + pendiente.toFixed(2) + '</span></div>' +
        '</div>' +
        (detallesHTML ? '<div class="modal-detalles"><h3>Productos</h3>' + detallesHTML + '</div>' : '') +
        '<div id="modal-error" style="color: var(--danger); margin-top: 0.75rem; font-size: 0.85rem;"></div>';

    document.getElementById('modal-detalle-body').innerHTML = html;
    document.getElementById('modal-detalle-apartado').classList.add('active');
};

window.cerrarModalDetalle = function(e) {
    if (e.target.id === 'modal-detalle-apartado') {
        document.getElementById('modal-detalle-apartado').classList.remove('active');
    }
};

window.cerrarModalDetalleDirecto = function() {
    document.getElementById('modal-detalle-apartado').classList.remove('active');
};

// --- Modal Abono ---
window.abrirModalAbono = function(id) {
    var apartado = buscarApartadoPorId(id);
    if (!apartado) { alert('Apartado no encontrado.'); return; }

    var total = Number(apartado.total || 0);
    var abonado = Number(apartado.abonado || 0);
    var pendiente = total - abonado;

    if (pendiente <= 0) {
        alert('Este apartado ya esta pagado.');
        return;
    }

    var html =
        '<h2 class="modal-title">Realizar Abono</h2>' +
        '<div class="modal-folio">Folio: #BB-' + apartado.id + '</div>' +
        '<div class="modal-resumen">' +
            '<div class="resumen-row"><span>Total:</span><span>$' + total.toFixed(2) + '</span></div>' +
            '<div class="resumen-row resumen-abonado"><span>Abonado:</span><span>$' + abonado.toFixed(2) + '</span></div>' +
            '<div class="resumen-row resumen-pendiente"><span>Pendiente:</span><span>$' + pendiente.toFixed(2) + '</span></div>' +
        '</div>' +
        '<div class="abono-form">' +
            '<label for="input-abono">Monto a abonar:</label>' +
            '<input type="number" id="input-abono" min="0.01" max="' + pendiente + '" step="0.01" placeholder="$0.00">' +
            '<div id="abono-error" style="color: var(--danger); margin-top: 0.5rem; font-size: 0.85rem;"></div>' +
            '<button class="btn-abonar-modal" id="btn-confirmar-abono" onclick="confirmarAbono(' + apartado.id + ', ' + pendiente + ')">Confirmar Abono</button>' +
        '</div>';

    document.getElementById('modal-detalle-body').innerHTML = html;
    document.getElementById('modal-detalle-apartado').classList.add('active');

    setTimeout(function() {
        var input = document.getElementById('input-abono');
        if (input) input.focus();
    }, 100);
};

window.confirmarAbono = function(apartadoId, pendiente) {
    var input = document.getElementById('input-abono');
    var errorDiv = document.getElementById('abono-error');
    if (!input || !errorDiv) return;

    var montoStr = input.value.trim();
    var monto = parseFloat(montoStr);

    if (montoStr === '' || isNaN(monto) || monto <= 0) {
        errorDiv.textContent = 'Ingresa un monto valido mayor a $0.';
        return;
    }

    if (monto > pendiente) {
        errorDiv.textContent = 'El monto excede el saldo pendiente de $' + pendiente.toFixed(2) + '.';
        return;
    }

    errorDiv.textContent = '';
    var btn = document.getElementById('btn-confirmar-abono');
    if (btn) { btn.disabled = true; btn.textContent = 'Procesando...'; }

    apiPut("/apartados/" + apartadoId + "/abono", { monto: monto }).then(function() {
        document.getElementById('modal-detalle-apartado').classList.remove('active');
        cargarApartadosDesdeServidor();
    }).catch(function(err) {
        if (btn) { btn.disabled = false; btn.textContent = 'Confirmar Abono'; }
        errorDiv.textContent = 'Error: ' + (err.error || 'No se pudo registrar el abono.');
    });
};

window.cancelarApartado = function(id) {
    if (!confirm('¿Seguro que quieres cancelar este apartado?')) return;
    apiPut("/apartados/" + id + "/cancelar", {}).then(function() {
        cargarApartadosDesdeServidor();
    }).catch(function(err) {
        alert('Error al cancelar: ' + (err.error || 'Intenta de nuevo.'));
    });
};
