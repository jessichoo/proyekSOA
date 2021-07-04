const express = require('express');
const router = express.Router();
const db = require('../conn');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const axios = require('axios');

const storage=multer.diskStorage({
    destination:function(req,file,callback){
        callback(null,'./uploads');
    },
    filename:async function(req,file,callback){
        if (req.body.role.toUpperCase() == "U" || req.body.role.toUpperCase() == "P") {
            let conn = await db.getConn();
            let query = await db.executeQuery(conn,
                `SELECT LPAD(COUNT(*)+1, 3,'0') as count FROM user where role = '${req.body.role.toUpperCase()}'`
            );
            conn.release();
    
            let file_name = req.body.role.toUpperCase() + query[0].count;
    
            const extension = file.originalname.split('.')[file.originalname.split('.').length-1];
            callback(null,(file_name+'.'+extension));
        }
        else {
            callback("error: Role tidak valid", null);
        }
    }
});

function checkFileType(file,cb){
    const filetypes= /jpeg|jpg|png/;
    const extname=filetypes.test(file.originalname.split('.')[file.originalname.split('.').length-1]);
    const mimetype=filetypes.test(file.mimetype);
    if(mimetype && extname){
        return cb(null,true);
    }else{
        return cb(error = 'error: Bukan JPG/PNG');
    }
}

const upload=multer({
    storage:storage,
    fileFilter: function(req,file,cb){
        checkFileType(file, cb);
    }
});

function cekJwt(token) {
    let user = [];
    try {
        user = jwt.verify(token, "proyeksoa");
    } catch (error) {
        user = null;
    }
    return user;
}

//register
router.post('/register', upload.single("foto_ktp"), async (req, res) => {
    let input = req.body;

    if (input.role != "U" && input.role != "P") {
        return res.status(400).send({
            "error": "Role tidak valid"
        });
    }
    else {
        input.role = input.role.toUpperCase();
    }

    if (req.file == undefined) {
        return res.status(400).send({
            "error": "Belum upload foto KTP"
        });
    }
    
    let conn = await db.getConn();
    let query = await db.executeQuery(conn, `select * from user where username = '${input.username}'`);
    if (query.length != 0) {
        conn.release();
        return res.status(400).send({
            "error": "Username sudah terdaftar"
        });
    }
    else if (input.username == null || input.password == null || input.nama == null || input.username == "" || input.password == "" || input.nama == "") {
        conn.release();
        return res.status(400).send({
            "error": "Input tidak valid"
        });
    }

    if (input.role == "U") {
        query = await db.executeQuery(conn, `select lpad(count(*)+1, 3, '0') as count from user where role = 'U'`);
        let id = "U" + query[0].count;
        query = await db.executeQuery(conn, `insert into user values ('${id}','${input.username}','${input.password}','${input.nama}', 0, 0, 'U')`);

        conn.release();
        if (query.affectedRows == 1) {
            return res.status(201).send({
                "id_user": id,
                "username": input.username,
                "nama": input.nama,
                "saldo": 0,
                "api_hit": 0,
                "role": "Umum"
            });
        }
    }
    else if (input.role = "P") {
        query = await db.executeQuery(conn, `select lpad(count(*)+1, 3, '0') as count from user where role = 'P'`);
        let id = "P" + query[0].count;

        query = await db.executeQuery(conn, `insert into user values ('${id}','${input.username}','${input.password}','${input.nama}', 0, 0, 'P')`);

        conn.release();
        if (query.affectedRows == 1) {
            return res.status(201).send({
                "id_user": id,
                "username": input.username,
                "nama": input.nama,
                "saldo": 0,
                "api_hit": 0,
                "role": "Perpustakaan"
            });
        }
    }
});

//delete user (buat testing aja)
router.delete("/", async (req, res) => {
    let id_user = req.body.id_user;
    let conn = await db.getConn();
    let query = await db.executeQuery(conn, `select * from user where id_user = '${id_user}'`);
    let user = query[0];
    query = await db.executeQuery(conn, `delete from user where id_user = '${id_user}'`);
    conn.release();
    if (query.affectedRows != 0) {
        return res.status(200).send(user);
    }
});

//login
router.post('/login', async (req, res) => {
    let input = req.body;
    let conn = await db.getConn();
    let query = await db.executeQuery(conn, `select * from user where username = '${input.username}'`);
    conn.release();
    if (query.length == 0) {
        return res.status(404).send({
            "error": "Username tidak terdaftar"
        });
    }
    else if (query[0].password != input.password) {
        return res.status(400).send({
            "error": "Password salah"
        });
    }

    let user = query[0];
    let role = "";
    switch (user.role) {
        case "P":
            role = "Perpustakaan";
            break;
        default:
            role = "User";
            break;
    }
    const token = jwt.sign({
        "id_user": user.id_user,
        "username": user.username,
        "nama": user.nama,
        "role": user.role,
        "api_hit":user.api_hit,
        "saldo":user.saldo
    }, "proyeksoa");

    return res.status(200).send({
        "username": user.username,
        "nama": user.nama,
        "role": role,
        "api_hit": user.api_hit,
        "saldo": user.saldo,
        "token": token
    });
});

//top up saldo
router.post('/topup', async (req,res)=>{
    let user = cekJwt(req.header("x-auth-token"));
    if (user == null) {
        return res.status(401).send({
            "error": "Token tidak valid"
        });
    }
    let conn = await db.getConn();
    let result = await db.executeQuery(conn, `SELECT * FROM user WHERE username = '${user.username}'`);
    if(result.length !=0){
        saldo = parseInt(req.body.saldo)+parseInt(result[0].saldo)
        result = await db.executeQuery(conn, `update user set saldo='${saldo}' WHERE username = '${user.username}'`);
        result = await db.executeQuery(conn, `SELECT * FROM user WHERE username = '${user.username}'`);
        delete result[0].password;
        conn.release();
        return res.status(200).send({
            "status":200,
            "data":result[0]
        });
    }
});

//update user
router.put("/update", async (req, res) => {
    //cek jwt token
    let user = cekJwt(req.header("x-auth-token"));
    if (user == null) {
        return res.status(401).send({
            "error": "Token tidak valid"
        });
    }
    ////////////////////

    let input = req.body;
    let conn = await db.getConn();
    let query = await db.executeQuery(conn, `select * from user where username = '${user.username}'`);
    let updated = {};

    let role = "";
    switch (user.role) {
        case "P":
            role = "Perpustakaan";
            break;
        default:
            role = "User";
            break;
    }
    
    updated = {
        "username": user.username,
        "password": query[0].password,
        "nama": query[0].nama,
        "role": role
    };

    if (input.password != "" && input.password != null) {
        query = await db.executeQuery(conn, `update user set password = '${input.password}' where username = '${user.username}'`);
        updated.password = input.password;
    }
    else if (input.password == "") {
        conn.release();
        return res.status(400).send({
            "error": "Input tidak valid"
        });
    }
    if (input.nama != "" && input.nama != null) {
        query = await db.executeQuery(conn, `update user set nama = '${input.nama}' where username = '${user.username}'`);
        updated.nama = input.nama;
    }
    else if (input.nama == "") {
        conn.release();
        return res.status(400).send({
            "error": "Input tidak valid"
        });
    }
    conn.release();
    return res.status(200).send(updated);
});

//tambah bookshelf -> ini isa ganti tambah request sih cmn kalo req isine kyk sing di tabel
router.post("/bookshelf/add", async(req, res) => {
    let input = req.body; let data = [];
    try {
        let val = await axios.get("https://www.googleapis.com/books/v1/volumes/" + input.id_buku);
        let result = val.data; 
        data.push({
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
    let result= await db.executeQuery(conn, `SELECT * FROM bookshelf WHERE id_user= '${input.id_user}' AND id_buku = '${input.id_buku}'`);
    if (result.length){
        return res.status(409).json({
            message: 'Buku sudah pernah ditambahkan ke bookshelf user',
            status_code: 409
        });   
    }
    conn.release();

    conn= await db.getConn();
    result= await db.executeQuery(conn, `INSERT INTO bookshelf VALUES ('${input.id_buku}', '${input.id_user}')`);
    if (result.affectedRows === 0) {
        return res.status(500).json({
            message: 'Terjadi kesalahan pada server',
            status_code: 500
        });
    }

    conn.release();
    return res.status(201).json({
        message: `Buku berjudul '${data[0].nama_buku}' berhasil ditambahkan ke bookshelf user`,
        data: input,
        status_code: 201
    });

});

//lihat bookshelf
router.get("/bookshelf/:id_user", async(req, res) => {
    let input = req.body; let dataBuku = [];

    let conn= await db.getConn();
    let listBookshelf= await db.executeQuery(conn, `SELECT * FROM bookshelf WHERE id_user= '${req.params.id_user}'`);
    if (!listBookshelf.length){
        return res.status(409).json({
            message: 'Data Bookshelf tidak tersedia',
            status_code: 409
        });   
    }

    conn.release();
    
    // listBookshelf.forEach(element => {
    // });
    return res.status(201).json({
        message: `Data bookshelf berhasil di load`,
        bookshelf: hasil,
        status_code: 201
    });
    
});

//recharge api hit
router.post("/recharge/apihit", async(req,res)=>{
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
    if(user.saldo<10000){
        return res.status(500).json({
            message: 'Saldo anda tidak mencukupi',
            status_code: 500
        });
    }

    let conn = await db.getConn();
    let tambah = await db.executeQuery(conn, `UPDATE user SET api_hit = api_hit+20, saldo = saldo - 10000  WHERE id_user = '${user.id_user}'`)
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

module.exports = router;