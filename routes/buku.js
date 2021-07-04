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

///////////////////////////////////////////////////jesnat
// - tambah buku
// - update status buku (berdasarkan id perpus)
// - update req buku : id user, id buku, status, tgl
// - lihat request buku (perpus dan user)

router.post("/preview", async(req,res)=>{
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
    let judul = req.params.judul;
    if(!judul){
        return res.status(400).json({
            message: 'Harap inputkan judul buku',
            status_code: 400
        });
    }
})

//lihat preview buku
router.post("/preview/:judul", async (req,res)=>{
    const token = req.header("x-auth-token");
    if(token == "" || token == null || token == undefined){
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
    let judul = req.params.judul;
    let conn = await db.getConn();
    let cariBuku = await db.executeQuery(conn, `SELECT * FROM buku WHERE LOWER(judul) = '${judul.toLocaleLowerCase()}'`);
    conn.release();
    if(!cariBuku.length){
        return res.status(404).json({
            message: 'Buku yang anda cari tidak tersedia',
            status_code: 404
        });
    }
    let search = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=${judul}&key=AIzaSyCh9du1IyImJP4TjJ2Qj6wasDMvhsz0RlI`);
    let result = search.data.items;
    let hasil = [];
    result.forEach(element => {
        let buku={
            "preview_link" :element.accessInfo.webReaderLink
        };
        hasil.push(buku);
    });
    
    let today = new Date();
    let date = "";
    if((today.getMonth()+1) < 10 && today.getDate() < 10){
        date = today.getFullYear()+'-0'+(today.getMonth()+1)+'-0'+today.getDate();
    } else if ((today.getMonth()+1) < 10) {
        date = today.getFullYear()+'-0'+(today.getMonth()+1)+'-'+today.getDate();
    } else if (today.getDate() < 10){
        date = today.getFullYear()+'-'+(today.getMonth()+1)+'-0'+today.getDate();
    } else {
        date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
    }
    
    let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    let dateTime = date+' '+time;

    conn = await db.getConn();
    let cekAccess = await db.executeQuery(conn, `SELECT * FROM access_log WHERE id_user = '${user.id_user}' AND access_time LIKE '${date}%'`);
    conn.release();

    //console.log(cekAccess.length);
    if(cekAccess.length<2){
        if(user.api_hit>0){
            conn = await db.getConn();
            let minApiHit = await db.executeQuery(conn, `UPDATE user SET api_hit = api_hit-1 WHERE id_user = '${user.id_user}'`);
        } else {
            console.log(user.api_hit);
            return res.status(400).json({
                message: 'Api hit anda tidak cukup',
                status_code: 400
            });
        }
    } else {
        if(user.saldo>=10000){
            conn = await db.getConn();
            let minSaldo = await db.executeQuery(conn, `UPDATE user SET saldo = saldo-10000 WHERE id_user = '${user.id_user}'`);
        } else {
            return res.status(400).json({
                message: 'Saldo anda tidak cukup',
                status_code: 400
            });
        }
        conn.release();
    }

    conn = await db.getConn();
    let inputLog = await db.executeQuery(conn,`INSERT INTO access_log VALUES (null, '${user.id_user}','${dateTime}')`);
    conn.release();

    conn = await db.getConn();
    let tambahPreview = await db.executeQuery(conn, `UPDATE buku SET preview = preview + 1 WHERE id = '${cariBuku[0].id}'`);
    conn.release();

    //console.log(hasil);
    return res.status(200).json({
        link_preview:hasil[0],
        status_code: 200,
    });

})

// add ke tabel buku dan buku_perpus
router.post("/add", async(req, res) => {
    let user = cekJwt(req.header("x-auth-token"));
    if (user == null || user.role == "U") {
        return res.status(401).send({
            "error": "Token tidak valid"
        });
    }

    let input = req.body; let dataBuku = [];
    try {
        //cek isbn
        let val = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=isbn:${input.isbn}`);
        let result = val.data; 
        // console.log(result);
        dataBuku.push({
            "id_buku"   : result.items[0].id,
            "isbn"      : input.isbn,
            "nama_buku" : result.items[0].volumeInfo.title,
            "author"    : result.items[0].volumeInfo.authors,
            "tahun"     : result.items[0].volumeInfo.publishedDate,
            "genre"     : result.items[0].volumeInfo.categories
        });
        console.log(dataBuku);
    }catch(error) {
        return res.status(403).json({
            message: 'Buku tidak dikenal',
            status_code: 403
        });
    }

    let conn= await db.getConn();
    let result= await db.executeQuery(conn, `SELECT * FROM buku WHERE isbn = ${dataBuku[0].isbn}`);
    conn.release();

    console.log(result);
    console.log(dataBuku[0].isbn)

    if (!result.length) {
        conn= await db.getConn();
        result= await db.executeQuery(conn, `INSERT INTO buku VALUES ('${dataBuku[0].id_buku}', '${dataBuku[0].isbn}', '${dataBuku[0].nama_buku}', '${dataBuku[0].author}', '${dataBuku[0].tahun}', '${dataBuku[0].genre}', 0)`);
        if (result.affectedRows === 0) {
            return res.status(500).json({
                message: 'Terjadi kesalahan pada server',
                status_code: 500
            });
        }
    }
    // conn.release();
   
    conn= await db.getConn();
    result= await db.executeQuery(conn, `SELECT * FROM buku_perpus WHERE id_perpus = '${user.id_user}' AND isbn = '${dataBuku[0].isbn}'`);
    if (result.length) {
        return res.status(409).json({
            message: 'Buku sudah terdaftar di perpustakaan',
            status_code: 409
        });
    }
    conn.release();

    conn= await db.getConn();
    result= await db.executeQuery(conn, `SELECT * FROM user WHERE id_user = '${user.id_user}'`);
    if (!result.length) {
        return res.status(404).json({
            message: 'Perpustakaan tidak ditemukan',
            status_code: 404
        });
    }
    conn.release();

    conn= await db.getConn();
    result= await db.executeQuery(conn, `INSERT INTO buku_perpus VALUES ('${dataBuku[0].isbn}', '${user.id_user}', '1')`);
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
        await db.executeQuery(conn, `INSERT INTO buku VALUES ('${e.id}','${e.volumeInfo.title}', '${e.volumeInfo.authors[0]}', '${e.volumeInfo.publishedDate}', '${e.volumeInfo.categories[0]}', '${random}')`);
    }
    conn.release();
    return res.status(200).json(result);   
})

//cari judul buku
router.get("/judul_buku", async(req, res) => {
    let user = cekJwt(req.header("x-auth-token"));
    if (user == null) {
        return res.status(401).send({
            "error": "Token tidak valid"
        });
    }

    if (req.query.judul == null || req.query.judul == "" || req.query.judul == undefined) {
        return res.status(400).send({
            "error": "Judul buku tidak valid"
        });
    }

    req.query.judul = req.query.judul || "";
    let author=`where judul like '%${req.query.judul}%'`;
    let conn= await db.getConn();
    let result= await db.executeQuery(conn, `SELECT id,isbn,judul,author,genre FROM buku ${author}`);
    conn.release();
    if (result.length == 0) {
        return res.status(404).send({
            "error": "Judul buku tidak ditemukan"
        })
    }
    else {
        return res.status(200).json(result);   
    }
})

//lihat daftar buku by author dan genre
router.get("/daftar_buku", async(req, res) => {
    let user = cekJwt(req.header("x-auth-token"));
    if (user == null) {
        return res.status(401).send({
            "error": "Token tidak valid"
        });
    }

    req.query.genre = req.query.genre || "";
    req.query.author = req.query.author || "";
    // req.query.judul = req.query.judul || "";
    // let author=`where author like '%${req.query.author}%' and genre like '%${req.query.genre}%' and judul like '%${req.query.judul}%'`;
    let author=`where author like '%${req.query.author}%' and genre like '%${req.query.genre}%'`;
    // console.log(author);
    let conn= await db.getConn();
    let result= await db.executeQuery(conn, `SELECT id,judul,author,genre FROM buku ${author}`);
    conn.release();

    if (result.length == 0) {
        return res.status(404).send({
            "error": "Buku tidak ditemukan"
        });
    }
    return res.status(200).json(result);   
})

//lihat detail buku
router.get("/detail_buku", async(req, res) => {
    let user = cekJwt(req.header("x-auth-token"));
    if (user == null) {
        return res.status(401).send({
            "error": "Token tidak valid"
        });
    }

    let isbn=req.query.isbn;
    let conn= await db.getConn();
    let result= await db.executeQuery(conn, `SELECT isbn,judul,author,genre FROM buku where isbn='${isbn}'`);
    conn.release();
    if(result.length==0){
        return res.status(404).json({
            message: 'ISBN buku tidak ditemukan',
            status_code: 404
        });
    }else{
        return res.status(200).json(result);         
    }
  
});

//lihat buku best seller
router.get("/best_seller", async(req, res) => {
    let user = cekJwt(req.header("x-auth-token"));
    if (user == null || user.role != "U") {
        return res.status(401).send({
            "error": "Token tidak valid"
        });
    }

    console.log(user);
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
    let user = cekJwt(req.header("x-auth-token"));
    if (user == null || user.role == "U") {
        return res.status(401).send({
            "error": "Token tidak valid"
        });
    }

    console.log(user);
    let input = req.body;
    let conn= await db.getConn();
    let result= await db.executeQuery(conn, `SELECT * FROM buku_perpus WHERE isbn = '${input.isbn}' AND id_perpus = '${user.id_user}'`);
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
    result= await db.executeQuery(conn, `UPDATE buku_perpus set status = '${setStatus}' where isbn = '${input.isbn}' AND id_perpus = '${user.id_user}'`);
    if (result.affectedRows === 0) {
        return res.status(500).json({
            message: 'Terjadi kesalahan pada server',
            status_code: 500
        });
    }else{

        return res.status(200).json({
            message: 'Update status buku berhasil',
            data: {
                "isbn": input.isbn,
                "id_perpus": user.id_user,
                "status": statusMsg
            },
            status_code: 200
        });
    }
});

// perpus mengubah status request buku saat menerima request buku   
router.put("/request/update", async(req, res) => {
    let input = req.body;
    let conn1= await db.getConn();
    let result1= await db.executeQuery(conn1, `SELECT * FROM request WHERE id_req = '${input.id_req}'`);
    if (result1.length == 0) {
        return res.status(404).json({
            message: 'Request not found!',
            status_code: 404
        });   
    }
    conn1.release();
  
    let setStatus = 0; let statusMessage = "Menunggu Perpustakaan"; //belum ada perpus yang menanggapi
    if(result1[0]["status"] == 0){setStatus = 1; statusMessage = "Diproses Perpustakaan";} //ada perpus yang menanggapi, perpus lain tdk bisa mengambil request ini
    else if(result1[0]["status"] >= 1){setStatus = 2; statusMessage = "Selesai"; } //selesai, saldo user yang tadi dipotong masuk ke saldo saldo perpus, klo gagal kembalikan ke user saldonya
    //status: -1 = gagal krn buku tidak tersedia


    let user = cekJwt(req.header("x-auth-token"));
    if (user == null || user.role == "U") {
        return res.status(401).send({
            "error": "Invalid Token"
        });
    }
    // console.log(user.id_user);

    let tempBuku = {
        "isbn" : result1[0].isbn, 
        "idperpus" : result1[0].id_perpus
    };

    let dataBuku = [];
    try { //cek apakah buku dengan id itu ada
        //cek isbn
        let val = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=isbn:${tempBuku.isbn}`);
        let result = val.data; 
        // console.log(result.items[0].id);
        dataBuku.push({
            "id_buku"   : result.items[0].id,
            "isbn"      : tempBuku.isbn,
            "nama_buku" : result.items[0].volumeInfo.title,
            "author"    : result.items[0].volumeInfo.authors,
            "tahun"     : result.items[0].volumeInfo.publishedDate,
            "genre"     : result.items[0].volumeInfo.categories
        });
        console.log(dataBuku);
       
    }catch(error) {
        let conn= await db.getConn();
        //buku tidak ditemukan, request digagalkan
        let result= await db.executeQuery(conn, `UPDATE request set status = '-1', id_perpus = '${user.id_user}'  where id_req = '${input.id_req}'`);
        conn.release();
        return res.status(404).json({
            message: 'Buku tidak dikenal',
            status_code: 404
        });
    }
    
    let conn= await db.getConn();
    let result= await db.executeQuery(conn, `SELECT * FROM buku WHERE isbn = '${tempBuku.isbn}'`);
    // console.log(tempBuku.idbuku);
    // console.log(result)

    conn.release();
    
    
    if (!result.length) { //kalau buku blm pernah terdaftar, insert dulu ke tabel buku
        conn= await db.getConn();
        result= await db.executeQuery(conn, `INSERT INTO buku VALUES ('${dataBuku[0].id_buku}', '${dataBuku[0].isbn}', '${dataBuku[0].nama_buku}', '${dataBuku[0].author}', '${dataBuku[0].tahun}', '${dataBuku[0].genre}', 0)`);
        conn.release();

        if (result.affectedRows === 0) {
            return res.status(500).json({
                message: 'Terjadi kesalahan pada server',
                status_code: 500
            });
        }
    }

    conn1= await db.getConn();
    result1= await db.executeQuery(conn1, `SELECT * FROM buku_perpus WHERE id_perpus = '${user.id_user}' AND isbn = '${tempBuku.isbn}'`);
    // console.log(result1);
    if (result1.length) { //buku terdaftar pada tabel buku_perpus
        return res.status(409).json({
            message: 'Buku sudah terdaftar di perpustakaan',
            status_code: 409
        });
    }
    conn1.release();

    
    conn= await db.getConn();
    
    result= await db.executeQuery(conn, `INSERT INTO buku_perpus values('${tempBuku.isbn}', '${user.id_user}', 1)`);
    conn.release();

    if (result.affectedRows === 0) {
        return res.status(500).json({
            message: 'Terjadi kesalahan pada server',
            status_code: 500
        });
    }

    // setelah semua pengecekan lancar, update status
    conn= await db.getConn();
    result= await db.executeQuery(conn, `UPDATE request set status = '${setStatus}', id_perpus = '${user.id_user}'  where id_req = '${input.id_req}'`);
    conn.release();

    
   

       

       
///////////////////////////////////////////////////////////////

        return res.status(200).json({
            message: 'Update status request berhasil',
            data:{
                "id_request": input.id_req,
                "status": statusMessage
            },
            status_code: 200
        });
    
});

//lihat req buku
router.get("/request", async(req, res) => {
    //pas user login diambil jwt e
    let user = cekJwt(req.header("x-auth-token"));
    if (user == null) {
        return res.status(401).send({
            "error": "Token tidak valid"
        });
    }
    // console.log(user);

    let conn= await db.getConn();
    let result = "";
    if(user.role == "U"){ //cek user memiliki req buku?
        result= await db.executeQuery(conn, `SELECT * FROM request WHERE id_user = '${user.id_user}'`); 
        if (result.length == 0) {
            return res.status(404).json({
                message: `User '${user.nama}' tidak pernah membuat request`,
                status_code: 404
            });   
        }else{
            return res.status(200).json({
                message: 'Get list request buku berhasil',
                data: result,
                status_code: 200
            });
        }
    }else{
        result= await db.executeQuery(conn, `SELECT * FROM request where id_perpus = '${user.id_user}'`); 
        if (result.length == 0) {
            return res.status(404).json({
                message: `Belum ada request baru`,
                status_code: 404
            });   
        }else{
            return res.status(200).json({
                message: 'Get list request buku berhasil',
                data: result,
                status_code: 200
            });
        }
        
    }
   
});

//tambah req buku
router.post("/request", async (req, res) => {
    let user = cekJwt(req.header("x-auth-token"));
    if (user == null || user.role != "U") {
        return res.status(401).send({
            "error": "Token tidak valid"
        });
    }

    let input = req.body;

    //cek api hit user
    let conn = await db.getConn();
    let query = await db.executeQuery(conn, `select * from user where id_user = '${user.id_user}'`);
    if (query[0].api_hit < 5) {
        conn.release();
        return res.status(403).send({
            "error": "API hit user tidak mencukupi"
        });
    }

    //cek id perpus
    query = await db.executeQuery(conn, `select * from user where id_user = '${input.id_perpus}'`);
    if (query.length == 0) {
        conn.release();
        return res.status(404).send({
            "error": "Perpustakaan tidak terdaftar"
        });
    }

    //cek buku di perpus
    query = await db.executeQuery(conn, `select * from buku_perpus where isbn = '${input.isbn}' and id_perpus = '${input.id_perpus}'`);
    if (query.length != 0) {
        conn.release();
        return res.status(400).send({
            "error": "Buku sudah terdaftar di perpustakaan"
        });
    }

    //cek isbn
    let search = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=isbn:${input.isbn}&key=AIzaSyCh9du1IyImJP4TjJ2Qj6wasDMvhsz0RlI`);
    if (search.data.totalItems == 0) {
        conn.release();
        return res.status(404).send({
            "error": "Buku tidak ditemukan"
        });
    }

    //id request baru
    query = await db.executeQuery(conn, `select * from request order by id_req desc limit 1`);
    let idbaru = "";
    if (query.length == 0) {
        idbaru = "R001";
    }
    else {
        let pad = "00";
        let ctr = query[0].id_req.substr(1,3);
        ctr = parseInt(ctr)+1;
        idbaru = "R" + pad.substr(pad.length - toString(ctr).length) + ctr;
    }

    //tgl request
    let today = new Date();
    let d = today.getDate();
    let m = today.getMonth()+1;
    let y = today.getFullYear();
    if (d < 10) {
        d = "0" + d;
    }
    if (m < 10) {
        m = "0" + m;
    }
    let tgl = y + "-" + m + "-" + d;

    //cek req buku di db
    query = await db.executeQuery(conn, `select * from request where isbn = '${input.isbn}' and id_user = '${user.id_user}' and id_perpus = '${input.id_perpus}'`);
    if (query.length != 0) {
        conn.release();
        return res.status(400).send({
            "error": "Request buku sudah ada"
        });
    }
    query = await db.executeQuery(conn, `insert into request values('${idbaru}','${user.id_user}','${input.isbn}','${tgl}',0,'${input.id_perpus}')`);
    if (query.affectedRows == 1) {
        query = await db.executeQuery(conn, `update user set api_hit = api_hit-5 where id_user = '${user.id_user}'`);
        conn.release();
        return res.status(201).send({
            "id_req": idbaru,
            "id_user": user.id_user,
            "isbn":input.isbn,
            "tgl_req": tgl,
            "status": 0,
            "id_perpus": input.id_perpus
        });
    }
    else {
        return res.status(500).send();
    }
});

//delete req buku
router.delete("/request", async (req, res) => {
    let user = cekJwt(req.header("x-auth-token"));
    if (user == null || user.role != "U") {
        return res.status(401).send({
            "error": "Token tidak valid"
        });
    }

    let idreq = req.body.id_request;

    let conn = await db.getConn();
    let query = await db.executeQuery(conn, `select * from request where id_req = '${idreq}'`);
    if (query.length == 0) {
        return res.status(404).send({
            "error": "Request tidak ditemukan"
        });
    }

    let reqbuku = query[0];
    if (reqbuku.id_user != user.id_user) {
        return res.status(401).send({
            "error": `Bukan request user ${user.nama}`
        });
    }

    query = await db.executeQuery(conn, `delete from request where id_req = '${idreq}'`);
    conn.release();
    reqbuku.tgl_req = reqbuku.tgl_req.toISOString().substr(0,10);
    if (query.affectedRows != 0) {
        return res.status(200).send(reqbuku);
    }
    else {
        return res.status(500).send();
    }
})

module.exports = router;