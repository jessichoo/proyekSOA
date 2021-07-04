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

/*Table structure for table `buku` */

DROP TABLE IF EXISTS `buku`;

CREATE TABLE `buku` (
  `id` varchar(50) NOT NULL,
  `isbn` varchar(30) NOT NULL,
  `judul` varchar(50) NOT NULL,
  `author` varchar(50) DEFAULT NULL,
  `tahun` varchar(50) DEFAULT NULL,
  `genre` varchar(100) DEFAULT NULL,
  `preview` int(10) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

/*Data for the table `buku` */

insert  into `buku`(`id`,`isbn`,`judul`,`author`,`tahun`,`genre`,`preview`) values 
('11NFDwAAQBAJ','9789792291421','Seasons To Remember','Ilana Tan','2013-05-27','Juvenile Fiction',0),
('99EffcWF2ycC','9781444720655','Delirium (Delirium Trilogy 1)','Lauren Oliver','2011-02-03','Fiction',0),
('B3qSvwEACAAJ','9780062224149','Broken Things','Lauren Oliver','2019-09-03','Young Adult Fiction',23),
('cCgejgEACAAJ','9781444929942','Malory Towers: Summer Term','Enid Blyton','2016-04-07','Boarding schools',0),
('GD38T2_VobgC','9789792230307','MetroPop: Autumn In Paris','Ilana Tan','2007','Indonesian fiction',0),
('jFdwnQEACAAJ','9780062014542','Requiem','Lauren Oliver','2014-02-04','Juvenile Fiction',0),
('Lc_3DQAAQBAJ','9781473615038','Ringer','Lauren Oliver','2017-10-05','Fiction',0),
('lLo8DwAAQBAJ','9786020314624','In A Blue Moon','Ilana Tan','2015-04-07','Fiction',0),
('RTvyAQAAQBAJ','9781444723045','Panic','Lauren Oliver','2014-03-06','Fiction',0),
('UzqVUdEtLDwC','9781101569184','The Fault in Our Stars','John Green','2012-01-10','Young Adult Fiction',0),
('x_skEAAAQBAJ','9781408894446','Clive Bell and the Making of Modernism','Mark Hussey','2021-07-06','Biography & Autobiography',0),
('Y6b0vQAACAAJ','9780812975703','A. Lincoln','Ronald Cedric White','2010','Biography & Autobiography',0),
('_C0JEAAAQBAJ','9781473594036','The Anthropocene Reviewed','John Green','2021-05-18','Young Adult Fiction',0);

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
