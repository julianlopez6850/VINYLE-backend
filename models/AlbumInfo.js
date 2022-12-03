module.exports = (sequelize, DataTypes) => {

	const AlbumInfo = sequelize.define('AlbumInfo', {
		albumID: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		albumName: {
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

	return AlbumInfo;
};