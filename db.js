// db.js
import postgres from 'postgres';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Validar conexión
if (!process.env.DATABASE_URL) {
  console.error('❌ La variable DATABASE_URL no está definida en el archivo .env');
  process.exit(1);
}

// Configuración SSL obligatoria para Render
const options = {
  ssl: { rejectUnauthorized: false },
  idle_timeout: 10,
  connect_timeout: 10,
  max: 10,
};


// Crear conexión global
console.log("🌐 Intentando conectar con PostgreSQL...");
const sql = postgres(process.env.DATABASE_URL, options);

// Probar la conexión
export const testConnection = async () => {
  try {
    const result = await sql`SELECT NOW() as time`;
    console.log('✅ Conectado a PostgreSQL (Render)');
    console.log(`🕒 Hora del servidor: ${result[0].time}`);
    return true;
  } catch (err) {
    console.error('❌ Error al conectar con PostgreSQL:', err.message);
    return false;
  }
};

export default sql;

