// index.js
import express from 'express';
import dotenv from 'dotenv';
import sql, { testConnection } from './db.js';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// --- Ruta raíz de prueba ---
app.get('/', (req, res) => {
  res.json({
    message: '🍔 API de Autoservicio de Hamburguesas',
    status: 'OK',
    timestamp: new Date(),
  });
});

// --- Verificar conexión con la base ---
app.get('/db-test', async (req, res) => {
  try {
    const ok = await testConnection();
    if (!ok) return res.status(500).json({ status: 'ERROR', message: 'No se pudo conectar' });

    const tables = await sql`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' ORDER BY table_name;
    `;
    res.json({
      status: 'OK',
      message: 'Conexión exitosa',
      tables: tables.map(t => t.table_name),
    });
  } catch (error) {
    res.status(500).json({ status: 'ERROR', message: error.message });
  }
});

// --- ENDPOINT EJEMPLO: Productos ---
app.get('/api/productos', async (req, res) => {
  try {
    const productos = await sql`SELECT * FROM productos ORDER BY nombre;`;
    res.json({ status: 'OK', data: productos });
  } catch (error) {
    res.status(500).json({ status: 'ERROR', message: error.message });
  }
});

// --- ENDPOINT EJEMPLO: Pedidos ---
app.get('/api/pedidos', async (req, res) => {
  try {
    const pedidos = await sql`SELECT * FROM pedido ORDER BY fecha DESC;`;
    res.json({ status: 'OK', data: pedidos });
  } catch (error) {
    res.status(500).json({ status: 'ERROR', message: error.message });
  }
});

// Iniciar servidor
app.listen(PORT, async () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  const connected = await testConnection();
  if (!connected) console.error('⚠️ No se pudo conectar a la base de datos');
});

// Exportar (por si querés usar tests)
export default app;
