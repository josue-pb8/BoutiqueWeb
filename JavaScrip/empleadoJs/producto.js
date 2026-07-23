if (!localStorage.getItem('token') || !['ADMIN','EMPLEADO'].includes(localStorage.getItem('rol'))) { window.location.href = '../../index.html'; }
document.addEventListener("DOMContentLoaded", () => {
    console.log("Modulo de Productos de Bella Boutique cargado.");
    
    let user = JSON.parse(localStorage.getItem('usuario'));
    if (!user || !user.nombreUsuario) {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        localStorage.removeItem('rol');
        window.location.href = '../../index.html';
        return;
    }
    document.getElementsByClassName("user-name")[0].innerHTML = user.nombreUsuario;
    var avatarEl = document.getElementById("userAvatar");
    if (avatarEl) {
        var partes = user.nombreUsuario.replace(/[._-]/g, " ").trim().split(/\s+/);
        var iniciales = partes.map(function(p) { return p.charAt(0); }).join("").substring(0, 2).toUpperCase();
        avatarEl.textContent = iniciales;
    }

    var searchInput = document.getElementById("searchProduct");
    var filterCategory = document.getElementById("filterCategory");
    var tableBody = document.getElementById("productTableBody");
    var todosLosProductos = [];

    var stockMap = {};

    function cargarDatos() {
        apiGet("/productos").then(function(productos) {
            if (!productos) return;
            todosLosProductos = productos.filter(function(p) { return p.activo !== false; });
            return apiGet("/inventario");
        }).then(function(inventario) {
            stockMap = {};
            if (inventario) {
                inventario.forEach(function(item) {
                    var prodId = item.producto ? item.producto.id : null;
                    if (prodId == null) return;
                    if (!stockMap[prodId]) stockMap[prodId] = { total: 0, tallas: {} };
                    stockMap[prodId].total += item.stock || 0;
                    var talla = item.talla || 'Única';
                    if (!stockMap[prodId].tallas[talla]) stockMap[prodId].tallas[talla] = 0;
                    stockMap[prodId].tallas[talla] += item.stock || 0;
                });
            }
            filtrarProductos();
        }).catch(function(err) {
            console.error("Error cargando datos:", err);
            renderizarProductos(todosLosProductos);
        });
    }

    cargarDatos();
    setInterval(cargarDatos, 30000);

    function renderizarProductos(productos) {
        if (!tableBody) return;
        tableBody.innerHTML = "";

        if (productos.length === 0) {
            var tr = document.createElement("tr");
            tr.className = "no-results-row";
            tr.innerHTML = '<td colspan="7" style="text-align:center; padding:30px; color:#94a3b8; font-size:14px;">No se encontraron productos con esos criterios.</td>';
            tableBody.appendChild(tr);
            return;
        }

        productos.forEach(function(producto) {
            var stock = stockMap[producto.id] || { total: 10, tallas: {} };
            var tr = document.createElement("tr");
            var categoriaNombre = producto.categoria ? producto.categoria.nombre : "Sin categoria";
            tr.setAttribute("data-categoria", categoriaNombre.toLowerCase());

            var tallasHTML = '';
            var tallasKeys = Object.keys(stock.tallas);
            if (tallasKeys.length === 0) {
                tallasHTML = '<span style="color:#94a3b8;">-</span>';
            } else {
                tallasKeys.forEach(function(t) {
                    if (stock.tallas[t] > 0) {
                        tallasHTML += '<span class="tag-size">' + escapeHtml(t) + '</span>';
                    }
                });
                if (!tallasHTML) tallasHTML = '<span style="color:#94a3b8;">-</span>';
            }

            var stockTotal = stock.total;
            var badgeClass = 'disponible';
            var badgeText = stockTotal + ' unidad' + (stockTotal !== 1 ? 'es' : '');
            if (stockTotal === 0) {
                badgeClass = 'agotado';
                badgeText = 'Agotado';
            } else if (stockTotal <= 3) {
                badgeClass = 'agotándose';
                badgeText = stockTotal + ' unid. (últimas)';
            }

            tr.innerHTML =
                '<td><strong>#PRD-' + String(producto.id).padStart(3, "0") + "</strong></td>" +
                "<td>" + escapeHtml(producto.nombre) + "</td>" +
                "<td>" + escapeHtml(categoriaNombre) + "</td>" +
                "<td>$" + Number(producto.precio).toLocaleString("es-MX", { minimumFractionDigits: 2 }) + "</td>" +
                "<td>" + tallasHTML + "</td>" +
                "<td>" + stockTotal + " unidad" + (stockTotal !== 1 ? 'es' : '') + "</td>" +
                '<td><span class="badge-stock ' + badgeClass + '">' + badgeText + "</span></td>";
            tableBody.appendChild(tr);
        });
    }

    function filtrarProductos() {
        if (!searchInput || !filterCategory) return;

        var textoBusqueda = searchInput.value.toLowerCase().trim();
        var categoriaSeleccionada = filterCategory.value;

        var filtrados = todosLosProductos.filter(function(p) {
            var nombreMatch = p.nombre.toLowerCase().includes(textoBusqueda) || (p.marca || "").toLowerCase().includes(textoBusqueda);
            var categoriaNombre = p.categoria ? p.categoria.nombre.toLowerCase() : "";
            var catMatch = categoriaSeleccionada === "all" || categoriaNombre.includes(categoriaSeleccionada);
            return nombreMatch && catMatch;
        });

        renderizarProductos(filtrados);
    }

    if (searchInput) searchInput.addEventListener("input", filtrarProductos);
    if (filterCategory) filterCategory.addEventListener("change", filtrarProductos);

    function escapeHtml(text) {
        var div = document.createElement("div");
        div.appendChild(document.createTextNode(text));
        return div.innerHTML;
    }
});
