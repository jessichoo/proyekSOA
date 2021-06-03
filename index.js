const express = require('express');
const app         = express();
const db        = require('./conn');
const axios       = require('axios');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function autogen(input){
    var pad = "0000";
    var str = input + 1 + "" ;
    var hasil = " "+pad.substring(0, pad.length - str.length) + str;
}

app.post("/api/books/add", async (req, res) => {
    const input = req.body;
    let arrHasil = []; 
    try {
        let val = await axios.get("https://www.googleapis.com/books/v1/volumes/" + input.id_buku);

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
    let result= await db.executeQuery(conn, `SELECT id_buku FROM buku WHERE id_perpus = '${input.id_perpus}'`);
    if (result.length) {
        return res.status(409).json({
            message: 'Buku sudah terdaftar di perpustakaan',
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
    conn.release();


    conn= await db.getConn();
    result= await db.executeQuery(conn, `INSERT INTO buku VALUES ('${id}', '${input.id_perpus}', '${input.id_buku}')`);
    if (result.affectedRows === 0) {
        return res.status(500).json({
            message: 'Terjadi kesalahan pada server',
            status_code: 500
        });
    }
    conn.release();

    return res.status(200).json({
        message: 'Tambah buku berhasil',
        status_code: 200
    });
});

app.put("/api/books/update/:id", async(req, res) => {
    let input = req.body;
    let conn= await db.getConn();
    let result= await db.executeQuery(conn, `SELECT * FROM buku WHERE id_buku = '${req.params.id}'`);
    if (result.length == 0) {
        return res.status(404).json({
            message: 'Buku tidak terdaftar terdaftar di perpustakaan',
            status_code: 404
        });   
    }

    conn.release();

    conn= await db.getConn();
    result= await db.executeQuery(conn, `UPDATE buku set id_perpus = '${input.id_perpus}' where id_buku = '${req.params.id}'`);
    if (result.affectedRows === 0) {
        return res.status(500).json({
            message: 'Terjadi kesalahan pada server',
            status_code: 500
        });

    }else{
        return res.status(200).json({
            message: 'Update buku berhasil',
            status_code: 500
        });
    }
    conn.release();

});

const user = require("./routes/user");
const buku = require("./routes/buku");

app.use("/api/user/", user);
app.use("/api/buku/", buku);

app.get('/', (req, res) => res.status(200).send('Online!'));

app.listen(3000, function() {
    console.log("listen 3000");
 })