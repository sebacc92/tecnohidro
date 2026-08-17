-- Índices de rendimiento para Turso.
--
-- Turso factura por filas leídas: sin estos índices cada consulta del home,
-- del catálogo y de las páginas de categoría hace un full table scan.
--
-- Es idempotente y no destructivo: se puede correr las veces que haga falta.
--
--   turso db shell <nombre-de-la-base> < src/db/indexes.sql
--
-- Nota: products.slug, categories.slug, products.meli_id y users.username ya
-- tienen índice implícito por su restricción UNIQUE, por eso no aparecen acá.

-- Home: bloque de productos destacados.
CREATE INDEX IF NOT EXISTS idx_products_status_featured
  ON products (status, is_featured);

-- Home: bloque de ofertas.
CREATE INDEX IF NOT EXISTS idx_products_status_offer
  ON products (status, is_offer);

-- Catálogo filtrado por rubro y páginas /categorias/*.
CREATE INDEX IF NOT EXISTS idx_products_category_status
  ON products (category_id, status);

-- Listado paginado general de /productos (orderBy desc(id) sobre status='active').
CREATE INDEX IF NOT EXISTS idx_products_status
  ON products (status, id);

-- Menú de navegación y listados de subcategorías.
CREATE INDEX IF NOT EXISTS idx_categories_parent
  ON categories (parent_id, sort_order);

-- Home: últimos 6 posts de Instagram por fecha.
CREATE INDEX IF NOT EXISTS idx_instagram_timestamp
  ON instagram_posts (timestamp);

-- Admin > Auditoría: últimas 50 sesiones por actividad.
CREATE INDEX IF NOT EXISTS idx_chat_sessions_last_active
  ON chat_sessions (last_active);

-- Admin > Auditoría: mensajes agrupados por sesión en orden cronológico.
CREATE INDEX IF NOT EXISTS idx_chat_messages_session
  ON chat_messages (session_id, created_at);

-- Verificación: debería listar los 8 índices de arriba.
-- SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%';
