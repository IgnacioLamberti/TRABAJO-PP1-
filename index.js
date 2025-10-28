// index.js
import dotenv from 'dotenv';
dotenv.config();
console.log("✅ Archivo .env cargado correctamente");
console.log("🔗 URL detectada:", process.env.DATABASE_URL);

import express from 'express';
import sql, { testConnection } from './db.js';


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

// ==============================
// 🔹 CLIENTES
// ==============================
app.get('/api/clientes', async (req, res) => {
  try {
    const clientes = await sql`
      SELECT c.*, p.nombre AS provincia, pa.nombre AS pais, i.nombre AS idioma
      FROM cliente c
      LEFT JOIN provincia p ON c.id_provincia = p.id_provincia
      LEFT JOIN pais pa ON p.id_pais = pa.id_pais
      LEFT JOIN idioma i ON c.id_idioma = i.id_idioma
      ORDER BY c.nombre;
    `;
    res.json({ status: 'OK', data: clientes });
  } catch (error) {
    res.status(500).json({ status: 'ERROR', message: error.message });
  }
});

app.post('/api/clientes', async (req, res) => {
  try {
    const { nombre, dni, telefono, mail, id_provincia, id_puntos, id_idioma, contraseña } = req.body;

    if (!nombre || !dni || !mail)
      return res.status(400).json({ status: 'ERROR', message: 'Faltan datos obligatorios' });

    const nuevoCliente = await sql`
      INSERT INTO cliente (nombre, dni, telefono, mail, id_provincia, id_puntos, id_idioma, "contraseña")
      VALUES (${nombre}, ${dni}, ${telefono}, ${mail}, ${id_provincia}, ${id_puntos}, ${id_idioma}, ${contraseña})
      RETURNING *;
    `;

    res.status(201).json({ status: 'OK', data: nuevoCliente[0] });
  } catch (error) {
    res.status(500).json({ status: 'ERROR', message: error.message });
  }
});

// ==============================
// 🔹 EMPLEADOS
// ==============================
app.get('/api/empleados', async (req, res) => {
  try {
    const empleados = await sql`SELECT * FROM empleado ORDER BY nombre;`;
    res.json({ status: 'OK', data: empleados });
  } catch (error) {
    res.status(500).json({ status: 'ERROR', message: error.message });
  }
});

// ==============================
// 🔹 PAGOS
// ==============================
app.get('/api/pagos', async (req, res) => {
  try {
    const pagos = await sql`
      SELECT p.id_pago, p.monto, m.nombre AS metodo_pago, pe.codigo AS codigo_pedido
      FROM pago p
      JOIN metodopago m ON p.id_metodo_pago = m.id_metodo_pago
      JOIN pedido pe ON p.id_pedido = pe.id_pedido
      ORDER BY p.id_pago DESC;
    `;
    res.json({ status: 'OK', data: pagos });
  } catch (error) {
    res.status(500).json({ status: 'ERROR', message: error.message });
  }
});

app.post('/api/pagos', async (req, res) => {
  try {
    const { monto, id_metodo_pago, id_pedido } = req.body;

    if (!monto || !id_metodo_pago || !id_pedido)
      return res.status(400).json({ status: 'ERROR', message: 'Faltan datos obligatorios' });

    const nuevoPago = await sql`
      INSERT INTO pago (monto, id_metodo_pago, id_pedido)
      VALUES (${monto}, ${id_metodo_pago}, ${id_pedido})
      RETURNING *;
    `;

    res.status(201).json({ status: 'OK', data: nuevoPago[0] });
  } catch (error) {
    res.status(500).json({ status: 'ERROR', message: error.message });
  }
});

// ==============================
// 🔹 PRODUCTOS + INGREDIENTES
// ==============================
app.get('/api/productos/detalle', async (req, res) => {
  try {
    const productos = await sql`
      SELECT 
        p.id_productos,
        p.nombre AS producto,
        p.descripcion,
        p.precio,
        p.categoria,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'ingrediente', i.nombre,
              'cantidad', pi.cantidad,
              'es_extra', pi.es_extra
            )
          ) FILTER (WHERE i.id_ingredientes IS NOT NULL),
          '[]'
        ) AS ingredientes
      FROM productos p
      LEFT JOIN productos_ingredientes pi ON p.id_productos = pi.id_productos
      LEFT JOIN ingredientes i ON pi.id_ingredientes = i.id_ingredientes
      GROUP BY p.id_productos
      ORDER BY p.nombre;
    `;
    res.json({ status: 'OK', data: productos });
  } catch (error) {
    res.status(500).json({ status: 'ERROR', message: error.message });
  }
});


app.listen(PORT, async () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  try {
    const ok = await testConnection();
    if (!ok) {
      console.error('⚠️ No se pudo conectar a la base de datos.');
    }
  } catch (error) {
    console.error('💥 Error al intentar conectar con PostgreSQL:', error);
  }
});



export default app;
