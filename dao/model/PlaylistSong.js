module.exports = function (sequelize) {
    sequelize.define('PlaylistSong', {}, {
        tableName: 'b_playlist_song'
    });
};
