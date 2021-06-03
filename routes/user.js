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
        console.log("upload");
        if (req.body.role.toUpperCase() == "U" || req.body.role.toUpperCase() == "P") {
            console.log("upload1");
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
            console.log("upload2");
            callback(error = "Error: Role tidak valid");
        }
    }
});

function checkFileType(file,cb){
    const filetypes= /jpeg|jpg|png/;
    const extname=filetypes.test(file.originalname.split('.')[file.originalname.split('.').length-1]);
    const mimetype=filetypes.test(file.mimetype);
    if(mimetype && extname){
        return true;
    }else{
        return false;
    }
}

const upload=multer({
    storage:storage,
    fileFilter: function(req,file,cb){
        // checkFileType(file, cb);
    }
});

//register
router.post('/register', upload.single("foto_ktp"), async (req, res) => {
    let input = req.body;
    console.log(req.body);
    input.role = input.role.toUpperCase();
    let conn = await db.getConn();
    let query = await db.executeQuery(conn, `select * from user where username = '${input.username}'`);

    console.log("tes1");
    if (query.length != 0) {
        conn.release();
        return res.status(400).send("Username sudah terdaftar");
    }
    else if (input.role != "U" && input.role != "P") {
        conn.release();
        return res.status(400).send("Role tidak valid");
    }

    console.log("tes2");
    if (input.role == "U") {
        console.log("tes3");
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
        console.log("tes4");
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
router.post('/login', (req, res) => {

});

router.post('/tes', async (req, res) => {
    console.log(req.body);
    return res.status(200).send(req.body.tes);
});

module.exports = router;