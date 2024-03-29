module.exports = (sequelize, DataTypes) => {

	const Games = sequelize.define('Games', {
		username: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		mode: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		date: {
			type: DataTypes.DATE,
			allowNull: false,
		},
		albumID: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		win: {
			type: DataTypes.TINYINT,
			allowNull: false,
		},
		numGuesses: {
			type: DataTypes.NUMERIC,
			allowNull: false,
		},
		guesses: {
			type: DataTypes.TEXT('long'),
			allowNull: false,
		},
	})

	return Games;
};