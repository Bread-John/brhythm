module.exports = function (sequelize) {
    const {
        User,
        Song,
        Artist,
        Album,
        Playlist
    } = sequelize.models;

    // Relationship A (1:n)
    // User -||------------O<- Song
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

    // Relationship D (1:n)
    // Artist -||------------|<- Album
    Artist.hasMany(Album, {
        foreignKey: {
            name: 'artistId',
            allowNull: false
        }
    });
    Album.belongsTo(Artist, {
        foreignKey: {
            name: 'artistId',
            allowNull: false
        }
    });

    // Relationship E (1:n)
    // Artist -||------------|<- Song
    Artist.hasMany(Song, {
        foreignKey: {
            name: 'artistId',
            allowNull: false
        }
    });
    Song.belongsTo(Artist, {
        foreignKey: {
            name: 'artistId',
            allowNull: false
        }
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
