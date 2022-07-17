const { DataTypes } = require('sequelize');

module.exports = function (sequelize) {
    sequelize.define('Playlist', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'Playlist'
        },
        description: {
            type: DataTypes.TEXT
        },
        popularity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        coverImg: {
            type: DataTypes.TEXT
        },
        visibility: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        }
    }, {
        tableName: 'b_playlist'
    });
};
