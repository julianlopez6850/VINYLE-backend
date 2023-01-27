const express = require('express');
const router = express.Router();
const { Games, Albums, Daily } = require('../models');
const { validateToken } = require("../jsonWebTokens");
const sequelize = require('sequelize');

// Get all of the games played
router.get("/all", async (req, res) => {
	const listOfGames = await Games.findAll();
	res.json(listOfGames);
});

// Post a new game to the games table.
router.post("/", validateToken, async (req, res) => {
	if(req.body.mode === "classic") {
		await Daily.update(
			{
				numPlayed: sequelize.literal('numPlayed + 1'), 
				numWins: (req.body.win) ? sequelize.literal('numWins + 1') : sequelize.literal('numWins'), 
				numLosses: (req.body.win) ? sequelize.literal('numLosses') : sequelize.literal('numLosses + 1'), 
				num1Guess: (req.body.win && req.body.numGuesses === 1) ? sequelize.literal('num1Guess + 1') : sequelize.literal('num1Guess'), 
				num2Guess: (req.body.win && req.body.numGuesses === 2) ? sequelize.literal('num2Guess + 1') : sequelize.literal('num2Guess'), 
				num3Guess: (req.body.win && req.body.numGuesses === 3) ? sequelize.literal('num3Guess + 1') : sequelize.literal('num3Guess'), 
				num4Guess: (req.body.win && req.body.numGuesses === 4) ? sequelize.literal('num4Guess + 1') : sequelize.literal('num4Guess'), 
				num5Guess: (req.body.win && req.body.numGuesses === 5) ? sequelize.literal('num5Guess + 1') : sequelize.literal('num5Guess'), 
				num6Guess: (req.body.win && req.body.numGuesses === 6) ? sequelize.literal('num6Guess + 1') : sequelize.literal('num6Guess'), 
				winPercent: sequelize.literal('numWins / numPlayed * 100'), 
			},
			{ where: { date: req.body.date } }
		).catch(err => {
			return res.status(400).json({ error: err })
		})
	}

	try {
		const newGame = req.body;
		await Games.create(newGame);
		return res.status(200).json({ message: "Successfully added new game.", game: newGame });
	} catch (err) {
		console.log(err);
		return res.status(400).json({ error: err })
	}
});

// get games played by a user in a specified mode and date, if any.
// (if mode is not specified, get games played in any mode).
// (if date is not specified, get games plaed on any date).
// (if limit is not specified, get all games played that match the other params.
router.get("/user/hasGame", validateToken, async (req, res) => {
	const { username, mode, date, offset, limit } = req.query;

	var query = { username: username };

	const parsedOffset = parseInt(offset);
	const parsedLimit = parseInt(limit);

	if(username === undefined)
		return res.status(400).json({ error: "Username cannot be undefined" });

	if(limit !== undefined && !Number.isInteger(parsedLimit) || parsedLimit <= 0)
		return res.status(400).json({ error: "Limit must be an integer greater than 0" });
	
	if(mode !== undefined)
		query.mode = mode
	if(date !== undefined)
		query.date = date

	const numGames = await Games.count({ where: query });

	const listOfGames = await Games.findAll({ 
		order : [
			['id', 'DESC']
		], 
		limit : (limit) ? parsedLimit : undefined, 
		offset: (offset) ? parsedOffset : undefined, 
		where: query 
	});

	if(listOfGames[0] === undefined)
		return res.status(200).json({ value: false, message: `No games found for { user: ${username}${(mode) ? `, mode: ${mode}` : ``}${(date) ? `, date: ${date}` : ``} }` })

	for(const game of listOfGames) {
		const album = await Albums.findOne({ where: { albumID: game.dataValues.albumID } })
		game.dataValues.album = album;
	}

	return res.status(200).json({ value: true, numGames: numGames, games: listOfGames })
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

module.exports = router;