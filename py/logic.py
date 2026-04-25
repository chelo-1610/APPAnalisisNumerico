import sympy as sp
import numpy as np

def evaluar_funcion(input_str, valor_x):
    x = sp.symbols('x')
    # Convierte el string del usuario en una expresión matemática
    expr = sp.parse_expr(input_str.replace("^", "**")) 
    return float(expr.subs(x, valor_x))

def metodo_biseccion(func_str, a, b, tol, max_iter):
    x = sp.symbols('x')
    
    # Convertimos la función para evaluarla de forma rápida (lambdify es más rápido que subs en ciclos)
    try:
        expr = sp.parse_expr(func_str.replace("^", "**"))
        f = sp.lambdify(x, expr, 'math')
    except Exception as e:
        raise ValueError(f"Error al procesar la función: {e}")

    fa = f(a)
    fb = f(b)

    if fa * fb > 0:
        raise ValueError("El intervalo no es válido: f(a) y f(b) deben tener signos opuestos.")

    iteraciones = []
    c = a

    for i in range(1, max_iter + 1):
        c_old = c
        c = (a + b) / 2
        fc = f(c)
        
        error = abs(c - c_old) if i > 1 else abs(b - a) / 2
        
        # Guardamos el registro de este paso
        iteraciones.append({
            "iteracion": i,
            "a": a,
            "b": b,
            "c": c,
            "f(c)": fc,
            "error": error
        })
        
        # Condición de parada: si la tolerancia se cumple o si encontramos la raíz exacta
        if abs(fc) < tol or error < tol:
            break
            
        # Redefinir el intervalo para la próxima iteración
        if fa * fc < 0:
            b = c
        else:
            a = c
            fa = fc
            
    return c, iteraciones

def obtener_datos_grafica(func_str, a, b):
    x = sp.symbols('x')
    expr = sp.parse_expr(func_str.replace("^", "**"))
    f = sp.lambdify(x, expr, 'numpy')
    
    margen = (b - a) * 0.2 if b != a else 1
    x_vals = np.linspace(a - margen, b + margen, 400)
    y_vals = f(x_vals)
    
    return x_vals, y_vals