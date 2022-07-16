module.exports = function (sequelize) {
    const {
        User,
        Song,
        Artist,
        Album,
        Playlist
    } = sequelize.models;

    // Relationship A (1:n)
    // User -||------------O>- Song
    User.hasMany(Song, {
        foreignKey: 'ownerId'
    });
    Song.belongsTo(User, {
        foreignKey: 'ownerId'
    });

    // Relationship B (1:n)
    // User -||------------O<- Playlist
    User.hasMany(Playlist, {
        foreignKey: 'creatorId'
    });
    Playlist.belongsTo(User, {
        foreignKey: 'creatorId'
    });

    // Relationship C (1:n)
    // Album -||------------|<- Song
    Album.hasMany(Song, {
        foreignKey: 'albumId'
    });
    Song.belongsTo(Album, {
        foreignKey: 'albumId'
    });

    // Relationship D (m:n)
    // Artist ->|------------|<- Album
    Artist.belongsToMany(Album, {
        through: 'AlbumArtist',
        foreignKey: 'artistId',
        otherKey: 'albumId'
    });
    Album.belongsToMany(Artist, {
        through: 'AlbumArtist',
        foreignKey: 'albumId',
        otherKey: 'artistId'
    });

    // Relationship E (m:n)
    // Artist ->|------------|<- Song
    Artist.belongsToMany(Song, {
        through: 'SongArtist',
        foreignKey: 'artistId',
        otherKey: 'songId'
    });
    Song.belongsToMany(Artist, {
        through: 'SongArtist',
        foreignKey: 'songId',
        otherKey: 'artistId'
    });

    // Relationship F (m:n)
    // Playlist ->O------------O<- Song
    Playlist.belongsToMany(Song, {
        through: 'PlaylistSong',
        foreignKey: 'playlistId',
        otherKey: 'songId'
    });
    Song.belongsToMany(Playlist, {
        through: 'PlaylistSong',
        foreignKey: 'songId',
        otherKey: 'playlistId'
    });
};
