-- phpMyAdmin SQL Dump
-- version 5.0.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Jun 15, 2021 at 08:30 PM
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
CREATE DATABASE IF NOT EXISTS `db_proyek_soa` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `db_proyek_soa`;

-- --------------------------------------------------------

--
-- Table structure for table `buku`
--

DROP TABLE IF EXISTS `buku`;
CREATE TABLE `buku` (
  `id` varchar(50) NOT NULL,
  `judul` varchar(50) NOT NULL,
  `author` varchar(50) DEFAULT NULL,
  `tahun` varchar(50) DEFAULT NULL,
  `genre` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `buku`
--

INSERT INTO `buku` (`id`, `judul`, `author`, `tahun`, `genre`) VALUES
('qRh7HEV_Q30C', 'HAI', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `buku_perpus`
--

DROP TABLE IF EXISTS `buku_perpus`;
CREATE TABLE `buku_perpus` (
  `id_buku` varchar(30) NOT NULL,
  `id_perpus` varchar(5) NOT NULL,
  `status` int(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `buku_perpus`
--

INSERT INTO `buku_perpus` (`id_buku`, `id_perpus`, `status`) VALUES
('qRh7HEV_Q30C', 'P001', 1);

-- --------------------------------------------------------

--
-- Table structure for table `request`
--

DROP TABLE IF EXISTS `request`;
CREATE TABLE `request` (
  `id_req` varchar(5) NOT NULL,
  `id_user` varchar(5) NOT NULL,
  `id_buku` varchar(5) NOT NULL,
  `tgl_req` date NOT NULL,
  `status` int(1) DEFAULT NULL COMMENT '0:pending, 1:process, 2:complete',
  `id_perpus` varchar(5) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `request`
--

INSERT INTO `request` (`id_req`, `id_user`, `id_buku`, `tgl_req`, `status`, `id_perpus`) VALUES
('R001', 'U001', 'test', '0000-00-00', 0, NULL),
('R002', 'U001', '1234', '0000-00-00', 0, 'P001');

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
  `id_user` varchar(5) NOT NULL,
  `username` varchar(30) NOT NULL,
  `password` varchar(30) NOT NULL,
  `nama` varchar(100) NOT NULL,
  `alamat` varchar(200) DEFAULT NULL COMMENT 'khusus P',
  `kota` varchar(20) DEFAULT NULL COMMENT 'khusus P',
  `no_telepon` varchar(15) DEFAULT NULL COMMENT 'khusus P',
  `api_hit` int(2) NOT NULL,
  `saldo` int(5) NOT NULL,
  `role` varchar(1) NOT NULL COMMENT 'P: perpus || U: umum'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`id_user`, `username`, `password`, `nama`, `alamat`, `kota`, `no_telepon`, `api_hit`, `saldo`, `role`) VALUES
('P001', 'perpus1', '111', 'New User 1', 'undefined', 'undefined', 'undefined', 0, 0, 'P'),
('U001', 'utuk', 'utuk123', 'utuk utuk', 'jl utuk utuk', 'surabaya', '123', 60, 0, 'u'),
('U002', 'user1', '111', 'New User 1', NULL, NULL, NULL, 0, 0, 'U');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `buku`
--
ALTER TABLE `buku`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `buku_perpus`
--
ALTER TABLE `buku_perpus`
  ADD PRIMARY KEY (`id_buku`,`id_perpus`);

--
-- Indexes for table `request`
--
ALTER TABLE `request`
  ADD PRIMARY KEY (`id_req`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id_user`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
