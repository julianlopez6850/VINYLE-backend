const express = require("express");
const router = express.Router();
const { Users } = require("../models");
const bcrypt = require("bcrypt");

// Registration
router.post("/register", async (req, res) => {
	const { username, password } = req.body;

	const isUsernameTaken = await Users.findOne({ where: { username: username } });

	if (isUsernameTaken)
		return res.status(400).json({ error: "Username is already taken" });
	else {
		bcrypt.hash(password.toString(), 10).then((hash) => {
			Users.create({
				username: username,
				password: hash,
			});
			return res.status(200).json({ success: "Successfully created new user: " + username, username: username, password: password });
		});
	}
});

router.get("/isUsernameAvailable", async (req, res) => {
	console.log(req.query);
	const { username } = req.query;

	const isUsernameTaken = await Users.findOne({ where: { username: username || null } });
	if (isUsernameTaken)
		return res.status(200).json({ result: false, message: "Username is already taken" });
	else
		return res.status(200).json({ result: true, message: "Username " + username + " is available." })
});

// Login
router.post("/login", async (req, res) => {
	const { username, password } = req.body;

	const userFound = await Users.findOne({ where: { username: username } });

	if (!userFound)
    return res.status(400).json({ error: "User Not Found" });
	bcrypt.compare(password, userFound.password).then((match) => {
		if (!match)
      return res.status(400).json({ error: "Wrong Username and Password Combination" });

		res.status(200).json({ success: "Login successful." });
	});
});

module.exports = router;
