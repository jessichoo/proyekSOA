-- phpMyAdmin SQL Dump
-- version 5.0.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Jul 03, 2021 at 04:15 PM
-- Server version: 10.4.11-MariaDB
-- PHP Version: 7.4.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `db_proyek_soa`
--

-- --------------------------------------------------------

--
-- Table structure for table `buku_perpus`
--

DROP TABLE IF EXISTS `buku_perpus`;
CREATE TABLE `buku_perpus` (
  `isbn` varchar(30) NOT NULL,
  `id_perpus` varchar(5) NOT NULL,
  `status` int(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `buku_perpus`
--

INSERT INTO `buku_perpus` (`isbn`, `id_perpus`, `status`) VALUES
('9780062224149', 'P001', 0);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `buku_perpus`
--
ALTER TABLE `buku_perpus`
  ADD PRIMARY KEY (`isbn`,`id_perpus`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
