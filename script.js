// ==================== CONFIGURACIÓN DE FIREBASE ====================
const firebaseConfig = {
  apiKey: "AIzaSyBQZ9ITIXtAOjlKPQqDG0UWanNFEyxDArM",
  authDomain: "contabilidad-colan.firebaseapp.com",
  projectId: "contabilidad-colan",
  storageBucket: "contabilidad-colan.firebasestorage.app",
  messagingSenderId: "271536599286",
  appId: "1:271536599286:web:449a9f6c876a6766bb7cd7",
  measurementId: "G-R1V82VXLQ6"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Variables globales
let usuarioActual = null;
let inventario = [];
let ventas = [];
let gastos = [];

// ==================== AUTENTICACIÓN ====================
function mostrarCrearCuenta() {
    document.getElementById('modalCrear').style.display = 'block';
}

function mostrarIniciarSesion() {
    document.getElementById('modalLogin').style.display = 'block';
}

function cerrarModal(id) {
    document.getElementById(id).style.display = 'none';
}

function crearCuenta() {
    const nombre = document.getElementById('regNombre').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;

    if (!nombre || !email || !password) {
        alert("Completa todos los campos");
        return;
    }

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            return db.collection('usuarios').doc(user.uid).set({
                nombre: nombre,
                email: email,
                inventario: [],
                ventas: [],
                gastos: []
            });
        })
        .then(() => {
            alert("Cuenta creada correctamente. Ahora inicia sesión.");
            cerrarModal('modalCrear');
        })
        .catch((error) => {
            alert("Error: " + error.message);
        });
}

function iniciarSesion() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        alert("Completa correo y contraseña");
        return;
    }

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            usuarioActual = userCredential.user;
            cargarDatosUsuario();
            cerrarModal('modalLogin');
            actualizarUI();
        })
        .catch((error) => {
            alert("Error: " + error.message);
        });
}

function cerrarSesion() {
    auth.signOut().then(() => {
        usuarioActual = null;
        inventario = [];
        ventas = [];
        gastos = [];
        actualizarUI();
        showSection('inicio');
        alert("Sesión cerrada");
    });
}

function actualizarUI() {
    const btnCerrar = document.getElementById('btnCerrarSesion');
    const usuarioTexto = document.getElementById('usuarioActual');

    if (usuarioActual) {
        btnCerrar.style.display = 'inline-block';
        usuarioTexto.innerText = "Usuario: " + usuarioActual.email;
    } else {
        btnCerrar.style.display = 'none';
        usuarioTexto.innerText = "";
    }
}

function cargarDatosUsuario() {
    if (!usuarioActual) return;

    db.collection('usuarios').doc(usuarioActual.uid).get()
        .then((doc) => {
            if (doc.exists) {
                const data = doc.data();
                inventario = data.inventario || [];
                ventas = data.ventas || [];
                gastos = data.gastos || [];
                actualizarInventario();
                actualizarSelectVentas();
                actualizarSelectGastoProducto();
            }
        });
}

function guardarDatosUsuario() {
    if (!usuarioActual) return;

    db.collection('usuarios').doc(usuarioActual.uid).update({
        inventario: inventario,
        ventas: ventas,
        gastos: gastos
    });
}

// ==================== NAVEGACIÓN ====================
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
    if (!usuarioActual) return alert("Debes iniciar sesión primero");

    const nombre = document.getElementById('prodNombre').value.trim();
    const cantidad = parseFloat(document.getElementById('prodCantidad').value);
    const unidad = document.getElementById('prodUnidad').value || 'kg';

    if (!nombre || isNaN(cantidad)) return alert("Completa nombre y cantidad");

    const existe = inventario.find(p => p.nombre.toLowerCase() === nombre.toLowerCase());
    if (existe) existe.cantidad += cantidad;
    else inventario.push({nombre, cantidad, unidad});

    guardarDatosUsuario();
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
    if (!usuarioActual) return alert("Debes iniciar sesión primero");

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
        
        guardarDatosUsuario();
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

    const productosUnicos = new Set();
    inventario.forEach(p => productosUnicos.add(p.nombre));
    ventas.forEach(v => productosUnicos.add(v.producto));

    let options = '<option value="">Selecciona un producto</option>';
    productosUnicos.forEach(nombre => {
        options += `<option value="${nombre}">${nombre}</option>`;
    });
    select.innerHTML = options;
}

function registrarGasto() {
    if (!usuarioActual) return alert("Debes iniciar sesión primero");

    const desc = document.getElementById('gastoDesc').value.trim();
    const monto = parseFloat(document.getElementById('gastoMonto').value);
    const cat = document.getElementById('gastoCategoria').value;
    const producto = document.getElementById('gastoProducto').value;

    if (!desc || isNaN(monto)) {
        alert("Completa descripción y monto");
        return;
    }
    if (!producto) {
        alert("Debes seleccionar el producto");
        return;
    }

    gastos.push({
        fecha: new Date().toLocaleDateString('es-PE'),
        descripcion: desc,
        monto: monto,
        categoria: cat,
        producto: producto
    });

    guardarDatosUsuario();
    actualizarGastos();
    alert("Gasto asignado a: " + producto);
}

function actualizarGastos() {
    const lista = document.getElementById('listaGastos');
    if (!lista) return;
    lista.innerHTML = gastos.slice(-5).map(g => 
        `<li>${g.fecha} - ${g.descripcion} (${g.categoria}) → <b>${g.producto}</b>: S/${g.monto}</li>`
    ).join('');
}

// ==================== REPORTE ====================
function generarReporte() {
    let html = `<h2>📊 Reporte por Producto y Fecha</h2>`;

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

        const fechas = new Set();
        ventasProd.forEach(v => fechas.add(v.fecha));
        gastosProd.forEach(g => fechas.add(g.fecha));

        html += `<div style="border:3px solid #2e7d32; padding:20px; margin:25px 0; border-radius:12px; background:#f9fff9;">`;
        html += `<h2 style="color:#1b5e20; text-align:center;">Producto: ${prod}</h2>`;

        fechas.forEach(fecha => {
            const ventasFecha = ventasProd.filter(v => v.fecha === fecha);
            const gastosFecha = gastosProd.filter(g => g.fecha === fecha);

            const totalVentas = ventasFecha.reduce((sum, v) => sum + v.total, 0);
            const totalGastos = gastosFecha.reduce((sum, g) => sum + g.monto, 0);
            const ganancia = totalVentas - totalGastos;

            html += `<div style="border-left:5px solid #4caf50; padding-left:15px; margin:15px 0;">`;
            html += `<h4>📅 Fecha: ${fecha}</h4>`;

            if (ventasFecha.length > 0) {
                html += `<p><b>Ventas:</b></p>`;
                ventasFecha.forEach(v => {
                    html += `<p style="margin-left:15px;">${v.cantidad} und. × S/${v.precio} = S/ ${v.total.toFixed(2)}</p>`;
                });
            }

            if (gastosFecha.length > 0) {
                html += `<p><b>Gastos:</b></p>`;
                gastosFecha.forEach(g => {
                    html += `<p style="margin-left:15px;">${g.descripcion} (${g.categoria}): S/ ${g.monto.toFixed(2)}</p>`;
                });
            }

            html += `<p style="color:green; font-weight:bold;">Ganancia del día: S/ ${ganancia.toFixed(2)}</p>`;
            html += `</div>`;
        });

        html += `</div>`;
    });

    document.getElementById('reporteContenido').innerHTML = html;
}

function borrarHistorial() {
    if (!usuarioActual) return alert("Debes iniciar sesión");
    if (confirm("¿Borrar todo el historial de ventas y gastos?")) {
        ventas = [];
        gastos = [];
        guardarDatosUsuario();
        generarReporte();
        alert("Historial borrado");
    }
}

function exportarCSV() {
    let csv = "Fecha,Tipo,Producto,Detalle,Monto\n";
    ventas.forEach(v => csv += `${v.fecha},Venta,${v.producto},${v.cantidad} und,${v.total}\n`);
    gastos.forEach(g => csv += `${g.fecha},Gasto,${g.producto},${g.descripcion},${g.monto}\n`);
    const blob = new Blob([csv], {type: 'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'reporte.csv'; a.click();
}

// Detectar si ya hay sesión iniciada
auth.onAuthStateChanged((user) => {
    if (user) {
        usuarioActual = user;
        cargarDatosUsuario();
        actualizarUI();
    }
});