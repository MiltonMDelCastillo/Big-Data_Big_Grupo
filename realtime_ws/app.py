from flask import Flask, jsonify, request, render_template
from pymongo import MongoClient

app = Flask(__name__)

# ======================================================
# 🔗 Conexión a MongoDB Atlas
# ======================================================
mongo_uri = 'mongodb+srv://fabricabla_db_user:ifMIBidJuyoCai24@cluster0.e0tjitb.mongodb.net/'
mongo_client = MongoClient(mongo_uri)
db = mongo_client["sensores_limpios"]
coleccion = db["datos"]

# ======================================================
# 🔹 Ruta principal - Dashboard
# ======================================================
@app.route("/")
def index():
    return render_template("dashboard.html")  # dashboard.html debe estar en la carpeta 'templates'

# ======================================================
# 🔹 API: Obtener datos recientes
# ======================================================
@app.route("/api/datos")
def get_datos():
    try:
        docs = list(coleccion.find().sort("_id", -1).limit(20))
        for d in docs:
            d["_id"] = str(d["_id"])
        return jsonify(docs)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ======================================================
# 🔹 API: Enviar datos desde formulario
# ======================================================
@app.route("/api/enviar", methods=["POST"])
def enviar():
    try:
        data = request.get_json()
        coleccion.insert_one(data)
        return jsonify({"message": "Dato recibido y guardado en Atlas!"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ======================================================
# 🔹 Ejecutar Flask
# ======================================================
if __name__ == "__main__":
    app.run(debug=True)
