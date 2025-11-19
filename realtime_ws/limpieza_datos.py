import pandas as pd

def limpiar_datos(df: pd.DataFrame) -> pd.DataFrame:
    """Limpia el DataFrame eliminando filas vacías, duplicados y corrigiendo tipos."""
    
    # Eliminar filas totalmente vacías
    df = df.dropna(how="all")
    
    # Eliminar duplicados
    df = df.drop_duplicates()
    
    # Convertir columnas numéricas donde aplique
    for col in df.columns:
        if df[col].dtype == object:
            # intentar convertir a número si tiene valores numéricos
            df[col] = pd.to_numeric(df[col], errors="ignore")

    return df
