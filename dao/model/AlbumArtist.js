module.exports = function (sequelize) {
    sequelize.define('AlbumArtist', {}, {
        tableName: 'b_album_artist',
        timestamps: false
    });
};
