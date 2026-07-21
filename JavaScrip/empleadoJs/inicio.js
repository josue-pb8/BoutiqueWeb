if (!localStorage.getItem('token') || !['ADMIN','EMPLEADO'].includes(localStorage.getItem('rol'))) { window.location.href = '../../index.html'; }
document.addEventListener("DOMContentLoaded", () => {
    console.log("Módulo de Inicio de Bella Boutique inicializado.");
//copiar en to
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

    cargarEstadisticas();
    cargarVentasRecientes();        

    // Saludo dinámico
    const titulo = document.querySelector(".welcome-text h1");
    if (titulo) {
        const usuario = getUsuario();
        const nombre = usuario ? (usuario.nombre || "Empleado") : "Empleado";
        const hora = new Date().getHours();
        let saludo = "Buenas tardes";
        if (hora >= 5 && hora < 12) saludo = "Buenos días";
        else if (hora >= 12 && hora < 19) saludo = "Buenas tardes";
        else saludo = "Buenas noches";
        titulo.textContent = saludo + ", " + nombre + "!";
    }

    // Modal corte de caja
    const modalCorte = document.getElementById("modalCorte");
    const modalCorteClose = document.getElementById("modalCorteClose");
    const modalCorteCancelar = document.getElementById("modalCorteCancelar");
    const modalCorteConfirmar = document.getElementById("modalCorteConfirmar");
    const btnCorte = document.getElementById("btnCorte");

    function abrirModalCorte() {
        if (!modalCorte) return;
        modalCorte.classList.add("active");
    }

    function cerrarModalCorte() {
        if (!modalCorte) return;
        modalCorte.classList.remove("active");
    }

    if (modalCorteClose) modalCorteClose.addEventListener("click", cerrarModalCorte);
    if (modalCorteCancelar) modalCorteCancelar.addEventListener("click", cerrarModalCorte);
    if (modalCorte) {
        modalCorte.addEventListener("click", (e) => {
            if (e.target === modalCorte) cerrarModalCorte();
        });
    }

    document.addEventListener("keydown", (e) => {
        if (!modalCorte || !modalCorte.classList.contains("active")) return;
        if (e.key === "Escape") cerrarModalCorte();
        if (e.key === "Enter") {
            e.preventDefault();
            confirmarCorte();
        }
    });

    function obtenerFechaHoy() {
        var d = new Date();
        return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    }

    function obtenerCorteDeHoy() {
        try {
            var corte = JSON.parse(localStorage.getItem("corteDeHoy"));
            if (!corte) return null;
            if (corte.fecha === obtenerFechaHoy()) return corte;
            localStorage.removeItem("corteDeHoy");
            return null;
        } catch (e) {
            return null;
        }
    }

    function guardarCorte(datos) {
        var cortes = [];
        try {
            cortes = JSON.parse(localStorage.getItem("cortesCaja")) || [];
        } catch (e) {
            cortes = [];
        }
        cortes.push(datos);
        localStorage.setItem("cortesCaja", JSON.stringify(cortes));
        localStorage.setItem("corteDeHoy", JSON.stringify(datos));
    }

    function formatoHora(fecha) {
        var h = fecha.getHours();
        var m = String(fecha.getMinutes()).padStart(2, "0");
        var s = String(fecha.getSeconds()).padStart(2, "0");
        var ampm = h >= 12 ? "PM" : "AM";
        h = h % 12;
        if (h === 0) h = 12;
        return h + ":" + m + ":" + s + " " + ampm;
    }

    function actualizarEstadoCorte() {
        var badge = document.getElementById("badgeCorte");
        var badgeTexto = document.getElementById("badgeCorteTexto");
        var subtitle = document.getElementById("corteSubtitle");
        var corteInfo = document.getElementById("corteCompletadoInfo");
        var corteInfoTexto = document.getElementById("corteCompletadoTexto");

        var corte = obtenerCorteDeHoy();

        if (corte) {
            if (badge) badge.classList.add("badge-completado");
            if (badgeTexto) badgeTexto.textContent = "Jornada finalizada";
            if (subtitle) subtitle.textContent = "Tu jornada de hoy ya fue cerrada.";
            if (corteInfo) {
                corteInfo.style.display = "flex";
                corteInfoTexto.textContent = "Corte realizado a las " + corte.hora + " - " + corte.fecha;
            }
            if (btnCorte) {
                btnCorte.disabled = true;
                btnCorte.style.opacity = "0.5";
                btnCorte.style.cursor = "not-allowed";
                btnCorte.innerHTML = '<i class="fa-solid fa-check"></i> Corte de caja realizado';
            }
        } else {
            if (badge) badge.classList.remove("badge-completado");
            if (badgeTexto) badgeTexto.textContent = "Jornada activa";
            if (subtitle) subtitle.textContent = "Finaliza tu jornada registrando tu corte de caja.";
            if (corteInfo) corteInfo.style.display = "none";
            if (btnCorte) {
                btnCorte.disabled = false;
                btnCorte.style.opacity = "1";
                btnCorte.style.cursor = "pointer";
                btnCorte.innerHTML = '<i class="fa-solid fa-lock"></i> Realizar corte de caja';
            }
        }
    }

    function confirmarCorte() {
        var ahora = new Date();
        var totalVentas = parseFloat(document.getElementById("kpi-ventas") ? document.getElementById("kpi-ventas").textContent.replace(/[$,]/g, '') : 0) || 0;
        var datos = {
            fecha: obtenerFechaHoy(),
            hora: formatoHora(ahora),
            totalVentas: totalVentas,
            efectivo: totalVentas,
            diferencia: 0.00,
            empleado: user ? user.nombreUsuario : "Empleado"
        };

        guardarCorte(datos);

        var modalBody = document.querySelector("#modalCorte .modal-body");
        var modalFooter = document.querySelector("#modalCorte .modal-footer");
        if (modalBody) {
            modalBody.innerHTML =
                '<div class="corte-exito">' +
                    '<i class="fa-solid fa-circle-check"></i>' +
                    '<h3>\u00A1Jornada finalizada!</h3>' +
                    '<p>Corte de caja registrado exitosamente.</p>' +
                    '<p class="corte-exito-hora">' + datos.hora + '</p>' +
                '</div>';
        }
        if (modalFooter) modalFooter.style.display = "none";

        setTimeout(function() {
            cerrarModalCorte();
            actualizarEstadoCorte();
            var modalBody2 = document.querySelector("#modalCorte .modal-body");
            var modalFooter2 = document.querySelector("#modalCorte .modal-footer");
            if (modalBody2) {
                modalBody2.innerHTML =
                    '<div class="corte-resumen-modal">' +
                        '<div class="detail-row"><span>Total ventas (sistema)</span><strong>$' + datos.totalVentas.toLocaleString("es-MX", { minimumFractionDigits: 2 }) + '</strong></div>' +
                        '<div class="detail-row"><span>Efectivo en sistema</span><strong>$' + datos.efectivo.toLocaleString("es-MX", { minimumFractionDigits: 2 }) + '</strong></div>' +
                        '<div class="detail-row total-row">' +
                            '<strong>Diferencia por cuadrar</strong>' +
                            '<strong id="diferenciaCorte">$' + datos.diferencia.toLocaleString("es-MX", { minimumFractionDigits: 2 }) + '</strong>' +
                        '</div>' +
                    '</div>';
            }
            if (modalFooter2) {
                modalFooter2.style.display = "flex";
                modalFooter2.innerHTML =
                    '<button class="btn-modal btn-modal-cancel" id="modalCorteCancelar">Cerrar</button>';
                document.getElementById("modalCorteCancelar").addEventListener("click", cerrarModalCorte);
            }
        }, 2500);
    }

    if (modalCorteConfirmar) modalCorteConfirmar.addEventListener("click", confirmarCorte);

    if (btnCorte) {
        btnCorte.addEventListener("click", function() {
            if (btnCorte.disabled) return;
            abrirModalCorte();
        });
    }

    actualizarEstadoCorte();

    // Notas de actividad del día
    const dailyNotes = document.getElementById("dailyNotes");
    const btnSaveNotes = document.getElementById("btnSaveNotes");
    const notesStatus = document.getElementById("notesStatus");

    if (dailyNotes) {
        const notasGuardadas = localStorage.getItem("notasActividadHoy");
        if (notasGuardadas) dailyNotes.value = notasGuardadas;
    }

    if (btnSaveNotes && dailyNotes && notesStatus) {
        btnSaveNotes.addEventListener("click", () => {
            localStorage.setItem("notasActividadHoy", dailyNotes.value);
            notesStatus.textContent = "Notas guardadas.";
            setTimeout(() => { notesStatus.textContent = ""; }, 2000);
        });
    }

    document.querySelectorAll(".link-view-all").forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            window.location.href = "ventas.html";
        });
    });

    const reminderItems = document.querySelectorAll(".reminder-item");
    if (reminderItems[0]) {
        reminderItems[0].style.cursor = "pointer";
        reminderItems[0].addEventListener("click", () => {
            window.location.href = "apartados.html";
        });
    }
    if (reminderItems[1]) {
        reminderItems[1].style.cursor = "pointer";
        reminderItems[1].addEventListener("click", () => {
            window.location.href = "producto.html";
        });
    }

    const globalSearch = document.querySelector(".search-bar input");
    if (globalSearch) {
        globalSearch.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                const query = e.target.value.toLowerCase().trim();
                if (!query) return;
                if (query.includes("venta")) window.location.href = "ventas.html";
                else if (query.includes("producto") || query.includes("prenda") || query.includes("ropa")) window.location.href = "producto.html";
                else if (query.includes("cliente")) window.location.href = "clientes.html";
                else if (query.includes("carrito") || query.includes("apartado")) window.location.href = "apartados.html";
            }
        });
    }
});

function cargarEstadisticas() {
    const kpiValues = document.querySelectorAll(".kpi-value");
    const kpiSubs = document.querySelectorAll(".kpi-sub");

    // KPI 0: Ventas semanales
    apiGet("/estadisticas/ventas-semanales").then(function(data) {
        if (kpiValues[0]) kpiValues[0].textContent = "$" + Number(data.montoTotal || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 });
        if (kpiSubs[0]) kpiSubs[0].textContent = (data.total || 0) + " ventas esta semana";
    }).catch(function() {});

    // KPI 1: Total vendidos
    apiGet("/estadisticas/ganancias").then(function(data) {
        if (kpiValues[1]) kpiValues[1].textContent = data.totalVentas || 0;
        if (kpiSubs[1]) kpiSubs[1].textContent = "Unidades vendidas (total)";
    }).catch(function() {});

    // KPI 2: Clientes nuevos
    apiGet("/estadisticas/clientes-nuevos").then(function(data) {
        if (kpiValues[2]) kpiValues[2].textContent = data.total || 0;
        if (kpiSubs[2]) kpiSubs[2].textContent = "Clientes nuevos este mes";
    }).catch(function() {});

    // KPI 3: Apartados activos
    apiGet("/estadisticas/apartados-activos").then(function(data) {
        if (kpiValues[3]) kpiValues[3].textContent = data.total || 0;
        if (kpiSubs[3]) kpiSubs[3].textContent = "Apartados activos";
        // Recordatorio
        var reminderTexts = document.querySelectorAll(".reminder-text strong");
        if (reminderTexts[0] && data.total !== undefined) {
            reminderTexts[0].textContent = "Tienes " + data.total + " apartados pendientes de pago";
        }
    }).catch(function() {});
}

function cargarVentasRecientes() {
    var tbody = document.querySelector(".card-table tbody");
    if (!tbody) return;

    apiGet("/estadisticas/ventas-recientes").then(function(ventas) {
        if (!ventas || ventas.length === 0) return;
        tbody.innerHTML = "";

        ventas.slice(0, 5).forEach(function(venta) {
            var tr = document.createElement("tr");
            var total = Number(venta.total || 0);
            tr.innerHTML =
                "<td>" + escapeHtml(venta.fecha || "") + "</td>" +
                "<td>" + escapeHtml(venta.cliente || "Sin cliente") + "</td>" +
                "<td>" + escapeHtml(venta.productos || "") + "</td>" +
                "<td><strong>$" + total.toLocaleString("es-MX", { minimumFractionDigits: 2 }) + "</strong></td>" +
                '<td><span class="badge-pay ' + (venta.metodoPago || 'efectivo') + '">' + escapeHtml(venta.metodoPago || 'Efectivo') + '</span></td>' +
                '<td><span class="badge-state ' + (venta.estado || 'completa') + '">' + escapeHtml(venta.estado || 'Completada') + '</span></td>';
            tbody.appendChild(tr);
        });
    }).catch(function() {});
}

function escapeHtml(text) {
    var div = document.createElement("div");
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
}
