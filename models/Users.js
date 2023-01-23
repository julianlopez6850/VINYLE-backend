module.exports = (sequelize, DataTypes) => {

	const Users = sequelize.define('Users', {
		username: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		password: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		settings: {
			type: DataTypes.JSON,
			allowNull: false,
		}
	});
/*
	Users.associate = (models) => {
		Users.hasMany(models.GamesPlayed, {
			onDelete: "cascade",
		});
	};*/

	return Users;
};