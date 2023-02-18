const express = require('express');
const { json } = require('sequelize');
const router = express.Router();
const { Albums } = require('../models');
const sharp = require('sharp');
var path = require('path');
const axios = require('axios');
var FormData = require('form-data');
const sequelize = require('sequelize');
const bcrypt = require("bcrypt");
var fs = require("fs");

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
		var artistsString = "";

		album.artists.forEach((artist, index) => {
			if(index !== 0)
			artistsString += ", ";
			artistsString += artist;
		})

		album.artistsString = artistsString;

		album.artists = JSON.stringify(album.artists);

		await Albums.create(album).then(() => {
			console.log("Album saved to database.");
		});
		console.log(album);
		return res.status(200).json({ success: true, album: album });
	} catch (err) {
		console.log(err);
		return res.status(400).json({ error: err })
	}
});

// Post new album art image files for each guessNum for the specified album ID.
router.post("/art", async (req, res) => {
	const { id } = req.body;

	if(id === undefined) {
		return res.status(400).json({error: "Request body must contain 'id'."})
	}

	var existingAlbum;
	if(isNaN(id))
		existingAlbum = await Albums.findOne({ where: { albumID: id } });
	else
		existingAlbum	= await getAlbumFromID(id);

	try {
		if (!fs.existsSync(`albumArt/${existingAlbum.albumID}`)) {
			fs.mkdirSync(`albumArt/${existingAlbum.albumID}`);
			console.log(`Created new directory /${existingAlbum.albumID}.`);
		} else {
			console.log(`Directory /${existingAlbum.albumID} already exists.`);
			return res.status(400).json({ error: "That album already has its art stored." })
		}
	} catch (err) {
		console.error(err);
		return res.status(400).json({ error: err });
	}
	try {
		// cycle through possible guessNum values
		for(var i = 0; i <= 6; i++) {

			// change the crop percentage of the album art based on guessNum.
			var cropPercentage = 1;
			switch (i) {
				case 0:
					cropPercentage = 1/6.5;
					break;
				case 1:
					cropPercentage = 1/4.0;
					break;
				case 2:
					cropPercentage = 1/3.0;
					break;
				case 3:
					cropPercentage = 1/2.0;
					break;
				case 4:
					cropPercentage = 1/1.66;
					break;
				case 5:
					cropPercentage = 1/1.33;
					break;
				case 6:
					cropPercentage = 1/1.0;
					break;
			}

			var size = Math.ceil(300.0 * cropPercentage);
			var fromTop = Math.floor(300.0 - size);
		
			console.log("Album Art: " + existingAlbum.albumArt + ", numGuesses : " + i);
			const url = existingAlbum.albumArt
			await bcrypt.hash(i.toString(), 10).then(async (hash) => {
				hash = hash.replace(/\//g, "SlashSlash");

				// the following allows for the answer album to be cropped, saved into a file, and then sent back as a file through the response.
				const response = await axios.get(url,  { responseType: 'arraybuffer' })
				const buffer = Buffer.from(response.data, "utf-8")
				await sharp(buffer)
				.extract({ width: size, height: size, left: 0, top: fromTop})
				.resize(300, 300)
				.toFile(`./albumArt/${existingAlbum.albumID}/${hash}.png`)
				.then(response => {
					console.log("Album Art Cropped and Saved to File Successfully.");
				})
				.catch(function(err) {
					console.log(err)
					return res.status(200).json({success: false, error: err});
				})
				
			});
		}
	} catch (err) {
		console.log(err);
		return res.status(400).json({ error: err })
	}
	return res.status(200).json({success: true, message: "All Art Images Successfully Saved."});
});

// Replace image file for specified album ID and guessNum 
router.put("/art/guess", async (req, res) => {
	const { id, guessNum, pxFromTop, pxFromLeft } = req.body;

	if(id === undefined) {
		return res.status(400).json({error: "Request body must contain 'id'."})
	}
	if(!Number.isInteger(guessNum) || guessNum < 0 || guessNum > 6) {
		return res.status(400).json({error: "guessNum must be passed as an integer between 0 and 6 (inclusive)."})
	}

	var existingAlbum;
	if(isNaN(id))
		existingAlbum = await Albums.findOne({ where: { albumID: id } });
	else
		existingAlbum	= await getAlbumFromID(id);

	try {
		if (!fs.existsSync(`albumArt/${existingAlbum.albumID}`)) {
			console.log(`Directory /albumArt/${existingAlbum.albumID} not found.`);
			return res.status(400).json({ error: "The directory for this album ID was not found. You must first make a POST /albums/art request with this album ID before making this request." });
		}
	} catch (err) {
		console.error(err);
		return res.status(400).json({ error: err });
	}
	try {
		// cycle through possible guessNum values
		for(var i = 0; i <= 6; i++) {
			if(guessNum !== undefined && i !== guessNum)
				continue;

			// change the crop percentage of the album art based on guessNum.
			var cropPercentage = 1;
			switch (i) {
				case 0:
					cropPercentage = 1/6.5;
					break;
				case 1:
					cropPercentage = 1/4.0;
					break;
				case 2:
					cropPercentage = 1/3.0;
					break;
				case 3:
					cropPercentage = 1/2.0;
					break;
				case 4:
					cropPercentage = 1/1.66;
					break;
				case 5:
					cropPercentage = 1/1.33;
					break;
				case 6:
					cropPercentage = 1/1.0;
					break;
			}

			var size = Math.ceil(300.0 * cropPercentage);
			var fromTop = Math.floor(300.0 - size);
			var fromLeft = 0;

			if(pxFromTop !== undefined && pxFromTop !== null)
				fromTop = pxFromTop;
			if(pxFromLeft !== undefined && pxFromLeft !== null)
				fromLeft = pxFromLeft;

			if(fromLeft + size > 300 || fromTop + size > 300) {
				console.log("Bad positioning & size. Cannot extract image file correctly.");
				return res.status(400).json({ error: "Bad positioning & size. Cannot extract image file correctly." })
			}

			console.log("Album Art: " + existingAlbum.albumArt + ", numGuesses : " + i);
			const url = existingAlbum.albumArt

			const directories = fs.readdirSync(`./albumArt/${existingAlbum.albumID}`);

			// REMOVE OLD ALBUM ART IMAGE FOR guessNum.
			for(var j = 0; j < directories.length; j++) {
				await bcrypt.compare(guessNum.toString(), directories[j].replace(/SlashSlash/g, "/").slice(0, -4))
				.then((match) => {
					if (match) {
						fs.unlinkSync(`albumArt/${existingAlbum.albumID}/${directories[j]}`);
						console.log(`Removed file: /albumArt/${existingAlbum.albumID}/${directories[j]}`);
						j = directories.length;
						return;
					} else {
						if(j === directories.length - 1)
							return res.status(400).json({ error: `No png file found for the art pertaining to id: ${id} and guessNum: ${guessNum}.` })
					}
				})
				.catch(function(err) {
					console.log(`(PUT /albums/art/guess) Error Removing old art for id: ${id}, guessNum: ${guessNum}`);
					console.log(err);
					return res.status(400).json({ error: err });
				});
			}

			const newDirectories = fs.readdirSync(`./albumArt/${existingAlbum.albumID}`);
			if(directories.length === newDirectories.length) {
				return res.status(400).json({ error: `Error Removing old art for id: ${id}, guessNum: ${guessNum}` });
			}

			// SAVE NEW ALBUM ART IMAGE FOR guessNum.
			await bcrypt.hash(i.toString(), 10).then(async (hash) => {
				hash = hash.replace(/\//g, "SlashSlash");

				// the following allows for the answer album to be cropped, saved into a file, and then sent back as a file through the response.
				const response = await axios.get(url,  { responseType: 'arraybuffer' })
				const buffer = Buffer.from(response.data, "utf-8")
				await sharp(buffer)
				.extract({ width: size, height: size, left: fromLeft, top: fromTop})
				.resize(300, 300)
				.toFile(`./albumArt/${existingAlbum.albumID}/${hash}.png`)
				.then(response => {
					console.log(`Replaced with /albumArt/${existingAlbum.albumID}/${hash}.png`);
				})
				.catch(function(err) {
					console.log(`(PUT /albums/art/guess) Error Creating new art for id: ${id}, guessNum: ${guessNum}`);
					console.log(err);
					return res.status(400).json({ error: err });
				})
			});
		}
	} catch (err) {
		console.log(err);
		return res.status(400).json({ error: err })
	}
	return res.status(200).json({success: true, message: `Successfully replaced image file for album ID: ${id}, guessNum: ${guessNum}.`});
});

// Delete all album art image files for specified album ID.
router.delete("/art", async (req, res) => {
	const { id } = req.body;

	if(id === undefined) {
		return res.status(400).json({error: "Request body must contain 'id'."})
	}

	var existingAlbum;
	if(isNaN(id))
		existingAlbum = await Albums.findOne({ where: { albumID: id } });
	else
		existingAlbum	= await getAlbumFromID(id);

	try {
		if (!fs.existsSync(`albumArt/${existingAlbum.albumID}`)) {
			console.log(`Directory /albumArt/${existingAlbum.albumID} not found.`);
			return res.status(400).json({ error: "The directory for this album ID was not found. (Nothing to delete)." });
		} else {
			fs.rmSync(`albumArt/${existingAlbum.albumID}`, { recursive: true, force: true });
			console.log(`Removed directory: /albumArt/${existingAlbum.albumID}`);
			return res.status(200).json({success: true, message: `Successfully deleted all image files for album ID: ${id}.`});
		}
	} catch (err) {
		console.error(err);
		return res.status(400).json({ error: err });
	}
});

// Post new album art image files for each guessNum for every album stored in the albums table.
router.post("/allArt", async (req, res) => {
	
	var albums = await Albums.findAll();
	for(var i = 0; i < albums.length; i++) {
		console.log("#" + i + ":\tid: " + albums[i].dataValues.albumID + ":\t Album: " + albums[i].dataValues.albumName + "\n");
		existingAlbum	= await getAlbumFromID(i);

		try {
			if (!fs.existsSync(`albumArt/${existingAlbum.albumID}`)) {
				fs.mkdirSync(`albumArt/${existingAlbum.albumID}`);
				console.log(`Created new directory /${existingAlbum.albumID}.`);
			} else {
				console.log(`Directory /${existingAlbum.albumID} already exists.`);
				continue;
			}
		} catch (err) {
			console.error(err);
			return res.status(400).json({ error: err });
		}
		try {
			// cycle through possible guessNum values
			for(var j = 0; j <= 6; j++) {
	
				// change the crop percentage of the album art based on guessNum.
				var cropPercentage = 1;
				switch (j) {
					case 0:
						cropPercentage = 1/6.5;
						break;
					case 1:
						cropPercentage = 1/4.0;
						break;
					case 2:
						cropPercentage = 1/3.0;
						break;
					case 3:
						cropPercentage = 1/2.0;
						break;
					case 4:
						cropPercentage = 1/1.66;
						break;
					case 5:
						cropPercentage = 1/1.33;
						break;
					case 6:
						cropPercentage = 1/1.0;
						break;
				}
	
				var size = Math.ceil(300.0 * cropPercentage);
				var fromTop = Math.floor(300.0 - size);
			
				console.log("Album Art: " + existingAlbum.albumArt + ", numGuesses : " + j);
				const url = existingAlbum.albumArt
				await bcrypt.hash(j.toString(), 10).then(async (hash) => {
					hash = hash.replace(/\//g, "SlashSlash");
	
					// the following allows for the answer album to be cropped, saved into a file, and then sent back as a file through the response.
					const response = await axios.get(url,  { responseType: 'arraybuffer' })
					const buffer = Buffer.from(response.data, "utf-8")
					await sharp(buffer)
					.extract({ width: size, height: size, left: 0, top: fromTop})
					.resize(300, 300)
					.toFile(`./albumArt/${existingAlbum.albumID}/${hash}.png`)
					.then(response => {
						console.log("Album Art Cropped and Saved to File Successfully.");
					})
					.catch(function(err) {
						console.log(err)
						return res.status(400).json({success: false, error: err});
					});
				});
			}
		} catch (err) {
			console.log(err);
			return res.status(400).json({ error: err })
		}
	}
	return res.status(200).json({success: true, message: "All Art Images Successfully Saved."});
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
				response.artists = JSON.parse(response.artists);
				if(response)
					return res.status(200).json({ album: response })
				else
					return res.status(400).json({ error: "Bad album ID." })
			});
	}
	else
	{
		const album = await getAlbumFromID(id);
		album.artists = JSON.parse(album.artists);
		return res.status(200).json({ album: album });
	}
});

// Get ALL albums in the database. Return in alphabetical order of artists, then albums
router.get("/all", async (req, res) => {
	const listOfAlbums = await Albums.findAll({
		order: [
			['artistsString', 'ASC'], 
			['albumName', 'ASC']
		]
	});
	listOfAlbums.forEach((album, index) => {
		album.artists = JSON.parse(album.artists);
	})
	res.status(200).json(listOfAlbums);
});

// Get the album art of an album specified by ID, and cropped based on guess #
// (IMAGES IN ALBUMS TABLE MUST BE SAVED AS 300x300 for this request to work)
router.get("/art", async (req, res) => {
	const { id, guessNum } = req.query;
	
	if(id === undefined) { 
		res.status(400).json({ error: "id cannot be undefined." })
	}
	if(guessNum === undefined) { 
		res.status(400).json({ error: "guessNum cannot be undefined." })
	}

	var existingAlbum;
	if(isNaN(id))
		existingAlbum = await Albums.findOne({ where: { albumID: id } });
	else
		existingAlbum	= await getAlbumFromID(id);

	if(!existingAlbum)
		return res.status(400).json({ error: "There is no album associated with the id provided in the request." });

	const directories = fs.readdirSync(`./albumArt/${existingAlbum.albumID}`);

	for(var i = 0; i < directories.length; i++) {
		await bcrypt.compare(guessNum, directories[i].replace(/SlashSlash/g, "/").slice(0, -4))
		.then((match) => {
			if (match) {
				res.status(200).sendFile(`albumArt/${existingAlbum.albumID}/${directories[i]}`, { root: path.join(__dirname, '..')});
				i = directories.length;
				return;
			} else {
				if(i === directories.length - 1)
					return res.status(400).json({ error: `No png file found for the art pertaining to id: ${id} and guessNum: ${guessNum}.` })
			}
		})
		.catch(function(err) {
			console.log(`Error retrieving art for id: ${id}, guessNum: ${guessNum}`)
			return res.status(400).json({ error: err });
		});
	};
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