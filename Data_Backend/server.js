// Data_Backend/server.js
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

// ========== CONEXIÓN MONGODB ==========
// Especificar la base de datos sensores_iot en la URI
const MONGODB_URI = "mongodb+srv://fabricabla_db_user:ifMIBidJuyoCai24@cluster0.e0tjitb.mongodb.net/sensores_iot?retryWrites=true&w=majority";
let mongoConnected = false;

console.log("🔌 Intentando conectar a MongoDB...");
console.log("📍 URI:", MONGODB_URI.replace(/:[^:@]+@/, ":****@")); // Ocultar contraseña en logs

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
})
.then(() => {
  console.log("✅ MongoDB conectado exitosamente");
  console.log("📊 Estado de conexión:", mongoose.connection.readyState);
  console.log("🗄️  Base de datos:", mongoose.connection.db.databaseName);
  mongoConnected = true;
  
  // Verificar que las colecciones existen
  mongoose.connection.db.listCollections().toArray((err, collections) => {
    if (err) {
      console.error("❌ Error listando colecciones:", err);
      console.error("   Stack:", err.stack);
    } else {
      const collectionNames = collections.map(c => c.name);
      console.log("📋 Colecciones disponibles:", collectionNames);
      console.log("   Total de colecciones:", collectionNames.length);
      
      // Verificar colecciones específicas
      const requiredCollections = ["sensores_soterrados", "sensores_sonido", "sensores_calidad-aire"];
      requiredCollections.forEach(colName => {
        if (collectionNames.includes(colName)) {
          console.log(`   ✓ ${colName} encontrada`);
        } else {
          console.log(`   ✗ ${colName} NO encontrada`);
        }
      });
    }
  });
})
.catch((err) => {
  console.error("❌ Error conectando a MongoDB:");
  console.error("   Mensaje:", err.message);
  console.error("   Nombre:", err.name);
  console.error("   Código:", err.code);
  if (err.stack) {
    console.error("   Stack:", err.stack);
  }
  mongoConnected = false;
});

// ========== CONEXIÓN POSTGRESQL ==========
// Codificar caracteres especiales en la contraseña
const POSTGRES_URI = "postgresql://postgres:CQZ_Kp2%3FxDDNV%23S@db.hotnyzywbgoiktfiwqwe.supabase.co:5432/postgres";
const pgPool = new Pool({
  connectionString: POSTGRES_URI,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test PostgreSQL connection
pgPool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("❌ Error conectando a PostgreSQL:", err.message);
  } else {
    console.log("✅ PostgreSQL conectado exitosamente");
  }
});

// ========== MODELOS MONGODB ==========
// Nota: Los nombres de las colecciones en MongoDB son:
// - sensores_soterrados (no sensores_soterreados)
// - sensores_sonido (no sensores_sonidos)
// - sensores_calidad-aire
const sensorSoterreadoSchema = new mongoose.Schema({}, { strict: false, collection: "sensores_soterrados" });
const sensorSonidoSchema = new mongoose.Schema({}, { strict: false, collection: "sensores_sonido" });
const sensorCalidadAireSchema = new mongoose.Schema({}, { strict: false, collection: "sensores_calidad-aire" });

const SensorSoterreado = mongoose.model("SensorSoterreado", sensorSoterreadoSchema);
const SensorSonido = mongoose.model("SensorSonido", sensorSonidoSchema);
const SensorCalidadAire = mongoose.model("SensorCalidadAire", sensorCalidadAireSchema);

// ========== FUNCIÓN DE PAGINACIÓN ==========
function paginate(array, page = 1, limit = 20) {
  const p = Math.max(1, parseInt(page || 1));
  const l = Math.max(1, parseInt(limit || 20));
  const start = (p - 1) * l;
  const end = start + l;
  return {
    page: p,
    limit: l,
    total: array.length,
    totalPages: Math.ceil(array.length / l),
    data: array.slice(start, end)
  };
}

// ========== ENDPOINTS MONGODB ==========

// Sensores Soterreados
app.get("/api/mongodb/sensores-soterreados", async (req, res) => {
  console.log("📥 GET /api/mongodb/sensores-soterreados");
  console.log("   Estado MongoDB:", mongoConnected ? "✅ Conectado" : "❌ Desconectado");
  
  try {
    if (!mongoConnected) {
      console.error("   ❌ MongoDB no está conectado, retornando 503");
      return res.status(503).json({ error: "MongoDB no está conectado" });
    }

    const { page = 1, limit = 20, device_name, address } = req.query;
    console.log("   Parámetros:", { page, limit, device_name, address });
    
    const query = {};
    if (device_name) query.device_name = { $regex: device_name, $options: "i" };
    if (address) query.address = { $regex: address, $options: "i" };
    
    console.log("   Query:", JSON.stringify(query));

    const total = await SensorSoterreado.countDocuments(query);
    console.log("   Total documentos:", total);
    
    const data = await SensorSoterreado.find(query)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    console.log(`✅ Sensores soterreados: ${data.length} documentos encontrados de ${total} totales`);
    if (data.length > 0) {
      console.log("   Primer documento:", JSON.stringify(data[0]).substring(0, 200) + "...");
    }
    
    res.json({
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      data
    });
  } catch (error) {
    console.error("❌ Error en sensores-soterreados:");
    console.error("   Mensaje:", error.message);
    console.error("   Stack:", error.stack);
    res.status(500).json({ error: error.message });
  }
});

// Sensores Sonidos
app.get("/api/mongodb/sensores-sonidos", async (req, res) => {
  console.log("📥 GET /api/mongodb/sensores-sonidos");
  console.log("   Estado MongoDB:", mongoConnected ? "✅ Conectado" : "❌ Desconectado");
  
  try {
    if (!mongoConnected) {
      console.error("   ❌ MongoDB no está conectado, retornando 503");
      return res.status(503).json({ error: "MongoDB no está conectado" });
    }

    const { page = 1, limit = 20, device_name, address } = req.query;
    console.log("   Parámetros:", { page, limit, device_name, address });
    
    const query = {};
    if (device_name) query.device_name = { $regex: device_name, $options: "i" };
    if (address) query.address = { $regex: address, $options: "i" };
    
    console.log("   Query:", JSON.stringify(query));

    const total = await SensorSonido.countDocuments(query);
    console.log("   Total documentos:", total);
    
    const data = await SensorSonido.find(query)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    console.log(`✅ Sensores sonidos: ${data.length} documentos encontrados de ${total} totales`);
    if (data.length > 0) {
      console.log("   Primer documento:", JSON.stringify(data[0]).substring(0, 200) + "...");
    }
    
    res.json({
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      data
    });
  } catch (error) {
    console.error("❌ Error en sensores-sonidos:");
    console.error("   Mensaje:", error.message);
    console.error("   Stack:", error.stack);
    res.status(500).json({ error: error.message });
  }
});

// Sensores Calidad Aire
app.get("/api/mongodb/sensores-calidad-aire", async (req, res) => {
  console.log("📥 GET /api/mongodb/sensores-calidad-aire");
  console.log("   Estado MongoDB:", mongoConnected ? "✅ Conectado" : "❌ Desconectado");
  
  try {
    if (!mongoConnected) {
      console.error("   ❌ MongoDB no está conectado, retornando 503");
      return res.status(503).json({ error: "MongoDB no está conectado" });
    }

    const { page = 1, limit = 20, device_name, address } = req.query;
    console.log("   Parámetros:", { page, limit, device_name, address });
    
    const query = {};
    if (device_name) query.device_name = { $regex: device_name, $options: "i" };
    if (address) query.address = { $regex: address, $options: "i" };
    
    console.log("   Query:", JSON.stringify(query));

    const total = await SensorCalidadAire.countDocuments(query);
    console.log("   Total documentos:", total);
    
    const data = await SensorCalidadAire.find(query)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    console.log(`✅ Sensores calidad aire: ${data.length} documentos encontrados de ${total} totales`);
    if (data.length > 0) {
      console.log("   Primer documento:", JSON.stringify(data[0]).substring(0, 200) + "...");
    }
    
    res.json({
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      data
    });
  } catch (error) {
    console.error("❌ Error en sensores-calidad-aire:");
    console.error("   Mensaje:", error.message);
    console.error("   Stack:", error.stack);
    res.status(500).json({ error: error.message });
  }
});

// ========== ENDPOINTS POSTGRESQL ==========
// Tablas permitidas de PostgreSQL (seguridad)
const POSTGRES_TABLES = [
  "sensores_soterrados",
  "sensores_sonido",
  "sensores_calidad_aire"
];

// Endpoint genérico para obtener tablas de PostgreSQL
app.get("/api/postgresql/tables", async (req, res) => {
  try {
    const result = await pgPool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name IN ($1, $2, $3)
      ORDER BY table_name;
    `, POSTGRES_TABLES);
    res.json({ tables: result.rows.map(row => row.table_name) });
  } catch (error) {
    console.error("Error obteniendo tablas:", error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para obtener datos de una tabla específica
app.get("/api/postgresql/:tableName", async (req, res) => {
  try {
    const { tableName } = req.params;
    const { page = 1, limit = 20, search, searchColumn } = req.query;
    
    // Validar nombre de tabla (solo permitir tablas conocidas)
    if (!POSTGRES_TABLES.includes(tableName)) {
      return res.status(400).json({ 
        error: "Tabla no permitida. Tablas disponibles: " + POSTGRES_TABLES.join(", ")
      });
    }

    // Contar total
    let countQuery = `SELECT COUNT(*) FROM "${tableName}"`;
    const countParams = [];
    
    if (search) {
      // Búsqueda en múltiples columnas comunes
      const searchFields = ["device_name", "dev_eui", "address", "_id"];
      const conditions = searchFields.map((field, idx) => 
        `${field}::text ILIKE $${idx + 1}`
      ).join(" OR ");
      countQuery += ` WHERE ${conditions}`;
      searchFields.forEach(() => countParams.push(`%${search}%`));
    }
    
    const countResult = await pgPool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    // Obtener datos paginados
    let dataQuery = `SELECT * FROM "${tableName}"`;
    const dataParams = [];
    
    if (search) {
      const searchFields = ["device_name", "dev_eui", "address", "_id"];
      const conditions = searchFields.map((field, idx) => 
        `"${field}"::text ILIKE $${idx + 1}`
      ).join(" OR ");
      dataQuery += ` WHERE ${conditions}`;
      searchFields.forEach(() => dataParams.push(`%${search}%`));
    }
    
    dataQuery += ` ORDER BY ts_medicion DESC LIMIT $${dataParams.length + 1} OFFSET $${dataParams.length + 2}`;
    dataParams.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const dataResult = await pgPool.query(dataQuery, dataParams);

    // Transformar datos para que sean consistentes con MongoDB
    const transformedData = dataResult.rows.map(row => ({
      _id: row._id,
      tipo_sensor: row.tipo_sensor,
      timestamp_ingesta: row.timestamp_ingesta,
      fuente_archivo: row.fuente_archivo,
      device_name: row.device_name,
      dev_eui: row.dev_eui,
      dev_addr: row.dev_addr,
      application_name: row.application_name,
      location: {
        latitude: parseFloat(row.latitude),
        longitude: parseFloat(row.longitude)
      },
      address: row.address,
      description: row.description,
      timestamp: {
        $date: row.ts_medicion
      },
      mediciones: {
        ...(tableName === "sensores_soterrados" && {
          distance: row.distance,
          position: row.position,
          battery: row.battery,
          status: row.status
        }),
        ...(tableName === "sensores_sonido" && {
          laeq: row.laeq,
          lai: row.lai,
          lai_max: row.lai_max,
          battery: row.battery,
          status: row.status
        }),
        ...(tableName === "sensores_calidad_aire" && {
          co2: row.co2,
          temperature: row.temperature,
          humidity: row.humidity,
          pressure: row.pressure,
          battery: row.battery
        })
      },
      red_lora: {
        rssi_promedio: row.rssi_promedio,
        rssi_max: row.rssi_max,
        rssi_min: row.rssi_min
      }
    }));

    res.json({
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      data: transformedData
    });
  } catch (error) {
    console.error(`Error obteniendo datos de ${req.params.tableName}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// ========== ENDPOINT PARA ESTADÍSTICAS (PARA GRÁFICOS) ==========
app.get("/api/mongodb/stats/:collection", async (req, res) => {
  const { collection } = req.params;
  console.log(`📥 GET /api/mongodb/stats/${collection}`);
  console.log("   Estado MongoDB:", mongoConnected ? "✅ Conectado" : "❌ Desconectado");
  
  try {
    if (!mongoConnected) {
      console.error("   ❌ MongoDB no está conectado, retornando 503");
      return res.status(503).json({ error: "MongoDB no está conectado" });
    }

    let Model;

    // Mapear nombres de URL a modelos (los modelos usan los nombres correctos de las colecciones)
    switch (collection) {
      case "sensores-soterreados":
      case "sensores-soterrados": // Aceptar ambos nombres
        Model = SensorSoterreado;
        console.log("   Usando modelo: SensorSoterreado (colección: sensores_soterrados)");
        break;
      case "sensores-sonidos":
      case "sensores-sonido": // Aceptar ambos nombres
        Model = SensorSonido;
        console.log("   Usando modelo: SensorSonido (colección: sensores_sonido)");
        break;
      case "sensores-calidad-aire":
        Model = SensorCalidadAire;
        console.log("   Usando modelo: SensorCalidadAire (colección: sensores_calidad-aire)");
        break;
      default:
        console.error(`   ❌ Colección no válida: ${collection}`);
        return res.status(400).json({ error: "Colección no válida" });
    }

    console.log("   Buscando documentos...");
    // Obtener todos los datos para estadísticas
    const data = await Model.find({}).lean().limit(10000);
    console.log(`✅ Estadísticas ${collection}: ${data.length} documentos encontrados`);
    
    if (data.length === 0) {
      console.warn(`⚠️ Advertencia: La colección ${collection} está vacía o no existe`);
      console.warn("   Verifica que la colección tenga datos en MongoDB");
    } else {
      console.log("   Primer documento:", JSON.stringify(data[0]).substring(0, 200) + "...");
    }
    
    res.json({ data });
  } catch (error) {
    console.error(`❌ Error obteniendo estadísticas de ${collection}:`);
    console.error("   Mensaje:", error.message);
    console.error("   Stack:", error.stack);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para estadísticas de PostgreSQL
app.get("/api/postgresql/stats/:tableName", async (req, res) => {
  try {
    const { tableName } = req.params;
    
    if (!POSTGRES_TABLES.includes(tableName)) {
      return res.status(400).json({ error: "Tabla no permitida" });
    }

    // Obtener datos para gráficos (últimos 10000 registros)
    const dataResult = await pgPool.query(
      `SELECT * FROM "${tableName}" ORDER BY ts_medicion DESC LIMIT 10000`
    );

    // Transformar datos igual que en el endpoint principal
    const transformedData = dataResult.rows.map(row => ({
      _id: row._id,
      tipo_sensor: row.tipo_sensor,
      timestamp_ingesta: row.timestamp_ingesta,
      fuente_archivo: row.fuente_archivo,
      device_name: row.device_name,
      dev_eui: row.dev_eui,
      dev_addr: row.dev_addr,
      application_name: row.application_name,
      location: {
        latitude: parseFloat(row.latitude),
        longitude: parseFloat(row.longitude)
      },
      address: row.address,
      description: row.description,
      timestamp: {
        $date: row.ts_medicion
      },
      mediciones: {
        ...(tableName === "sensores_soterrados" && {
          distance: row.distance,
          position: row.position,
          battery: row.battery,
          status: row.status
        }),
        ...(tableName === "sensores_sonido" && {
          laeq: row.laeq,
          lai: row.lai,
          lai_max: row.lai_max,
          battery: row.battery,
          status: row.status
        }),
        ...(tableName === "sensores_calidad_aire" && {
          co2: row.co2,
          temperature: row.temperature,
          humidity: row.humidity,
          pressure: row.pressure,
          battery: row.battery
        })
      },
      red_lora: {
        rssi_promedio: row.rssi_promedio,
        rssi_max: row.rssi_max,
        rssi_min: row.rssi_min
      }
    }));

    res.json({ data: transformedData });
  } catch (error) {
    console.error(`Error obteniendo estadísticas de ${tableName}:`, error);
    res.status(500).json({ error: error.message });
  }
});


// ========== START SERVER ==========
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ API corriendo en http://localhost:${PORT}`);
  console.log(`📊 Endpoints MongoDB: /api/mongodb/*`);
  console.log(`🗄️  Endpoints PostgreSQL: /api/postgresql/*`);
});
