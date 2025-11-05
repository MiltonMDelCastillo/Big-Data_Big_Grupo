#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para importar datos desde backup local a MongoDB Atlas
Uso: python import_to_atlas.py
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from pymongo import MongoClient
from bson import decode_file_iter

# Configurar encoding para Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

load_dotenv()

MONGO_URI = os.getenv('MONGO_URI')
MONGO_DB = os.getenv('MONGO_DB', 'iot')

if not MONGO_URI:
    print("[ERROR] MONGO_URI no esta configurado en .env")
    exit(1)

# Buscar el backup más reciente
backup_dir = Path(".")
backup_folders = sorted([d for d in backup_dir.glob("backup_mongo_*") if d.is_dir()], reverse=True)

if not backup_folders:
    print("[ERROR] No se encontro carpeta de backup")
    print("[INFO] Ejecuta primero: .\\backup_mongo.ps1")
    exit(1)

backup_path = backup_folders[0] / MONGO_DB / "events.bson"
if not backup_path.exists():
    print(f"[ERROR] No se encontro el archivo de backup: {backup_path}")
    exit(1)

print(f"[INFO] Usando backup: {backup_folders[0].name}")
print(f"[INFO] Archivo: {backup_path}")
print("")

try:
    print("[INFO] Conectando a MongoDB Atlas...")
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=10000)
    client.admin.command('ping')
    print("[OK] Conectado exitosamente")
    
    db = client[MONGO_DB]
    collection = db.events
    
    # Verificar si ya hay datos
    existing_count = collection.count_documents({})
    if existing_count > 0:
        print(f"[WARN] Ya existen {existing_count} documentos en la coleccion 'events'")
        response = input("¿Deseas eliminar los datos existentes y reemplazarlos? (s/n): ")
        if response.lower() == 's':
            collection.delete_many({})
            print("[INFO] Datos existentes eliminados")
        else:
            print("[INFO] Los datos nuevos se agregaran a los existentes")
    
    print("\n[INFO] Importando datos...")
    print("       Esto puede tomar unos minutos...")
    
    # Leer y importar documentos desde el archivo BSON
    batch = []
    batch_size = 1000
    imported = 0
    
    with open(backup_path, 'rb') as f:
        for doc in decode_file_iter(f):
            batch.append(doc)
            
            if len(batch) >= batch_size:
                collection.insert_many(batch, ordered=False)
                imported += len(batch)
                print(f"       Importados: {imported:,} documentos...", end='\r')
                batch = []
        
        # Insertar el último lote
        if batch:
            collection.insert_many(batch, ordered=False)
            imported += len(batch)
    
    print(f"\n[OK] Importacion completada!")
    print(f"     Total de documentos importados: {imported:,}")
    
    # Verificar
    final_count = collection.count_documents({})
    print(f"     Total de documentos en la coleccion: {final_count:,}")
    
    client.close()
    
except Exception as e:
    print(f"\n[ERROR] Error durante la importacion: {e}")
    print("\n[INFO] Verifica:")
    print("       1. Que tu IP este en la whitelist de MongoDB Atlas")
    print("       2. Que las credenciales sean correctas")
    print("       3. Que tengas permisos de escritura")
    exit(1)

