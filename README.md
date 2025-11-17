# Big-Data_Big_Grupo
# 📡 Sistema en Tiempo Real para Captura, Análisis, Visualización y Monitoreo de Datos Ambientales del GAMC

Sistema en tiempo real para el **captura, análisis, visualización y monitoreo** de datos de **calidad de aire**, **soterrados** y **sonido** del Gobierno Autónomo Municipal de Cochabamba (GAMC).

---

## 👥 Integrantes del Equipo

- **Chambi Mamani Vladimir**  
- **Escalera Muñoz Christhian Andrés**  
- **Maldonado Caballero Erick**  
- **Camacho Blanco Fabricio** *(Team Leader)*  
- **Martinez del Castillo Milton Rael**  
- **Pareja Almendras Samuel Reynaldo** *(Team Leader)*  

---

## 📘 Introducción

En la era digital actual, el GAMC enfrenta un crecimiento acelerado en volumen, variedad y velocidad de generación de datos provenientes de sensores ambientales. Estos datos son críticos para la toma de decisiones estratégicas, pero los sistemas tradicionales de procesamiento por lotes no permiten una respuesta oportuna en tiempo real.

La incapacidad de procesar grandes volúmenes de datos en formatos complejos (texto, JSON, imágenes, audio, video) genera retrasos importantes entre la ocurrencia de un evento y la capacidad de reacción del municipio.

Este proyecto propone una **arquitectura moderna en tiempo real**, robusta, escalable y capaz de procesar datos de forma eficiente para apoyar la gestión ambiental del GAMC.

---

## ❗ Problemática

El incremento en volumen y variedad de datos de sensores puede provocar cuellos de botella, lentitud en el procesamiento y retrasos en la toma de decisiones.

---

## 🎯 Objetivo General

Desarrollar un sistema en tiempo real que permita capturar, procesar y analizar datos heterogéneos, mostrar información visual clara y comprensible, y ofrecer herramientas robustas para la toma de decisiones del GAMC.

---

## 🎯 Objetivos Específicos

1. Implementar tecnologías **ETL** para preprocesamiento y automatización de carga.
2. Elaborar el **diagrama de arquitectura** y su descripción textual.
3. Investigar e implementar tecnologías para **comunicación en tiempo real** (WebSockets).
4. Analizar e implementar tecnologías de **Data Ingestion** eficientes y asincrónicas.  
5. Implementar almacenamiento mixto: **SQL y NoSQL**.
6. Incorporar componentes para **analítica de datos** ambiental.
7. Implementar herramientas de **visualización** en dashboards.
8. Crear un **generador de datos sintéticos** para pruebas.
9. Preparar el **deployment** con Docker o sistema dockerizado.

---

## 📏 Alcance

El sistema será capaz de procesar datos provenientes de sensores de **calidad de aire**, **sonido** y **soterrados**, incluyendo datos numéricos, imágenes y audio.

---

# 🏛️ Arquitectura del Sistema

## 🔷 1) Diagrama de Arquitectura
_diagrama en el docx

## 🔷 2) Descripción de la Arquitectura

El sistema se estructura en capas:

- Sensores / Edge  
- Ingestión  
- Bus de eventos  
- Procesamiento en tiempo real  
- ETL / Dataflow  
- Almacenamiento  
- Analítica  
- API y Visualización  
- Monitoreo y operación  

Tecnologías principales:

- **MQTT / HTTP** para sensores  
- **Apache Kafka** para eventos  
- **Apache NiFi** para ETL  
- **Apache Flink / Kafka Streams** para streaming  
- **TimescaleDB / InfluxDB / MinIO** para almacenamiento  
- **Grafana + React** para visualización  
- **Prometheus + Alertmanager** para monitoreo  
- **Docker/Kubernetes** para despliegue  

_(Si deseas, puedo incluir la descripción completa de cada componente como la que me enviaste.)_

---

## 🌀 Flujo End-to-End de Datos
1. Sensores → Gateway  
2. Gateway → Kafka  
3. Kafka → Procesamiento (Flink/Streams)  
4. Procesamiento → Bases de datos  
5. Alertas → WebSockets / Alertmanager  
6. Visualización → Grafana y SPA (React)  

---

## 📦 Requisitos no Funcionales

- Escalabilidad horizontal  
- Alta disponibilidad  
- Baja latencia  
- Seguridad end-to-end  
- Observabilidad completa  
- Configurabilidad por ambiente  

---



# 🧪 Metodología de Trabajo – Scrum

- Equipo de 6 integrantes  
- Roles: Product Owner, Scrum Master, Dev Team  
- Sprints semanales  
- Backlogs, Kanban y dailies  

---

# 📚 Documentación Técnica

Incluye:

1. Introducción  
2. Requerimientos  
3. Arquitectura  
4. APIs  
5. Configuración de entornos  
6. Instalación en Docker  
7. Monitoreo y mantenimiento  
8. Anexos y documentación generada  

---

# 🏁 Conclusiones

El sistema desarrollado mejora la capacidad de respuesta del GAMC ante eventos ambientales críticos. La arquitectura moderna y escalable permite procesar datos en tiempo real, almacenar información históricamente y visualizar insights de manera clara y eficaz. La evolución del sistema es garantizada mediante metodologías ágiles como Scrum.

---

# 📖 Bibliografía

- Apache Kafka. (2025). *Documentation*.  
- Datacamp. (2024). *Apache NiFi vs Apache Airflow*.  
- Timescale. (2018). *TimescaleDB vs InfluxDB*.  
- Grafana Labs. (s.f.). *Sensor Data Dashboard Example*.  
- Ably. (2025). *WebSocket vs Socket.IO*.  

______________
