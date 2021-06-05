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

module.exports = router;