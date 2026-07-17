let inventario = JSON.parse(localStorage.getItem('inventario')) || [];
let ventas = JSON.parse(localStorage.getItem('ventas')) || [];
let gastos = JSON.parse(localStorage.getItem('gastos')) || [];

function saveData() { /* mismo */ }

function showSection(section) { /* mismo */ }

// ... (mantén las funciones agregarProducto, registrarVenta, registrarGasto, etc. iguales)

function generarReporte() {
    let html = `<h2>Reporte por Producto - Pueblo Nuevo de Colán</h2>`;

    const ventasPorProducto = {};
    ventas.forEach(v => {
        if (!ventasPorProducto[v.producto]) {
            ventasPorProducto[v.producto] = {cantidad: 0, total: 0};
        }
        ventasPorProducto[v.producto].cantidad += v.cantidad;
        ventasPorProducto[v.producto].total += v.total;
    });

    let totalVentasGlobal = 0;
    let totalGastosGlobal = gastos.reduce((sum, g) => sum + g.monto, 0);

    Object.keys(ventasPorProducto).forEach(producto => {
        const venta = ventasPorProducto[producto];
        totalVentasGlobal += venta.total;

        html += `<h3 style="background:#4CAF50; color:white; padding:8px;">Producto: ${producto}</h3>`;
        html += `<p><b>Ventas:</b> ${venta.cantidad} unidades - Total: S/ ${venta.total.toFixed(2)}</p>`;

        // Gastos (todos, ya que no están asignados por producto)
        html += `<p><b>Gastos relacionados:</b></p>`;
        html += `<ul>`;
        gastos.forEach(g => {
            html += `<li>${g.fecha} - ${g.descripcion} (${g.categoria}): S/ ${g.monto.toFixed(2)}</li>`;
        });
        html += `</ul>`;

        const gananciaProducto = venta.total - totalGastosGlobal; // aproximado
        html += `<p style="color:green; font-size:18px;"><b>Ganancia estimada para ${producto}: S/ ${gananciaProducto.toFixed(2)}</b></p>`;
        html += `<hr>`;
    });

    // Resumen general
    const gananciaTotal = totalVentasGlobal - totalGastosGlobal;
    html += `<h2 style="color:green; text-align:center;">Ganancia Total del Negocio: S/ ${gananciaTotal.toFixed(2)}</h2>`;

    document.getElementById('reporteContenido').innerHTML = html;
}