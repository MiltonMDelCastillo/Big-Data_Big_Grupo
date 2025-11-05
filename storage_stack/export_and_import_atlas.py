#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para exportar datos de MongoDB local e importarlos directamente a Atlas
Uso: python export_and_import_atlas.py
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

MONGO_URI_LOCAL = "mongodb://localhost:27017"
MONGO_URI_ATLAS = os.getenv('MONGO_URI')
MONGO_DB = os.getenv('MONGO_DB', 'iot')

if not MONGO_URI_ATLAS:
    print("[ERROR] MONGO_URI no esta configurado en .env")
    exit(1)

try:
    print("[INFO] Conectando a MongoDB local...")
    client_local = MongoClient(MONGO_URI_LOCAL, serverSelectionTimeoutMS=5000)
    client_local.admin.command('ping')
    print("[OK] Conectado a MongoDB local")
    
    db_local = client_local[MONGO_DB]
    collection_local = db_local.events
    
    count_local = collection_local.count_documents({})
    print(f"[INFO] Documentos en MongoDB local: {count_local:,}")
    
    if count_local == 0:
        print("[WARN] No hay documentos para importar")
        exit(0)
    
    print("\n[INFO] Conectando a MongoDB Atlas...")
    client_atlas = MongoClient(MONGO_URI_ATLAS, serverSelectionTimeoutMS=10000)
    client_atlas.admin.command('ping')
    print("[OK] Conectado a MongoDB Atlas")
    
    db_atlas = client_atlas[MONGO_DB]
    collection_atlas = db_atlas.events
    
    # Verificar si ya hay datos
    existing_count = collection_atlas.count_documents({})
    if existing_count > 0:
        print(f"[WARN] Ya existen {existing_count} documentos en Atlas")
        response = input("¿Deseas eliminar los datos existentes y reemplazarlos? (s/n): ")
        if response.lower() == 's':
            collection_atlas.delete_many({})
            print("[INFO] Datos existentes eliminados")
        else:
            print("[INFO] Los datos nuevos se agregaran a los existentes")
    
    print("\n[INFO] Exportando e importando datos...")
    print("       Esto puede tomar unos minutos...")
    
    # Exportar en lotes e importar directamente
    batch_size = 1000
    imported = 0
    batch = []
    
    for doc in collection_local.find():
        batch.append(doc)
        
        if len(batch) >= batch_size:
            collection_atlas.insert_many(batch, ordered=False)
            imported += len(batch)
            print(f"       Importados: {imported:,} documentos...", end='\r')
            batch = []
    
    # Insertar el último lote
    if batch:
        collection_atlas.insert_many(batch, ordered=False)
        imported += len(batch)
    
    print(f"\n[OK] Importacion completada!")
    print(f"     Total de documentos importados: {imported:,}")
    
    # Verificar
    final_count = collection_atlas.count_documents({})
    print(f"     Total de documentos en Atlas: {final_count:,}")
    
    # Crear índices
    print("\n[INFO] Creando indices...")
    collection_atlas.create_index([("device.devEui", 1), ("time", -1)])
    collection_atlas.create_index([("object.co2", 1), ("time", -1)])
    collection_atlas.create_index([("rx.rssi", -1)])
    print("[OK] Indices creados")
    
    client_local.close()
    client_atlas.close()
    
    print("\n[OK] ¡Migracion completada exitosamente!")
    
except Exception as e:
    print(f"\n[ERROR] Error durante la migracion: {e}")
    import traceback
    traceback.print_exc()
    print("\n[INFO] Verifica:")
    print("       1. Que MongoDB local este corriendo (docker)")
    print("       2. Que tu IP este en la whitelist de MongoDB Atlas")
    print("       3. Que las credenciales sean correctas")
    exit(1)

