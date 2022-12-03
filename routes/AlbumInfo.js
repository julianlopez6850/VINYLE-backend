const express = require('express');
const router = express.Router();
const { AlbumInfo } = require('../models');

router.get("/", async (req, res) => {
	const listOfAlbumInfo = await AlbumInfo.findAll();
	res.json(listOfAlbumInfo);
});

router.post("/", async (req, res) => {
	const albumInfo = req.body;
	await AlbumInfo.create(albumInfo);
	res.json(albumInfo);
});

module.exports = router;