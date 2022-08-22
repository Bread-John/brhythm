const { parseFile, selectCover } = require('music-metadata');

function joinWithSlash(items) {
    return items ? items.join('/') : null;
}

module.exports = function (fileLocation) {
    return new Promise(function (resolve, reject) {
        parseFile(fileLocation)
            .then(function(metadata) {
                const { title, artists, album, albumartist, genre, track, disk, composer, year, picture } = metadata.common;
                const { no: trackNo, of: totalTrackNo } = track;
                const { no: discNo, of: totalDiscNo } = disk;
                resolve({
                    title,
                    artist: joinWithSlash(artists),
                    album,
                    albumArtist: albumartist,
                    genre: joinWithSlash(genre),
                    trackNo,
                    totalTrackNo,
                    discNo,
                    totalDiscNo,
                    composer: joinWithSlash(composer),
                    releaseYear: year,
                    coverImg: selectCover(picture)
                });
            })
            .catch(function (error) {
                reject(error);
            });
    });
};
