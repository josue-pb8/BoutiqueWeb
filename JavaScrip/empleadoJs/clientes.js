if (!localStorage.getItem('token') || !['ADMIN','EMPLEADO'].includes(localStorage.getItem('rol'))) { window.location.href = '../../index.html'; }
document.addEventListener("DOMContentLoaded", () => {
    console.log("Modulo de Clientes de Bella Boutique cargado.");

    var formCliente = document.getElementById("formCliente");
    var tablaClientes = document.getElementById("clientesTableBody");
    var searchInput = document.getElementById("searchCliente");
    var inputNombre = document.getElementById("nombreCliente");
    var inputTelefono = document.getElementById("telefonoCliente");
    var inputCorreo = document.getElementById("correoCliente");
    var todosLosClientes = [];

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

    if (!formCliente || !tablaClientes || !inputNombre || !inputTelefono || !inputCorreo) return;

    cargarClientes();

    function cargarClientes() {
        apiGet("/clientes").then(function(clientes) {
            if (!clientes) return;
            todosLosClientes = clientes;
            renderizarClientes(clientes);
        }).catch(function(err) {
            console.error("Error cargando clientes:", err);
        });
    }

    function renderizarClientes(clientes) {
        tablaClientes.innerHTML = "";
        clientes.forEach(function(cliente) {
            var iniciales = ((cliente.nombre || "")[0] || "") + ((cliente.apellido || "")[0] || "");
            var tr = document.createElement("tr");
            tr.innerHTML =
                '<td><strong>#CLI-' + String(cliente.id).padStart(3, "0") + "</strong></td>" +
                '<td>' +
                    '<div class="cliente-cell">' +
                        '<div class="cliente-avatar-placeholder">' + escapeHtml(iniciales.toUpperCase()) + "</div>" +
                        "<strong>" + escapeHtml((cliente.nombre || "") + " " + (cliente.apellido || "")) + "</strong>" +
                    "</div>" +
                "</td>" +
                "<td>" + escapeHtml(cliente.telefono || "Sin telefono") + "</td>" +
                "<td>" + escapeHtml(cliente.email || "Sin correo") + "</td>" +
                "<td>" + formatFecha(cliente.fechaRegistro) + "</td>";
            tablaClientes.appendChild(tr);
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

    function mostrarError(input, mensaje) {
        limpiarError(input);
        input.classList.add("input-error");
        input.classList.remove("input-success");
        var div = document.createElement("div");
        div.className = "error-message";
        div.textContent = mensaje;
        input.parentElement.appendChild(div);
    }

    function limpiarError(input) {
        input.classList.remove("input-error", "input-success");
        var parent = input.parentElement;
        var msg = parent.querySelector(".error-message");
        if (msg) msg.remove();
    }

    function marcarValido(input) {
        limpiarError(input);
        input.classList.add("input-success");
    }

    function escapeHtml(text) {
        var div = document.createElement("div");
        div.appendChild(document.createTextNode(text));
        return div.innerHTML;
    }

    function validarNombre(valor) {
        var limpio = valor.trim();
        if (limpio === "") return "El nombre es obligatorio.";
        if (limpio.length < 3) return "El nombre debe tener al menos 3 caracteres.";
        if (limpio.length > 100) return "El nombre no puede exceder 100 caracteres.";
        if (!/^[a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+$/.test(limpio)) return "El nombre solo debe contener letras y espacios.";
        return null;
    }

    function validarTelefono(valor) {
        var limpio = valor.trim();
        if (limpio === "") return "El telefono es obligatorio.";
        if (!/^\d+$/.test(limpio)) return "El telefono solo debe contener numeros.";
        if (limpio.length < 10) return "El telefono debe tener al menos 10 digitos.";
        if (limpio.length > 15) return "El telefono no puede exceder 15 digitos.";
        return null;
    }

    function validarCorreo(valor) {
        var limpio = valor.trim();
        if (limpio === "") return null;
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(limpio)) return "El correo electronico no tiene un formato valido.";
        if (limpio.length > 100) return "El correo no puede exceder 100 caracteres.";
        return null;
    }

    inputNombre.addEventListener("blur", function() {
        var err = validarNombre(inputNombre.value);
        if (err) mostrarError(inputNombre, err);
        else marcarValido(inputNombre);
    });

    inputNombre.addEventListener("input", function() {
        if (inputNombre.classList.contains("input-error")) {
            var err = validarNombre(inputNombre.value);
            if (!err) marcarValido(inputNombre);
        }
    });

    inputTelefono.addEventListener("blur", function() {
        var err = validarTelefono(inputTelefono.value);
        if (err) mostrarError(inputTelefono, err);
        else marcarValido(inputTelefono);
    });

    inputTelefono.addEventListener("input", function() {
        if (inputTelefono.classList.contains("input-error")) {
            var err = validarTelefono(inputTelefono.value);
            if (!err) marcarValido(inputTelefono);
        }
    });

    inputCorreo.addEventListener("blur", function() {
        var err = validarCorreo(inputCorreo.value);
        if (err) mostrarError(inputCorreo, err);
        else if (inputCorreo.value.trim() !== "") marcarValido(inputCorreo);
        else limpiarError(inputCorreo);
    });

    inputCorreo.addEventListener("input", function() {
        if (inputCorreo.classList.contains("input-error")) {
            var err = validarCorreo(inputCorreo.value);
            if (!err) marcarValido(inputCorreo);
        }
    });

    formCliente.addEventListener("submit", function(e) {
        e.preventDefault();

        var errNombre = validarNombre(inputNombre.value);
        var errTelefono = validarTelefono(inputTelefono.value);
        var errCorreo = validarCorreo(inputCorreo.value);

        var hayErrores = false;
        if (errNombre) { mostrarError(inputNombre, errNombre); hayErrores = true; }
        if (errTelefono) { mostrarError(inputTelefono, errTelefono); hayErrores = true; }
        if (errCorreo) { mostrarError(inputCorreo, errCorreo); hayErrores = true; }
        if (hayErrores) return;

        var nombre = inputNombre.value.trim();
        var telefono = inputTelefono.value.trim();
        var correo = inputCorreo.value.trim();
        var partes = nombre.split(" ");
        var nombreP = partes[0] || "";
        var apellido = partes.slice(1).join(" ") || "";

        var payload = {
            nombreUsuario: correo || telefono,
            contrasena: telefono,
            nombre: nombreP,
            apellido: apellido,
            email: correo,
            telefono: telefono,
            perfil: '3'
        };

        apiPost("/clientes", payload).then(function(cliente) {
            cargarClientes();
            formCliente.reset();
            inputNombre.classList.remove("input-success");
            inputTelefono.classList.remove("input-success");
            inputCorreo.classList.remove("input-success");

            var msgExito = document.createElement("div");
            msgExito.className = "form-exito";
            msgExito.textContent = "Cliente registrado correctamente.";
            formCliente.appendChild(msgExito);
            setTimeout(function() { msgExito.remove(); }, 3000);
        }).catch(function(err) {
            var msgError = document.createElement("div");
            msgError.className = "ticket-warning";
            msgError.textContent = "Error: " + (err.error || "No se pudo registrar el cliente.");
            formCliente.appendChild(msgError);
            setTimeout(function() { msgError.remove(); }, 4000);
        });
    });

    if (searchInput) {
        searchInput.addEventListener("input", function(e) {
            var valorBusqueda = e.target.value.toLowerCase().trim();
            if (!valorBusqueda) {
                renderizarClientes(todosLosClientes);
                return;
            }
            var filtrados = todosLosClientes.filter(function(c) {
                return (c.nombre || "").toLowerCase().includes(valorBusqueda) ||
                    (c.apellido || "").toLowerCase().includes(valorBusqueda) ||
                    (c.email || "").toLowerCase().includes(valorBusqueda) ||
                    (c.telefono || "").includes(valorBusqueda);
            });
            renderizarClientes(filtrados);
        });
    }
});
