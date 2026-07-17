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
    if (section === 'gastos') actualizarSelectGastoProducto();
    if (section === 'reportes') generarReporte();
}

// ==================== INVENTARIO ====================
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
    actualizarSelectGastoProducto();
    alert("Producto guardado");
}

function actualizarInventario() {
    const lista = document.getElementById('listaInventario');
    lista.innerHTML = inventario.map(p => `<li>${p.nombre} - ${p.cantidad} ${p.unidad}</li>`).join('');
}

// ==================== VENTAS ====================
function actualizarSelectVentas() {
    const select = document.getElementById('ventaProducto');
    select.innerHTML = inventario.map(p => `<option value="${p.nombre}">${p.nombre}</option>`).join('');
}

// ==================== GASTOS ====================
function actualizarSelectGastoProducto() {
    const select = document.getElementById('gastoProducto');
    if (!select) return;
    select.innerHTML = '<option value="">Sin producto específico</option>' + 
                       inventario.map(p => `<option value="${p.nombre}">${p.nombre}</option>`).join('');
}

function registrarGasto() {
    const desc = document.getElementById('gastoDesc').value.trim();
    const monto = parseFloat(document.getElementById('gastoMonto').value);
    const cat = document.getElementById('gastoCategoria').value;
    const producto = document.getElementById('gastoProducto').value;

    if (!desc || isNaN(monto)) return alert("Completa descripción y monto");

    gastos.push({
        fecha: new Date().toLocaleDateString('es-PE'),
        descripcion: desc,
        monto: monto,
        categoria: cat,
        producto: producto || "General"
    });

    saveData();
    actualizarGastos();
    alert("Gasto registrado");
}

function actualizarGastos() {
    const lista = document.getElementById('listaGastos');
    lista.innerHTML = gastos.slice(-5).map(g => 
        `<li>${g.fecha} - ${g.descripcion} (${g.categoria}) ${g.producto ? '→ '+g.producto : ''}: S/${g.monto}</li>`
    ).join('');
}

// ==================== REPORTE POR PRODUCTO ====================
function generarReporte() {
    let html = `<h2>Reporte Detallado por Producto</h2>`;

    // Agrupar ventas
    const ventasPorProd = {};
    ventas.forEach(v => {
        if (!ventasPorProd[v.producto]) ventasPorProd[v.producto] = {cant:0, total:0};
        ventasPorProd[v.producto].cant += v.cantidad;
        ventasPorProd[v.producto].total += v.total;
    });

    // Agrupar gastos por producto
    const gastosPorProd = {};
    gastos.forEach(g => {
        const prod = g.producto || "General";
        if (!gastosPorProd[prod]) gastosPorProd[prod] = [];
        gastosPorProd[prod].push(g);
    });

    Object.keys(ventasPorProd).forEach(prod => {
        const venta = ventasPorProd[prod];
        const gastosProd = gastosPorProd[prod] || [];
        const totalGastoProd = gastosProd.reduce((sum, g) => sum + g.monto, 0);
        const ganancia = venta.total - totalGastoProd;

        html += `<div style="border:2px solid #4CAF50; padding:15px; margin:15px 0; border-radius:8px;">`;
        html += `<h3>Producto: ${prod}</h3>`;
        html += `<p><b>Ventas:</b> ${venta.cant} unidades - S/ ${venta.total.toFixed(2)}</p>`;
        
        html += `<p><b>Gastos:</b></p><ul>`;
        gastosProd.forEach(g => {
            html += `<li>${g.fecha} - ${g.descripcion} (${g.categoria}): S/ ${g.monto.toFixed(2)}</li>`;
        });
        if (gastosProd.length === 0) html += `<li style="color:gray;">Sin gastos registrados</li>`;
        html += `</ul>`;

        html += `<p style="font-size:18px; color:green;"><b>Ganancia: S/ ${ganancia.toFixed(2)}</b></p>`;
        html += `</div>`;
    });

    document.getElementById('reporteContenido').innerHTML = html;
}

function exportarCSV() { /* puedes dejar el anterior */ }