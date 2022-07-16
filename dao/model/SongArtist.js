module.exports = function (sequelize) {
    sequelize.define('SongArtist', {}, {
        tableName: 'b_song_artist',
        timestamps: false
    });
};
