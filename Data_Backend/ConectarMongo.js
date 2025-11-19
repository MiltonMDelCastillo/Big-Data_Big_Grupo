const mongoose = require('mongoose');

const uri = "mongodb+srv://fabricabla_db_user:ifMIBidJuyoCai24@cluster0.e0tjitb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const conectarMongo = async () => {
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ Conexión exitosa a MongoDB Atlas"); // <- Aquí sale el mensaje
    process.exit(); // cierra el script
  } catch (error) {
    console.error("❌ Error al conectar a MongoDB:", error.message);
    process.exit(1);
  }
};

// Esto es clave: ejecutar la función
conectarMongo();
