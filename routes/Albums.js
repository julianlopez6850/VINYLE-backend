const express = require('express');
const { json } = require('sequelize');
const router = express.Router();
const { Albums } = require('../models');
const sharp = require('sharp');
var path = require('path')
const axios = require('axios')

// This method is used to get choose an answer album using a random integer.
const getAlbumFromID = async (id) => {
	var listOfAlbums = await Albums.findAll();
	var albumID = parseInt(id) % listOfAlbums.length + 1;
	const album = await Albums.findOne({ where: { id: albumID } });
	return album;
}

// Post a new album to the albums table
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

// Get album information by an album ID.
router.get("/", async (req, res) => {
	const { id } = req.query;

	if(isNaN(id))
	{
		await Albums.findOne({ where: { albumID: id } })
			.then((response) => {
				if(response)
					return res.status(200).json({ album: response })
				else
					return res.status(400).json({ error: "Bad album ID." })
			});
	}
	else
	{
		const album = await getAlbumFromID(id);
		return res.status(200).json({ album: album });
	}
});

// Get ALL albums in the database.
router.get("/all", async (req, res) => {
	const listOfAlbums = await Albums.findAll();
	res.status(200).json(listOfAlbums);
});

// Get the album art of an album specified by ID, and cropped based on guess #
router.get("/art", async (req, res) => {
	const { id, guessNum } = req.query;

	var cropPercentage = 1;

	// change the crop percentage of the album art based on the guessNum passed through the request.
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

	const album = await getAlbumFromID(id);

	console.log(album.albumArt)
	const url = album.albumArt

	// the following allows for the answer album to be cropped, saved into a file, and then sent back as a file through the response.
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

// Compare the guess album with the answer album.
router.get("/compare", async (req, res) => {
	const { id, guess_albumID } = req.query;

	const answerAlbum = await getAlbumFromID(id);

	var correctGuess = (answerAlbum.albumID == guess_albumID)

	const guessAlbum = await Albums.findOne({ where: { albumID: guess_albumID } })

	console.log(guessAlbum);

	var correctArtists = (answerAlbum.artists == guessAlbum.artists)
	var correctGenres = (answerAlbum.genres == guessAlbum.genres)
	var correctReleaseYear = (answerAlbum.releaseYear == guessAlbum.releaseYear)
	var releaseYearDirection = "";
	if(answerAlbum.releaseYear > guessAlbum.releaseYear)
		releaseYearDirection = "later";
	else if(answerAlbum.releaseYear < guessAlbum.releaseYear)
		releaseYearDirection = "earlier";

	return res.status(200).json({ correct: correctGuess, correctArtists: correctArtists, correctGenres: correctGenres, correctReleaseYear: correctReleaseYear, releaseYearDirection: releaseYearDirection });
});

module.exports = router;