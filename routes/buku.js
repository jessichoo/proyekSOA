const express = require('express');
const router = express.Router();
const db = require('../conn');
const jwt = require('jsonwebtoken');
const axios = require('axios');

function cekJwt(token) {
    let user = [];
    try {
        user = jwt.verify(token, "proyeksoa");
    } catch (error) {
        user = null;
    }
    return user;
}

//cari judul buku 3rd api
router.get('/', async (req, res) => {
    //cek jwt token
    let user = cekJwt(req.header("x-auth-token"));
    if (user == null) {
        return res.status(401).send({
            "Error": "Token Invalid"
        });
    }
    ////////////////////

    let judul = req.query.judul;
    let search = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=${judul}&key=AIzaSyCh9du1IyImJP4TjJ2Qj6wasDMvhsz0RlI`);
    let result = search.data.items;
    let hasil = [];
    result.forEach(element => {
        let date = new Date(element.volumeInfo.publishedDate);
        let tahun = date.getFullYear();
        
        let buku = {
            "id": element.id,
            "judul": element.volumeInfo.title,
            "author": element.volumeInfo.authors,
            "penerbit": element.volumeInfo.publisher,
            "tahun": tahun,
            "genre": element.volumeInfo.categories
        };
        hasil.push(buku);
    });
    return res.status(200).send(hasil);
});

router.post("/add", async(req, res) => {
    let input = req.body; let dataBuku = [];

    try {
        let val = await axios.get("https://www.googleapis.com/books/v1/volumes/" + input.id_buku);
        let result = val.data; 
        dataBuku.push({
            id_buku: result.id,
            nama_buku: result.volumeInfo.title
        });
    }catch(error) {
        // console.log(error);
        return res.status(404).json({
            message: 'ID buku tidak dikenal',
            status_code: 404
        });
    }

    let conn= await db.getConn();
    let result= await db.executeQuery(conn, `SELECT * FROM buku_perpus WHERE id_perpus = '${input.id_perpus}' AND id_buku = '${input.id_buku}'`);
    if (result.length) {
        return res.status(409).json({
            message: 'Buku sudah terdaftar di perpustakaan',
            status_code: 409
        });
    }

    conn.release();

    conn= await db.getConn();
    result= await db.executeQuery(conn, `SELECT * FROM user WHERE id_user = '${input.id_perpus}'`);
    if (!result.length) {
        return res.status(404).json({
            message: 'Perpustakaan tidak ditemukan',
            status_code: 404
        });
    }
    conn.release();

    conn= await db.getConn();
    result= await db.executeQuery(conn, `INSERT INTO buku_perpus VALUES ('${input.id_buku}', '${input.id_perpus}', 1)`);
    if (result.affectedRows === 0) {
        return res.status(500).json({
            message: 'Terjadi kesalahan pada server',
            status_code: 500
        });
    }
    conn.release();

    return res.status(201).json({
        message: `Buku berjudul '${dataBuku[0].nama_buku}' berhasil ditambahkan ke perpus`,
        data: input,
        status_code: 201
    });
    
});

router.put("/update", async(req, res) => {
    let input = req.body;
    let conn= await db.getConn();
    let result= await db.executeQuery(conn, `SELECT * FROM buku_perpus WHERE id_buku = '${input.id_buku}' AND id_perpus = '${input.id_perpus}'`);

    if (result.length == 0) {
        return res.status(404).json({
            message: 'Buku tidak terdaftar terdaftar di perpustakaan',
            status_code: 404
        });   
    }

    conn.release();

    conn= await db.getConn();
    result= await db.executeQuery(conn, `UPDATE buku_perpus set status = '${input.status}' where id_buku = '${input.id_buku}' AND id_perpus = '${input.id_perpus}'`);
    
    if (result.affectedRows === 0) {
        return res.status(500).json({
            message: 'Terjadi kesalahan pada server',
            status_code: 500
        });

    }else{
        return res.status(200).json({
            message: 'Update status buku berhasil',
            data: input,
            status_code: 200
        });
    }
});


module.exports = router;