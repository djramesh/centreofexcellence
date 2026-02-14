-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 14, 2026 at 09:21 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `coe_ecommerce`
--

-- --------------------------------------------------------

--
-- Table structure for table `addresses`
--

CREATE TABLE `addresses` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `line1` varchar(255) NOT NULL,
  `line2` varchar(255) DEFAULT NULL,
  `city` varchar(100) NOT NULL,
  `state` varchar(100) NOT NULL,
  `pincode` varchar(20) NOT NULL,
  `country` varchar(100) NOT NULL DEFAULT 'India',
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `addresses`
--

INSERT INTO `addresses` (`id`, `user_id`, `line1`, `line2`, `city`, `state`, `pincode`, `country`, `is_default`, `created_at`, `updated_at`) VALUES
(1, 1, 'xyz', 'xyz', 'BAKSA', 'Assam', '781349', 'India', 1, '2026-02-03 18:09:31', '2026-02-03 18:09:31'),
(2, 1, 'xyz', 'xyz', 'BAKSA', 'Assam', '781349', 'India', 1, '2026-02-04 06:04:16', '2026-02-04 06:04:16'),
(3, 3, 'hatigaon, guwahati, kamrup(m)', 'xyz', 'guwahati', 'Assam', '781038', 'India', 1, '2026-02-09 10:28:36', '2026-02-09 10:28:36'),
(4, 1, 'hatigaon, guwahati, kamrup(m)', 'xyz', 'guwahati', 'Assam', '781038', 'India', 1, '2026-02-09 12:09:45', '2026-02-09 12:09:45'),
(5, 1, 'hatigaon, guwahati, kamrup(m)', 'xyz', 'guwahati', 'Assam', '781038', 'India', 1, '2026-02-13 06:23:45', '2026-02-13 06:23:45'),
(6, 1, 'hatigaon, guwahati, kamrup(m)', 'xyz', 'guwahati', 'Assam', '781038', 'India', 1, '2026-02-13 07:07:00', '2026-02-13 07:07:00'),
(7, 1, 'hatigaon, guwahati, kamrup(m)', 'xyz', 'guwahati', 'Assam', '781038', 'India', 1, '2026-02-13 09:54:15', '2026-02-13 09:54:15'),
(8, 1, 'hatigaon, guwahati, kamrup(m)', 'xyz', 'guwahati', 'Assam', '781038', 'India', 1, '2026-02-13 10:58:22', '2026-02-13 10:58:22');

-- --------------------------------------------------------

--
-- Table structure for table `admin_audit_logs`
--

CREATE TABLE `admin_audit_logs` (
  `id` int(10) UNSIGNED NOT NULL,
  `admin_id` int(10) UNSIGNED NOT NULL,
  `action` varchar(100) NOT NULL,
  `entity_type` varchar(50) NOT NULL,
  `entity_id` int(10) UNSIGNED DEFAULT NULL,
  `metadata_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata_json`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `name`, `slug`, `description`, `created_at`, `updated_at`) VALUES
(1, 'Handicrafts', 'handicrafts', 'Handcrafted products from local artisans', '2026-02-02 13:44:43', '2026-02-02 13:44:43'),
(2, 'Handloom', 'handloom', 'Handwoven textiles and related products', '2026-02-02 13:44:43', '2026-02-02 13:44:43'),
(3, 'Prerana', 'prerana', 'Beautiful handcrafted products from Prerana community', '2026-02-13 07:01:58', '2026-02-13 07:01:58'),
(4, 'Shristi', 'shristi', 'Exquisite handcrafted products from Shristi community', '2026-02-13 07:01:58', '2026-02-13 07:01:58');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `address_id` int(10) UNSIGNED DEFAULT NULL,
  `status` enum('PENDING','PAID','SHIPPED','DELIVERED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  `payment_status` enum('PENDING','PAID','FAILED','REFUNDED') NOT NULL DEFAULT 'PENDING',
  `total_amount` decimal(10,2) NOT NULL,
  `razorpay_order_id` varchar(191) DEFAULT NULL,
  `razorpay_payment_id` varchar(191) DEFAULT NULL,
  `shiprocket_order_id` varchar(191) DEFAULT NULL,
  `shiprocket_shipment_id` varchar(191) DEFAULT NULL,
  `tracking_id` varchar(191) DEFAULT NULL,
  `courier_company` varchar(100) DEFAULT NULL,
  `tracking_url` varchar(500) DEFAULT NULL,
  `shipping_status` varchar(50) DEFAULT NULL,
  `shipped_at` timestamp NULL DEFAULT NULL,
  `delivered_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `user_id`, `address_id`, `status`, `payment_status`, `total_amount`, `razorpay_order_id`, `razorpay_payment_id`, `shiprocket_order_id`, `shiprocket_shipment_id`, `tracking_id`, `courier_company`, `tracking_url`, `shipping_status`, `shipped_at`, `delivered_at`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 'CANCELLED', 'PAID', 1200.00, 'order_SBlaqE4sUYSXQm', 'pay_SBld4KdPX1b2VC', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-02-03 18:09:31', '2026-02-09 12:06:49'),
(2, 1, 2, 'DELIVERED', 'PAID', 1200.00, 'order_SBxlrsvVKouTLa', 'pay_SBxmLvbmi0PRQq', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-02-04 06:04:16', '2026-02-09 12:06:43'),
(3, 3, 3, 'SHIPPED', 'PAID', 1200.00, 'order_SE0wfVE4MMw2z6', 'pay_SE0xuMhdqHCaJi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-02-09 10:28:36', '2026-02-09 12:06:36'),
(4, 1, 4, 'DELIVERED', 'PAID', 800.00, 'order_SE2fWt5JStdeXg', 'pay_SE2gL4xS3jWwyf', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-02-09 12:09:45', '2026-02-09 12:11:58'),
(5, 1, 5, 'PENDING', 'PENDING', 1000.00, 'order_SFWuWu365K38ix', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-02-13 06:23:45', '2026-02-13 06:23:46'),
(6, 1, 6, 'PENDING', 'PENDING', 500.00, 'order_SFXeDFPwX1cu8c', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-02-13 07:07:00', '2026-02-13 07:07:01'),
(7, 1, 7, 'DELIVERED', 'PAID', 1200.00, 'order_SFaUtbQi6E0suu', 'pay_SFaVd56zvleXdP', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-02-13 09:54:15', '2026-02-13 10:08:06'),
(8, 1, 8, 'PAID', 'PAID', 800.00, 'order_SFbacHyX6RfSZd', 'pay_SFbbnDMHLtlHlS', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-02-13 10:58:22', '2026-02-14 05:22:51');

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` int(10) UNSIGNED NOT NULL,
  `order_id` int(10) UNSIGNED NOT NULL,
  `product_id` int(10) UNSIGNED NOT NULL,
  `quantity` int(11) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `line_total` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `quantity`, `unit_price`, `line_total`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 1, 1200.00, 1200.00, '2026-02-03 18:09:31', '2026-02-03 18:09:31'),
(2, 2, 1, 1, 1200.00, 1200.00, '2026-02-04 06:04:16', '2026-02-04 06:04:16'),
(3, 3, 1, 1, 1200.00, 1200.00, '2026-02-09 10:28:36', '2026-02-09 10:28:36'),
(4, 4, 2, 1, 800.00, 800.00, '2026-02-09 12:09:45', '2026-02-09 12:09:45'),
(5, 5, 2, 2, 500.00, 1000.00, '2026-02-13 06:23:45', '2026-02-13 06:23:45'),
(6, 6, 24, 1, 500.00, 500.00, '2026-02-13 07:07:00', '2026-02-13 07:07:00'),
(7, 7, 1, 1, 1200.00, 1200.00, '2026-02-13 09:54:15', '2026-02-13 09:54:15'),
(8, 8, 3, 1, 800.00, 800.00, '2026-02-13 10:58:22', '2026-02-13 10:58:22');

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` int(10) UNSIGNED NOT NULL,
  `order_id` int(10) UNSIGNED NOT NULL,
  `razorpay_order_id` varchar(191) DEFAULT NULL,
  `razorpay_payment_id` varchar(191) DEFAULT NULL,
  `razorpay_signature` varchar(255) DEFAULT NULL,
  `status` enum('PENDING','SUCCESS','FAILED') NOT NULL DEFAULT 'PENDING',
  `amount` decimal(10,2) NOT NULL,
  `currency` varchar(10) NOT NULL DEFAULT 'INR',
  `raw_payload_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`raw_payload_json`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `order_id`, `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`, `status`, `amount`, `currency`, `raw_payload_json`, `created_at`) VALUES
(1, 1, 'order_SBlaqE4sUYSXQm', 'pay_SBld4KdPX1b2VC', '77b4f136ec6326f7abeddf3912f5678d68179a1b7a8808de671d292308ec6b79', 'SUCCESS', 1200.00, 'INR', NULL, '2026-02-03 18:11:59'),
(2, 2, 'order_SBxlrsvVKouTLa', 'pay_SBxmLvbmi0PRQq', '4ec73c8551c5061b20059366d9a41387a86a401b7e6fe6b2a74eb9c23b0058cd', 'SUCCESS', 1200.00, 'INR', NULL, '2026-02-04 06:05:06'),
(3, 3, 'order_SE0wfVE4MMw2z6', 'pay_SE0xuMhdqHCaJi', 'dfd959d8d491c3faa1b22db4d8424ecc3b94deb554bfd4220c8049bdff637850', 'SUCCESS', 1200.00, 'INR', NULL, '2026-02-09 10:30:12'),
(4, 4, 'order_SE2fWt5JStdeXg', 'pay_SE2gL4xS3jWwyf', '90f928cb298ef93987a0b6c0465ea39a3eca5782b17b5bdd0f485f06fac61bbe', 'SUCCESS', 800.00, 'INR', NULL, '2026-02-09 12:10:51'),
(5, 7, 'order_SFaUtbQi6E0suu', 'pay_SFaVd56zvleXdP', '11cd28810f49899704f260c0e1fd78dc0055ee487a13932a8ed15e98a64c449d', 'SUCCESS', 1200.00, 'INR', NULL, '2026-02-13 09:55:17'),
(6, 8, 'order_SFbacHyX6RfSZd', 'pay_SFbbnDMHLtlHlS', 'bbe04ed4ce89381ea6c515933e58edaf4cb6e06f7137e94079ad9be675fe4a67', 'SUCCESS', 800.00, 'INR', NULL, '2026-02-13 10:59:53');

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(150) NOT NULL,
  `slug` varchar(180) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `stock` int(11) NOT NULL DEFAULT 0,
  `category_id` int(10) UNSIGNED DEFAULT NULL,
  `thumbnail_url` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `name`, `slug`, `description`, `price`, `stock`, `category_id`, `thumbnail_url`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Bamboo Hand Bag', 'bamboo-hand-bag', 'Eco-friendly bamboo hand bag crafted by artisans.', 1200.00, 6, 1, '/assets/bamboo-bag-1.jpg', 1, '2026-02-02 13:44:43', '2026-02-13 09:54:15'),
(2, 'Handloom Cotton Saree', 'handloom-cotton-saree', 'Traditional handloom cotton saree.', 2500.00, 5, 2, '/assets/handloom1.jpg', 1, '2026-02-02 13:44:43', '2026-02-13 06:23:45'),
(3, 'Prerana Product 1', 'prerana-product-1', 'Beautiful handcrafted product from Prerana community', 800.00, 9, 3, '/assets/IMG-20260129-WA0001.jpg', 1, '2026-02-13 07:01:58', '2026-02-13 10:58:22'),
(4, 'Prerana Product 2', 'prerana-product-2', 'Beautiful handcrafted product from Prerana community', 800.00, 10, 3, '/assets/IMG-20260129-WA0002.jpg', 1, '2026-02-13 07:01:58', '2026-02-13 07:01:58'),
(5, 'Prerana Product 3', 'prerana-product-3', 'Beautiful handcrafted product from Prerana community', 800.00, 10, 3, '/assets/IMG-20260129-WA0003.jpg', 1, '2026-02-13 07:01:58', '2026-02-13 07:01:58'),
(6, 'Prerana Product 4', 'prerana-product-4', 'Beautiful handcrafted product from Prerana community', 800.00, 10, 3, '/assets/IMG-20260129-WA0004.jpg', 1, '2026-02-13 07:01:58', '2026-02-13 07:01:58'),
(7, 'Prerana Product 5', 'prerana-product-5', 'Beautiful handcrafted product from Prerana community', 800.00, 10, 3, '/assets/IMG-20260129-WA0005.jpg', 1, '2026-02-13 07:01:58', '2026-02-13 07:01:58'),
(8, 'Prerana Product 6', 'prerana-product-6', 'Beautiful handcrafted product from Prerana community', 800.00, 10, 3, '/assets/IMG-20260129-WA0006.jpg', 1, '2026-02-13 07:01:58', '2026-02-13 07:01:58'),
(9, 'Prerana Product 7', 'prerana-product-7', 'Beautiful handcrafted product from Prerana community', 800.00, 10, 3, '/assets/IMG-20260129-WA0007.jpg', 1, '2026-02-13 07:01:58', '2026-02-13 07:01:58'),
(10, 'Prerana Product 8', 'prerana-product-8', 'Beautiful handcrafted product from Prerana community', 800.00, 10, 3, '/assets/IMG-20260129-WA0008.jpg', 1, '2026-02-13 07:01:58', '2026-02-13 07:01:58'),
(11, 'Prerana Product 9', 'prerana-product-9', 'Beautiful handcrafted product from Prerana community', 800.00, 10, 3, '/assets/IMG-20260129-WA0009.jpg', 1, '2026-02-13 07:01:58', '2026-02-13 07:01:58'),
(12, 'Prerana Product 10', 'prerana-product-10', 'Beautiful handcrafted product from Prerana community', 800.00, 10, 3, '/assets/IMG-20260129-WA0010.jpg', 1, '2026-02-13 07:01:58', '2026-02-13 07:01:58'),
(13, 'Prerana Product 11', 'prerana-product-11', 'Beautiful handcrafted product from Prerana community', 800.00, 10, 3, '/assets/IMG-20260129-WA0011.jpg', 1, '2026-02-13 07:01:58', '2026-02-13 07:01:58'),
(14, 'Prerana Product 12', 'prerana-product-12', 'Beautiful handcrafted product from Prerana community', 800.00, 10, 3, '/assets/IMG-20260129-WA0012.jpg', 1, '2026-02-13 07:01:58', '2026-02-13 07:01:58'),
(15, 'Prerana Product 13', 'prerana-product-13', 'Beautiful handcrafted product from Prerana community', 800.00, 10, 3, '/assets/IMG-20260129-WA0013.jpg', 1, '2026-02-13 07:01:58', '2026-02-13 07:01:58'),
(16, 'Prerana Product 14', 'prerana-product-14', 'Beautiful handcrafted product from Prerana community', 800.00, 10, 3, '/assets/IMG-20260129-WA0014.jpg', 1, '2026-02-13 07:01:58', '2026-02-13 07:01:58'),
(17, 'Prerana Product 15', 'prerana-product-15', 'Beautiful handcrafted product from Prerana community', 800.00, 10, 3, '/assets/IMG-20260129-WA0015.jpg', 1, '2026-02-13 07:01:58', '2026-02-13 07:01:58'),
(18, 'Prerana Product 16', 'prerana-product-16', 'Beautiful handcrafted product from Prerana community', 800.00, 10, 3, '/assets/IMG-20260129-WA0016.jpg', 1, '2026-02-13 07:01:58', '2026-02-13 07:01:58'),
(19, 'Prerana Product 17', 'prerana-product-17', 'Beautiful handcrafted product from Prerana community', 800.00, 10, 3, '/assets/IMG-20260129-WA0017.jpg', 1, '2026-02-13 07:01:58', '2026-02-13 07:01:58'),
(20, 'Prerana Product 18', 'prerana-product-18', 'Beautiful handcrafted product from Prerana community', 800.00, 10, 3, '/assets/IMG-20260129-WA0018.jpg', 1, '2026-02-13 07:01:58', '2026-02-13 07:01:58'),
(21, 'Prerana Product 19', 'prerana-product-19', 'Beautiful handcrafted product from Prerana community', 800.00, 10, 3, '/assets/IMG-20260129-WA0019.jpg', 1, '2026-02-13 07:01:58', '2026-02-13 07:01:58'),
(22, 'Prerana Product 20', 'prerana-product-20', 'Beautiful handcrafted product from Prerana community', 800.00, 10, 3, '/assets/IMG-20260129-WA0020.jpg', 1, '2026-02-13 07:01:58', '2026-02-13 07:01:58'),
(23, 'Prerana Product 21', 'prerana-product-21', 'Beautiful handcrafted product from Prerana community', 800.00, 10, 3, '/assets/IMG-20260129-WA0021.jpg', 1, '2026-02-13 07:01:58', '2026-02-13 07:01:58'),
(24, 'Prerana Product 22', 'prerana-product-22', 'Beautiful handcrafted product from Prerana community', 800.00, 9, 3, '/assets/IMG-20260129-WA0022.jpg', 1, '2026-02-13 07:01:58', '2026-02-13 07:07:00'),
(25, 'Prerana Product 23', 'prerana-product-23', 'Beautiful handcrafted product from Prerana community', 800.00, 10, 3, '/assets/IMG-20260129-WA0023.jpg', 1, '2026-02-13 07:01:58', '2026-02-13 07:01:58'),
(26, 'Prerana Product 24', 'prerana-product-24', 'Beautiful handcrafted product from Prerana community', 800.00, 10, 3, '/assets/IMG-20260129-WA0024.jpg', 1, '2026-02-13 07:01:58', '2026-02-13 07:01:58'),
(27, 'Prerana Product 25', 'prerana-product-25', 'Beautiful handcrafted product from Prerana community', 800.00, 10, 3, '/assets/IMG-20260129-WA0025.jpg', 1, '2026-02-13 07:01:58', '2026-02-13 07:01:58'),
(28, 'Prerana Product 26', 'prerana-product-26', 'Beautiful handcrafted product from Prerana community', 800.00, 10, 3, '/assets/IMG-20260129-WA0026.jpg', 1, '2026-02-13 07:01:58', '2026-02-13 07:01:58'),
(29, 'Prerana Product 27', 'prerana-product-27', 'Beautiful handcrafted product from Prerana community', 800.00, 10, 3, '/assets/IMG-20260129-WA0027.jpg', 1, '2026-02-13 07:01:58', '2026-02-13 07:01:58'),
(30, 'Prerana Product 28', 'prerana-product-28', 'Beautiful handcrafted product from Prerana community', 800.00, 10, 3, '/assets/IMG-20260129-WA0028.jpg', 1, '2026-02-13 07:01:58', '2026-02-13 07:01:58'),
(31, 'Prerana Product 29', 'prerana-product-29', 'Beautiful handcrafted product from Prerana community', 800.00, 10, 3, '/assets/IMG-20260129-WA0029.jpg', 1, '2026-02-13 07:01:58', '2026-02-13 07:01:58'),
(32, 'Prerana Product 30', 'prerana-product-30', 'Beautiful handcrafted product from Prerana community', 800.00, 10, 3, '/assets/IMG-20260129-WA0030.jpg', 1, '2026-02-13 07:01:58', '2026-02-13 07:01:58'),
(33, 'Prerana Product 31', 'prerana-product-31', 'Beautiful handcrafted product from Prerana community', 800.00, 10, 3, '/assets/IMG-20260129-WA0031.jpg', 1, '2026-02-13 07:01:58', '2026-02-13 07:01:58'),
(34, 'Shristi Product 1', 'shristi-product-1', 'Beautiful handcrafted product from Shristi community', 800.00, 10, 4, '/assets/IMG_3865.jpeg', 1, '2026-02-13 07:01:58', '2026-02-13 07:01:58'),
(35, 'Shristi Product 2', 'shristi-product-2', 'Beautiful handcrafted product from Shristi community', 800.00, 10, 4, '/assets/IMG_3866.jpeg', 1, '2026-02-13 07:01:58', '2026-02-13 07:01:58'),
(36, 'Shristi Product 3', 'shristi-product-3', 'Beautiful handcrafted product from Shristi community', 800.00, 10, 4, '/assets/IMG_3867.jpeg', 1, '2026-02-13 07:01:58', '2026-02-13 07:01:58'),
(37, 'Shristi Product 4', 'shristi-product-4', 'Beautiful handcrafted product from Shristi community', 800.00, 10, 4, '/assets/IMG_3868.jpeg', 1, '2026-02-13 07:01:58', '2026-02-13 07:01:58'),
(38, 'Shristi Product 5', 'shristi-product-5', 'Beautiful handcrafted product from Shristi community', 800.00, 10, 4, '/assets/IMG_3869.jpeg', 1, '2026-02-13 07:01:58', '2026-02-13 07:01:58'),
(39, 'Shristi Product 6', 'shristi-product-6', 'Beautiful handcrafted product from Shristi community', 800.00, 10, 4, '/assets/IMG_3870.jpeg', 1, '2026-02-13 07:01:58', '2026-02-13 07:01:58'),
(40, 'Shristi Product 7', 'shristi-product-7', 'Beautiful handcrafted product from Shristi community', 800.00, 10, 4, '/assets/IMG_3874.jpeg', 1, '2026-02-13 07:01:58', '2026-02-13 07:01:58'),
(41, 'Shristi Product 8', 'shristi-product-8', 'Beautiful handcrafted product from Shristi community', 800.00, 10, 4, '/assets/IMG_3875.jpeg', 1, '2026-02-13 07:01:58', '2026-02-13 07:01:58'),
(42, 'Shristi Product 9', 'shristi-product-9', 'Beautiful handcrafted product from Shristi community', 800.00, 10, 4, '/assets/IMG_3876.jpeg', 1, '2026-02-13 07:01:58', '2026-02-13 07:01:58'),
(43, 'Shristi Product 10', 'shristi-product-10', 'Beautiful handcrafted product from Shristi community', 800.00, 10, 4, '/assets/IMG_3877.jpeg', 1, '2026-02-13 07:01:58', '2026-02-13 07:01:58'),
(44, 'Shristi Product 11', 'shristi-product-11', 'Beautiful handcrafted product from Shristi community', 800.00, 10, 4, '/assets/IMG_3879.jpeg', 1, '2026-02-13 07:01:58', '2026-02-13 07:01:58'),
(45, 'Shristi Product 12', 'shristi-product-12', 'Beautiful handcrafted product from Shristi community', 800.00, 10, 4, '/assets/IMG_4338.jpeg', 1, '2026-02-13 07:01:58', '2026-02-13 07:01:58'),
(46, 'Shristi Product 13', 'shristi-product-13', 'Beautiful handcrafted product from Shristi community', 800.00, 10, 4, '/assets/IMG_4339.jpeg', 1, '2026-02-13 07:01:58', '2026-02-13 07:01:58'),
(47, 'Shristi Product 14', 'shristi-product-14', 'Beautiful handcrafted product from Shristi community', 800.00, 10, 4, '/assets/IMG_4341.jpeg', 1, '2026-02-13 07:01:58', '2026-02-13 07:01:58'),
(48, 'Shristi Product 15', 'shristi-product-15', 'Beautiful handcrafted product from Shristi community', 800.00, 10, 4, '/assets/IMG_4342.jpeg', 1, '2026-02-13 07:01:58', '2026-02-13 07:01:58'),
(49, 'Shristi Product 16', 'shristi-product-16', 'Beautiful handcrafted product from Shristi community', 800.00, 10, 4, '/assets/IMG_4394.jpeg', 1, '2026-02-13 07:01:58', '2026-02-13 07:01:58'),
(50, 'Shristi Product 17', 'shristi-product-17', 'Beautiful handcrafted product from Shristi community', 800.00, 10, 4, '/assets/IMG_4397.jpeg', 1, '2026-02-13 07:01:58', '2026-02-13 07:01:58'),
(51, 'Shristi Product 18', 'shristi-product-18', 'Beautiful handcrafted product from Shristi community', 800.00, 10, 4, '/assets/IMG_4398.jpeg', 1, '2026-02-13 07:01:58', '2026-02-13 07:01:58'),
(52, 'Shristi Product 19', 'shristi-product-19', 'Beautiful handcrafted product from Shristi community', 800.00, 10, 4, '/assets/IMG_4399.jpeg', 1, '2026-02-13 07:01:58', '2026-02-13 07:01:58'),
(53, 'Shristi Product 20', 'shristi-product-20', 'Beautiful handcrafted product from Shristi community', 800.00, 10, 4, '/assets/IMG_4401.jpeg', 1, '2026-02-13 07:01:58', '2026-02-13 07:01:58');

-- --------------------------------------------------------

--
-- Table structure for table `product_images`
--

CREATE TABLE `product_images` (
  `id` int(10) UNSIGNED NOT NULL,
  `product_id` int(10) UNSIGNED NOT NULL,
  `image_url` varchar(255) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(191) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('user','admin') NOT NULL DEFAULT 'user',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `phone`, `password_hash`, `role`, `created_at`, `updated_at`) VALUES
(1, 'Deep Baishya', 'deepbaishya4385@gmail.com', '6000588710', '$2a$10$oGPZzh2vf87bwOAKzDnDp.oJQ5WojTW642jNObzwVCusI4mGa.MpC', 'user', '2026-01-28 12:35:37', '2026-01-28 12:35:37'),
(2, 'Admin', 'admin@coe.com', NULL, '$2a$10$tdS5Vy336lV/AJfSinj0Ze3TFcEK9GzRigjONRmu5FHgBYU0C0AWW', 'admin', '2026-02-02 13:44:43', '2026-02-02 13:44:43'),
(3, 'Deep Baishya', 'deepbaishya369@gmail.com', '6000588710', '$2a$10$IvZVZVDkwakvDHhpu4ZU3.cRpzHSdY/ZHojGXZWu8r614B698cYGO', 'user', '2026-02-09 10:26:29', '2026-02-09 10:26:29');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `addresses`
--
ALTER TABLE `addresses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_addresses_user` (`user_id`);

--
-- Indexes for table `admin_audit_logs`
--
ALTER TABLE `admin_audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_audit_admin` (`admin_id`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_orders_user` (`user_id`),
  ADD KEY `fk_orders_address` (`address_id`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_order_items_order` (`order_id`),
  ADD KEY `fk_order_items_product` (`product_id`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_payments_order` (`order_id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `fk_products_category` (`category_id`);

--
-- Indexes for table `product_images`
--
ALTER TABLE `product_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_product_images_product` (`product_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `addresses`
--
ALTER TABLE `addresses`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `admin_audit_logs`
--
ALTER TABLE `admin_audit_logs`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=54;

--
-- AUTO_INCREMENT for table `product_images`
--
ALTER TABLE `product_images`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `admin_audit_logs`
--
ALTER TABLE `admin_audit_logs`
  ADD CONSTRAINT `fk_audit_admin` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `fk_orders_address` FOREIGN KEY (`address_id`) REFERENCES `addresses` (`id`),
  ADD CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_order_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `fk_payments_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
