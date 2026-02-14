USE coe_ecommerce;

-- Add new categories for Prerana and Shristi
INSERT INTO categories (name, slug, description) VALUES
  ('Prerana', 'prerana', 'Beautiful handcrafted products from Prerana community'),
  ('Shristi', 'shristi', 'Exquisite handcrafted products from Shristi community')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description);

-- Insert Prerana Products (31 products)
INSERT INTO products (name, slug, description, price, stock, category_id, thumbnail_url, is_active) VALUES
('Prerana Product 1', 'prerana-product-1', 'Beautiful handcrafted product from Prerana community', 800.00, 10, (SELECT id FROM categories WHERE slug = 'prerana' LIMIT 1), '/assets/IMG-20260129-WA0001.jpg', 1),
('Prerana Product 2', 'prerana-product-2', 'Beautiful handcrafted product from Prerana community', 800.00, 10, (SELECT id FROM categories WHERE slug = 'prerana' LIMIT 1), '/assets/IMG-20260129-WA0002.jpg', 1),
('Prerana Product 3', 'prerana-product-3', 'Beautiful handcrafted product from Prerana community', 800.00, 10, (SELECT id FROM categories WHERE slug = 'prerana' LIMIT 1), '/assets/IMG-20260129-WA0003.jpg', 1),
('Prerana Product 4', 'prerana-product-4', 'Beautiful handcrafted product from Prerana community', 800.00, 10, (SELECT id FROM categories WHERE slug = 'prerana' LIMIT 1), '/assets/IMG-20260129-WA0004.jpg', 1),
('Prerana Product 5', 'prerana-product-5', 'Beautiful handcrafted product from Prerana community', 800.00, 10, (SELECT id FROM categories WHERE slug = 'prerana' LIMIT 1), '/assets/IMG-20260129-WA0005.jpg', 1),
('Prerana Product 6', 'prerana-product-6', 'Beautiful handcrafted product from Prerana community', 800.00, 10, (SELECT id FROM categories WHERE slug = 'prerana' LIMIT 1), '/assets/IMG-20260129-WA0006.jpg', 1),
('Prerana Product 7', 'prerana-product-7', 'Beautiful handcrafted product from Prerana community', 800.00, 10, (SELECT id FROM categories WHERE slug = 'prerana' LIMIT 1), '/assets/IMG-20260129-WA0007.jpg', 1),
('Prerana Product 8', 'prerana-product-8', 'Beautiful handcrafted product from Prerana community', 800.00, 10, (SELECT id FROM categories WHERE slug = 'prerana' LIMIT 1), '/assets/IMG-20260129-WA0008.jpg', 1),
('Prerana Product 9', 'prerana-product-9', 'Beautiful handcrafted product from Prerana community', 800.00, 10, (SELECT id FROM categories WHERE slug = 'prerana' LIMIT 1), '/assets/IMG-20260129-WA0009.jpg', 1),
('Prerana Product 10', 'prerana-product-10', 'Beautiful handcrafted product from Prerana community', 800.00, 10, (SELECT id FROM categories WHERE slug = 'prerana' LIMIT 1), '/assets/IMG-20260129-WA0010.jpg', 1),
('Prerana Product 11', 'prerana-product-11', 'Beautiful handcrafted product from Prerana community', 800.00, 10, (SELECT id FROM categories WHERE slug = 'prerana' LIMIT 1), '/assets/IMG-20260129-WA0011.jpg', 1),
('Prerana Product 12', 'prerana-product-12', 'Beautiful handcrafted product from Prerana community', 800.00, 10, (SELECT id FROM categories WHERE slug = 'prerana' LIMIT 1), '/assets/IMG-20260129-WA0012.jpg', 1),
('Prerana Product 13', 'prerana-product-13', 'Beautiful handcrafted product from Prerana community', 800.00, 10, (SELECT id FROM categories WHERE slug = 'prerana' LIMIT 1), '/assets/IMG-20260129-WA0013.jpg', 1),
('Prerana Product 14', 'prerana-product-14', 'Beautiful handcrafted product from Prerana community', 800.00, 10, (SELECT id FROM categories WHERE slug = 'prerana' LIMIT 1), '/assets/IMG-20260129-WA0014.jpg', 1),
('Prerana Product 15', 'prerana-product-15', 'Beautiful handcrafted product from Prerana community', 800.00, 10, (SELECT id FROM categories WHERE slug = 'prerana' LIMIT 1), '/assets/IMG-20260129-WA0015.jpg', 1),
('Prerana Product 16', 'prerana-product-16', 'Beautiful handcrafted product from Prerana community', 800.00, 10, (SELECT id FROM categories WHERE slug = 'prerana' LIMIT 1), '/assets/IMG-20260129-WA0016.jpg', 1),
('Prerana Product 17', 'prerana-product-17', 'Beautiful handcrafted product from Prerana community', 800.00, 10, (SELECT id FROM categories WHERE slug = 'prerana' LIMIT 1), '/assets/IMG-20260129-WA0017.jpg', 1),
('Prerana Product 18', 'prerana-product-18', 'Beautiful handcrafted product from Prerana community', 800.00, 10, (SELECT id FROM categories WHERE slug = 'prerana' LIMIT 1), '/assets/IMG-20260129-WA0018.jpg', 1),
('Prerana Product 19', 'prerana-product-19', 'Beautiful handcrafted product from Prerana community', 800.00, 10, (SELECT id FROM categories WHERE slug = 'prerana' LIMIT 1), '/assets/IMG-20260129-WA0019.jpg', 1),
('Prerana Product 20', 'prerana-product-20', 'Beautiful handcrafted product from Prerana community', 800.00, 10, (SELECT id FROM categories WHERE slug = 'prerana' LIMIT 1), '/assets/IMG-20260129-WA0020.jpg', 1),
('Prerana Product 21', 'prerana-product-21', 'Beautiful handcrafted product from Prerana community', 800.00, 10, (SELECT id FROM categories WHERE slug = 'prerana' LIMIT 1), '/assets/IMG-20260129-WA0021.jpg', 1),
('Prerana Product 22', 'prerana-product-22', 'Beautiful handcrafted product from Prerana community', 800.00, 10, (SELECT id FROM categories WHERE slug = 'prerana' LIMIT 1), '/assets/IMG-20260129-WA0022.jpg', 1),
('Prerana Product 23', 'prerana-product-23', 'Beautiful handcrafted product from Prerana community', 800.00, 10, (SELECT id FROM categories WHERE slug = 'prerana' LIMIT 1), '/assets/IMG-20260129-WA0023.jpg', 1),
('Prerana Product 24', 'prerana-product-24', 'Beautiful handcrafted product from Prerana community', 800.00, 10, (SELECT id FROM categories WHERE slug = 'prerana' LIMIT 1), '/assets/IMG-20260129-WA0024.jpg', 1),
('Prerana Product 25', 'prerana-product-25', 'Beautiful handcrafted product from Prerana community', 800.00, 10, (SELECT id FROM categories WHERE slug = 'prerana' LIMIT 1), '/assets/IMG-20260129-WA0025.jpg', 1),
('Prerana Product 26', 'prerana-product-26', 'Beautiful handcrafted product from Prerana community', 800.00, 10, (SELECT id FROM categories WHERE slug = 'prerana' LIMIT 1), '/assets/IMG-20260129-WA0026.jpg', 1),
('Prerana Product 27', 'prerana-product-27', 'Beautiful handcrafted product from Prerana community', 800.00, 10, (SELECT id FROM categories WHERE slug = 'prerana' LIMIT 1), '/assets/IMG-20260129-WA0027.jpg', 1),
('Prerana Product 28', 'prerana-product-28', 'Beautiful handcrafted product from Prerana community', 800.00, 10, (SELECT id FROM categories WHERE slug = 'prerana' LIMIT 1), '/assets/IMG-20260129-WA0028.jpg', 1),
('Prerana Product 29', 'prerana-product-29', 'Beautiful handcrafted product from Prerana community', 800.00, 10, (SELECT id FROM categories WHERE slug = 'prerana' LIMIT 1), '/assets/IMG-20260129-WA0029.jpg', 1),
('Prerana Product 30', 'prerana-product-30', 'Beautiful handcrafted product from Prerana community', 800.00, 10, (SELECT id FROM categories WHERE slug = 'prerana' LIMIT 1), '/assets/IMG-20260129-WA0030.jpg', 1),
('Prerana Product 31', 'prerana-product-31', 'Beautiful handcrafted product from Prerana community', 800.00, 10, (SELECT id FROM categories WHERE slug = 'prerana' LIMIT 1), '/assets/IMG-20260129-WA0031.jpg', 1)
ON DUPLICATE KEY UPDATE
  description = VALUES(description),
  price = VALUES(price),
  stock = VALUES(stock),
  thumbnail_url = VALUES(thumbnail_url),
  is_active = VALUES(is_active);

-- Insert Shristi Products (20 products)
INSERT INTO products (name, slug, description, price, stock, category_id, thumbnail_url, is_active) VALUES
('Shristi Product 1', 'shristi-product-1', 'Beautiful handcrafted product from Shristi community', 800.00, 10, (SELECT id FROM categories WHERE slug = 'shristi' LIMIT 1), '/assets/IMG_3865.jpeg', 1),
('Shristi Product 2', 'shristi-product-2', 'Beautiful handcrafted product from Shristi community', 800.00, 10, (SELECT id FROM categories WHERE slug = 'shristi' LIMIT 1), '/assets/IMG_3866.jpeg', 1),
('Shristi Product 3', 'shristi-product-3', 'Beautiful handcrafted product from Shristi community', 800.00, 10, (SELECT id FROM categories WHERE slug = 'shristi' LIMIT 1), '/assets/IMG_3867.jpeg', 1),
('Shristi Product 4', 'shristi-product-4', 'Beautiful handcrafted product from Shristi community', 800.00, 10, (SELECT id FROM categories WHERE slug = 'shristi' LIMIT 1), '/assets/IMG_3868.jpeg', 1),
('Shristi Product 5', 'shristi-product-5', 'Beautiful handcrafted product from Shristi community', 800.00, 10, (SELECT id FROM categories WHERE slug = 'shristi' LIMIT 1), '/assets/IMG_3869.jpeg', 1),
('Shristi Product 6', 'shristi-product-6', 'Beautiful handcrafted product from Shristi community', 800.00, 10, (SELECT id FROM categories WHERE slug = 'shristi' LIMIT 1), '/assets/IMG_3870.jpeg', 1),
('Shristi Product 7', 'shristi-product-7', 'Beautiful handcrafted product from Shristi community', 800.00, 10, (SELECT id FROM categories WHERE slug = 'shristi' LIMIT 1), '/assets/IMG_3874.jpeg', 1),
('Shristi Product 8', 'shristi-product-8', 'Beautiful handcrafted product from Shristi community', 800.00, 10, (SELECT id FROM categories WHERE slug = 'shristi' LIMIT 1), '/assets/IMG_3875.jpeg', 1),
('Shristi Product 9', 'shristi-product-9', 'Beautiful handcrafted product from Shristi community', 800.00, 10, (SELECT id FROM categories WHERE slug = 'shristi' LIMIT 1), '/assets/IMG_3876.jpeg', 1),
('Shristi Product 10', 'shristi-product-10', 'Beautiful handcrafted product from Shristi community', 800.00, 10, (SELECT id FROM categories WHERE slug = 'shristi' LIMIT 1), '/assets/IMG_3877.jpeg', 1),
('Shristi Product 11', 'shristi-product-11', 'Beautiful handcrafted product from Shristi community', 800.00, 10, (SELECT id FROM categories WHERE slug = 'shristi' LIMIT 1), '/assets/IMG_3879.jpeg', 1),
('Shristi Product 12', 'shristi-product-12', 'Beautiful handcrafted product from Shristi community', 800.00, 10, (SELECT id FROM categories WHERE slug = 'shristi' LIMIT 1), '/assets/IMG_4338.jpeg', 1),
('Shristi Product 13', 'shristi-product-13', 'Beautiful handcrafted product from Shristi community', 800.00, 10, (SELECT id FROM categories WHERE slug = 'shristi' LIMIT 1), '/assets/IMG_4339.jpeg', 1),
('Shristi Product 14', 'shristi-product-14', 'Beautiful handcrafted product from Shristi community', 800.00, 10, (SELECT id FROM categories WHERE slug = 'shristi' LIMIT 1), '/assets/IMG_4341.jpeg', 1),
('Shristi Product 15', 'shristi-product-15', 'Beautiful handcrafted product from Shristi community', 800.00, 10, (SELECT id FROM categories WHERE slug = 'shristi' LIMIT 1), '/assets/IMG_4342.jpeg', 1),
('Shristi Product 16', 'shristi-product-16', 'Beautiful handcrafted product from Shristi community', 800.00, 10, (SELECT id FROM categories WHERE slug = 'shristi' LIMIT 1), '/assets/IMG_4394.jpeg', 1),
('Shristi Product 17', 'shristi-product-17', 'Beautiful handcrafted product from Shristi community', 800.00, 10, (SELECT id FROM categories WHERE slug = 'shristi' LIMIT 1), '/assets/IMG_4397.jpeg', 1),
('Shristi Product 18', 'shristi-product-18', 'Beautiful handcrafted product from Shristi community', 800.00, 10, (SELECT id FROM categories WHERE slug = 'shristi' LIMIT 1), '/assets/IMG_4398.jpeg', 1),
('Shristi Product 19', 'shristi-product-19', 'Beautiful handcrafted product from Shristi community', 800.00, 10, (SELECT id FROM categories WHERE slug = 'shristi' LIMIT 1), '/assets/IMG_4399.jpeg', 1),
('Shristi Product 20', 'shristi-product-20', 'Beautiful handcrafted product from Shristi community', 800.00, 10, (SELECT id FROM categories WHERE slug = 'shristi' LIMIT 1), '/assets/IMG_4401.jpeg', 1)
ON DUPLICATE KEY UPDATE
  description = VALUES(description),
  price = VALUES(price),
  stock = VALUES(stock),
  thumbnail_url = VALUES(thumbnail_url),
  is_active = VALUES(is_active);
