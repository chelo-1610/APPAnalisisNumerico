import customtkinter as ctk
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg, NavigationToolbar2Tk
import numpy as np
import sympy as sp
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
from analisis_pro import analizar_funcion_completa # Integración correcta de tu archivo
import logic

class AnalisisNumericoApp(ctk.CTk):
    def __init__(self):
        super().__init__()
        self.title("Numerical Analysis Tool v1.0")
        self.geometry("1100x700")
        ctk.set_appearance_mode("light") 
        
        # Colores personalizados (Beige/Professional)
        self.bg_color = "#F5F5DC" 
        self.accent_color = "#4A4A4A"
        self.configure(fg_color=self.bg_color)

        self.setup_ui()

    def setup_ui(self):
        self.grid_columnconfigure(0, weight=3) # Gráfica y Resultados
        self.grid_columnconfigure(1, weight=1) # Inputs

        # --- PANEL DERECHO: INPUTS ---
        self.panel_inputs = ctk.CTkFrame(self, fg_color="#E8E8D0", corner_radius=15)
        self.panel_inputs.grid(row=0, column=1, sticky="nsew", padx=15, pady=15)

        ctk.CTkLabel(self.panel_inputs, text="CONFIGURACIÓN", font=("Arial", 16, "bold"), text_color=self.accent_color).pack(pady=20)
        
        self.ent_func = self.crear_input("Función f(x):", "x**3 - x**2 + 2")
        self.ent_a = self.crear_input("Límite inferior (a):", "-2")
        self.ent_b = self.crear_input("Límite superior (b):", "2")
        self.ent_tol = self.crear_input("Tolerancia:", "0.0001")

        self.btn_calc = ctk.CTkButton(self.panel_inputs, text="CALCULAR", fg_color="#6B8E23", 
                                      hover_color="#556B2F", font=("Arial", 14, "bold"), 
                                      command=self.ejecutar_analisis)
        self.btn_calc.pack(pady=30, padx=20, fill="x", ipady=5)

        # --- PANEL IZQUIERDO: VISUALIZACIÓN ---
        self.panel_viz = ctk.CTkFrame(self, fg_color=self.bg_color)
        self.panel_viz.grid(row=0, column=0, sticky="nsew", padx=10, pady=10)
        
        # Frame para la Gráfica
        self.frame_grafica = ctk.CTkFrame(self.panel_viz, fg_color="white", height=400, corner_radius=10)
        self.frame_grafica.pack(fill="both", expand=True, padx=10, pady=(10, 5))

        # Textbox para Resultados
        self.txt_res = ctk.CTkTextbox(self.panel_viz, height=180, font=("Courier New", 14), 
                                      fg_color="#FDFDF8", text_color="#333333", border_width=1)
        self.txt_res.pack(fill="x", padx=10, pady=(5, 10))

    def crear_input(self, label, default_value):
        ctk.CTkLabel(self.panel_inputs, text=label, text_color=self.accent_color, font=("Arial", 12, "bold")).pack(pady=(10,0), padx=20, anchor="w")
        entry = ctk.CTkEntry(self.panel_inputs, border_color="#BDBDA0", fg_color="white", text_color="black")
        entry.insert(0, default_value) 
        entry.pack(pady=(0,10), padx=20, fill="x")
        return entry

    def ejecutar_analisis(self):
        # Limpiar resultados anteriores
        self.txt_res.delete("0.0", "end")
        
        func_str = self.ent_func.get().strip()
        
        try:
            # Obtener datos de la interfaz
            a = float(self.ent_a.get())
            b = float(self.ent_b.get())
            tol = float(self.ent_tol.get())
            max_iter = 100 
            
            # Ejecutar la lógica de bisección
            raiz_encontrada, pasos = logic.metodo_biseccion(func_str, a, b, tol, max_iter)
            
            # Renderizar la gráfica con los puntos críticos desde analisis_pro
            self.renderizar_grafica(func_str, raiz_encontrada)
            
            # Formatear el resultado en el Textbox
            error_final = pasos[-1]['error'] if pasos else 0
            
            resultado_texto = f"✅ ANÁLISIS COMPLETADO EXITOSAMENTE\n"
            resultado_texto += f"-" * 45 + "\n"
            resultado_texto += f"Método utilizado  : Bisección\n"
            resultado_texto += f"Raíz aproximada   : {raiz_encontrada:.6f}\n"
            resultado_texto += f"Iteraciones       : {len(pasos)}\n"
            resultado_texto += f"Error tolerado    : {error_final:.2e}\n\n"
            
            self.txt_res.insert("0.0", resultado_texto)

        except ValueError as ve:
            self.txt_res.insert("0.0", f"❌ ERROR DE VALIDACIÓN:\n{ve}\n\nVerifique que los valores ingresados sean correctos.")
            self.limpiar_grafica()
        except Exception as e:
            self.txt_res.insert("0.0", f"❌ ERROR INESPERADO:\n{str(e)}")
            self.limpiar_grafica()
            
    def limpiar_grafica(self):
        for widget in self.frame_grafica.winfo_children():
            widget.destroy()

    def renderizar_grafica(self, func_str, raiz):
        self.limpiar_grafica()
        plt.close('all') # Prevenir fugas de memoria

        try:
            # Obtener datos procesados con los puntos críticos y derivadas
            x_vals, y_vals, puntos_criticos, f_num = analizar_funcion_completa(func_str, raiz)

            fig, ax = plt.subplots(figsize=(6, 4), dpi=100)
            fig.patch.set_facecolor('white') 
            
            ax.plot(x_vals, y_vals, label=f"f(x)", color="#2E4053", linewidth=2.5)
            ax.axhline(0, color='black', linewidth=1)
            ax.axvline(0, color='black', linewidth=0.5, linestyle='--')

            # Resaltar la Raíz
            ax.scatter([raiz], [0], color='#D35400', s=120, zorder=5, label=f"Raíz: {raiz:.4f}")
            
            # Resaltar Puntos Críticos (Máximos/Mínimos) calculados por analisis_pro
            for pc in puntos_criticos:
                if x_vals.min() < pc < x_vals.max():
                    ax.scatter([pc], [f_num(pc)], color='#F39C12', marker='D', s=60, label="Punto Crítico", zorder=4)

            ax.set_title(f"Análisis Numérico de f(x) = {func_str}", fontsize=12, color="#4A4A4A", pad=15)
            ax.grid(True, alpha=0.3, linestyle='--')
            
            handles, labels = ax.get_legend_handles_labels()
            by_label = dict(zip(labels, handles))
            ax.legend(by_label.values(), by_label.keys(), loc="best", framealpha=0.9)

            canvas = FigureCanvasTkAgg(fig, master=self.frame_grafica)
            canvas.draw()
            
            # 2. Crear y empaquetar la barra de herramientas (Zoom, Paneo, Guardar)
            toolbar = NavigationToolbar2Tk(canvas, self.frame_grafica)
            toolbar.update()
            toolbar.config(background="#F5F5DC") 
            toolbar.pack(side="bottom", fill="x")
            
            # 3. Empaquetar la gráfica propiamente dicha
            canvas.get_tk_widget().pack(side="top", fill="both", expand=True, padx=5, pady=5)
            
        except Exception as e:
            self.txt_res.insert("end", f"\n⚠️ Advertencia gráfica: {e}")

if __name__ == "__main__":
    app = AnalisisNumericoApp()
    app.mainloop()