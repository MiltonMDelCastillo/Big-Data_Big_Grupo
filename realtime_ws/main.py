from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
import json
from bson import ObjectId

# Convertidor para ObjectId → string
class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        return json.JSONEncoder.default(self, o)

# -------------------------------
# CONEXIÓN MONGODB ATLAS
# -------------------------------
MONGO_URI = "mongodb://TU_URI_NO_SRV"
mongo_client = MongoClient(MONGO_URI)
db = mongo_client["sensores_iot"]
coleccion = db["sensores_crudos"]

# -------------------------------
# FASTAPI APP
# -------------------------------
app = FastAPI()

# -------------------------------
# CORS PERMITIR TODO
# -------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # frontend, dashboard, cliente web
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------
# ENDPOINT PARA OBTENER DATOS
# -------------------------------
@app.get("/api/datos")
def obtener_datos():

    # ➤ Ajusta estos tipos según tu MongoDB
    sensores_sonido = list(coleccion.find({"tipo_sensor": "sonido"}))
    sensores_distancia = list(coleccion.find({"tipo_sensor": "distancia"}))
    sensores_aire = list(coleccion.find({"tipo_sensor": "aire"}))

    return json.loads(JSONEncoder().encode({
        "sonido": sensores_sonido,
        "distancia": sensores_distancia,
        "aire": sensores_aire
    }))
