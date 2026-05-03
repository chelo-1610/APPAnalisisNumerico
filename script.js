let myChart = null;
let historial = [];

// Eventos de botones
document.getElementById('btn-calc').addEventListener('click', ejecutarAnalisis);
document.getElementById('btn-clear').addEventListener('click', limpiarTodo);
document.getElementById('btn-theme').addEventListener('click', cambiarTema);

function cambiarTema() {
    const body = document.body;
    const current = body.getAttribute('data-theme');
    body.setAttribute('data-theme', current === 'dark' ? 'light' : 'dark');
}

function limpiarTodo() {
    document.getElementById('ent-func').value = "";
    document.getElementById('txt-res').innerText = "Esperando cálculos...";
    document.getElementById('tabla-container').style.display = 'none';
    if(myChart) myChart.destroy();
}

function ejecutarAnalisis() {
    const resBox = document.getElementById('txt-res');
    const inputs = {
        funcStr: document.getElementById('ent-func').value,
        metodo: document.getElementById('menu-metodo').value,
        a: parseFloat(document.getElementById('ent-a').value),
        b: parseFloat(document.getElementById('ent-b').value),
        tol: parseFloat(document.getElementById('ent-tol').value),
        maxIter: 100
    };

    try {
        let resultado;
        const f = (val) => math.evaluate(inputs.funcStr, { x: val });

        if (inputs.metodo === "Bisección") resultado = metodoBiseccion(f, inputs.a, inputs.b, inputs.tol, inputs.maxIter);
        else if (inputs.metodo === "Regula Falsi") resultado = metodoRegulaFalsi(f, inputs.a, inputs.b, inputs.tol, inputs.maxIter);
        else if (inputs.metodo === "Newton-Raphson") {
            const df = (val) => math.derivative(inputs.funcStr, 'x').evaluate({ x: val });
            resultado = metodoNewton(f, df, inputs.a, inputs.tol, inputs.maxIter);
        } else if (inputs.metodo === "Secante") resultado = metodoSecante(f, inputs.a, inputs.b, inputs.tol, inputs.maxIter);
        else if (inputs.metodo === "Punto Fijo") resultado = metodoPuntoFijo(f, inputs.a, inputs.tol, inputs.maxIter);

        procesarResultado(inputs, resultado);

    } catch (e) {
        resBox.innerText = `❌ ERROR:\n${e.message}`;
        document.getElementById('tabla-container').style.display = 'none';
    }
}

function procesarResultado(inputs, resultado) {
    const { raiz, pasos } = resultado;
    const errorFinal = pasos[pasos.length - 1].error;

    // Mostrar Texto
    document.getElementById('txt-res').innerText = 
        `✅ ${inputs.metodo} EXITOSO\nRaíz: ${raiz.toFixed(6)}\nIteraciones: ${pasos.length}\nError: ${errorFinal.toExponential(4)}`;
    
    renderizarGrafica(inputs.funcStr, raiz);
    mostrarTabla(pasos);
    agregarAHistorial(inputs, resultado);
}

function agregarAHistorial(inputs, resultado) {
    const item = { inputs, resultado, id: Date.now() };
    historial.unshift(item);
    if (historial.length > 4) historial.pop(); // Solo guardamos los últimos 4

    const lista = document.getElementById('historial-lista');
    lista.innerHTML = "";
    historial.forEach(h => {
        const div = document.createElement('div');
        div.className = "hist-item";
        div.innerHTML = `<strong>${h.inputs.metodo}</strong>: ${h.inputs.funcStr}`;
        div.onclick = () => restaurarHistorial(h);
        lista.appendChild(div);
    });
}

function restaurarHistorial(h) {
    document.getElementById('ent-func').value = h.inputs.funcStr;
    document.getElementById('menu-metodo').value = h.inputs.metodo;
    document.getElementById('ent-a').value = h.inputs.a;
    document.getElementById('ent-b').value = h.inputs.b;
    document.getElementById('ent-tol').value = h.inputs.tol;
    procesarResultado(h.inputs, h.resultado);
}

// --- ALGORITMOS (Copia los mismos que ya tenías: Biseccion, Newton, etc.) ---
function metodoBiseccion(f, a, b, tol, maxIter) {
    if (f(a) * f(b) > 0) throw new Error("Signos iguales en los extremos.");
    let pasos = [], c = a;
    for (let i = 1; i <= maxIter; i++) {
        let cOld = c;
        c = (a + b) / 2;
        let fc = f(c);
        let error = i > 1 ? Math.abs(c - cOld) : Math.abs(b - a) / 2;
        pasos.push({ iter: i, a, b, c, fc, error });
        if (Math.abs(fc) < tol || error < tol) break;
        if (f(a) * fc < 0) b = c; else a = c;
    }
    return { raiz: c, pasos };
}

function metodoRegulaFalsi(f, a, b, tol, maxIter) {
    if (f(a) * f(b) > 0) throw new Error("Signos iguales.");
    let pasos = [], c = a;
    for (let i = 1; i <= maxIter; i++) {
        let cOld = c, fa = f(a), fb = f(b);
        c = b - (fb * (b - a)) / (fb - fa);
        let fc = f(c);
        let error = Math.abs(c - cOld);
        pasos.push({ iter: i, a, b, c, fc, error });
        if (Math.abs(fc) < tol || error < tol) break;
        if (fa * fc < 0) b = c; else a = c;
    }
    return { raiz: c, pasos };
}

function metodoNewton(f, df, x0, tol, maxIter) {
    let pasos = [], xn = x0;
    for (let i = 1; i <= maxIter; i++) {
        let fxn = f(xn), dfxn = df(xn);
        if (Math.abs(dfxn) < 1e-12) throw new Error("Derivada nula.");
        let xNext = xn - fxn / dfxn;
        let error = Math.abs(xNext - xn);
        pasos.push({ iter: i, a: xn, b: null, c: xNext, fc: f(xNext), error });
        xn = xNext;
        if (Math.abs(f(xn)) < tol || error < tol) break;
    }
    return { raiz: xn, pasos };
}

function metodoSecante(f, x0, x1, tol, maxIter) {
    let pasos = [];
    for (let i = 1; i <= maxIter; i++) {
        let fx0 = f(x0), fx1 = f(x1);
        if (Math.abs(fx1 - fx0) < 1e-12) throw new Error("División por cero.");
        let x2 = x1 - fx1 * (x1 - x0) / (fx1 - fx0);
        let error = Math.abs(x2 - x1);
        pasos.push({ iter: i, a: x0, b: x1, c: x2, fc: f(x2), error });
        x0 = x1; x1 = x2;
        if (Math.abs(f(x2)) < tol || error < tol) break;
    }
    return { raiz: x1, pasos };
}

function metodoPuntoFijo(g, x0, tol, maxIter) {
    let pasos = [], xn = x0;
    for (let i = 1; i <= maxIter; i++) {
        let xNext = g(xn);
        let error = Math.abs(xNext - xn);
        pasos.push({ iter: i, a: xn, b: null, c: xNext, fc: xNext, error });
        if (error < tol) { xn = xNext; break; }
        xn = xNext;
        if (i === maxIter) throw new Error("Divergencia.");
    }
    return { raiz: xn, pasos };
}

// --- INTERFAZ ---
function mostrarTabla(pasos) {
    const container = document.getElementById('tabla-container');
    const tbody = document.querySelector('#tabla-pasos tbody');
    container.style.display = 'block';
    tbody.innerHTML = ""; 
    pasos.forEach(p => {
        const fila = document.createElement('tr');
        fila.innerHTML = `<td>${p.iter}</td><td>${p.a!==null?p.a.toFixed(4):'-'}</td><td>${p.b!==null?p.b.toFixed(4):'-'}</td><td>${p.c.toFixed(6)}</td><td>${p.fc.toFixed(6)}</td><td>${p.error.toExponential(2)}</td>`;
        tbody.appendChild(fila);
    });
}

function renderizarGrafica(funcStr, raiz) {
    const ctx = document.getElementById('myChart').getContext('2d');
    const dataPoints = [];
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    
    for (let x = raiz - 2; x <= raiz + 2; x += 0.05) {
        try { dataPoints.push({ x: x, y: math.evaluate(funcStr, { x: x }) }); } catch (e) {}
    }
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'f(x)', data: dataPoints, borderColor: isDark ? '#ADFF2F' : '#6B8E23', borderWidth: 2, pointRadius: 0, fill: false
            }, {
                label: 'Raíz', data: [{ x: raiz, y: 0 }], backgroundColor: '#D35400', pointRadius: 8, showLine: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { type: 'linear', position: 'bottom', grid: { color: isDark ? '#444' : '#ddd' }, ticks: { color: isDark ? '#eee' : '#333' } },
                y: { grid: { color: isDark ? '#444' : '#ddd' }, ticks: { color: isDark ? '#eee' : '#333' } }
            },
            plugins: { legend: { labels: { color: isDark ? '#eee' : '#333' } } }
        }
    });
}

// --- COMPARADOR DE METODOS ---
function compararMetodos() {
    const funcStr = document.getElementById('ent-func').value;
    const a = parseFloat(document.getElementById('ent-a').value);
    const b = parseFloat(document.getElementById('ent-b').value);
    const tol = parseFloat(document.getElementById('ent-tol').value);
    const maxIter = 100;

    const f = (val) => math.evaluate(funcStr, { x: val });
    const df = (val) => math.derivative(funcStr, 'x').evaluate({ x: val });

    const metodos = [
        {
            nombre: "Bisección",
            fn: () => metodoBiseccion(f, a, b, tol, maxIter)
        },
        {
            nombre: "Regula Falsi",
            fn: () => metodoRegulaFalsi(f, a, b, tol, maxIter)
        },
        {
            nombre: "Newton-Raphson",
            fn: () => metodoNewton(f, df, a, tol, maxIter)
        },
        {
            nombre: "Secante",
            fn: () => metodoSecante(f, a, b, tol, maxIter)
        },
        {
            nombre: "Punto Fijo",
            fn: () => metodoPuntoFijo(f, a, tol, maxIter)
        }
    ];

    const resultados = [];

    metodos.forEach(m => {
        const t0 = performance.now();
        try {
            const res = m.fn();
            const tiempo = performance.now() - t0;
            resultados.push({
                nombre:      m.nombre,
                convergio:   true,
                raiz:        res.raiz,
                iteraciones: res.pasos.length,
                error:       res.pasos[res.pasos.length - 1].error,
                tiempo:      tiempo,
                pasos:       res.pasos
            });
        } catch (e) {
            resultados.push({
                nombre:    m.nombre,
                convergio: false,
                motivo:    e.message
            });
        }
    });

    mostrarResultadosComparacion(resultados);
}

function mostrarResultadosComparacion(resultados) {
    const convergidos = resultados.filter(r => r.convergio);

    // Ranking por cada criterio (menor = mejor)
    const porIter  = [...convergidos].sort((a, b) => a.iteraciones - b.iteraciones);
    const porError = [...convergidos].sort((a, b) => a.error - b.error);
    const porTiempo= [...convergidos].sort((a, b) => a.tiempo - b.tiempo);

    // Puntaje combinado
    const puntajes = {};
    convergidos.forEach(r => puntajes[r.nombre] = 0);
    [porIter, porError, porTiempo].forEach(lista => {
        lista.forEach((r, pos) => puntajes[r.nombre] += pos);
    });
    const ganador = Object.entries(puntajes).sort((a, b) => a[1] - b[1])[0];

    // texto
    let texto = ` COMPARACIÓN DE MÉTODOS\n`;
    texto += `${'─'.repeat(52)}\n`;
    texto += `${'Método'.padEnd(18)} ${'Raíz'.padStart(10)} ${'Iter'.padStart(5)} ${'Error'.padStart(12)} ${'Tiempo'.padStart(9)}\n`;
    texto += `${'─'.repeat(52)}\n`;

    resultados.forEach(r => {
        if (r.convergio) {
            texto += ` ${r.nombre.padEnd(16)} ${r.raiz.toFixed(6).padStart(10)} ${String(r.iteraciones).padStart(5)} ${r.error.toExponential(2).padStart(12)} ${r.tiempo.toFixed(2).padStart(7)}ms\n`;
        } else {
            texto += ` ${r.nombre.padEnd(16)} No convergió: ${r.motivo}\n`;
        }
    });

    texto += `${'─'.repeat(52)}\n`;
    if (ganador) {
        texto += ` Ganador general   : ${ganador[0]}\n`;
        texto += ` Menos iteraciones : ${porIter[0].nombre}\n`;
        texto += ` Más preciso       : ${porError[0].nombre}\n`;
        texto += ` Más rápido        : ${porTiempo[0].nombre}\n`;
    }

    document.getElementById('txt-res').innerText = texto;

    // Mostrar tabla ganador
    if (ganador) {
        const resGanador = convergidos.find(r => r.nombre === ganador[0]);
        mostrarTabla(resGanador.pasos);
        renderizarGrafica(document.getElementById('ent-func').value, resGanador.raiz);
    }
}
