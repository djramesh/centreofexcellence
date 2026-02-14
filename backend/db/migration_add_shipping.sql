USE coe_ecommerce;

-- Add shipping-related columns to orders table
ALTER TABLE orders ADD COLUMN shiprocket_order_id VARCHAR(191) AFTER razorpay_payment_id;
ALTER TABLE orders ADD COLUMN shiprocket_shipment_id VARCHAR(191) AFTER shiprocket_order_id;
ALTER TABLE orders ADD COLUMN tracking_id VARCHAR(191) AFTER shiprocket_shipment_id;
ALTER TABLE orders ADD COLUMN courier_company VARCHAR(100) AFTER tracking_id;
ALTER TABLE orders ADD COLUMN tracking_url VARCHAR(500) AFTER courier_company;
ALTER TABLE orders ADD COLUMN shipping_status VARCHAR(50) AFTER tracking_url;
ALTER TABLE orders ADD COLUMN shipped_at TIMESTAMP NULL AFTER shipping_status;
ALTER TABLE orders ADD COLUMN delivered_at TIMESTAMP NULL AFTER shipped_at;
