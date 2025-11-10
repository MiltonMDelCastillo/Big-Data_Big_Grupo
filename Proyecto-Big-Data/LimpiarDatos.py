import pandas as pd
import os

# === 1️⃣ Configuración de rutas ===
ruta_base = r"D:\Recursos"
archivos = {
    "aire": os.path.join(ruta_base, "CO2.csv"),
    "sonido": os.path.join(ruta_base, "SONIDO.csv"),
    "soterrado": os.path.join(ruta_base, "soterrados.csv"),
}

# === 2️⃣ Función para limpiar y extraer columnas ===
def limpiar_csv(ruta, tipo):
    try:
        # 1️⃣ Intento normal
        df = pd.read_csv(ruta, encoding="utf-8", low_memory=False)
    except pd.errors.ParserError:
        print("⚠️ Error al parsear CSV, intentando modo tolerante (on_bad_lines='skip')...")
        try:
            # 2️⃣ Segundo intento más tolerante
            df = pd.read_csv(
                ruta,
                encoding="utf-8",
                low_memory=False,
                on_bad_lines="skip",
                engine="python"   # 👈 usa motor Python, más flexible
            )
        except Exception as e:
            print(f"❌ Error grave al leer {ruta}: {e}")
            return pd.DataFrame()  # Devuelve vacío si no se puede leer

    print(f"✅ CSV cargado correctamente con {len(df)} filas después de limpiar.")
    
    # === Limpieza básica ===
    df = df.drop_duplicates()
    df = df.dropna(how="all")
    df = df.fillna("NoData")

    # === Limpieza específica por tipo ===
    if tipo == "aire":
        df_limpio = pd.DataFrame({
            "tipo": tipo,
            "fecha": df["time"],
            "valor": df["object.co2"],
            "temperatura": df.get("object.temperature", None),
            "humedad": df.get("object.humidity", None),
            "ubicacion": df["deviceInfo.tags.Location"].fillna("") + ", " + df["deviceInfo.tags.Address"].fillna(""),
            "nombre_sensor": df["deviceInfo.tags.Name"],
            "bateria": df["object.battery"]
        })

    elif tipo == "sonido":
        df_limpio = pd.DataFrame({
            "tipo": tipo,
            "fecha": df["time"],
            "valor": df["object.LAeq"],
            "ubicacion": df["deviceInfo.tags.Location"].fillna("") + ", " + df["deviceInfo.tags.Address"].fillna(""),
            "nombre_sensor": df["deviceInfo.tags.Name"],
            "bateria": df["object.battery"]
        })

    elif tipo == "soterrado":
        df_limpio = pd.DataFrame({
            "tipo": tipo,
            "fecha": df["time"],
            "valor": df["object.distance"],
            "ubicacion": df["deviceInfo.tags.Location"].fillna("") + ", " + df["deviceInfo.tags.Address"].fillna(""),
            "nombre_sensor": df["deviceInfo.tags.Name"],
            "bateria": df["object.battery"]
        })

    else:
        raise ValueError("Tipo no reconocido")

    # === Limpieza general ===
    df_limpio = df_limpio.dropna(subset=["fecha", "valor"])
    df_limpio["fecha"] = pd.to_datetime(df_limpio["fecha"], errors="coerce")
    df_limpio = df_limpio.dropna(subset=["fecha"])
    df_limpio = df_limpio.drop_duplicates()

    print(f"➡️ {tipo.upper()} limpio: {len(df_limpio)} filas útiles")

    return df_limpio

# === 3️⃣ Procesar los tres archivos ===
todos = []
for tipo, ruta in archivos.items():
    if os.path.exists(ruta):
        print(f"\n📂 Procesando archivo: {ruta}")
        df_limpio = limpiar_csv(ruta, tipo)
        if not df_limpio.empty:
            todos.append(df_limpio)
        else:
            print(f"⚠️ {tipo.upper()} no produjo filas válidas.")
    else:
        print(f"❌ Archivo no encontrado: {ruta}")

# === 4️⃣ Combinar en un solo CSV ===
if todos:
    df_final = pd.concat(todos, ignore_index=True)
    df_final.to_csv("datos_limpios.csv", index=False, encoding="utf-8")
    print(f"\n✅ Archivo combinado guardado como 'datos_limpios.csv' con {len(df_final)} filas totales.")
else:
    print("❌ No se encontró ningún archivo válido para procesar.")
