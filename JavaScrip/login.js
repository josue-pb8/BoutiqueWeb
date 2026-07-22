const API_BASE_URL = 'http://35.168.202.45:8081/api';
function redirigir(rol) {
  if (rol === 'ADMIN') {
    window.location.href = '/pagina/inicio.html';
  } else if (rol === 'EMPLEADO') {
    window.location.href = '/pagina/empleadoHTML/inicio.html';
  } else if (rol === 'CLIENTE') {
    window.location.href = '/pagina/vistas cliente html/inicio.html';
  } else {
    window.location.href = '/index.html';
  }
}

$(document).ready(function() {

  $('#miFormulario').on('submit', function(event) {
    event.preventDefault();

    var usuario = $('#usuario').val().trim();
    var contrasena = $('#contrasena').val();
    var $contenedorRespuesta = $('#respuesta');

    if (!usuario) {
      $contenedorRespuesta.removeClass('cargando exito').addClass('error').text('Ingresa tu usuario.').show();
      return;
    }

    if (!contrasena) {
      $contenedorRespuesta.removeClass('cargando exito').addClass('error').text('Ingresa tu contrasena.').show();
      return;
    }

    if (contrasena.length < 6) {
      $contenedorRespuesta.removeClass('cargando exito').addClass('error').text('La contrasena debe tener al menos 6 caracteres.').show();
      return;
    }

    $contenedorRespuesta.removeClass('exito error').addClass('cargando').text('Cargando...').show();

    fetch(API_BASE_URL + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombreUsuario: usuario, contrasena: contrasena })
    })
    .then(function(response) {
      if (!response.ok) {
        return response.json().catch(function() { return {}; }).then(function(err) {
          throw err;
        });
      }
      return response.json();
    })
    .then(function(respuesta) {
    console.log('respuesta :', respuesta);
      localStorage.setItem('token', respuesta.token);

      var payload = JSON.parse(atob(respuesta.token.split('.')[1]));
      console.log('payload :', payload);

      localStorage.setItem('usuarioId', payload.sub);
      localStorage.setItem('rol', payload.rol);
      localStorage.setItem('usuario', JSON.stringify({ nombreUsuario: usuario, rol: payload.rol, id: payload.sub }));

      $contenedorRespuesta.removeClass('cargando error').addClass('exito').text('Inicio de sesion exitoso. Redirigiendo...');

      if (payload.rol === 'CLIENTE') {
        fetch(API_BASE_URL + '/clientes/por-usuario/' + payload.sub, {
          headers: { 'Authorization': 'Bearer ' + respuesta.token }
        })
        .then(function(res) { return res.json(); })
        .then(function(cliente) {
          localStorage.setItem('clienteId', cliente.id);
          setTimeout(function() { redirigir(payload.rol); }, 800);
        })
        .catch(function() {
          localStorage.setItem('clienteId', payload.sub);
          setTimeout(function() { redirigir(payload.rol); }, 800);
        });
      } else {
        setTimeout(function() { redirigir(payload.rol); }, 800);
      }
    })
    .catch(function() {
      $contenedorRespuesta.removeClass('cargando exito').addClass('error').text('Usuario o contrasena incorrectos.');
    });
  });

});
