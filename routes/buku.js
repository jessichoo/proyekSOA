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
        console.log(element);
        let buku = {
            "id": element.id,
            "judul": element.volumeInfo.title,
            "author": element.volumeInfo.authors,
            "penerbit": element.volumeInfo.publisher,
            "tahun": tahun,
            "genre": element.volumeInfo.categories,
            "link" :element.selfLink,
            "img": element.volumeInfo.imageLinks.thumbnail,
            
            // "isbn": element.volumeInfo.isbn
        };
        hasil.push(buku);
    });
    return res.status(200).send(hasil);
});

///////////////////////////////////////////////////jesnat
// - tambah buku
// - update status buku (berdasarkan id perpus)
// - update req buku : id user, id buku, status, tgl
// - beli buku
// - lihat request buku (perpus dan user)


// add ke tabel buku dan buku_perpus
router.post("/add", async(req, res) => {
    let input = req.body; let dataBuku = [];
    try {
        let val = await axios.get("https://www.googleapis.com/books/v1/volumes/" + input.id_buku);
        let result = val.data; 
        // console.log(result);
        dataBuku.push({
            "id_buku"   : result.id,
            "nama_buku" : result.volumeInfo.title,
            "author"    : result.volumeInfo.authors,
            "tahun"     : result.volumeInfo.publishedDate,
            "genre"     : "NULL"
        });
        console.log(dataBuku);
    }catch(error) {
        return res.status(404).json({
            message: 'ID buku tidak dikenal',
            status_code: 404
        });
    }

    let conn= await db.getConn();
    let result= await db.executeQuery(conn, `SELECT * FROM buku WHERE id = '${input.id_buku}'`);
    if (!result.length) {
        let conn2= await db.getConn();
        let result2= await db.executeQuery(conn2, `INSERT INTO buku VALUES ('${input.id_buku}','${dataBuku[0].nama_buku}', '${dataBuku[0].author}', '${dataBuku[0].tahun}', '${dataBuku[0].genre}','0')`);
        if (result2.affectedRows === 0) {
            return res.status(500).json({
                message: 'Terjadi kesalahan pada server',
                status_code: 500
            });
        }
    }
    conn.release();
   
    conn= await db.getConn();
    result= await db.executeQuery(conn, `SELECT * FROM buku_perpus WHERE id_perpus = '${input.id_perpus}' AND id_buku = '${input.id_buku}'`);
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
    result= await db.executeQuery(conn, `INSERT INTO buku_perpus VALUES ('${input.id_buku}', '${input.id_perpus}', '1')`);
    if (result.affectedRows === 0) {
        return res.status(500).json({
            message: 'Terjadi kesalahan pada server',
            status_code: 500
        });
    }
    conn.release();

    return res.status(201).json({
        message: `Buku berjudul '${dataBuku[0].nama_buku}' berhasil ditambahkan`,
        data: input,
        status_code: 201
    });
    
});
router.get("/dummy", async(req, res) => {
    let conn= await db.getConn();
    let val = await axios.get("https://www.googleapis.com/books/v1/volumes?&q=isbn=9786023857456");
    let result = val.data.items; 
    for (const e of result) {
        let random = Math.floor(Math.random() * 20);
        await db.executeQuery(conn, `INSERT INTO buku VALUES ('${e.id}','${e.volumeInfo.title}', '${e.volumeInfo.authors[0]}', '${e.volumeInfo.publishedDate}', '${e.volumeInfo.categories[0]}','${random}')`);
    }
    conn.release();
    return res.status(200).json(result);   
})
router.get("/judul_buku", async(req, res) => {
    req.query.judul = req.query.judul || "";
    let author=`where judul like '%${req.query.judul}%'`;
    let conn= await db.getConn();
    let result= await db.executeQuery(conn, `SELECT id,judul,author,genre FROM buku ${author}`);
    conn.release();
    return res.status(200).json(result);   
})
//lihat daftar buku by author dan genre
router.get("/daftar_buku", async(req, res) => {
    req.query.genre = req.query.genre || "";
    req.query.author = req.query.author || "";
    req.query.judul = req.query.judul || "";
    let author=`where author like '%${req.query.author}%' and genre like '%${req.query.genre}%' and judul like '%${req.query.judul}%'`;
    console.log(author)
    let conn= await db.getConn();
    let result= await db.executeQuery(conn, `SELECT id,judul,author,genre FROM buku ${author}`);
    conn.release();
    return res.status(200).json(result);   
})
//lihat detail buku
router.get("/detail_buku", async(req, res) => {
    let id=req.body.id;
    let conn= await db.getConn();
    let result= await db.executeQuery(conn, `SELECT id,judul,author,genre FROM buku where id='${id}'`);
    conn.release();
    if(result.length==0){
        return res.status(500).json({
            message: 'Id buku tidak ditemukan',
            status_code: 500
        });
    }else{
        return res.status(200).json(result);         
    }
  
})
router.get("/best_seller", async(req, res) => {
    let limit="";
    if(req.query.limit){
        limit=`LIMIT ${req.query.limit}`
    }
    
    let conn= await db.getConn();
    let result= await db.executeQuery(conn, `SELECT judul,author,tahun,genre FROM buku order by preview desc ${limit}`);
    console.log(result)
    conn.release();
    return res.status(200).json(result);   

})
// perpus mengubah status suatu buku: 1(aktif), 0(non-aktif)
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
  
    let setStatus = 0; let statusMsg = "Non-aktif";
    if(result[0]["status"] == 0){setStatus = 1; statusMsg = "Aktif";}
    // console.log(setStatus);
    conn= await db.getConn();
    result= await db.executeQuery(conn, `UPDATE buku_perpus set status = '${setStatus}' where id_buku = '${input.id_buku}' AND id_perpus = '${input.id_perpus}'`);
    if (result.affectedRows === 0) {
        return res.status(500).json({
            message: 'Terjadi kesalahan pada server',
            status_code: 500
        });
    }else{

        return res.status(200).json({
            message: 'Update status buku berhasil',
            data: {
                "id_buku": input.id_buku,
                "id_perpus": input.id_perpus,
                "status": statusMsg
            },
            status_code: 200
        });
    }
});

// perpus mengubah status request buku saat menerima request buku
router.put("/request/update", async(req, res) => {
    let input = req.body;
    let conn= await db.getConn();
    let result= await db.executeQuery(conn, `SELECT * FROM request WHERE id_req = '${input.id_req}'`);
    if (result.length == 0) {
        return res.status(404).json({
            message: 'Request tidak pernah dibuat',
            status_code: 404
        });   
    }
    conn.release();
  
    let setStatus = 0; let statusMessage = "Menunggu Perpus"; //belum ada perpus yang menanggapi
    if(result[0]["status"] == 0){setStatus = 1; statusMessage = "Diproses Perpus";} //ada perpus yang menanggapi, perpus lain tdk bisa mengambil request ini
    else if(result[0]["status"] >= 1){setStatus = 2; statusMessage = "Selesai"; } //selesai, saldo user yang tadi dipotong masuk ke saldo saldo perpus, klo gagal kembalikan ke user saldonya

    // console.log(setStatus);

    conn= await db.getConn();
    result= await db.executeQuery(conn, `UPDATE request set status = '${setStatus}' where id_req = '${input.id_req}'`);
    if (result.affectedRows === 0) {
        return res.status(500).json({
            message: 'Terjadi kesalahan pada server',
            status_code: 500
        });
    }else{
        return res.status(200).json({
            message: 'Update status request berhasil',
            data:{
                "id_request": input.id_req,
                "status": statusMessage
            },
            status_code: 200
        });
    }
});

//lihat req buku
router.get("/request", async(req, res) => {
    //pas user login diambil jwt e
    let user = cekJwt(req.header("x-auth-token"));
    if (user == null) {
        return res.status(401).send({
            "Error": "Token Invalid"
        });
    }
    console.log(user);

    let conn= await db.getConn();
    let result= await db.executeQuery(conn, `SELECT * FROM request WHERE id_user = '${user.id_user}' OR id_user= '${user.id_perpus}'`); //cek user/perpus memiliki req buku?
    if (result.length == 0) {
        return res.status(404).json({
            message: `User '${user.id_user}' tidak pernah membuat request`,
            status_code: 404
        });   
    }else{
        return res.status(200).json({
            message: 'Get list request buku user berhasil',
            data: result,
            status_code: 200
        });
    }
});




module.exports = router;