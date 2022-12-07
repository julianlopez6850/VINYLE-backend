const express = require('express');
const { json } = require('sequelize');
const router = express.Router();
const { Albums } = require('../models');
const sharp = require('sharp');
var path = require('path')
const axios = require('axios')

const getAlbumFromID = async (id) => {
	var listOfAlbums = await Albums.findAll();
	var albumID = parseInt(id) % listOfAlbums.length + 1;
	const album = await Albums.findOne({ where: { id: albumID } });
	return album;
}

router.post("/", async (req, res) => {
	const album = req.body;
	try {
		var doesAlbumExist = await Albums.findOne({ where: { albumID: album.albumID } });
	} catch {
		return res.status(400).json({ error: "albumID cannot be null"})
	}
	if(doesAlbumExist)
	{
		return res.status(400).json({ error: "That album is already stored in the albums table" })
	}
	try {
		await Albums.create(album);
	} catch (err) {
		return res.status(400).json(err)
	}
	return res.status(200).json(album);
});

router.get("/", async (req, res) => {
	const { id } = req.query;

	var listOfAlbums = await Albums.findAll();
	var albumID = parseInt(id) % listOfAlbums.length + 1;
	const album = await Albums.findOne({ where: { id: albumID } });

	return res.status(200).json({ id: albumID, album: album});
});

router.get("/all", async (req, res) => {
	const listOfAlbums = await Albums.findAll();
	res.status(200).json(listOfAlbums);
});

router.get("/art", async (req, res) => {
	const { id, guessNum } = req.query;

	var cropPercentage = 1;

	switch (guessNum) {
		case '0':
			cropPercentage = 1/10.0;
			break;
		case '1':
			cropPercentage = 1/8.0;
			break;
		case '2':
			cropPercentage = 1/6.5;
			break;
		case '3':
			cropPercentage = 1/5.0;
			break;
		case '4':
			cropPercentage = 1/3.5;
			break;
		case '5':
			cropPercentage = 1/2.0;
			break;
		case '6':
			cropPercentage = 1/1.0;
			break;
	}

	var size = Math.ceil(300.0 * cropPercentage);
	var fromTop = Math.floor(300.0 - size);

	var listOfAlbums = await Albums.findAll();
	var albumID = parseInt(id) % listOfAlbums.length + 1;
	const album = await getAlbumFromID(id);


	console.log(album.albumArt)
	const url = album.albumArt

	const response = await axios.get(url,  { responseType: 'arraybuffer' })
	const buffer = Buffer.from(response.data, "utf-8")
	await sharp(buffer)
	.extract({ width: size, height: size, left: 0, top: fromTop})
	.resize(300, 300)
	.toFile(`./albumArt/answer.png`)
	.then(response => {
		console.log("Album Art cropped successfully.");
	})
	.catch(function(err) {
		console.log(err)
	})
	console.log("Art sent to client.");
	res.status(200).sendFile('albumArt/answer.png', { root: path.join(__dirname, '..')})
})

router.get("/compare", async (req, res) => {
	const { id, guess_albumID, guess_artists, guess_genres, guess_releaseYear } = req.query;

	var listOfAlbums = await Albums.findAll();
	var albumID = parseInt(id) % listOfAlbums.length + 1;
	const album = await Albums.findOne({ where: { id: albumID } });

	var correctGuess = (album.albumID == guess_albumID)
	var correctArtist = (album.artists == guess_artists)
	console.log(album.artists)
	console.log(guess_artists)
	var correctGenres = (album.genres == guess_genres)
	var correctReleaseYear = (album.releaseYear == guess_releaseYear)

	return res.status(200).json({ correct: correctGuess, correctArtist: correctArtist, correctGenres: correctGenres, correctReleaseYear: correctReleaseYear });
});

module.exports = router;