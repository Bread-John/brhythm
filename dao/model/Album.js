const { DataTypes } = require('sequelize');

module.exports = function (sequelize) {
    sequelize.define('Album', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'Untitled'
        },
        genre: {
            type: DataTypes.STRING
        },
        releaseYear: {
            type: DataTypes.STRING(4)
        },
        releaseDate: {
            type: DataTypes.DATE
        },
        totalTrackNo: {
            type: DataTypes.INTEGER
        },
        totalDiscNo: {
            type: DataTypes.INTEGER
        },
        publisher: {
            type: DataTypes.STRING
        },
        description: {
            type: DataTypes.TEXT
        },
        coverImg: {
            type: DataTypes.TEXT
        }
    }, {
        tableName: 'b_album'
    });
};
