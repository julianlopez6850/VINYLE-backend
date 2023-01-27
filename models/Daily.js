module.exports = (sequelize, DataTypes) => {

	const Daily = sequelize.define('Daily', {
		date: {
			type: DataTypes.DATE,
			allowNull: false,
		},
		albumID: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		albumName: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		numPlayed: {
			type: DataTypes.NUMERIC,
			allowNull: false,
		},
		numWins: {
			type: DataTypes.NUMERIC,
			allowNull: false,
		},
		num1Guess: {
			type: DataTypes.NUMERIC,
			allowNull: false,
		},
		num2Guess: {
			type: DataTypes.NUMERIC,
			allowNull: false,
		},
		num3Guess: {
			type: DataTypes.NUMERIC,
			allowNull: false,
		},
		num4Guess: {
			type: DataTypes.NUMERIC,
			allowNull: false,
		},
		num5Guess: {
			type: DataTypes.NUMERIC,
			allowNull: false,
		},
		num6Guess: {
			type: DataTypes.NUMERIC,
			allowNull: false,
		},
		numLosses: {
			type: DataTypes.NUMERIC,
			allowNull: false,
		},
		winPercent: {
			type: DataTypes.NUMERIC,
			allowNull: false,
		},
	})

	return Daily;
};