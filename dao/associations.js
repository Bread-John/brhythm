module.exports = function (sequelize) {
    const {
        User,
        Song,
        Artist,
        Album,
        Playlist
    } = sequelize.models;

    User.hasMany(Song, {
        foreignKey: {
            name: 'ownerId',
            allowNull: true
        }
    });
    Song.belongsTo(User, {
        foreignKey: {
            name: 'ownerId',
            allowNull: false
        }
    });

    User.hasMany(Playlist, {
        foreignKey: {
            name: 'creatorId',
            allowNull: true
        }
    });
    Playlist.belongsTo(User, {
        foreignKey: {
            name: 'creatorId',
            allowNull: false
        }
    });

    Album.hasMany(Song, {
        foreignKey: {
            name: 'albumId',
            allowNull: false
        }
    });
    Song.belongsTo(Album, {
        foreignKey: {
            name: 'albumId',
            allowNull: false
        }
    });

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
