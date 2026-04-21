import sympy as sp
import numpy as np

def analizar_funcion_completa(func_str, raiz, margen=2):
    x = sp.symbols('x')
    expr = sp.parse_expr(func_str.replace("^", "**"))
    f_num = sp.lambdify(x, expr, 'numpy')
    
    # 1. Derivada para puntos críticos (Máximos/Mínimos)
    derivada = sp.diff(expr, x)
    puntos_criticos_x = []
    try:
        # Buscamos donde f'(x) = 0
        soluciones = sp.solve(derivada, x)
        for s in soluciones:
            if getattr(s, 'is_real', False):
                try:
                    puntos_criticos_x.append(float(s.evalf()))
                except (TypeError, ValueError):
                    pass
    except Exception:
        pass # Algunas funciones no tienen solución analítica fácil

    # 2. Definir límites inteligentes basados en la raíz
    x_min, x_max = raiz - margen, raiz + margen
    x_vals = np.linspace(x_min, x_max, 500)
    y_vals = f_num(x_vals)

    return x_vals, y_vals, puntos_criticos_x, f_num