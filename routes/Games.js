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

	if(listOfGames[0] === undefined)
		return res.status(200).json({ message: "No games found for user: " + username + `${(mode) ? `, mode: ${mode}` : ``}` })

	for(const game of listOfGames) {
		const album = await Albums.findOne({ where: { albumID: game.dataValues.albumID } })
		game.dataValues.album = album ;
	}
	
	res.status(200).json({ games: listOfGames });
});

// get stats of games played by a specified user & gamemode. 
// (if mode is not specified in request, get all modes)
router.get("/user/stats", validateToken, async (req, res) => {
	const { username, mode } = req.query;

	if(username === undefined)
		return res.status(400).json({ error: "Username cannot be undefined" });

	const withMode = { username: username, mode: mode };
	const withoutMode = { username: username }
	const listOfGames = await Games.findAll({ where: (mode === undefined) ? withoutMode : withMode });

	if(listOfGames[0] === undefined)
		return res.status(200).json({ message: "No games found for user: " + username + `${(mode) ? `, mode: ${mode}` : ``}` })
		
	var numGames = listOfGames.length;
	var numWins = 0;
	var numGuesses = 0;
	var numGuessDistribution = [0,0,0,0,0,0]
	for(var i = 0; i < numGames; i++) {
		if(listOfGames[i].win === 1) {
			numWins++;
			numGuessDistribution[listOfGames[i].numGuesses - 1]++;
		}
	}
	var mostFrequent = 0;
	numGuessDistribution.forEach((item, index) => {
		numGuesses += item * (index + 1);
		if(item > mostFrequent)
			mostFrequent = item;
	})
	
	res.status(200).json({ game: {
		numGames: numGames,
		numWins: numWins,
		numLosses: numGames - numWins,
		winPercent: parseFloat((numWins / numGames * 100).toFixed()),
		guessDistribution: numGuessDistribution,
		avgGuessesPerWin: parseFloat((numGuesses / numWins).toFixed(2)),
		mostFrequent: mostFrequent
	}});
});

// get games played by a user in a specified mode and date, if any.
router.get("/user/hasGame", validateToken, async (req, res) => {
	const { username, mode, date } = req.query;

	if(username === undefined)
		return res.status(400).json({ error: "Username cannot be undefined" });
	if(mode === undefined)
		return res.status(400).json({ error: "Mode cannot be undefined" });
	if(date === undefined)
		return res.status(400).json({ error: "Date cannot be undefined" });
	const listOfGames = await Games.findAll({ where: { username: username, date: date, mode: mode } });
	
	if(listOfGames[0] === undefined)
		return res.status(200).json({ value: false, message: `No games found for { user: ${username}, mode: ${mode}, date: ${date} }` })
	else
		return res.status(200).json({ value: true, games: listOfGames })
})

module.exports = router;