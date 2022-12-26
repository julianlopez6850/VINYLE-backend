const express = require('express');
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");

app.use(express.json());
app.use(cors({
	credentials: true,
	origin: ["http://localhost:3000", "http://localhost:3001"]
}));
app.use(cookieParser());


const db = require('./models');

//Routers
const usersRouter = require("./routes/Users");
app.use("/auth", usersRouter);
const albumsRouter = require("./routes/Albums");
app.use("/albums", albumsRouter);
const gamesRouter = require("./routes/Games");
app.use("/games", gamesRouter);
const dailyGamesRouter = require("./routes/Daily");
app.use("/daily", dailyGamesRouter);

db.sequelize.sync().then(() => {
	app.listen(5000, () => {
		console.log("Server running on port 5000");
	})
})

