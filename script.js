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
    if (!select) return;
    select.innerHTML = inventario.map(p => 
        `<option value="${p.nombre}">${p.nombre} (${p.cantidad} disp.)</option>`
    ).join('');
}

function registrarVenta() {
    const producto = document.getElementById('ventaProducto').value;
    const cantidad = parseFloat(document.getElementById('ventaCantidad').value);
    const precio = parseFloat(document.getElementById('ventaPrecio').value);

    if (!producto || isNaN(cantidad) || isNaN(precio) || cantidad <= 0) {
        alert("Completa todos los campos correctamente");
        return;
    }

    const item = inventario.find(p => p.nombre === producto);
    if (item && item.cantidad >= cantidad) {
        item.cantidad -= cantidad;
        if (item.cantidad <= 0) {
            inventario = inventario.filter(p => p.nombre !== producto);
        }

        ventas.push({
            fecha: new Date().toLocaleDateString('es-PE'),
            producto, 
            cantidad, 
            precio, 
            total: cantidad * precio
        });
        
        saveData();
        actualizarInventario();
        actualizarSelectVentas();
        actualizarSelectGastoProducto();
        alert("✅ Venta registrada correctamente");
    } else {
        alert("Stock insuficiente");
    }
}

// ==================== GASTOS ====================
function actualizarSelectGastoProducto() {
    const select = document.getElementById('gastoProducto');
    if (!select) return;

    let options = '<option value="">Selecciona un producto</option>';
    inventario.forEach(p => {
        options += `<option value="${p.nombre}">${p.nombre}</option>`;
    });
    select.innerHTML = options;
}

function registrarGasto() {
    const desc = document.getElementById('gastoDesc').value.trim();
    const monto = parseFloat(document.getElementById('gastoMonto').value);
    const cat = document.getElementById('gastoCategoria').value;
    const producto = document.getElementById('gastoProducto').value;

    if (!desc || isNaN(monto)) {
        alert("Completa descripción y monto");
        return;
    }
    if (!producto) {
        alert("Debes seleccionar el producto al que pertenece este gasto");
        return;
    }

    gastos.push({
        fecha: new Date().toLocaleDateString('es-PE'),
        descripcion: desc,
        monto: monto,
        categoria: cat,
        producto: producto
    });

    saveData();
    actualizarGastos();
    alert("Gasto asignado correctamente al producto: " + producto);
}

function actualizarGastos() {
    const lista = document.getElementById('listaGastos');
    if (!lista) return;
    lista.innerHTML = gastos.slice(-5).map(g => 
        `<li>${g.fecha} - ${g.descripcion} (${g.categoria}) → <b>${g.producto}</b>: S/${g.monto}</li>`
    ).join('');
}

// ==================== REPORTE POR PRODUCTO ====================
function generarReporte() {
    let html = `<h2>📊 Reporte Separado por Producto</h2>`;

    // Obtener todos los productos que tienen ventas o gastos
    const productos = new Set();
    ventas.forEach(v => productos.add(v.producto));
    gastos.forEach(g => productos.add(g.producto));

    if (productos.size === 0) {
        document.getElementById('reporteContenido').innerHTML = `<p style="color:orange; text-align:center;">Aún no hay movimientos registrados.</p>`;
        return;
    }

    productos.forEach(prod => {
        const ventasProd = ventas.filter(v => v.producto === prod);
        const gastosProd = gastos.filter(g => g.producto === prod);

        const totalVentas = ventasProd.reduce((sum, v) => sum + v.total, 0);
        const totalGastos = gastosProd.reduce((sum, g) => sum + g.monto, 0);
        const ganancia = totalVentas - totalGastos;

        html += `<div style="border:3px solid #2e7d32; padding:20px; margin:25px 0; border-radius:12px; background:#f9fff9;">`;
        html += `<h2 style="color:#1b5e20; text-align:center;">Producto: ${prod}</h2>`;

        // Ventas del producto
        html += `<h4>💰 Ventas</h4>`;
        if (ventasProd.length > 0) {
            ventasProd.forEach(v => {
                html += `<p>${v.fecha} → ${v.cantidad} und. × S/${v.precio} = <b>S/ ${v.total.toFixed(2)}</b></p>`;
            });
            html += `<p style="color:green;"><b>Total Ventas: S/ ${totalVentas.toFixed(2)}</b></p>`;
        } else {
            html += `<p style="color:gray;">Sin ventas registradas</p>`;
        }

        // Gastos del producto
        html += `<h4>📋 Gastos</h4>`;
        if (gastosProd.length > 0) {
            gastosProd.forEach(g => {
                html += `<p>${g.fecha} → ${g.descripcion} (${g.categoria}): <b>S/ ${g.monto.toFixed(2)}</b></p>`;
            });
            html += `<p style="color:#d32f2f;"><b>Total Gastos: S/ ${totalGastos.toFixed(2)}</b></p>`;
        } else {
            html += `<p style="color:gray;">Sin gastos asignados</p>`;
        }

        // Ganancia del producto
        html += `<h3 style="color:green; text-align:center; margin-top:15px;">Ganancia de ${prod}: S/ ${ganancia.toFixed(2)}</h3>`;
        html += `</div>`;
    });

    document.getElementById('reporteContenido').innerHTML = html;
}

function exportarCSV() {
    let csv = "Fecha,Tipo,Producto,Detalle,Monto\n";
    ventas.forEach(v => csv += `${v.fecha},Venta,${v.producto},${v.cantidad} und,${v.total}\n`);
    gastos.forEach(g => csv += `${g.fecha},Gasto,${g.producto},${g.descripcion},${g.monto}\n`);
    const blob = new Blob([csv], {type: 'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'reporte_por_producto.csv'; a.click();
}