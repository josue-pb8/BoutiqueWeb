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
        apiGet('/estadisticas/ventas-semanales')
            .then(function (respuesta) {
                if (!respuesta) throw new Error('Sin datos');
                $('#ventasDia').text('$' + formatNumber(respuesta.montoTotal || 0));
                $('#ventasDiaComparacion').text((respuesta.total || 0) + ' ventas esta semana.');
            })
            .catch(function () {
                apiGet('/estadisticas/ventas-mensuales')
                    .then(function (respuesta) {
                        if (!respuesta) throw new Error('Sin datos');
                        $('#ventasDia').text('$' + formatNumber(respuesta.montoTotal || 0));
                        $('#ventasDiaComparacion').text((respuesta.totalVentas || 0) + ' ventas este mes.');
                    })
                    .catch(function () {
                        $('#ventasDia').text('$0.00');
                        $('#ventasDiaComparacion').text('Sin datos aún.');
                    });
            });
    }

    function cargarGananciasSemanales() {
        apiGet('/estadisticas/ganancias')
            .then(function (respuesta) {
                if (!respuesta) throw new Error('Sin datos');
                $('#gananciasSemana').text('$' + formatNumber(respuesta.totalVentas || 0));
                $('#gananciasComparacion').text('Unidades vendidas (total).');
            })
            .catch(function () {
                apiGet('/estadisticas/ganancias-semanales')
                    .then(function (respuesta) {
                        if (!respuesta) throw new Error('Sin datos');
                        $('#gananciasSemana').text('$' + formatNumber(respuesta.montoTotal || 0));
                        $('#gananciasComparacion').text((respuesta.porcentaje || 0) + '% vs la semana pasada.');
                    })
                    .catch(function () {
                        $('#gananciasSemana').text('$0.00');
                        $('#gananciasComparacion').text('Sin datos aún.');
                    });
            });
    }

    function cargarNuevosClientes() {
        apiGet('/estadisticas/clientes-nuevos')
            .then(function (respuesta) {
                if (!respuesta) throw new Error('Sin datos');
                $('#nuevosClientes').text(respuesta.total || 0);
            })
            .catch(function () {
                $('#nuevosClientes').text('0');
            });
    }

    function cargarApartadosActivos() {
        apiGet('/estadisticas/apartados-activos')
            .then(function (respuesta) {
                if (!respuesta) throw new Error('Sin datos');
                $('#apartadosActivos').text(respuesta.total || 0);
            })
            .catch(function () {
                $('#apartadosActivos').text('0');
            });
    }

    function mostrarGraficaVacia(canvasId, mensaje) {
        var ctx = document.getElementById(canvasId);
        if (!ctx) return null;
        var existing = Chart.getChart(ctx);
        if (existing) existing.destroy();
        return new Chart(ctx.getContext('2d'), {
            type: 'pie',
            data: {
                labels: [mensaje || 'Sin datos disponibles'],
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
    }

    function cargarProductosMasVendidos() {
        apiGet('/estadisticas/productos-mas-vendidos')
            .then(function (respuesta) {
                if (!respuesta || !Array.isArray(respuesta) || respuesta.length === 0) {
                    graficaProductos = mostrarGraficaVacia('graficaProductosVendidos');
                    return;
                }
                var labels = respuesta.map(function (item) { return item.producto || item.nombre || ''; });
                var datos = respuesta.map(function (item) { return item.totalVendidos || item.cantidad || item.total || 0; });
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
            })
            .catch(function () {
                graficaProductos = mostrarGraficaVacia('graficaProductosVendidos');
            });
    }

    function cargarVentasPorSemana() {
        apiGet('/estadisticas/ventas-semanales')
            .then(function (respuesta) {
                if (!respuesta) {
                    graficaVentas = mostrarGraficaVacia('graficaVentasPorDia');
                    return;
                }

                var labels = [];
                var datos = [];

                if (Array.isArray(respuesta)) {
                    respuesta.forEach(function (item) {
                        labels.push(item.dia || item.fecha || item.etiqueta || '');
                        datos.push(item.montoTotal || item.total || item.monto || 0);
                    });
                } else if (respuesta.detalle && Array.isArray(respuesta.detalle)) {
                    respuesta.detalle.forEach(function (item) {
                        labels.push(item.dia || item.fecha || item.etiqueta || '');
                        datos.push(item.montoTotal || item.total || item.monto || 0);
                    });
                }

                if (labels.length === 0) {
                    labels.push('Total semana');
                    datos.push(respuesta.montoTotal || 0);
                }

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
                            pointRadius: 6,
                            pointHoverRadius: 8,
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
            })
            .catch(function () {
                graficaVentas = mostrarGraficaVacia('graficaVentasPorDia');
            });
    }

    function cargarPerdidasPorSemana() {
        apiGet('/estadisticas/perdidas-semanales')
            .then(function (respuesta) {
                if (!respuesta || !Array.isArray(respuesta) || respuesta.length === 0) {
                    graficaPerdidas = mostrarGraficaVacia('graficaPerdidasSemana');
                    return;
                }
                var labels = respuesta.map(function (item) { return item.producto || item.nombre || ''; });
                var datos = respuesta.map(function (item) { return parseFloat(item.ganancia || item.perdida || item.total || 0); });
                var colores = ['#27a745', '#C8A45D', '#3498db', '#e74c3c', '#9b59b6', '#f39c12', '#1abc9c', '#e67e22'];

                if (graficaPerdidas) graficaPerdidas.destroy();
                var ctx = document.getElementById('graficaPerdidasSemana').getContext('2d');
                graficaPerdidas = new Chart(ctx, {
                    type: 'pie',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Monto ($)',
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
                graficaPerdidas = mostrarGraficaVacia('graficaPerdidasSemana');
            });
    }

    function cargarVentasRecientes() {
        apiGet('/estadisticas/ventas-recientes')
            .then(function (respuesta) {
                if (!respuesta || !Array.isArray(respuesta) || respuesta.length === 0) {
                    $('#cuerpoTablaRecientes').html('<tr><td colspan="5" class="tabla-vacia">Sin ventas recientes</td></tr>');
                    return;
                }
                var html = '';
                respuesta.forEach(function (item) {
                    var estado = item.estado || 'completada';
                    var claseEstado = 'estado-completada';
                    if (estado.toLowerCase() === 'pendiente') claseEstado = 'estado-pendiente';
                    else if (estado.toLowerCase() === 'cancelada') claseEstado = 'estado-cancelada';
                    html += '<tr>';
                    html += '<td>' + escapeHtml(item.fecha || '') + '</td>';
                    html += '<td>' + escapeHtml(item.cliente || item.clienteNombre || 'Sin cliente') + '</td>';
                    html += '<td>' + escapeHtml(item.productos || '') + '</td>';
                    html += '<td>$' + formatNumber(item.total || 0) + '</td>';
                    html += '<td><span class="' + claseEstado + '">' + escapeHtml(estado.charAt(0).toUpperCase() + estado.slice(1)) + '</span></td>';
                    html += '</tr>';
                });
                $('#cuerpoTablaRecientes').html(html);
            })
            .catch(function () {
                $('#cuerpoTablaRecientes').html('<tr><td colspan="5" class="tabla-vacia">Error al cargar datos</td></tr>');
            });
    }

    function formatNumber(numero) {
        return parseFloat(numero || 0).toLocaleString('es-MX', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    function escapeHtml(text) {
        var div = document.createElement("div");
        div.appendChild(document.createTextNode(text));
        return div.innerHTML;
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
