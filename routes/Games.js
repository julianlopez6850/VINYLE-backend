const express = require('express');
const router = express.Router();
const { Games, Albums } = require('../models');
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

// get games played by a specified user & gamemode. 
// (if mode is not specified in request, get all modes)
router.get("/user", validateToken, async (req, res) => {
	const { username, mode } = req.query;

	if(username === undefined)
		return res.status(400).json({ error: "Username cannot be undefined" });

	const withMode = { username: username, mode: mode };
	const withoutMode = { username: username }
	const listOfGames = await Games.findAll({ where: (mode === undefined) ? withoutMode : withMode });

	for(const game of listOfGames) {
		const album = await Albums.findOne({ where: { albumID: game.dataValues.albumID } })
		game.dataValues.album = album ;
	}
	
	if(listOfGames[0] != undefined) {
		res.status(200).json({ games: listOfGames });
	} else {
		res.status(200).json({ message: "No games found for user: " + username + `${(mode) ? `, mode: ${mode}` : ``}` })
	}
});

module.exports = router;