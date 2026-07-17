let inventario = JSON.parse(localStorage.getItem('inventario')) || [];
let ventas = JSON.parse(localStorage.getItem('ventas')) || [];
let gastos = JSON.parse(localStorage.getItem('gastos')) || [];

function saveData() {
    localStorage.setItem('inventario', JSON.stringify(inventario));
    localStorage.setItem('ventas', JSON.stringify(ventas));
    localStorage.setItem('gastos', JSON.stringify(gastos));
}

function showSection(section) {
    document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
    document.getElementById(section).style.display = 'block';
    
    if (section === 'inventario') actualizarInventario();
    if (section === 'ventas') actualizarSelectVentas();
    if (section === 'gastos') actualizarGastos();
    if (section === 'reportes') generarReporte();
}

// Funciones básicas (mantenerlas)
function agregarProducto() {
    const nombre = document.getElementById('prodNombre').value.trim();
    const cantidad = parseFloat(document.getElementById('prodCantidad').value);
    const unidad = document.getElementById('prodUnidad').value || 'kg';

    if (!nombre || isNaN(cantidad)) return alert("Completa nombre y cantidad");

    const existe = inventario.find(p => p.nombre.toLowerCase() === nombre.toLowerCase());
    if (existe) existe.cantidad += cantidad;
    else inventario.push({nombre, cantidad, unidad});

    saveData();
    actualizarInventario();
    actualizarSelectVentas();
    alert("Producto guardado");
}

function actualizarInventario() {
    const lista = document.getElementById('listaInventario');
    lista.innerHTML = inventario.map(p => `<li>${p.nombre} - ${p.cantidad} ${p.unidad}</li>`).join('');
}

function actualizarSelectVentas() {
    const select = document.getElementById('ventaProducto');
    select.innerHTML = inventario.map(p => `<option value="${p.nombre}">${p.nombre} (${p.cantidad} disp.)</option>`).join('');
}

function registrarVenta() {
    const producto = document.getElementById('ventaProducto').value;
    const cantidad = parseFloat(document.getElementById('ventaCantidad').value);
    const precio = parseFloat(document.getElementById('ventaPrecio').value);

    if (!producto || isNaN(cantidad) || isNaN(precio)) return alert("Completa todos los campos");

    const item = inventario.find(p => p.nombre === producto);
    if (item && item.cantidad >= cantidad) {
        item.cantidad -= cantidad;
        ventas.push({fecha: new Date().toLocaleDateString('es-PE'), producto, cantidad, precio, total: cantidad*precio});
        saveData();
        actualizarInventario();
        actualizarSelectVentas();
        alert("Venta registrada");
    } else alert("Stock insuficiente");
}

function registrarGasto() {
    const desc = document.getElementById('gastoDesc').value.trim();
    const monto = parseFloat(document.getElementById('gastoMonto').value);
    const cat = document.getElementById('gastoCategoria').value;

    if (!desc || isNaN(monto)) return alert("Completa descripción y monto");

    gastos.push({fecha: new Date().toLocaleDateString('es-PE'), descripcion: desc, monto, categoria: cat});
    saveData();
    actualizarGastos();
    alert("Gasto registrado");
}

function actualizarGastos() {
    const lista = document.getElementById('listaGastos');
    lista.innerHTML = gastos.slice(-5).map(g => `<li>${g.fecha} - ${g.descripcion} (${g.categoria}): S/${g.monto}</li>`).join('');
}

// ====================== REPORTE MEJORADO ======================
function generarReporte() {
    // Ventas por producto
    const ventasPorProducto = {};
    ventas.forEach(v => {
        if (!ventasPorProducto[v.producto]) ventasPorProducto[v.producto] = {cantidad: 0, total: 0};
        ventasPorProducto[v.producto].cantidad += v.cantidad;
        ventasPorProducto[v.producto].total += v.total;
    });

    let html = `<h2>Reporte Detallado - Pueblo Nuevo de Colán</h2>`;

    // Ventas
    html += `<h3>📊 Ventas por Producto</h3>`;
    html += `<table style="width:100%; border-collapse: collapse; margin-bottom:20px;">`;
    html += `<tr style="background:#4CAF50; color:white;"><th>Producto</th><th>Cantidad Vendida</th><th>Total S/</th></tr>`;

    let totalVentas = 0;
    Object.keys(ventasPorProducto).forEach(prod => {
        const data = ventasPorProducto[prod];
        totalVentas += data.total;
        html += `<tr style="border-bottom:1px solid #ddd; text-align:center;">
                    <td>${prod}</td>
                    <td>${data.cantidad}</td>
                    <td><b>S/ ${data.total.toFixed(2)}</b></td>
                 </tr>`;
    });
    html += `</table>`;

    // Gastos por categoría
    const gastosPorCategoria = {};
    gastos.forEach(g => {
        if (!gastosPorCategoria[g.categoria]) gastosPorCategoria[g.categoria] = 0;
        gastosPorCategoria[g.categoria] += g.monto;
    });

    html += `<h3>💰 Gastos por Categoría</h3>`;
    html += `<table style="width:100%; border-collapse: collapse; margin-bottom:20px;">`;
    html += `<tr style="background:#f44336; color:white;"><th>Categoría</th><th>Total S/</th></tr>`;

    let totalGastos = 0;
    Object.keys(gastosPorCategoria).forEach(cat => {
        const monto = gastosPorCategoria[cat];
        totalGastos += monto;
        html += `<tr style="border-bottom:1px solid #ddd; text-align:center;">
                    <td>${cat}</td>
                    <td><b>S/ ${monto.toFixed(2)}</b></td>
                 </tr>`;
    });
    html += `</table>`;

    // Resultado final
    const ganancia = totalVentas - totalGastos;
    html += `<h2 style="color:green; text-align:center;">Ganancia Total: S/ ${ganancia.toFixed(2)}</h2>`;

    // Inventario
    html += `<h3>📦 Inventario Actual</h3><ul>`;
    inventario.forEach(p => html += `<li><b>${p.nombre}:</b> ${p.cantidad} ${p.unidad}</li>`);
    html += `</ul>`;

    document.getElementById('reporteContenido').innerHTML = html;
}

function exportarCSV() {
    let csv = "Tipo,Detalle,Monto,Categoria/Producto\n";
    ventas.forEach(v => csv += `Venta,${v.producto},${v.total},-\n`);
    gastos.forEach(g => csv += `Gasto,${g.descripcion},${g.monto},${g.categoria}\n`);
    const blob = new Blob([csv], {type: 'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'reporte_detallado_colan.csv'; a.click();
}