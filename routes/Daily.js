const express = require('express');
const router = express.Router();
const { Daily, Albums } = require('../models');
const { validateToken } = require("../jsonWebTokens");
const sequelize = require('sequelize');

// Get the info of all daily games.
router.get("/all", async (req, res) => {
	const listOfGames = await Daily.findAll();
	res.json(listOfGames);
});

// Post a new daily game to the daily table.
router.post("/", async (req, res) => {
	const { date } = req.body;
	const existingDaily = await Daily.findOne({ where: { date: date } });
	if(existingDaily) {
		return res.status(200).json({ message: "A daily game already exists for that date" });
	}
	try {
		var data = {
			date: date,
			albumID: "",
			albumName: "",
			numPlayed: 0,
			numWins: 0,
			num1Guess: 0,
			num2Guess: 0,
			num3Guess: 0,
			num4Guess: 0,
			num5Guess: 0,
			num6Guess: 0,
			numLosses: 0,
			winPercent: 0
		}
		await Albums.findAll({ order: sequelize.literal('rand()'), limit: 1 }).then((response) => {
			data.albumID = response[0].dataValues.albumID;
			data.albumName = response[0].dataValues.albumName;
		}).catch(function(err) {
			console.log(err);
		});

		await Daily.create(data);
	} catch (err) {
		return res.status(400).json(err);
	}
	return res.status(200).json({ message: "A new daily game has been added for " + date });
});

// Get a daily game's info from the daily table.
router.get("/", async (req, res) => {
	const { date } = req.query;
	const existingDaily = await Daily.findOne({ where: { date: date } });

	var numGuessDistribution = [
		existingDaily.num1Guess,
		existingDaily.num2Guess,
		existingDaily.num3Guess,
		existingDaily.num4Guess,
		existingDaily.num5Guess,
		existingDaily.num6Guess
	]

	var mostFrequent = existingDaily.numLosses;
	numGuessDistribution.forEach((item) => {
		if(parseInt(item) > parseInt(mostFrequent))
			mostFrequent = item;
	})

	existingDaily.dataValues.mostFrequent = mostFrequent;

	if(existingDaily) {
		res.status(200).json({ game: existingDaily });
	} else {
		res.status(200).json({ error: "No daily game found for date " + date })
	}
});

// Get an album ID of a specific date's daily game.
router.get("/id", async (req, res) => {
	const { date } = req.query;
	const existingDaily = await Daily.findOne({ where: { date: date } });
	if(existingDaily) {

		var album = await Albums.findOne({ where: { albumID: existingDaily.albumID } });
		var id = album.id;
		var listOfAlbums = await Albums.findAll();
		var rand = Math.floor(Math.random() * 100);
		id = id * ((listOfAlbums.length) * rand) + id - 1;

		res.status(200).json({ albumID: id });
	} else {
		res.status(200).json({ error: "No daily game found for date " + date })
	}
});

// Get the number of daily games that have occured from the first daily game to a specified date, or to today's date if none specified.
router.get("/numDays", async (req, res) => {
	const { date } = req.query;
	const existingDaily = await Daily.findOne({ where: { date: (date ? date : new Date().setHours(0, 0, 0, 0)) } });

	if(existingDaily)
		res.status(200).json({ days: existingDaily.id })
	else {
		res.status(200).json({ error: "No game occured on given day, or that day has not occured yet." })
	}

});

module.exports = router;