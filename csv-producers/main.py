# csv-producers/unified-producer/main.py
import pandas as pd
from kafka import KafkaProducer
import json
import time
import os

class UnifiedCSVProducer:
    def __init__(self, bootstrap_servers='localhost:9092'):
        self.producer = KafkaProducer(
            bootstrap_servers=bootstrap_servers,
            value_serializer=lambda v: json.dumps(v).encode('utf-8'),
            batch_size=16384,
            linger_ms=10
        )
        
        # Mapeo de tipos de sensor a topics
        self.topic_mapping = {
            'soterrados': 'sensores-soterrados',
            'sonido': 'sensores-sonido', 
            'calidad-aire': 'sensores-aire'
        }
    
    def discover_csv_files(self, data_folder):
        """Descubre automáticamente archivos CSV"""
        csv_files = {}
        for sensor_type in self.topic_mapping.keys():
            sensor_folder = os.path.join(data_folder, sensor_type)
            if os.path.exists(sensor_folder):
                csv_files[sensor_type] = [
                    os.path.join(sensor_folder, f) 
                    for f in os.listdir(sensor_folder) 
                    if f.endswith('.csv')
                ]
        return csv_files
    
    def process_sensor_data(self, sensor_type, csv_file_path):
        """Procesa datos específicos para cada tipo de sensor"""
        df = pd.read_csv(csv_file_path)
        topic = self.topic_mapping[sensor_type]
        
        print(f"Procesando {sensor_type}: {len(df)} registros")
        
        for index, row in df.iterrows():
            message = {
                'sensor_type': sensor_type,
                'timestamp': time.time(),
                'data_id': f"{sensor_type}_{index}",
                'data': row.to_dict(),
                'source_file': os.path.basename(csv_file_path),
                'batch_processed': False
            }
            
            # Enriquecer datos según tipo de sensor
            message = self.enrich_data(sensor_type, message)
            
            self.producer.send(topic, value=message)
            
            if index % 100 == 0:  # Log cada 100 registros
                print(f"Enviados {index} registros de {sensor_type}")
        
        return len(df)
    
    def enrich_data(self, sensor_type, message):
        """Enriquece los datos según el tipo de sensor"""
        if sensor_type == 'soterrados':
            message['data_category'] = 'subsurface'
            message['units'] = 'depth_pressure_temperature'
            
        elif sensor_type == 'sonido':
            message['data_category'] = 'acoustic'
            message['units'] = 'decibels_frequency'
            # Agregar análisis básico de sonido
            if 'db_level' in message['data']:
                db = message['data']['db_level']
                message['noise_level'] = 'low' if db < 60 else 'high'
                
        elif sensor_type == 'calidad-aire':
            message['data_category'] = 'environmental'
            message['units'] = 'ppm_ugm3'
            # Calcular calidad del aire
            if 'pm25' in message['data']:
                pm25 = message['data']['pm25']
                message['air_quality'] = self.calculate_air_quality(pm25)
        
        return message
    
    def calculate_air_quality(self, pm25):
        """Calcula calidad del aire basado en PM2.5"""
        if pm25 <= 12: return 'good'
        elif pm25 <= 35: return 'moderate'
        elif pm25 <= 55: return 'unhealthy_sensitive'
        else: return 'unhealthy'
    
    def run(self, data_folder='../data'):
        """Ejecuta la carga de todos los datos"""
        csv_files = self.discover_csv_files(data_folder)
        total_processed = 0
        
        for sensor_type, files in csv_files.items():
            print(f"\n=== PROCESANDO {sensor_type.upper()} ===")
            for csv_file in files:
                print(f"Archivo: {csv_file}")
                processed = self.process_sensor_data(sensor_type, csv_file)
                total_processed += processed
                print(f"✓ Completado: {processed} registros")
        
        self.producer.flush()
        print(f"\n🎯 TOTAL PROCESADO: {total_processed} registros")

if __name__ == "__main__":
    producer = UnifiedCSVProducer()
    producer.run()