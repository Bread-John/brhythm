const { DataTypes } = require('sequelize');

module.exports = function (sequelize) {
    sequelize.define('Song', {
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
        lyricist: {
            type: DataTypes.STRING
        },
        composer: {
            type: DataTypes.STRING
        },
        trackNo: {
            type: DataTypes.INTEGER
        },
        discNo: {
            type: DataTypes.INTEGER
        },
        isExplicit: {
            type: DataTypes.BOOLEAN
        },
        playCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        fileName: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        fileLocation: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        allowDownload: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        visibility: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        }
    }, {
        tableName: 'b_song'
    });
};
