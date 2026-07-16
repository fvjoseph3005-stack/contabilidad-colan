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
    lista.innerHTML = gastos.slice(-5).map(g => `<li>${g.fecha} - ${g.descripcion}: S/${g.monto}</li>`).join('');
}

function generarReporte() {
    const totalV = ventas.reduce((a, v) => a + v.total, 0);
    const totalG = gastos.reduce((a, g) => a + g.monto, 0);
    const ganancia = totalV - totalG;

    let html = `<p><b>Ventas Totales:</b> S/ ${totalV.toFixed(2)}</p>`;
    html += `<p><b>Gastos Totales:</b> S/ ${totalG.toFixed(2)}</p>`;
    html += `<p style="color:green; font-size:18px;"><b>Ganancia:</b> S/ ${ganancia.toFixed(2)}</p>`;
    html += `<h3>Inventario:</h3><ul>${inventario.map(p => `<li>${p.nombre}: ${p.cantidad}</li>`).join('')}</ul>`;

    document.getElementById('reporteContenido').innerHTML = html;
}

function exportarCSV() {
    let csv = "Fecha,Tipo,Detalle,Monto\n";
    ventas.forEach(v => csv += `${v.fecha},Venta,${v.producto},${v.total}\n`);
    gastos.forEach(g => csv += `${g.fecha},Gasto,${g.descripcion},${g.monto}\n`);
    
    const blob = new Blob([csv], {type: 'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'reporte_colan.csv'; a.click();
}

// Iniciar
showSection('inventario');