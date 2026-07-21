# BoutiqueWeb - MODA SYSTEM

Sistema web para administración de boutique.

---

## Roles del Sistema

### Administrador

1. Quiero iniciar sesión para acceder de forma segura al sistema.
2. Quiero registrar nuevos productos para mantener actualizado el inventario.
3. Quiero editar la información de un producto para corregir precios, tallas, colores o descripciones.
4. Quiero eliminar productos que ya no se venderán para mantener organizado el catálogo.
5. Quiero consultar el inventario para conocer la disponibilidad de cada producto.
6. Quiero recibir alertas de productos con stock bajo para reabastecerlos a tiempo.
7. Quiero registrar categorías para organizar mejor los productos.
8. Quiero modificar las categorías para mantener la organización del catálogo.
9. Quiero registrar descuentos para ofrecer promociones a los clientes.
10. Quiero editar o finalizar descuentos para mantener vigentes solo las promociones activas.
11. Quiero consultar todas las ventas realizadas para llevar el control del negocio.
12. Quiero ver el detalle de cada venta para conocer los productos vendidos, el cliente y el método de pago (en efectivo).
13. Quiero consultar las ganancias del negocio para evaluar el rendimiento de las ventas.
14. Quiero visualizar estadísticas de ventas para apoyar la toma de decisiones.
15. Quiero consultar los productos más vendidos para identificar los artículos con mayor demanda.
16. Quiero consultar las ventas por día para analizar el comportamiento del negocio.
17. Quiero consultar los apartados registrados para dar seguimiento a los pagos pendientes.
18. Quiero consultar la información de los clientes para brindar un mejor servicio.
19. Quiero cerrar sesión para proteger la información del sistema.

**Funciones del administrador:**
- Iniciar y cerrar sesión.
- Administrar productos (agregar, editar, eliminar y consultar).
- Controlar el inventario.
- Administrar categorías.
- Administrar descuentos.
- Consultar ventas.
- Ver detalles de las ventas.
- Consultar clientes.
- Dar seguimiento a apartados.
- Consultar ganancias.
- Visualizar estadísticas (productos más vendidos, ventas mensuales, métodos de pago y stock bajo).

**Funciones que NO debería tener el administrador:**
- Ninguna, el administrador tiene acceso total al sistema.

---

### Empleado

1. Como empleado, quiero iniciar sesión para acceder únicamente a las funciones autorizadas del sistema.
2. Como empleado, quiero consultar el catálogo de productos para ofrecer información a los clientes.
3. Como empleado, quiero consultar la disponibilidad de un producto para informar al cliente si está en existencia.
4. Como empleado, quiero registrar una venta para completar la compra de un cliente.
5. Como empleado, quiero seleccionar el método de pago para registrar correctamente la venta.
6. Como empleado, quiero registrar un apartado para apartar productos solicitados por un cliente.
7. Como empleado, quiero consultar los apartados registrados para informar a los clientes sobre el estado de sus compras.
8. Como empleado, quiero consultar la información de un cliente para brindar una mejor atención durante la venta.
9. Como empleado, quiero registrar nuevos clientes para facilitar futuras compras y apartados.
10. Como empleado, quiero actualizar los datos de un cliente cuando sea necesario.
11. Como empleado, quiero consultar los descuentos disponibles para aplicarlos correctamente durante la venta.
12. Como empleado, quiero consultar mi historial de ventas para dar seguimiento a las ventas que he realizado.
13. Como empleado, quiero cerrar sesión al finalizar mi jornada para proteger la información del sistema.

**Funciones del empleado:**
- Iniciar y cerrar sesión.
- Consultar productos y existencias.
- Registrar ventas.
- Aplicar descuentos ya autorizados.
- Registrar clientes.
- Registrar y administrar apartados.
- Registrar abonos.
- Generar tickets.
- Consultar sus ventas.

**Funciones que NO debería tener el empleado:**
- Agregar productos al inventario.
- Eliminar productos.
- Modificar precios.
- Crear o eliminar categorías.
- Crear o modificar descuentos.
- Consultar ganancias del negocio.
- Ver estadísticas generales.
- Eliminar ventas registradas.
- Autorizar cambios importantes sin permisos.

---

### Cliente

1. Como cliente, quiero registrarme en el sistema para realizar compras y dar seguimiento a mis pedidos.
2. Como cliente, quiero iniciar sesión para acceder a mi cuenta de forma segura.
3. Como cliente, quiero consultar el catálogo de productos para conocer los artículos disponibles.
4. Como cliente, quiero buscar productos por nombre, categoría o marca para encontrar fácilmente lo que deseo.
5. Como cliente, quiero filtrar productos por talla, color o precio para encontrar opciones que se adapten a mis necesidades.
6. Como cliente, quiero ver la información detallada de un producto para conocer su precio, descripción y disponibilidad.
7. Como cliente, quiero agregar productos a mi carrito para comprarlos posteriormente.
8. Como cliente, quiero modificar la cantidad de productos en mi carrito para ajustar mi compra antes de pagar.
9. Como cliente, quiero eliminar productos de mi carrito para cambiar mi decisión de compra.
10. Como cliente, quiero realizar el pago de mi compra utilizando un método de pago disponible para completar mi pedido (pago en efectivo).
11. Como cliente, quiero consultar el estado de mis apartados para conocer cuánto me falta por pagar.
12. Como cliente, quiero consultar mi historial de compras para revisar mis pedidos anteriores.
13. Como cliente, quiero actualizar mis datos personales para mantener mi información correcta.
14. Como cliente, quiero recuperar mi contraseña en caso de olvidarla para volver a acceder a mi cuenta.
15. Como cliente, quiero cerrar sesión para proteger la seguridad de mi cuenta.

**Funciones del cliente:**
- Registrarse.
- Iniciar sesión.
- Ver el catálogo de productos.
- Buscar y filtrar productos.
- Ver detalles de un producto.
- Agregar productos al carrito.
- Modificar o eliminar productos del carrito.
- Realizar una compra.
- Consultar sus apartados.
- Consultar su historial de compras.
- Actualizar sus datos personales.
- Recuperar su contraseña.
- Cerrar sesión.

**Funciones que NO puede hacer el cliente:**
- Agregar, editar o eliminar productos.
- Modificar precios.
- Administrar inventario.
- Registrar descuentos.
- Consultar ventas generales.
- Ver ganancias del negocio.
- Acceder a estadísticas.
- Administrar categorías.

---

## Arquitectura y Patrones

- **Frontend:** Arquitectura por tecnología.
- **Backend:** Orientado a Objetos.
