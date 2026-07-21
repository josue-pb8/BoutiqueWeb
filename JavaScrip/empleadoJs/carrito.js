if (!localStorage.getItem('token') || !['ADMIN','EMPLEADO'].includes(localStorage.getItem('rol'))) { window.location.href = '../../index.html'; }
document.addEventListener("DOMContentLoaded", () => {
    console.log("Modulo de Apartados de Bella Boutique inicializado.");

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

    var searchInput = document.getElementById("searchApartado");
    var tableBody = document.getElementById("apartadosTableBody");

    var modal = document.getElementById("modalAbonar");
    var modalClose = document.getElementById("modalClose");
    var modalCancelar = document.getElementById("modalCancelar");
    var modalConfirmar = document.getElementById("modalConfirmar");
    var modalSaldoTotal = document.getElementById("modalSaldoTotal");
    var modalMonto = document.getElementById("modalMonto");
    var modalError = document.getElementById("modalError");
    

    if (!modal || !modalMonto || !modalError || !modalConfirmar) return;

    var saldoActual = 0;
    var apartadoIdActual = null;
    var todosLosApartados = [];
    

    cargarApartados();

    function cargarApartados() {
        apiGet("/apartados").then(function(apartados) {
            if (!apartados) return;
            todosLosApartados = apartados;
            renderizarApartados(apartados);
        }).catch(function(err) {
            console.error("Error cargando apartados:", err);
        });
    }

    function renderizarApartados(apartados) {
        if (!tableBody) return;
        tableBody.innerHTML = "";

        if (apartados.length === 0) {
            var trEmpty = document.createElement("tr");
            trEmpty.innerHTML = '<td colspan="6" style="text-align:center; padding:30px; color:#94a3b8;">No hay apartados registrados.</td>';
            tableBody.appendChild(trEmpty);
            return;
        }

        apartados.forEach(function(apartado) {
            var cliente = apartado.cliente;
            var nombreCliente = cliente ? (cliente.nombre + " " + cliente.apellido) : "Sin cliente";
            var total = Number(apartado.total || 0);
            var abonado = Number(apartado.abonado || 0);
            var pendiente = total - abonado;
            var estado = apartado.estado || "ACTIVO";

            var saldoHTML = "";
            var accionHTML = "";

            if (estado === "ACTIVO" && pendiente > 0) {
                saldoHTML = "<strong>$" + pendiente.toFixed(2) + "</strong>";
                accionHTML = '<button class="btn-abonar" data-apartado-id="' + apartado.id + '" data-remaining="' + pendiente + '"><i class="fa-solid fa-dollar-sign"></i> Abonar</button>';
            } else {
                saldoHTML = '<span style="color: #16a34a; font-weight: bold;">Liquidado</span>';
                accionHTML = '<span style="color:#16a34a;"><i class="fa-solid fa-square-check"></i> Entregado</span>';
            }

            var tr = document.createElement("tr");
            tr.innerHTML =
                "<td><strong>#APT-" + String(apartado.id).padStart(3, "0") + "</strong></td>" +
                "<td>" + escapeHtml(nombreCliente) + "</td>" +
                "<td>$" + total.toFixed(2) + "</td>" +
                '<td class="status-saldo">' + saldoHTML + "</td>" +
                "<td>" + formatFecha(apartado.fechaApartado) + "</td>" +
                "<td>" + accionHTML + "</td>";
            tableBody.appendChild(tr);
        });

        document.querySelectorAll(".btn-abonar").forEach(function(button) {
            button.addEventListener("click", function(e) {
                var btn = e.target.closest(".btn-abonar");
                if (!btn) return;
                var saldoRestante = parseFloat(btn.getAttribute("data-remaining"));
                var id = parseInt(btn.getAttribute("data-apartado-id"));
                if (isNaN(saldoRestante) || saldoRestante <= 0) return;
                apartadoIdActual = id;
                abrirModal(saldoRestante);
            });
        });
    }

    function formatFecha(fecha) {
        if (!fecha) return "N/A";
        try {
            if (Array.isArray(fecha)) {
                return fecha[2] + "/" + String(fecha[1]).padStart(2, "0") + "/" + fecha[0];
            }
            return new Date(fecha).toLocaleDateString("es-MX");
        } catch (e) {
            return "N/A";
        }
    }

    function escapeHtml(text) {
        var div = document.createElement("div");
        div.appendChild(document.createTextNode(text));
        return div.innerHTML;
    }

    function abrirModal(saldo) {
        saldoActual = saldo;
        modalSaldoTotal.textContent = "$" + saldo.toFixed(2);
        modalMonto.value = "";
        modalMonto.max = saldo;
        modalError.textContent = "";
        modal.classList.add("active");
        modalMonto.focus();
    }

    function cerrarModal() {
        modal.classList.remove("active");
        saldoActual = 0;
        apartadoIdActual = null;
    }

    function confirmarPago() {
        var montoStr = modalMonto.value.trim();
        var abonoNum = parseFloat(montoStr);

        if (montoStr === "" || isNaN(abonoNum) || abonoNum <= 0) {
            modalError.textContent = "Ingresa un monto valido mayor a $0.";
            return;
        }

        if (abonoNum > saldoActual) {
            modalError.textContent = "El monto excede el saldo pendiente de $" + saldoActual.toFixed(2) + ".";
            return;
        }

        if (!apartadoIdActual) {
            modalError.textContent = "Error: No se identifico el apartado.";
            return;
        }

        apiPut("/apartados/" + apartadoIdActual + "/abono", { monto: abonoNum }).then(function() {
            cerrarModal();
            cargarApartados();
        }).catch(function(err) {
            modalError.textContent = "Error: " + (err.error || "No se pudo registrar el abono.");
        });
    }

    if (modalClose) modalClose.addEventListener("click", cerrarModal);
    if (modalCancelar) modalCancelar.addEventListener("click", cerrarModal);
    modal.addEventListener("click", function(e) {
        if (e.target === modal) cerrarModal();
    });

    document.addEventListener("keydown", function(e) {
        if (!modal.classList.contains("active")) return;
        if (e.key === "Escape") cerrarModal();
        if (e.key === "Enter") {
            e.preventDefault();
            confirmarPago();
        }
    });

    modalConfirmar.addEventListener("click", confirmarPago);

    modalMonto.addEventListener("input", function() {
        modalError.textContent = "";
    });

    if (searchInput) {
        searchInput.addEventListener("input", function(e) {
            var query = e.target.value.toLowerCase().trim();
            if (!query) {
                renderizarApartados(todosLosApartados);
                return;
            }
            var filtrados = todosLosApartados.filter(function(a) {
                var nombreCliente = a.cliente ? (a.cliente.nombre + " " + a.cliente.apellido).toLowerCase() : "";
                return nombreCliente.includes(query) || String(a.id).includes(query);
            });
            renderizarApartados(filtrados);
        });
    }
});
