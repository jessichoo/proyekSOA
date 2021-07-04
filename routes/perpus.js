const express = require('express');
const router = express.Router();
const db = require('../conn');
const jwt = require('jsonwebtoken');

router.get("/daftarbuku", async (req,res)=>{
    const token = req.header("x-auth-token");
    if(!token){
        return res.status(401).send({"msg":"token tidak ditemukan!"});
    }

    let user={};
    try {
        user = jwt.verify(token,"proyeksoa");
    } catch (error) {
        return res.status(401).send({"msg":"token tidak valid!"});
    }
    return res.status(400).json({
        message: 'Harap inputkan judul buku',
        status_code: 400
    });
})

//lihat perpus yang menyediakan buku
router.get("/daftarbuku/:judul", async(req,res)=>{
    const token = req.header("x-auth-token");
    if(!token){
        return res.status(401).send({"msg":"token tidak ditemukan!"});
    }

    let user={};
    try {
        user = jwt.verify(token,"proyeksoa");
        if (user.role != "U") {
            return res.status(401).send({"msg":"token tidak valid!"});
        }
    } catch (error) {
        return res.status(401).send({"msg":"token tidak valid!"});
    }
    let conn = await db.getConn();
    let idBuku = await db.executeQuery(conn,`SELECT * FROM buku WHERE LOWER(judul) = '${req.params.judul.toLocaleLowerCase()}'`);
    if(!idBuku.length){
        return res.status(404).json({
            message: 'Buku yang anda cari tidak ditemukan',
            status_code: 404
        });
    } else {
        let daftarPerpus=[];
        conn = await db.getConn();
        let idToko = await db.executeQuery(conn,`SELECT * FROM buku_perpus WHERE isbn = '${idBuku[0].isbn}' AND status = 1`);
        if(!idToko.length){
            return res.status(404).json({
                message: 'Tidak ada perpustakaan yang menyediakan buku ini',
                status_code: 404
            });
        }
        for (let i = 0; i < idToko.length; i++) {
            daftarPerpus.push(idToko[i].id_perpus);
        }
        conn.release();

        let daftarToko = [];
        for (let i = 0; i < daftarPerpus.length; i++) {
            conn = await db.getConn();
            let tempToko = await db.executeQuery(conn, `SELECT * FROM user WHERE id_user = '${daftarPerpus[i]}'`);
            const data =  {
                id_perpus: tempToko[0].id_user,
                nama_perpus: tempToko[0].nama
                // alamat_perpus: tempToko[0].alamat,
                // kota: tempToko[0].kota,
                // no_telp:tempToko[0].no_telepon
            }
            daftarToko.push(data);
        }
        return res.status(200).json({
            daftar_perpus:daftarToko,
            status_code: 200,
        });
    }
    conn.release();
});

router.get("/books", async(req,res)=>{
    const token = req.header("x-auth-token");
    if(!token){
        return res.status(401).send({"msg":"token tidak ditemukan!"});
    }

    let user={};
    try {
        user = jwt.verify(token,"proyeksoa");
    } catch (error) {
        return res.status(401).send({"msg":"token tidak valid!"});
    }
    return res.status(400).json({
        message: 'Id perpus tidak boleh kosong',
        status_code: 400
    });
})

//lihat buku yang terdaftar pada perpus
router.get("/books/:id_perpus", async(req,res)=>{
    const token = req.header("x-auth-token");
    if(!token){
        return res.status(401).send({"msg":"token tidak ditemukan!"});
    }

    let user={};
    try {
        user = jwt.verify(token,"proyeksoa");
        if (user.role != "U" && user.id_user != req.params.id_perpus) {
            return res.status(401).send({"msg":"token tidak valid!"});
        }
    } catch (error) {
        return res.status(401).send({"msg":"token tidak valid!"});
    }
    let daftar=[];
    let cekAwal = req.params.id_perpus.substr(0,1);
    if(cekAwal!='P'){
        return res.status(400).json({
            message: 'Id perpus yang anda masukkan tidak valid',
            status_code: 400
        });
    }
    let conn = await db.getConn();
    let cekPerpus = await db.executeQuery(conn, `SELECT * FROM user WHERE id_user = '${req.params.id_perpus}'`);
    if(!cekPerpus.length){
        return res.status(404).json({
            message: 'Perpustakaan yang anda cari tidak terdaftar',
            status_code: 404
        });
    }
    conn.release();
    conn = await db.getConn();
    let result = await db.executeQuery(conn, `SELECT * FROM buku_perpus WHERE id_perpus = '${req.params.id_perpus}' AND status = 1`);
    //console.log(result);
    if(!result.length){
        return res.status(404).json({
            message: 'Tidak ada buku yang terdaftar pada perpustakaan ini',
            status_code: 404
        });
    } else {
        for (let i = 0; i < result.length; i++) {
            conn = await db.getConn();
            let buku = await db.executeQuery(conn, `SELECT * FROM buku WHERE isbn = '${result[i].isbn}'`);
            const data =  {
                id_buku: buku[0].id,
                isbn: buku[0].isbn,
                nama_buku: buku[0].judul,
                author:buku[0].author,
                genre:buku[0].genre,
                tahun:buku[0].tahun
            }
            daftar.push(data);
            conn.release();
        }
        return res.status(200).json({
            daftar_buku:daftar,
            status_code: 200,
        });
    }
    conn.release();
    
});

module.exports = router;