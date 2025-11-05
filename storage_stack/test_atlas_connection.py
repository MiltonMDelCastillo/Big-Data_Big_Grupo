#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para probar la conexión a MongoDB Atlas
Uso: python test_atlas_connection.py
"""

import os
import sys
from dotenv import load_dotenv
from pymongo import MongoClient

# Configurar encoding para Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

load_dotenv()

MONGO_URI = os.getenv('MONGO_URI')
MONGO_DB = os.getenv('MONGO_DB', 'iot')

if not MONGO_URI:
    print("[ERROR] MONGO_URI no está configurado en .env")
    exit(1)

try:
    print("[INFO] Conectando a MongoDB Atlas...")
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=10000)
    
    # Verificar conexión - forzar una operación para validar
    client.admin.command('ping')
    print("[OK] Conectado exitosamente a MongoDB Atlas")
    
    # Obtener info del servidor
    try:
        server_info = client.server_info()
        print(f"     Version: {server_info.get('version', 'N/A')}")
    except:
        pass
    
    # Listar bases de datos
    db_names = client.list_database_names()
    print(f"\n[INFO] Bases de datos disponibles: {', '.join(db_names)}")
    
    # Verificar base de datos objetivo
    db = client[MONGO_DB]
    collections = db.list_collection_names()
    print(f"\n[INFO] Colecciones en '{MONGO_DB}': {', '.join(collections) if collections else 'Ninguna'}")
    
    # Contar documentos en events
    if 'events' in collections:
        count = db.events.count_documents({})
        print(f"\n[INFO] Total de eventos: {count:,}")
        
        # Mostrar ejemplo
        if count > 0:
            sample = db.events.find_one()
            print(f"\n[INFO] Ejemplo de documento:")
            print(f"       devEui: {sample.get('device', {}).get('devEui', 'N/A')}")
            print(f"       time: {sample.get('time', 'N/A')}")
            print(f"       CO2: {sample.get('object', {}).get('co2', 'N/A')}")
    else:
        print("\n[WARN] La coleccion 'events' no existe aun")
    
    client.close()
    print("\n[OK] Conexion exitosa a MongoDB Atlas!")
    
except Exception as e:
    print(f"\n[ERROR] Error de conexion: {e}")
    print("\n[INFO] Verifica:")
    print("       1. Que MONGO_URI este correctamente configurado en .env")
    print("       2. Que tu IP este en la whitelist de MongoDB Atlas")
    print("       3. Que el usuario y contrasena sean correctos")
    exit(1)

