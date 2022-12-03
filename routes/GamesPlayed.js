const express = require('express');
const router = express.Router();
const { GamesPlayed } = require('../models');

router.get("/", async (req, res) => {
	const listOfGamesPlayed = await GamesPlayed.findAll();
	res.json(listOfGamesPlayed);
});

router.post("/", async (req, res) => {
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