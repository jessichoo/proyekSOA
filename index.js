const express = require('express');
const app         = express();
const db        = require('./conn');
const axios       = require('axios');
const jwt = require('jsonwebtoken');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const user = require("./routes/user");
const buku = require("./routes/buku");

app.use("/api/user/", user);
app.use("/api/buku/", buku);

// function autogen(input){
//     var pad = "0000";
//     var str = input + 1 + "" ;
//     var hasil = " "+pad.substring(0, pad.length - str.length) + str;
// }

app.post("/api/books/add", async (req, res) => {
    const input = req.body;
    let arrHasil = [];
    try {
        let val = await axios.get("https://www.googleapis.com/books/v1/volumes/" + input.id_buku_api);

        let result = val.data; 
        // console.log(result);
        // console.log(result.volumeInfo.title);

        let data =  {
            id_buku: result.id,
            nama_buku: result.volumeInfo.title
        }

        arrHasil.push(data); 
    }

    catch(error) {
        console.log(error); 
    }

    let conn= await db.getConn();
    let result= await db.executeQuery(conn, `SELECT * FROM buku WHERE id_buku_api = '${input.id_buku_api}'`);
    if (result.length) {
        return res.status(409).json({
            message: 'Gagal menambahkan! Buku sudah terdaftar',
            status_code: 409
        });
    }

    conn.release();

    //autogen
    conn= await db.getConn();
    result= await db.executeQuery(conn, `SELECT * FROM buku`);
    var pad = "000";
    var str = result.length + 1 + "" ;
    var id = "B" + pad.substring(0, pad.length - str.length) + str;
    
    // arrHasil[0]["id"] = id;

    conn.release();

    //insert buku
    conn= await db.getConn();
    result= await db.executeQuery(conn, `INSERT INTO buku VALUES ('${id}', '${arrHasil[0]['nama_buku']}', '${input.id_buku_api}')`);
    if (result.affectedRows === 0) {
        return res.status(500).json({
            message: 'Terjadi kesalahan pada server',
            status_code: 500
        });
    }
    conn.release();


    return res.status(200).json({
        message: 'Berhasil menambahkan buku ke dalam database',
        data: arrHasil,
        status_code: 200
    });
});


//top up saldo
app.post('/api/user/topup', async (req,res)=>{
    let conn = await db.getConn();
    let result = await db.executeQuery(conn, `SELECT * FROM user WHERE username = '${req.body.username}'`);
    if(result.length !=0){
        saldo = parseInt(req.body.saldo)+parseInt(result[0].saldo)
        result = await db.executeQuery(conn, `update user set saldo='${saldo}' WHERE username = '${req.body.username}'`);
        result = await db.executeQuery(conn, `SELECT * FROM user WHERE username = '${req.body.username}'`);
        delete result[0].password
        return res.status(200).send({
            "status":200,
            "data":result[0]
        })
        
    }else{
        return res.status(400).send({
            "message":"User Tidak Ditemukan"
        })
    }
    conn.release();

})

//recharge api hit
app.post("/api/recharge/apihit", async(req,res)=>{
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
    let input = req.body;
    let conn = await db.getConn();
    let cariUser = await db.executeQuery(conn, `SELECT * FROM user WHERE id_user = '${input.id_user}'` );
    //console.log(cariUser);
    conn.release();
    if(!cariUser.length){
        return res.status(404).json({
            message: 'User tidak terdaftar',
            status_code: 404
        });
    }
    if(cariUser.saldo<10000){
        return res.status(500).json({
            message: 'Saldo anda tidak mencukupi',
            status_code: 500
        });
    }

    conn = await db.getConn();
    let tambah = await db.executeQuery(conn, `UPDATE user SET api_hit = api_hit+20, saldo = saldo - 10000  WHERE id_user = '${input.id_user}'`)
    if (tambah.affectedRows === 0) {
        return res.status(500).json({
            message: 'Terjadi kesalahan pada server',
            status_code: 500
        });

    }else{
        return res.status(200).json({
            message: 'Recharge API_hit berhasil',
            status_code: 200
        });
    }
    conn.release();
});

app.get("/api/library/books/:judul", async(req,res)=>{
    let conn = await db.getConn();
    
    conn.release();
});
app.get("/api/buku/:id_buku", async (req, res) => {
    let conn = await db.getConn();
    let result = await db.executeQuery(conn, `SELECT * FROM buku WHERE id_buku = '${req.params.id_buku}'`);
    if(!result.length){
        return res.status(404).json({
            message: 'Buku yang dimaksud tidak ditemukan',
            status_code: 404
        });
    } else {
        let listLibrary = [];
        for (let i = 0; i < result.length; i++) {
            const element = {
                id_buku:result[i].id_buku,
                judul_buku:result[i].judul_buku,
            };
            listLibrary.push(element);
        }
        return res.status(200).json({
            daftar:listLibrary ,
            status_code: 200,
        });
    }
    conn.release();
});
//lihat toko yang menyediakan buku
app.get("/api/toko/daftarbuku/:judul", async(req,res)=>{
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
    let conn = await db.getConn();
    let idBuku = await db.executeQuery(conn,`SELECT * FROM buku WHERE judul = '${req.params.judul}'`);
    if(!idBuku.length){
        return res.status(404).json({
            message: 'Buku yang anda cari tidak ditemukan',
            status_code: 404
        });
    } else {
        let daftarPerpus=[];
        conn = await db.getConn();
        let idToko = await db.executeQuery(conn,`SELECT * FROM buku_perpus WHERE id_buku = '${idBuku[0].id}'`);
        if(!idToko.length){
            return res.status(404).json({
                message: 'Tidak ada toko yang menyediakan buku ini',
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
                id_toko: tempToko[0].id_user,
                nama_toko: tempToko[0].nama,
                alamat_toko: tempToko[0].alamat,
                kota: tempToko[0].kota,
                no_telp:tempToko[0].no_telepon
            }
            daftarToko.push(data);
        }
        return res.status(200).json({
            daftar_toko:daftarToko,
            status_code: 200,
        });
    }
    conn.release();
});
app.post('/api/user/topup', async (req,res)=>{
    let conn = await db.getConn();
    let result = await db.executeQuery(conn, `SELECT * FROM user WHERE username = '${req.body.username}'`);
    if(result.length !=0){
        saldo = parseInt(req.body.saldo)+parseInt(result[0].saldo)
        result = await db.executeQuery(conn, `update user set saldo='${saldo}' WHERE username = '${req.body.username}'`);
        result = await db.executeQuery(conn, `SELECT * FROM user WHERE username = '${req.body.username}'`);
        delete result[0].password
        return res.status(200).send({
            "status":200,
            "data":result[0]
        })
        
    }else{
        return res.status(400).send({
            "message":"User Tidak Ditemukan"
        })
    }
    conn.release();

});
//lihat buku yang terdaftar pada toko
app.get("/api/toko/books/:id_toko", async(req,res)=>{
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
    let daftar=[];
    let conn = await db.getConn();
    let result = await db.executeQuery(conn, `SELECT * FROM buku_perpus WHERE id_perpus = '${req.params.id_toko}'`);
    //console.log(result);
    if(!result.length){
        return res.status(404).json({
            message: 'Tidak ada buku yang terdaftar pada toko ini',
            status_code: 404
        });
    } else {
        for (let i = 0; i < result.length; i++) {
            conn = await db.getConn();
            let buku = await db.executeQuery(conn, `SELECT * FROM buku WHERE id = '${result[i].id_buku}'`);
            const data =  {
                id_buku: buku[0].id,
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

//lihat preview buku
app.post("/api/books/preview/:judul", async (req,res)=>{
    const token = req.header("x-auth-token");
    if(!token){
        return res.status(401).send({"msg":"token tidak ditemukan!"});
    }

    let user={};
    try {
        user = jwt.verify(token,"proyeksoa");
    } catch (error) {
        return res.status(400).send({"msg":"token tidak valid!"});
    }

    let judul = req.params.judul;
    let conn = await db.getConn();
    let cariBuku = await db.executeQuery(`SELECT * FROM buku WHERE LOWER(buku) = '${judul.toLocaleLowerCase()}'`);
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
        console.log(element);
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
        conn = await db.getConn();
        let minApiHit = await db.executeQuery(conn, `UPDATE user SET api_hit = api_hit-1 WHERE id_user = '${user.id_user}'`);
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
    let tambahPreview = await db.executeQuery(`UPDATE buku SET preview = preview + 1 WHERE id_buku = '${cariBuku[0].id}'`);
    conn.release();

    //console.log(hasil);
    return res.status(200).json({
        link_preview:hasil[0],
        status_code: 200,
    });

})

app.get("/api/books/detail/:id_buku", async (req, res) => {
    let conn = await db.getConn();
    let result = await db.executeQuery(conn, `SELECT * FROM buku WHERE id_buku = '${req.params.id_buku}'`);
    if(!result.length){
        return res.status(404).json({
            message: 'Buku yang dimaksud tidak ditemukan',
            status_code: 404
        });
    } else {
        let listLibrary = [];
        for (let i = 0; i < result.length; i++) {
            const element = {
                id_buku:result[i].id_buku,
                judul_buku:result[i].judul_buku,
            };
            listLibrary.push(element);
        }
        return res.status(200).json({
            daftar:listLibrary ,
            status_code: 200,
        });
    }
    conn.release();
});

//delete buku
//tambah peminjaman buku -> perpus

app.listen(3000, function() {
    console.log("listen 3000");
 })