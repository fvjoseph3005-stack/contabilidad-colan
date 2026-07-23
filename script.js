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
        if (item.cantidad < 0) item.cantidad = 0;

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
    let options = '<option value="">Sin producto específico</option>';
    inventario.forEach(p => {
        if (p.cantidad > 0) {
            options += `<option value="${p.nombre}">${p.nombre}</option>`;
        }
    });
    select.innerHTML = options;
}

function registrarGasto() {
    const desc = document.getElementById('gastoDesc').value.trim();
    const monto = parseFloat(document.getElementById('gastoMonto').value);
    const cat = document.getElementById('gastoCategoria').value;
    const producto = document.getElementById('gastoProducto').value || "General";

    if (!desc || isNaN(monto)) return alert("Completa descripción y monto");

    gastos.push({
        fecha: new Date().toLocaleDateString('es-PE'),
        descripcion: desc,
        monto: monto,
        categoria: cat,
        producto: producto
    });

    saveData();
    actualizarGastos();
    alert("Gasto registrado");
}

function actualizarGastos() {
    const lista = document.getElementById('listaGastos');
    lista.innerHTML = gastos.slice(-5).map(g => 
        `<li>${g.fecha} - ${g.descripcion} (${g.categoria}) → ${g.producto}: S/${g.monto}</li>`
    ).join('');
}

// ==================== REPORTE FINAL ====================
function generarReporte() {
    let html = `<h2>📊 Reporte Detallado por Fecha</h2>`;

    const datosPorFecha = {};

    ventas.forEach(v => {
        if (!datosPorFecha[v.fecha]) datosPorFecha[v.fecha] = {ventas: [], gastos: {}};
        datosPorFecha[v.fecha].ventas.push(v);
    });

    gastos.forEach(g => {
        if (!datosPorFecha[g.fecha]) datosPorFecha[g.fecha] = {ventas: [], gastos: {}};
        const prod = g.producto || "General";
        if (!datosPorFecha[g.fecha].gastos[prod]) datosPorFecha[g.fecha].gastos[prod] = [];
        datosPorFecha[g.fecha].gastos[prod].push(g);
    });

    let totalVentasMes = 0;
    let totalGastosMes = 0;

    Object.keys(datosPorFecha).sort().reverse().forEach(fecha => {
        const data = datosPorFecha[fecha];
        let totalV = data.ventas.reduce((sum, v) => sum + v.total, 0);
        let totalG = 0;

        html += `<div style="border:3px solid #2e7d32; padding:20px; margin:20px 0; border-radius:12px; background:#f9fff9;">`;
        html += `<h3 style="color:#1b5e20;">📅 ${fecha}</h3>`;

        if (data.ventas.length > 0) {
            html += `<h4>💰 Ventas</h4>`;
            data.ventas.forEach(v => {
                html += `<p><b>${v.producto}</b>: ${v.cantidad} und. - S/ ${v.total.toFixed(2)}</p>`;
            });
        }
        totalVentasMes += totalV;

        html += `<h4>📋 Gastos por Producto</h4>`;
        Object.keys(data.gastos).forEach(prod => {
            const gastosProd = data.gastos[prod];
            const sumaG = gastosProd.reduce((sum, g) => sum + g.monto, 0);
            totalG += sumaG;

            html += `<p style="font-weight:bold;">${prod}:</p>`;
            gastosProd.forEach(g => {
                html += `<li style="margin-left:25px;">${g.descripcion} (${g.categoria}): S/ ${g.monto.toFixed(2)}</li>`;
            });
            html += `<p style="margin-left:25px; color:#d32f2f;">Subtotal: S/ ${sumaG.toFixed(2)}</p>`;
        });
        totalGastosMes += totalG;

        const gananciaDia = totalV - totalG;
        html += `<h3 style="color:green; text-align:center;">Ganancia del día: S/ ${gananciaDia.toFixed(2)}</h3>`;
        html += `</div>`;
    });

    const gananciaMes = totalVentasMes - totalGastosMes;
    html += `<div style="background:#e8f5e9; padding:25px; border-radius:12px; text-align:center; margin-top:30px;">`;
    html += `<h2>Resumen Total</h2>`;
    html += `<p><b>Total Ventas:</b> S/ ${totalVentasMes.toFixed(2)}</p>`;
    html += `<p><b>Total Gastos:</b> S/ ${totalGastosMes.toFixed(2)}</p>`;
    html += `<h2 style="color:green;">Ganancia Total: S/ ${gananciaMes.toFixed(2)}</h2>`;
    html += `</div>`;

    if (Object.keys(datosPorFecha).length === 0) {
        html = `<p style="color:orange; text-align:center;">Aún no hay movimientos registrados.</p>`;
    }

    document.getElementById('reporteContenido').innerHTML = html;
}