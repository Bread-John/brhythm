const { DataTypes } = require('sequelize');

module.exports = function (sequelize) {
    sequelize.define('Album', {
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
        description: {
            type: DataTypes.TEXT
        },
        coverImg: {
            type: DataTypes.TEXT
        }
    }, {
        tableName: 'b_album',
        indexes: [{
            unique: true,
            fields: ['title', 'artistId']
        }, {
            name: 'index_b_album_trigram',
            fields: [sequelize.literal('title gin_trgm_ops')],
            using: 'GIN',
            concurrently: true
        }]
    });
};
