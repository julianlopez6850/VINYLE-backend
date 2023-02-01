const express = require('express');
const { json } = require('sequelize');
const router = express.Router();
const { Albums } = require('../models');
const sharp = require('sharp');
var path = require('path');
const axios = require('axios');
var FormData = require('form-data');

// This method is used to choose an answer album using a random integer.
const getAlbumFromID = async (id) => {
	var listOfAlbums = await Albums.findAll();
	var albumID = parseInt(id) % listOfAlbums.length + 1;
	const album = await Albums.findOne({ where: { id: albumID } });
	return album;
};

// Post a new album to the albums table
router.post("/", async (req, res) => {
	const album = req.body;

	var errors = [];

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
		// cycle through possible guessNum values
		for(var i = 0; i < 6; i++) {

			// change the crop percentage of the album art based on guessNum.
			var cropPercentage = 1;
			switch (i) {
				case 0:
					cropPercentage = 1/10.0;
					break;
				case 1:
					cropPercentage = 1/8.0;
					break;
				case 2:
					cropPercentage = 1/6.5;
					break;
				case 3:
					cropPercentage = 1/5.0;
					break;
				case 4:
					cropPercentage = 1/3.5;
					break;
				case 5:
					cropPercentage = 1/2.0;
					break;
			}

			var size = Math.ceil(300.0 * cropPercentage);
			var fromTop = Math.floor(300.0 - size);
		
			console.log("Album Art: " + album.albumArt + ", numGuesses : " + i);
			const url = album.albumArt
		
			// the following allows for the answer album to be cropped, saved into a buffer, stored onto Imgur, and have the resulting link saved into the albums table.
			const response = await axios.get(url,  { responseType: 'arraybuffer' })
			.catch(function (error) {
				console.log(error);
				return res.status(400).json(error);
			});
			if(!response.data) {
				return;
			}
			const buffer = Buffer.from(response.data, "utf-8")
			await sharp(buffer)
			.extract({ width: size, height: size, left: 0, top: fromTop})
			.resize(300, 300)
			.toBuffer()
			.then(async (response) => {
				console.log("Album Art cropped successfully.");

				var data = new FormData();
				data.append('image', response);

				var axiosConfig = {
					method: 'post',
					url: 'https://api.imgur.com/3/image',
					headers: { 
						'Authorization': `Client-ID ${process.env.IMGUR_CLIENT_ID}`, 
						...data.getHeaders()
					},
					data : data
				};

				await axios(axiosConfig)
				.then(function (response) {
					console.log(`SUCCESSFULLY UPLOADED CROPPED ART FOR GUESS ${i + 1} TO IMGUR`)
					console.log(response.data.data.link);
					album[`guess${i + 1}Art`] = response.data.data.link
				})
				.catch(function (err) {
					console.log(`FAILED TO UPLOAD FOR CROPPED ART FOR GUESS ${i + 1} TO IMGUR`)
					errors.push({ msg: `GUESS ${i + 1} ART UPLOAD TO IMGUR FAILED`, error: err });
				});
			})
			.catch(function(err) {
				console.log(err);
				return res.status(400).json(err);
			})
		}
		if(errors[0]) {
			return res.status(400).json({errors: errors});
		}

		await Albums.create(album).then(() => {
			console.log("Album saved to database.");
		});
		console.log(album);
		return res.status(200).json(album);
	} catch (err) {
		return res.status(400).json(err)
	}
});

// Delete an existing album in the album table
router.delete("/",  async (req, res) => {
	const { id } = req.query;

	try {
		await Albums.destroy({ where: { albumID: id }})
	} catch {
		return res.status(400).json({ error: "albumID cannot be null"})
	}
	return res.status(200).json( "Album " + id + " was successfully deleted." );
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

// Get ALL albums in the database. Return in alphabetical order of artists, then albums
router.get("/all", async (req, res) => {
	const listOfAlbums = await Albums.findAll({
		order: [
			['artists', 'ASC'], 
			['albumName', 'ASC']
		]
	});
	res.status(200).json(listOfAlbums);
});

// Get the album art of an album specified by ID, and cropped based on guess #
// (IMAGES IN ALBUMS TABLE MUST BE SAVED AS 300x300 for this request to work)
router.get("/art", async (req, res) => {
	const { id, guessNum } = req.query;
	
	var album;
	if(isNaN(id))
		album = await Albums.findOne({ where: { albumID: id } });
	else
		album	= await getAlbumFromID(id);
	
	var art;

	switch (guessNum) {
		case '0':
			art = album.dataValues.guess1Art;
			break;
		case '1':
			art = album.dataValues.guess2Art;
			break;
		case '2':
			art = album.dataValues.guess3Art;
			break;
		case '3':
			art = album.dataValues.guess4Art;
			break;
		case '4':
			art = album.dataValues.guess5Art;
			break;
		case '5':
			art = album.dataValues.guess6Art;
			break;
		case '6':
			art = album.dataValues.albumArt;
			break;
	}

	console.log("Art sent to client.");
	return res.status(200).json({artURL: art});
});

// Compare the guess album with the answer album.
router.get("/compare", async (req, res) => {
	const { id, guess_albumID } = req.query;

	const answerAlbum = await getAlbumFromID(id);

	var correctGuess = (answerAlbum.albumID == guess_albumID)

	const guessAlbum = await Albums.findOne({ where: { albumID: guess_albumID } })

	console.log(guessAlbum);

	var correctArtists = ''
	if(JSON.stringify(answerAlbum.artists) == JSON.stringify(guessAlbum.artists))
		correctArtists = "correct";
	else {
		correctArtists = false;
		answerAlbum.artists.forEach((artist) => {
			if(guessAlbum.artists.includes(artist))
				correctArtists = "partial";
		})
	}
	var correctGenres = (answerAlbum.genres == guessAlbum.genres)
	var correctReleaseYear = ''
	if(answerAlbum.releaseYear == guessAlbum.releaseYear)
		correctReleaseYear = "correct";
	else {
		correctReleaseYear = false;
		if(Math.floor(answerAlbum.releaseYear / 10) === Math.floor(guessAlbum.releaseYear / 10))
			correctReleaseYear = "decade"
	}
	var releaseYearDirection = "";
	if(answerAlbum.releaseYear > guessAlbum.releaseYear)
		releaseYearDirection = "later";
	else if(answerAlbum.releaseYear < guessAlbum.releaseYear)
		releaseYearDirection = "earlier";

	return res.status(200).json({ correct: correctGuess, correctArtists: correctArtists, correctGenres: correctGenres, correctReleaseYear: correctReleaseYear, releaseYearDirection: releaseYearDirection });
});

module.exports = router;