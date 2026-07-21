$(document).ready(function () {

// datos de selectpor

// 1. Creamos la función que va a buscar los datos al servidor Java
    function cargarDatosEnSelector() {
        var $selector = $('#miSelector');

        // Hacemos el fetch al endpoint de tu API (ejemplo: /categorias)
        fetch(API_BASE_URL + '/clientes/roles', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
                // Si tu API pide token de seguridad, descomenta la línea de abajo:
                // 'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        })
        .then(function(response) {
            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor');
            }
            return response.json(); // Convertimos la respuesta a JSON
        })
        .then(function(listaDeDatos) {
        console.log('listaDeDatos :', listaDeDatos);
            // Limpiamos el selector por si tenía texto de "Cargando..."
            $selector.empty();
            $selector.append('<option value="">-- Selecciona una opción --</option>');

            // 2. Recorremos la lista que nos mandó Java y llenamos el selector
            listaDeDatos.forEach(function(item) {
            console.log('item :', item);
                // NOTA: Cambia 'id_categoria' y 'nombre' por los nombres reales de tus columnas
                $selector.append('<option value="' + item.id + '">' + item.nombre + '</option>');
            });

            // 1. Le asignas el valor por defecto (ejemplo: '3' para el rol de Cliente)
            $('#miSelector').val('3');

            // 2. Deshabilitas el elemento para que no lo puedan clickear
            $('#miSelector').prop('disabled', true);
        })
        .catch(function(error) {
            console.error('Hubo un fallo al llenar el selector:', error);
            $selector.empty().append('<option value="">Error al cargar los datos</option>');
        });
    }

    // 3. Ejecutamos la función de inmediato al cargar la página
    cargarDatosEnSelector();

    //post del registro
    $('#registerForm').on('submit', function (event) {
        event.preventDefault();

        var nombreUsuario = $('#reg-username').val().trim();
        var nombre = $('#reg-name').val().trim();
        var correo = $('#reg-email').val().trim();
        var password = $('#reg-password').val();
        var $respuesta = $('#respuesta');
          var rol = $('#miSelector').val();;

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
