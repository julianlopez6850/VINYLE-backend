module.exports = (sequelize, DataTypes) => {

	const Albums = sequelize.define('Albums', {
		albumID: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		albumName: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		albumArt: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		guess1Art: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		guess2Art: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		guess3Art: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		guess4Art: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		guess5Art: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		guess6Art: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		artists: {
			type: DataTypes.JSON,
			allowNull: false,
		},
		releaseYear: {
			type: DataTypes.NUMERIC,
			allowNull: false,
		},
		genres: {
			type: DataTypes.JSON,
			allowNull: true,
		},
	})

	return Albums;
};