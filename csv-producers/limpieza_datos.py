"""
Módulo de limpieza de datos para sensores IoT
Procesa y limpia los datos según el tipo de sensor
"""
import pandas as pd
import numpy as np
import re
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

def limpiar_valor_numerico(valor):
    """Convierte valores a numéricos, eliminando NaN y valores inválidos"""
    if pd.isna(valor) or valor is None:
        return None
    try:
        if isinstance(valor, str):
            # Limpiar strings que puedan ser numéricos
            valor = valor.strip()
            if valor == '' or valor.lower() == 'nan':
                return None
        num = float(valor)
        if np.isnan(num) or np.isinf(num):
            return None
        return num
    except (ValueError, TypeError):
        return None

def limpiar_valor_texto(valor):
    """Limpia valores de texto, eliminando NaN y espacios"""
    if pd.isna(valor) or valor is None:
        return None
    if isinstance(valor, str):
        valor = valor.strip()
        if valor == '' or valor.lower() == 'nan':
            return None
    return str(valor)

def parsear_coordenadas(location_str):
    """Parsea coordenadas desde string 'lat, lon' a diccionario"""
    if pd.isna(location_str) or location_str is None:
        return None
    try:
        if isinstance(location_str, str):
            coords = location_str.split(',')
            if len(coords) == 2:
                lat = float(coords[0].strip())
                lon = float(coords[1].strip())
                return {'latitude': lat, 'longitude': lon}
    except (ValueError, AttributeError):
        pass
    return None

def limpiar_datos_soterrados(fila):
    """
    Limpia datos de sensores soterrados (nivel de líquido)
    Campos relevantes según diccionario:
    - object.distance: distancia medida
    - object.position: posición
    - object.battery: nivel de batería
    - object.status: estado del sensor
    """
    datos_limpios = {
        # Información del dispositivo
        'device_name': limpiar_valor_texto(fila.get('deviceInfo.deviceName')),
        'dev_eui': limpiar_valor_texto(fila.get('deviceInfo.devEui')),
        'dev_addr': limpiar_valor_texto(fila.get('devAddr')),
        'application_name': limpiar_valor_texto(fila.get('deviceInfo.applicationName')),
        
        # Ubicación
        'location': parsear_coordenadas(fila.get('deviceInfo.tags.Location')),
        'address': limpiar_valor_texto(fila.get('deviceInfo.tags.Address')),
        'description': limpiar_valor_texto(fila.get('deviceInfo.tags.Description')),
        
        # Timestamp
        'timestamp': limpiar_valor_texto(fila.get('time')),
        
        # Datos del sensor (campos específicos de soterrados)
        'mediciones': {
            'distance': limpiar_valor_numerico(fila.get('object.distance')),
            'position': limpiar_valor_numerico(fila.get('object.position')),
            'battery': limpiar_valor_numerico(fila.get('object.battery')),
            'status': limpiar_valor_numerico(fila.get('object.status'))
        },
        
        # Información de red LoRaWAN (solo si tiene valores válidos)
        'red_lora': {}
    }
    
    # Agregar información de red solo si tiene valores válidos
    rssi_values = []
    for i in range(3):
        rssi = limpiar_valor_numerico(fila.get(f'rxInfo[{i}].rssi'))
        if rssi is not None:
            rssi_values.append(rssi)
    
    if rssi_values:
        datos_limpios['red_lora']['rssi_promedio'] = sum(rssi_values) / len(rssi_values)
        datos_limpios['red_lora']['rssi_max'] = max(rssi_values)
        datos_limpios['red_lora']['rssi_min'] = min(rssi_values)
    
    # Eliminar campos vacíos
    datos_limpios = {k: v for k, v in datos_limpios.items() if v is not None and v != {}}
    
    return datos_limpios

def limpiar_datos_sonido(fila):
    """
    Limpia datos de sensores de sonido
    Campos relevantes según diccionario:
    - object.LAeq: nivel sonoro equivalente
    - object.LAI: nivel sonoro instantáneo
    - object.LAImax: nivel sonoro máximo
    - object.battery: nivel de batería
    - object.status: estado del sensor
    """
    datos_limpios = {
        # Información del dispositivo
        'device_name': limpiar_valor_texto(fila.get('deviceInfo.deviceName')),
        'dev_eui': limpiar_valor_texto(fila.get('deviceInfo.devEui')),
        'dev_addr': limpiar_valor_texto(fila.get('devAddr')),
        'application_name': limpiar_valor_texto(fila.get('deviceInfo.applicationName')),
        
        # Ubicación
        'location': parsear_coordenadas(fila.get('deviceInfo.tags.Location')),
        'address': limpiar_valor_texto(fila.get('deviceInfo.tags.Address')),
        'description': limpiar_valor_texto(fila.get('deviceInfo.tags.Description')),
        
        # Timestamp
        'timestamp': limpiar_valor_texto(fila.get('time')),
        
        # Datos del sensor (campos específicos de sonido)
        'mediciones': {
            'laeq': limpiar_valor_numerico(fila.get('object.LAeq')),  # Nivel sonoro equivalente (dB)
            'lai': limpiar_valor_numerico(fila.get('object.LAI')),    # Nivel sonoro instantáneo (dB)
            'lai_max': limpiar_valor_numerico(fila.get('object.LAImax')),  # Nivel sonoro máximo (dB)
            'battery': limpiar_valor_numerico(fila.get('object.battery')),
            'status': limpiar_valor_numerico(fila.get('object.status'))
        },
        
        # Información de red LoRaWAN
        'red_lora': {}
    }
    
    # Agregar información de red solo si tiene valores válidos
    rssi_values = []
    for i in range(4):
        rssi = limpiar_valor_numerico(fila.get(f'rxInfo[{i}].rssi'))
        if rssi is not None:
            rssi_values.append(rssi)
    
    if rssi_values:
        datos_limpios['red_lora']['rssi_promedio'] = sum(rssi_values) / len(rssi_values)
        datos_limpios['red_lora']['rssi_max'] = max(rssi_values)
        datos_limpios['red_lora']['rssi_min'] = min(rssi_values)
    
    # Eliminar campos vacíos
    datos_limpios = {k: v for k, v in datos_limpios.items() if v is not None and v != {}}
    
    return datos_limpios

def limpiar_datos_calidad_aire(fila):
    """
    Limpia datos de sensores de calidad de aire (CO2, temperatura, humedad, presión)
    Campos relevantes según diccionario:
    - object.co2: concentración de CO2 (ppm)
    - object.temperature: temperatura (°C)
    - object.humidity: humedad (%)
    - object.pressure: presión barométrica
    - object.battery: nivel de batería
    """
    datos_limpios = {
        # Información del dispositivo
        'device_name': limpiar_valor_texto(fila.get('deviceInfo.deviceName')),
        'dev_eui': limpiar_valor_texto(fila.get('deviceInfo.devEui')),
        'dev_addr': limpiar_valor_texto(fila.get('devAddr')),
        'application_name': limpiar_valor_texto(fila.get('deviceInfo.applicationName')),
        
        # Ubicación
        'location': parsear_coordenadas(fila.get('deviceInfo.tags.Location')),
        'address': limpiar_valor_texto(fila.get('deviceInfo.tags.Address')),
        'description': limpiar_valor_texto(fila.get('deviceInfo.tags.Description')),
        
        # Timestamp
        'timestamp': limpiar_valor_texto(fila.get('time')),
        
        # Datos del sensor (campos específicos de calidad de aire)
        'mediciones': {
            'co2': limpiar_valor_numerico(fila.get('object.co2')),  # CO2 en ppm
            'temperature': limpiar_valor_numerico(fila.get('object.temperature')),  # Temperatura en °C
            'humidity': limpiar_valor_numerico(fila.get('object.humidity')),  # Humedad en %
            'pressure': limpiar_valor_numerico(fila.get('object.pressure')),  # Presión barométrica
            'battery': limpiar_valor_numerico(fila.get('object.battery'))
        },
        
        # Estados de las mediciones (si están disponibles)
        'estados': {}
    }
    
    # Agregar estados si están disponibles
    estados_campos = {
        'co2_status': limpiar_valor_texto(fila.get('object.co2_status')),
        'temperature_status': limpiar_valor_texto(fila.get('object.temperature_status')),
        'humidity_status': limpiar_valor_texto(fila.get('object.humidity_status')),
        'pressure_status': limpiar_valor_texto(fila.get('object.pressure_status'))
    }
    
    for key, value in estados_campos.items():
        if value is not None:
            datos_limpios['estados'][key] = value
    
    # Información de red LoRaWAN
    datos_limpios['red_lora'] = {}
    rssi_values = []
    for i in range(4):
        rssi = limpiar_valor_numerico(fila.get(f'rxInfo[{i}].rssi'))
        if rssi is not None:
            rssi_values.append(rssi)
    
    if rssi_values:
        datos_limpios['red_lora']['rssi_promedio'] = sum(rssi_values) / len(rssi_values)
        datos_limpios['red_lora']['rssi_max'] = max(rssi_values)
        datos_limpios['red_lora']['rssi_min'] = min(rssi_values)
    
    # Eliminar campos vacíos
    if not datos_limpios['estados']:
        del datos_limpios['estados']
    if not datos_limpios['red_lora']:
        del datos_limpios['red_lora']
    
    datos_limpios = {k: v for k, v in datos_limpios.items() if v is not None and v != {}}
    
    return datos_limpios

def limpiar_datos(fila, tipo_sensor):
    """
    Función principal que limpia datos según el tipo de sensor
    
    Args:
        fila: Fila del DataFrame (Series de pandas)
        tipo_sensor: Tipo de sensor ('soterrados', 'sonido', 'calidad-aire')
    
    Returns:
        dict: Diccionario con datos limpios
    """
    funciones_limpieza = {
        'soterrados': limpiar_datos_soterrados,
        'sonido': limpiar_datos_sonido,
        'calidad-aire': limpiar_datos_calidad_aire
    }
    
    if tipo_sensor not in funciones_limpieza:
        logger.warning(f"Tipo de sensor desconocido: {tipo_sensor}. Usando limpieza genérica.")
        # Limpieza genérica como fallback
        return {
            'device_name': limpiar_valor_texto(fila.get('deviceInfo.deviceName')),
            'timestamp': limpiar_valor_texto(fila.get('time')),
            'datos_crudos': {k: v for k, v in fila.replace({pd.NA: None}).to_dict().items() 
                           if v is not None and not pd.isna(v)}
        }
    
    return funciones_limpieza[tipo_sensor](fila)

