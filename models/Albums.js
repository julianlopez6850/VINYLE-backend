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
		artists: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		artistsString: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		releaseYear: {
			type: DataTypes.NUMERIC,
			allowNull: false,
		},
	})

	return Albums;
};