USE coe_ecommerce;

-- Admin user (email: admin@coe.com, password: admin123) – change after first login
INSERT INTO users (name, email, password_hash, role) VALUES
  ('Admin', 'admin@coe.com', '$2a$10$tdS5Vy336lV/AJfSinj0Ze3TFcEK9GzRigjONRmu5FHgBYU0C0AWW', 'admin')
ON DUPLICATE KEY UPDATE role = 'admin', password_hash = VALUES(password_hash), name = VALUES(name);

-- Basic categories
INSERT INTO categories (name, slug, description) VALUES
  ('Handicrafts', 'handicrafts', 'Handcrafted products from local artisans'),
  ('Handloom', 'handloom', 'Handwoven textiles and related products')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description);

-- Example products (you can update images/prices later)
INSERT INTO products (name, slug, description, price, stock, category_id, thumbnail_url, is_active)
VALUES
  ('Bamboo Hand Bag', 'bamboo-hand-bag', 'Eco-friendly bamboo hand bag crafted by artisans.', 1200.00, 10,
    (SELECT id FROM categories WHERE slug = 'handicrafts' LIMIT 1),
    '/assets/bamboo-bag-1.jpg', 1),
  ('Handloom Cotton Saree', 'handloom-cotton-saree', 'Traditional handloom cotton saree.', 2500.00, 8,
    (SELECT id FROM categories WHERE slug = 'handloom' LIMIT 1),
    '/assets/handloom1.jpg', 1)
ON DUPLICATE KEY UPDATE
  description = VALUES(description),
  price = VALUES(price),
  stock = VALUES(stock),
  thumbnail_url = VALUES(thumbnail_url),
  is_active = VALUES(is_active);

