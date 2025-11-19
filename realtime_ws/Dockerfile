# Base Python
FROM python:3.10

# Directorio de la app
WORKDIR /app

# Copiar requirements
COPY requirements.txt .

# Instalar dependencias
RUN pip install --no-cache-dir -r requirements.txt

# Copiar todo el código
COPY . .

# Exponer puerto de Flask
EXPOSE 5000

# Ejecutar la app con eventlet (recomendado para SocketIO)
CMD ["python", "create_endpoint.py"]
