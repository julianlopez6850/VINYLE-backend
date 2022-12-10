const express = require('express');
const router = express.Router();
const { GamesPlayed } = require('../models');
const { validateToken } = require("../jsonWebTokens");

// Get all of the games played
router.get("/", async (req, res) => {
	const listOfGamesPlayed = await GamesPlayed.findAll();
	res.json(listOfGamesPlayed);
});

// Post a new game to the gamesplayed table.
router.post("/", validateToken, async (req, res) => {
	try {
		const newGame = req.body;
		await GamesPlayed.create(newGame);
		res.json({ success: newGame });
	} catch (err) {
		res.json({ error: err })
		console.log(err);
	}
});

module.exports = router;