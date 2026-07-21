if (!localStorage.getItem('token') || localStorage.getItem('rol') !== 'ADMIN') { window.location.href = '../index.html'; }
$(document).ready(function () {

    try {
        let user = JSON.parse(localStorage.getItem('usuario'));
        if (user) {
            var nameEl0 = document.getElementsByClassName("user-name")[0];
            if (nameEl0) nameEl0.innerHTML = user.nombreUsuario;
            var roleEl0 = document.getElementsByClassName("user-role")[0];
            if (roleEl0) roleEl0.innerHTML = user.rol;
        }
    } catch(e) { window.location.href = '../index.html'; return; }

    var graficaProductos = null;
    var graficaVentas = null;
    var graficaPerdidas = null;

    function cargarDashboard() {
        cargarVentasDelDia();
        cargarGananciasSemanales();
        cargarNuevosClientes();
        cargarApartadosActivos();
        cargarProductosMasVendidos();
        cargarVentasPorSemana();
        cargarPerdidasPorSemana();
        cargarVentasRecientes();
    }

    function cargarVentasDelDia() {
        apiGet('/estadisticas/ventas-mensuales')
            .then(function (respuesta) {
                $('#ventasDia').text('$' + formatNumber(respuesta.montoTotal));
                $('#ventasDiaComparacion').text(respuesta.totalVentas + ' ventas este mes.');
            })
            .catch(function () {
                $('#ventasDia').text('$0.00');
                $('#ventasDiaComparacion').text('Sin datos aun.');
            });
    }

    function cargarGananciasSemanales() {
        apiGet('/estadisticas/ganancias-semanales')
            .then(function (respuesta) {
                $('#gananciasSemana').text('$' + formatNumber(respuesta.montoTotal));
                $('#gananciasComparacion').text(respuesta.porcentaje + '% vs la semana pasada.');
            })
            .catch(function () {
                $('#gananciasSemana').text('$0.00');
                $('#gananciasComparacion').text('Sin datos aun.');
            });
    }

    function cargarNuevosClientes() {
        apiGet('/estadisticas/clientes-nuevos')
            .then(function (respuesta) {
                $('#nuevosClientes').text(respuesta.total);
            })
            .catch(function () {
                $('#nuevosClientes').text('0');
            });
    }

    function cargarApartadosActivos() {
        apiGet('/estadisticas/apartados-activos')
            .then(function (respuesta) {
                $('#apartadosActivos').text(respuesta.total);
            })
            .catch(function () {
                $('#apartadosActivos').text('0');
            });
    }

    function cargarProductosMasVendidos() {
        apiGet('/estadisticas/productos-mas-vendidos')
            .then(function (respuesta) {
                if (!respuesta || respuesta.length === 0) return;
                var labels = respuesta.map(function (item) { return item.producto; });
                var datos = respuesta.map(function (item) { return item.totalVendidos; });
                var colores = ['#C8A45D', '#000000', '#f0b171', '#b39150', '#27a745', '#e74c3c', '#3498db', '#9b59b6'];

                if (graficaProductos) graficaProductos.destroy();
                var ctx = document.getElementById('graficaProductosVendidos').getContext('2d');
                graficaProductos = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Unidades vendidas',
                            data: datos,
                            backgroundColor: colores.slice(0, datos.length),
                            borderRadius: 6,
                            barThickness: 32
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: { precision: 0, font: { size: 11 } },
                                grid: { color: '#f0f0f0' }
                            },
                            x: {
                                ticks: { font: { size: 11 } },
                                grid: { display: false }
                            }
                        }
                    }
                });
            });
    }

    function cargarVentasPorSemana() {
        apiGet('/estadisticas/ventas-semanales')
            .then(function (respuesta) {
                if (!respuesta) return;
                var labels = ['Últimos 7 días'];
                var datos = [respuesta.montoTotal || 0];

                if (graficaVentas) graficaVentas.destroy();
                var ctx = document.getElementById('graficaVentasPorDia').getContext('2d');
                graficaVentas = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Total vendido ($)',
                            data: datos,
                            borderColor: '#C8A45D',
                            backgroundColor: 'rgba(200, 164, 93, 0.15)',
                            pointBackgroundColor: '#000000',
                            pointBorderColor: '#C8A45D',
                            pointRadius: 8,
                            pointHoverRadius: 10,
                            fill: true,
                            tension: 0.3
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    callback: function (valor) { return '$' + formatNumber(valor); },
                                    font: { size: 11 }
                                },
                                grid: { color: '#f0f0f0' }
                            },
                            x: {
                                ticks: { font: { size: 11 } },
                                grid: { display: false }
                            }
                        }
                    }
                });
            });
    }

    function cargarPerdidasPorSemana() {
        apiGet('/estadisticas/perdidas-semanales')
            .then(function (respuesta) {
                if (graficaPerdidas) graficaPerdidas.destroy();
                var ctx = document.getElementById('graficaPerdidasSemana').getContext('2d');

                if (!respuesta || respuesta.length === 0) {
                    graficaPerdidas = new Chart(ctx, {
                        type: 'pie',
                        data: {
                            labels: ['Sin datos disponibles'],
                            datasets: [{
                                data: [1],
                                backgroundColor: ['#e0e0e0'],
                                borderWidth: 2,
                                borderColor: '#ffffff'
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 12 } }
                            }
                        }
                    });
                    return;
                }
                var labels = respuesta.map(function (item) { return item.producto; });
                var datos = respuesta.map(function (item) { return parseFloat(item.ganancia); });
                var colores = ['#27a745', '#C8A45D', '#3498db', '#e74c3c', '#9b59b6', '#f39c12', '#1abc9c', '#e67e22'];

                graficaPerdidas = new Chart(ctx, {
                    type: 'pie',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Ganancia neta ($)',
                            data: datos,
                            backgroundColor: colores.slice(0, datos.length),
                            borderWidth: 2,
                            borderColor: '#ffffff'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: { font: { size: 11 }, padding: 12 }
                            },
                            tooltip: {
                                callbacks: {
                                    label: function (contexto) {
                                        var valor = parseFloat(contexto.raw);
                                        return contexto.label + ': $' + formatNumber(valor);
                                    }
                                }
                            }
                        }
                    }
                });
            })
            .catch(function () {
                if (graficaPerdidas) graficaPerdidas.destroy();
                var ctx = document.getElementById('graficaPerdidasSemana').getContext('2d');
                graficaPerdidas = new Chart(ctx, {
                    type: 'pie',
                    data: {
                        labels: ['Sin datos disponibles'],
                        datasets: [{
                            data: [1],
                            backgroundColor: ['#e0e0e0'],
                            borderWidth: 2,
                            borderColor: '#ffffff'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 12 } }
                        }
                    }
                });
            });
    }

    function cargarVentasRecientes() {
        apiGet('/estadisticas/ventas-recientes')
            .then(function (respuesta) {
                var html = '';
                respuesta.forEach(function (item) {
                    html += '<tr>';
                    html += '<td>' + item.fecha + '</td>';
                    html += '<td>' + item.cliente + '</td>';
                    html += '<td>' + item.productos + '</td>';
                    html += '<td>$' + formatNumber(item.total) + '</td>';
                    html += '<td><span class="estado-completada">Completada</span></td>';
                    html += '</tr>';
                });
                $('#cuerpoTablaRecientes').html(html || '<tr><td colspan="5" style="text-align:center;color:#888;">Sin ventas recientes</td></tr>');
            })
            .catch(function () {
                $('#cuerpoTablaRecientes').html('<tr><td colspan="5" style="text-align:center;color:#888;">Sin datos</td></tr>');
            });
    }

    function formatNumber(numero) {
        return parseFloat(numero).toLocaleString('es-MX', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    cargarDashboard();
    setInterval(cargarDashboard, 30000);

    $('.btn-nueva-venta').on('click', function () {
        window.location.href = 'ventas.html';
    });

    $('.btn-agregar-producto').on('click', function () {
        window.location.href = 'productos.html';
    });

});
