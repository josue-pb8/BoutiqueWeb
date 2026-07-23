if (!localStorage.getItem('token') || !['ADMIN','EMPLEADO'].includes(localStorage.getItem('rol'))) { window.location.href = '../../index.html'; }
document.addEventListener("DOMContentLoaded", () => {
    var container = document.getElementById("ticketItemsContainer");
    var subtotalText = document.getElementById("subtotalVal");
    var totalText = document.getElementById("totalVal");
    var salesSearch = document.getElementById("salesSearch");
    var quickProducts = document.getElementById("quickProducts");
    var btnCompleteSale = document.getElementById("btnCompleteSale");
    var totalAcumulado = 0;
    var ticketItems = [];

    try {
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
    } catch(e) { window.location.href = '../../index.html'; return; }

    // Modal confirmar venta
    var modalVenta = document.getElementById("modalConfirmarVenta");
    var modalVentaClose = document.getElementById("modalVentaClose");
    var modalVentaCancelar = document.getElementById("modalVentaCancelar");
    var modalVentaConfirmar = document.getElementById("modalVentaConfirmar");
    var modalVentaTotal = document.getElementById("modalVentaTotal");
    var modalVentaMetodo = document.getElementById("modalVentaMetodo");

    function abrirModalVenta() {
        if (!modalVenta) return;
        modalVentaTotal.textContent = "$" + totalAcumulado.toFixed(2);
        modalVentaMetodo.textContent = "Efectivo";
        modalVenta.classList.add("active");
    }

    function cerrarModalVenta() {
        if (!modalVenta) return;
        modalVenta.classList.remove("active");
    }

    if (modalVentaClose) modalVentaClose.addEventListener("click", cerrarModalVenta);
    if (modalVentaCancelar) modalVentaCancelar.addEventListener("click", cerrarModalVenta);
    if (modalVenta) {
        modalVenta.addEventListener("click", function(e) {
            if (e.target === modalVenta) cerrarModalVenta();
        });
    }

    // Mapa de stock por producto ID
    var stockPorProducto = {};

    // Cargar productos e inventario desde la API
    Promise.all([
        apiGet("/productos"),
        apiGet("/inventario")
    ]).then(function(resultados) {
        var productos = resultados[0];
        var inventario = resultados[1];

        if (inventario && Array.isArray(inventario)) {
            inventario.forEach(function(item) {
                if (!item.producto || !item.producto.id) return;
                var pid = item.producto.id;
                if (!stockPorProducto[pid]) stockPorProducto[pid] = 0;
                stockPorProducto[pid] += (item.stock || 0);
            });
        }

        if (!productos || !quickProducts) return;

        var activos = productos.filter(function(p) { return p.activo !== false; });
        if (activos.length === 0) return;

        quickProducts.innerHTML = "";

        activos.forEach(function(producto) {
            var stock = stockPorProducto[producto.id] || 10;
            var agotado = stock <= 0;

            var card = document.createElement("div");
            card.className = "product-item-card" + (agotado ? " product-agotado" : "");
            card.setAttribute("data-id", producto.id);
            card.setAttribute("data-name", producto.nombre);
            card.setAttribute("data-price", producto.precio);
            card.setAttribute("data-stock", stock);

            var imgUrl = producto.imagenUrl || "";
            var svgPlaceholder = '<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="80" rx="12" fill="#f1f5f9"/><text x="40" y="45" text-anchor="middle" fill="#94a3b8" font-size="10">Img</text></svg>';

            var stockLabel = agotado
                ? '<span class="stock-badge stock-agotado"><i class="fa-solid fa-ban"></i> Agotado</span>'
                : '<span class="stock-badge"><i class="fa-solid fa-box-open"></i> Stock: ' + stock + '</span>';

            card.innerHTML =
                '<div class="item-image">' + (imgUrl ? '<img src="' + getImagenUrl(escapeHtml(imgUrl)) + '" alt="' + escapeHtml(producto.nombre) + '" style="width:80px;height:80px;object-fit:cover;border-radius:12px;">' : svgPlaceholder) + '</div>' +
                '<div class="item-details">' +
                    '<strong>' + escapeHtml(producto.nombre) + '</strong>' +
                    '<span>$' + Number(producto.precio).toLocaleString("es-MX", { minimumFractionDigits: 2 }) + '</span>' +
                    stockLabel +
                '</div>' +
                '<button class="btn-add-item"' + (agotado ? ' disabled' : '') + '><i class="fa-solid fa-plus"></i></button>';
            quickProducts.appendChild(card);
        });

        document.querySelectorAll(".btn-add-item").forEach(function(button) {
            button.addEventListener("click", function(e) {
                var card = e.target.closest(".product-item-card");
                if (!card) return;
                if (card.classList.contains("product-agotado")) return;

                var id = parseInt(card.getAttribute("data-id"));
                var name = card.getAttribute("data-name");
                var price = parseFloat(card.getAttribute("data-price"));
                var stock = parseInt(card.getAttribute("data-stock")) || 0;
                if (isNaN(price) || price <= 0) return;

                var emptyMsg = container.querySelector(".empty-ticket-msg");
                if (emptyMsg) emptyMsg.remove();

                var warningMsg = container.parentElement.querySelector(".ticket-warning");
                if (warningMsg) warningMsg.remove();

                var existente = ticketItems.find(function(item) { return item.productoId === id; });
                if (existente) {
                    if (existente.cantidad >= stock) {
                        mostrarAdvertenciaStock(name, stock);
                        return;
                    }
                    existente.cantidad += 1;
                } else {
                    if (stock < 1) {
                        mostrarAdvertenciaStock(name, stock);
                        return;
                    }
                    ticketItems.push({ productoId: id, nombre: name, precioUnitario: price, cantidad: 1 });
                }

                renderizarTicket();
            });
        });
    }).catch(function(err) {
        console.error("Error cargando productos:", err);
        document.querySelectorAll(".btn-add-item").forEach(function(button) {
            button.addEventListener("click", function(e) {
                var card = e.target.closest(".product-item-card");
                if (!card) return;
                var id = parseInt(card.getAttribute("data-id"));
                var name = card.getAttribute("data-name");
                var price = parseFloat(card.getAttribute("data-price"));
                if (isNaN(price) || price <= 0) return;
                var emptyMsg = container.querySelector(".empty-ticket-msg");
                if (emptyMsg) emptyMsg.remove();
                var existente = ticketItems.find(function(item) { return item.productoId === id; });
                if (existente) {
                    existente.cantidad += 1;
                } else {
                    ticketItems.push({ productoId: id, nombre: name, precioUnitario: price, cantidad: 1 });
                }
                renderizarTicket();
            });
        });
    });

    function mostrarAdvertenciaStock(nombre, stock) {
        var ticketSection = document.querySelector(".sales-ticket-section");
        var existente = ticketSection.querySelector(".ticket-warning");
        if (existente) existente.remove();

        var warning = document.createElement("div");
        warning.className = "ticket-warning";
        if (stock <= 0) {
            warning.textContent = "No hay stock disponible para: " + nombre;
        } else {
            warning.textContent = "Stock insuficiente para: " + nombre + " (disponible: " + stock + ")";
        }
        ticketSection.querySelector(".ticket-card").appendChild(warning);
        setTimeout(function() { if (warning.parentNode) warning.remove(); }, 3000);
    }

    function renderizarTicket() {
        container.innerHTML = "";

        if (ticketItems.length === 0) {
            container.innerHTML = '<p class="empty-ticket-msg">No hay productos en el carrito.</p>';
            recalcularTotal();
            return;
        }

        ticketItems.forEach(function(item) {
            var row = document.createElement("div");
            row.className = "ticket-item-row";
            row.setAttribute("data-producto-id", item.productoId);

            var subtotalLinea = item.precioUnitario * item.cantidad;

            row.innerHTML =
                '<div class="ticket-item-info">' +
                    '<span class="ticket-item-name">' + escapeHtml(item.nombre) + '</span>' +
                    '<span class="ticket-item-price">$' + subtotalLinea.toFixed(2) + '</span>' +
                '</div>' +
                '<div class="ticket-item-controls">' +
                    '<div class="quantity-controls">' +
                        '<button class="qty-btn" data-id="' + item.productoId + '" data-action="decrease">−</button>' +
                        '<span class="qty-value">' + item.cantidad + '</span>' +
                        '<button class="qty-btn" data-id="' + item.productoId + '" data-action="increase">+</button>' +
                    '</div>' +
                    '<button class="btn-remove-item" data-id="' + item.productoId + '"><i class="fa-solid fa-xmark"></i></button>' +
                '</div>';

            container.appendChild(row);
        });

        container.querySelectorAll(".qty-btn").forEach(function(btn) {
            btn.addEventListener("click", function() {
                var id = parseInt(btn.getAttribute("data-id"));
                var action = btn.getAttribute("data-action");
                var cambio = action === "increase" ? 1 : -1;
                modificarCantidadTicket(id, cambio);
            });
        });

        container.querySelectorAll(".btn-remove-item").forEach(function(btn) {
            btn.addEventListener("click", function() {
                var id = parseInt(btn.getAttribute("data-id"));
                eliminarDelTicket(id);
            });
        });

        recalcularTotal();
    }

    function modificarCantidadTicket(productoId, cambio) {
        var item = ticketItems.find(function(i) { return i.productoId === productoId; });
        if (!item) return;

        var stock = stockPorProducto[productoId] || 0;
        item.cantidad += cambio;
        if (item.cantidad > stock) {
            item.cantidad = stock;
            mostrarAdvertenciaStock(item.nombre, stock);
        }
        if (item.cantidad <= 0) {
            eliminarDelTicket(productoId);
            return;
        }

        renderizarTicket();
    }

    function eliminarDelTicket(productoId) {
        ticketItems = ticketItems.filter(function(i) { return i.productoId !== productoId; });
        renderizarTicket();
    }

    function recalcularTotal() {
        totalAcumulado = 0;
        ticketItems.forEach(function(item) {
            totalAcumulado += item.precioUnitario * item.cantidad;
        });
        subtotalText.textContent = "$" + totalAcumulado.toFixed(2);
        totalText.textContent = "$" + totalAcumulado.toFixed(2);
    }

    // Búsqueda de prendas en tiempo real
    if (salesSearch) {
        salesSearch.addEventListener("input", function(e) {
            var query = e.target.value.toLowerCase().trim();
            document.querySelectorAll(".product-item-card").forEach(function(card) {
                var name = card.getAttribute("data-name").toLowerCase();
                card.style.display = name.includes(query) ? "" : "none";
            });
        });
    }

    // Registrar venta
    btnCompleteSale.addEventListener("click", function() {
        var warningExistente = container.parentElement.querySelector(".ticket-warning");
        if (warningExistente) warningExistente.remove();

        if (totalAcumulado === 0) {
            var warning = document.createElement("div");
            warning.className = "ticket-warning";
            warning.textContent = "Agrega al menos un producto al ticket para continuar.";
            container.parentElement.appendChild(warning);
            return;
        }

        var sinStock = [];
        ticketItems.forEach(function(item) {
            var stock = stockPorProducto[item.productoId] || 0;
            if (item.cantidad > stock) {
                sinStock.push(item.nombre + " (disponible: " + stock + ")");
            }
        });

        if (sinStock.length > 0) {
            var warning = document.createElement("div");
            warning.className = "ticket-warning";
            warning.textContent = "Stock insuficiente para: " + sinStock.join(", ");
            container.parentElement.appendChild(warning);
            return;
        }

        abrirModalVenta();
    });

    function confirmarVenta() {
        cerrarModalVenta();

        var empleadoId = getUsuarioId();
        var ventaPayload = {
            empleadoId: empleadoId,
            metodoPagoId: 1,
            detalles: ticketItems.map(function(item) {
                return {
                    productoId: item.productoId,
                    cantidad: item.cantidad,
                    precioUnitario: item.precioUnitario
                };
            })
        };

        apiPost("/ventas", ventaPayload).then(function(venta) {
            var ticketSection = document.querySelector(".sales-ticket-section");
            var msgExito = document.createElement("div");
            msgExito.className = "form-exito";
            msgExito.style.marginTop = "12px";
            msgExito.style.justifyContent = "center";
            msgExito.textContent = "Venta #" + venta.id + " registrada con exito.";
            ticketSection.querySelector(".ticket-card").appendChild(msgExito);

            btnCompleteSale.disabled = true;
            btnCompleteSale.style.opacity = "0.6";

            setTimeout(function() { location.reload(); }, 2000);
        }).catch(function(err) {
            var ticketSection = document.querySelector(".sales-ticket-section");
            var msgError = document.createElement("div");
            msgError.className = "ticket-warning";
            msgError.textContent = "Error al registrar venta: " + (err.error || "Error desconocido");
            ticketSection.querySelector(".ticket-card").appendChild(msgError);
            setTimeout(function() { msgError.remove(); }, 4000);
        });
    }

    if (modalVentaConfirmar) modalVentaConfirmar.addEventListener("click", confirmarVenta);

    document.addEventListener("keydown", function(e) {
        if (!modalVenta || !modalVenta.classList.contains("active")) return;
        if (e.key === "Escape") cerrarModalVenta();
        if (e.key === "Enter") {
            e.preventDefault();
            confirmarVenta();
        }
    });

    function escapeHtml(text) {
        var div = document.createElement("div");
        div.appendChild(document.createTextNode(text));
        return div.innerHTML;
    }
});
