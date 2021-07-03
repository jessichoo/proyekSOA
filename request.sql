/*
SQLyog Community v13.1.6 (64 bit)
MySQL - 10.4.13-MariaDB : Database - db_proyek_soa
*********************************************************************
*/

/*!40101 SET NAMES utf8 */;

/*!40101 SET SQL_MODE=''*/;

/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
USE `db_proyek_soa`;

/*Table structure for table `request` */

DROP TABLE IF EXISTS `request`;

CREATE TABLE `request` (
  `id_req` varchar(5) NOT NULL,
  `id_user` varchar(5) NOT NULL,
  `isbn` varchar(15) NOT NULL,
  `tgl_req` date NOT NULL,
  `status` int(1) DEFAULT NULL COMMENT '0:pending, 1:process, 2:complete',
  `id_perpus` varchar(5) DEFAULT NULL,
  PRIMARY KEY (`id_req`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

/*Data for the table `request` */

insert  into `request`(`id_req`,`id_user`,`isbn`,`tgl_req`,`status`,`id_perpus`) values 
('R001','U001','9780575088498','2021-07-02',0,'P001'),
('R002','U001','9780062224149','2021-07-02',0,'P001'),
('R003','U002','9781444929942','2021-07-02',0,'P001');

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
