const express = require('express');
const router = express.Router();
const db = require('../conn');
const jwt = require('jsonwebtoken');
const multer = require('multer');

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
            callback("Error: Role tidak valid", null);
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
        return cb(error = 'Error: Bukan JPG/PNG');
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
    input.role = input.role.toUpperCase();
    let conn = await db.getConn();
    let query = await db.executeQuery(conn, `select * from user where username = '${input.username}'`);

    if (query.length != 0) {
        conn.release();
        return res.status(400).send({
            "Error": "Username sudah terdaftar"
        });
    }
    else if (input.role != "U" && input.role != "P") {
        conn.release();
        return res.status(400).send({
            "Error": "Role tidak valid"
        });
    }

    if (input.role == "U") {
        // if (input.username == null || input.password == null || input.nama == null) {
        //     return res.status(400).send("Input tidak lengkap");
        // }
        query = await db.executeQuery(conn, `select lpad(count(*)+1, 3, '0') as count from user where role = 'U'`);
        let id = "U" + query[0].count;

        query = await db.executeQuery(conn, `insert into user values ('${id}','${input.username}','${input.password}','${input.nama}', null, null, null, 0, 0, 'U')`);

        conn.release();
        if (query.insertedRows != 0) {
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
        // if (input.username == null || input.password == null || input.nama == null || input.alamat == null || input.kota == null || input.no_telepon == null) {
        //     return res.status(400).send("Input tidak lengkap");
        // }
        query = await db.executeQuery(conn, `select lpad(count(*)+1, 3, '0') as count from user where role = 'P'`);
        let id = "P" + query[0].count;

        query = await db.executeQuery(conn, `insert into user values ('${id}','${input.username}','${input.password}','${input.nama}', '${input.alamat}', '${input.kota}', '${input.no_telepon}', 0, 0, 'P')`);

        conn.release();
        if (query.insertedRows != 0) {
            return res.status(201).send({
                "id_user": id,
                "username": input.username,
                "nama": input.nama,
                "alamat": input.alamat,
                "kota": input.kota,
                "no_telepon": input.no_telepon,
                "saldo": 0,
                "api_hit": 0,
                "role": "Perpustakaan"
            });
        }
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
            "Error": "Username tidak terdaftar"
        });
    }
    else if (query[0].password != input.password) {
        return res.status(400).send({
            "Error": "Password salah"
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
        "role": user.role
    }, "proyeksoa");

    return res.status(200).send({
        "username": user.username,
        "nama": user.nama,
        "role": role,
        "token": token
    });
});

//update user
router.put("/update", async (req, res) => {
    //cek jwt token
    let user = cekJwt(req.header("x-auth-token"));
    if (user == null) {
        return res.status(401).send({
            "Error": "Token Invalid"
        });
    }
    ////////////////////

    let input = req.body;
    let conn = await db.getConn();
    let query = await db.executeQuery(conn, `select * from user where username = '${user.username}'`);
    let updated = {};

    switch (user.role) {
        case "P":
            updated = {
                "username": user.username,
                "password": query[0].password,
                "nama": query[0].nama,
                "alamat": query[0].alamat,
                "kota": query[0].kota,
                "no_telepon": query[0].no_telepon,
                "role": "Perpustakaan"
            };
            break;
        default:
            updated = {
                "username": user.username,
                "password": query[0].password,
                "nama": query[0].nama,
                "role": "User"
            };
            break;
    }

    if (input.no_telepon != "" && input.no_telepon != null) {
        if (user.role == "P") {
            query = await db.executeQuery(conn, `update user set no_telepon = '${input.no_telepon}' where username = '${user.username}'`);
            updated.no_telepon = input.no_telepon;
        }
        else {
            return res.status(400).send({
                "Error": 'Role tidak sesuai'
            });
        }
    }
    if (input.password != "" && input.password != null) {
        query = await db.executeQuery(conn, `update user set password = '${input.password}' where username = '${user.username}'`);
        updated.password = input.password;
    }
    if (input.nama != "" && input.nama != null) {
        query = await db.executeQuery(conn, `update user set nama = '${input.nama}' where username = '${user.username}'`);
        updated.nama = input.nama;
    }
    conn.release();

    return res.status(200).send(updated);
});

module.exports = router;