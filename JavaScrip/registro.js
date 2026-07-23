$(document).ready(function () {

    // 1. Función para cargar los datos en el selector usando GET
    function cargarDatosEnSelector() {
        var $selector = $('#miSelector');

        fetch(API_BASE_URL + '/clientes/roles', {
            method: 'GET',
            headers: { 
                'Content-Type': 'application/json'
            }
        })
        .then(function(response) {
            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor');
            }
            return response.json();
        })
        .then(function(listaDeDatos) {
            $selector.empty();
            $selector.append('<option value="">-- Selecciona una opción --</option>');

            listaDeDatos.forEach(function(item) {
                $selector.append('<option value="' + item.id + '">' + item.nombre + '</option>');
            });

            $('#miSelector').val('3');
            $('#miSelector').prop('disabled', true);
            $('#miSelector').data('forcedRole', '3');
        })
        .catch(function(error) {
            console.error('Hubo un fallo al llenar el selector:', error);
            $selector.empty().append('<option value="">Error al cargar los datos</option>');
        });
    }

    // Ejecutamos la función de inmediato al cargar la página
    cargarDatosEnSelector();

    // 2. Post del registro
    $('#registerForm').on('submit', function (event) {
        event.preventDefault();

        var nombreUsuario = $('#reg-username').val().trim();
        var nombre = $('#reg-name').val().trim();
        var correo = $('#reg-email').val().trim();
        var password = $('#reg-password').val();
        var $respuesta = $('#respuesta');
        var rol = $('#miSelector').data('forcedRole') || $('#miSelector').val() || '3';

        if (!nombreUsuario) {
            $respuesta.removeClass('cargando exito').addClass('error').text('Ingresa un nombre de usuario.').show();
            return;
        }

        if (nombreUsuario.length < 3) {
            $respuesta.removeClass('cargando exito').addClass('error').text('El usuario debe tener al menos 3 caracteres.').show();
            return;
        }

        if (!nombre) {
            $respuesta.removeClass('cargando exito').addClass('error').text('Ingresa tu nombre completo.').show();
            return;
        }

        if (nombre.length < 3) {
            $respuesta.removeClass('cargando exito').addClass('error').text('El nombre debe tener al menos 3 caracteres.').show();
            return;
        }

        if (!correo) {
            $respuesta.removeClass('cargando exito').addClass('error').text('Ingresa tu correo electronico.').show();
            return;
        }

        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(correo)) {
            $respuesta.removeClass('cargando exito').addClass('error').text('Ingresa un correo electronico valido.').show();
            return;
        }

        if (!password) {
            $respuesta.removeClass('cargando exito').addClass('error').text('Ingresa una contrasena.').show();
            return;
        }

        if (password.length < 6) {
            $respuesta.removeClass('cargando exito').addClass('error').text('La contrasena debe tener al menos 6 caracteres.').show();
            return;
        }

        $respuesta.removeClass('exito error').addClass('cargando').text('Creando cuenta...').show();

        var partes = nombre.split(' ');
        var primerNombre = partes[0] || nombre;
        var apellido = partes.slice(1).join(' ') || ' ';

        fetch(API_BASE_URL + '/clientes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nombreUsuario: nombreUsuario,
                contrasena: password,
                nombre: primerNombre,
                apellido: apellido,
                email: correo,
                telefono: '',
                perfil: rol,
            })
        })
        .then(function(response) {
            console.log("response", response);

            if (!response.ok) {
                return response.json().catch(function() { return {}; }).then(function(err) {
                    throw err;
                });
            }
            return response.json();
        })
        .then(function () {
            $respuesta.removeClass('cargando error').addClass('exito').text('Cuenta creada exitosamente. Redirigiendo al login...');
            $('#registerForm')[0].reset();
            setTimeout(function () {
                window.location.href = '../index.html';
            }, 1500);
        })
        .catch(function () {
            $respuesta.removeClass('cargando exito').addClass('error').text('Hubo un error al crear la cuenta. Intenta de nuevo.');
        });
    });

});