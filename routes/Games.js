const express = require('express');
const router = express.Router();
const { Games } = require('../models');
const { validateToken } = require("../jsonWebTokens");

// Get all of the games played
router.get("/all", async (req, res) => {
	const listOfGames = await Games.findAll();
	res.json(listOfGames);
});

// Post a new game to the games table.
router.post("/", validateToken, async (req, res) => {
	try {
		const newGame = req.body;
		await Games.create(newGame);
		res.json({ success: newGame });
	} catch (err) {
		res.json({ error: err })
		console.log(err);
	}
});

// get games played by a specified user.
router.get("/user/all", async (req, res) => {
	const { username } = req.query;
	const listOfGames = await Games.findAll({ where: { username: username } });
	if(listOfGames[0] != undefined) {
		res.status(200).json({ games: listOfGames });
	} else {
		res.status(200).json({ error: "No games found for user " + username })
	}
});

// get games played by a specified user & gamemode.
router.get("/user/mode", async (req, res) => {
	const { username, mode } = req.query;
	const listOfGames = await Games.findAll({ where: { username: username, mode: mode } });
	if(listOfGames[0] != undefined) {
		res.status(200).json({ games: listOfGames });
	} else {
		res.status(200).json({ error: "No games found for user " + username })
	}
});

module.exports = router;