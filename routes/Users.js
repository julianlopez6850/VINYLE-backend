const express = require("express");
const router = express.Router();
const { Users } = require("../models");
const bcrypt = require("bcrypt");
const { createToken, validateToken } = require("../jsonWebTokens");

// Registration
router.post("/register", async (req, res) => {
	const { username, password } = req.body;
	if(username == undefined)
		return res.status(400).json({ error: "Username cannot be undefined" });
	if(password == undefined)
		return res.status(400).json({ error: "Password cannot be undefined" });

	const isUsernameTaken = await Users.findOne({ where: { username: username } });

	if (isUsernameTaken)
		return res.status(400).json({ error: "Username is already taken" });
	else {
		bcrypt.hash(password.toString(), 10).then((hash) => {
			Users.create({
				username: username,
				password: hash,
				settings: JSON.stringify({ darkTheme: true, colorblindMode: false, difficulty: 0 })
			});
			return res.status(200).json({ success: "Successfully created new user: " + username, username: username, password: password });
		});
	}
});

// Check if a username is available.
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

		const accessToken = createToken(userFound);
		
		res.cookie("access-token", accessToken, {
			maxAge: 1000 * 60 * 60 * 24 * 7,
			httpOnly: true
		})

		res.status(200).json({ success: "Login successful.", accessToken: accessToken });
	});
});

// Logout
router.post("/logout", async (req, res) => {
	res.cookie("access-token", 'expired', {
		maxAge: 1000,
		httpOnly: true
	})
	return res.status(200).json({ success: "User logged out successfully." })
});

// Check if a user is logged in, and who that user is.
router.get("/profile", validateToken, async (req, res) => {
	const user = await Users.findOne({ where: { username: req.username } });
	user.settings = JSON.parse(user.settings);
	res.status(200).json({ success: "User authenticated.", username: req.username, settings: user.settings })
});

router.put("/settings", validateToken, (req, res) => {
	const { username, settings } = req.body;

	if(username == undefined)
		return res.status(400).json({ error: "Username cannot be undefined" });
	if(settings == undefined)
		return res.status(400).json({ error: "Settings cannot be undefined" });

	Users.update(
		{ settings: JSON.stringify(settings) },
		{ where: { username: username } }
	).then(() => {
		return res.status(200).json({ success: "User settings updated." })
	}).catch(err => {
		return res.status(400).json({ error: err })
	})
});

module.exports = router;
