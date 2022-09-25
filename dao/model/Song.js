const { DataTypes } = require('sequelize');

module.exports = function (sequelize) {
    sequelize.define('Song', {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'Untitled'
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
        duration: {
            type: DataTypes.DOUBLE,
            allowNull: false
        },
        fileName: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        fileIdentifier: {
            type: DataTypes.TEXT,
            allowNull: false,
            unique: true
        },
        extIdentifier: {
            type: DataTypes.STRING,
            unique: true
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
        },
        ownerId: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }, {
        tableName: 'b_song',
        indexes: [{
            name: 'index_b_song_trigram',
            fields: [sequelize.literal('title gin_trgm_ops')],
            using: 'GIN',
            concurrently: true
        }]
    });
};
