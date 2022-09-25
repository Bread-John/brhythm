const { DataTypes } = require('sequelize');

module.exports = function (sequelize) {
    sequelize.define('Playlist', {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT
        },
        itemCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
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
        tableName: 'b_playlist',
        indexes: [{
            name: 'index_b_playlist_trigram',
            fields: [sequelize.literal('name gin_trgm_ops')],
            using: 'GIN',
            concurrently: true
        }]
    });
};
