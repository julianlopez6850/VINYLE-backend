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
			WinPercent: 0,
			avgGuesses: 0
		}
		await Albums.findAll({ order: sequelize.literal('rand()'), limit: 1 }).then((response) => {
			data.albumID = response[0].dataValues.albumID;
			data.albumName = response[0].dataValues.albumName;
		})

		console.log(data);

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
	if(existingDaily) {
		res.status(200).json({ game: existingDaily });
	} else {
		res.status(200).json({ error: "No daily game found for date " + date })
	}
});

module.exports = router;