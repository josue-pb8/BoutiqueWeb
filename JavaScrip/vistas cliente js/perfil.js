var clienteTelefono = '';

document.addEventListener('DOMContentLoaded', () => {
 try {
 let user = JSON.parse(localStorage.getItem('usuario'));
    if (user) {
        var nameElCliPerfil = document.getElementsByClassName("user-name")[0];
        if (nameElCliPerfil) nameElCliPerfil.innerHTML = user.nombreUsuario;
        var avatarElCliPerfil = document.getElementsByClassName("avatar-placeholder")[0];
        if (avatarElCliPerfil) avatarElCliPerfil.innerHTML = user.nombreUsuario.charAt(0).toUpperCase();
    }
 } catch(e) {}
    cargarPerfil();
    configurarEdicion();
    configurarPassword();
    configurarBusqueda();
});
    

function cargarPerfil() {
    var clienteId = getClienteId();
    apiGet("/clientes/" + clienteId).then(function(cliente) {
        if (!cliente) return;

        var nombreCompleto = (cliente.nombre || '') + ' ' + (cliente.apellido || '');
        var inputNombre = document.getElementById('input-nombre');
        var inputEmail = document.getElementById('input-email');
        var displayName = document.getElementById('profile-display-name');
        var avatar = document.querySelector('.profile-avatar');
        var headerAvatar = document.querySelector('.avatar-placeholder');
        var userName = document.querySelector('.user-name');

        if (inputNombre) inputNombre.value = nombreCompleto.trim();
        if (inputEmail) inputEmail.value = cliente.email || '';
        clienteTelefono = cliente.telefono || '';
        if (displayName) displayName.textContent = nombreCompleto.trim();

        var iniciales = ((cliente.nombre || '')[0] || '') + ((cliente.apellido || '')[0] || '');
        if (avatar) avatar.textContent = iniciales.toUpperCase();
        if (headerAvatar) headerAvatar.textContent = iniciales.toUpperCase();
        if (userName) userName.textContent = nombreCompleto.trim();

        if (inputNombre) inputNombre.setAttribute('data-original', inputNombre.value);
        if (inputEmail) inputEmail.setAttribute('data-original', inputEmail.value);
    }).catch(function(err) {
        console.error("Error cargando perfil:", err);
    });
}

function configurarEdicion() {
    var btnEdit = document.getElementById('btn-edit');
    var btnSave = document.getElementById('btn-save');
    var btnCancel = document.getElementById('btn-cancel');
    var actions = document.getElementById('profile-actions');

    var inputs = [
        document.getElementById('input-nombre'),
        document.getElementById('input-email')
    ];

    var valoresOriginales = inputs.map(function(i) { return i ? i.value : ''; });

    if (btnEdit) {
        btnEdit.addEventListener('click', function() {
            inputs.forEach(function(i) { if (i) i.disabled = false; });
            if (actions) actions.style.display = 'flex';
            if (btnEdit) btnEdit.style.display = 'none';
        });
    }

    if (btnCancel) {
        btnCancel.addEventListener('click', function() {
            inputs.forEach(function(input) {
                if (input) {
                    input.value = input.getAttribute('data-original') || '';
                    input.disabled = true;
                }
            });
            if (actions) actions.style.display = 'none';
            if (btnEdit) btnEdit.style.display = 'block';
        });
    }

    if (btnSave) {
        btnSave.addEventListener('click', function() {
            var inputNombre = document.getElementById('input-nombre');
            var inputEmail = document.getElementById('input-email');

            var nombre = inputNombre ? inputNombre.value.trim() : '';
            var email = inputEmail ? inputEmail.value.trim() : '';

            if (!nombre || !email) {
                alert('Por favor, completa al menos el nombre y el correo.');
                return;
            }

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                alert('Correo electronico invalido.');
                return;
            }

            var partes = nombre.split(' ');
            var nombreP = partes[0] || '';
            var apellido = partes.slice(1).join(' ') || '';

            var clienteId = getClienteId();
            var payload = {
                nombre: nombreP,
                apellido: apellido,
                email: email,
                telefono: clienteTelefono
            };

            apiPut("/clientes/" + clienteId, payload).then(function(cliente) {
                var displayName = document.getElementById('profile-display-name');
                var userName = document.querySelector('.user-name');
                if (displayName) displayName.textContent = nombre;
                if (userName) userName.textContent = nombre;

                var avatar = document.querySelector('.profile-avatar');
                var headerAvatar = document.querySelector('.avatar-placeholder');
                var iniciales = nombre.split(' ').filter(function(p) { return p.length > 0; }).map(function(p) { return p[0]; }).join('').substring(0, 2).toUpperCase();
                if (avatar) avatar.textContent = iniciales;
                if (headerAvatar) headerAvatar.textContent = iniciales;

                inputs.forEach(function(input) { if (input) { input.disabled = true; input.setAttribute('data-original', input.value); } });
                if (actions) actions.style.display = 'none';
                if (btnEdit) btnEdit.style.display = 'block';

                alert('Perfil actualizado con exito.');
            }).catch(function(err) {
                alert('Error al actualizar: ' + (err.error || 'Intenta de nuevo.'));
            });
        });
    }
}

function configurarPassword() {
    var inputPassActual = document.getElementById('input-password-actual');
    var inputPassNueva = document.getElementById('input-password-nueva');
    var passwordActions = document.getElementById('password-actions');
    var btnSavePass = document.getElementById('btn-save-password');
    var btnCancelPass = document.getElementById('btn-cancel-password');
    var btnEditPass = document.getElementById('btn-edit-password');

    if (!inputPassActual || !inputPassNueva) return;

    if (btnEditPass) {
        btnEditPass.addEventListener('click', function() {
            inputPassActual.disabled = false;
            inputPassNueva.disabled = false;
            if (passwordActions) passwordActions.style.display = 'flex';
            if (btnEditPass) btnEditPass.style.display = 'none';
        });
    }

    if (btnCancelPass) {
        btnCancelPass.addEventListener('click', function() {
            inputPassActual.value = '';
            inputPassNueva.value = '';
            inputPassActual.disabled = true;
            inputPassNueva.disabled = true;
            if (passwordActions) passwordActions.style.display = 'none';
            if (btnEditPass) btnEditPass.style.display = 'block';
        });
    }

    if (btnSavePass) {
        btnSavePass.addEventListener('click', function() {
            var actual = inputPassActual.value;
            var nueva = inputPassNueva.value;

            if (!actual) {
                alert('Debes ingresar tu contraseña actual.');
                return;
            }

            if (!nueva) {
                alert('Debes ingresar la nueva contraseña.');
                return;
            }

            if (nueva.length < 6) {
                alert('La nueva contraseña debe tener al menos 6 caracteres.');
                return;
            }

            var clienteId = getClienteId();
            var payload = {
                contrasenaActual: actual,
                contrasenaNueva: nueva
            };

            apiPut("/clientes/" + clienteId + "/contrasena", payload).then(function() {
                alert('Contraseña actualizada con exito.');
                inputPassActual.value = '';
                inputPassNueva.value = '';
                inputPassActual.disabled = true;
                inputPassNueva.disabled = true;
                if (passwordActions) passwordActions.style.display = 'none';
                if (btnEditPass) btnEditPass.style.display = 'block';
            }).catch(function(err) {
                alert('Error al cambiar contraseña: ' + (err.error || 'Verifica tu contraseña actual e intenta de nuevo.'));
            });
        });
    }
}

function toggleSidebar() {
    var sidebar = document.querySelector('.sidebar');
    if (sidebar) sidebar.classList.toggle('collapsed');
}

window.togglePassword = function(inputId, btn) {
    var input = document.getElementById(inputId);
    if (!input) return;
    var icon = btn.querySelector('.material-symbols-outlined');
    if (input.type === 'password') {
        input.type = 'text';
        icon.textContent = 'visibility_off';
    } else {
        input.type = 'password';
        icon.textContent = 'visibility';
    }
};

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
