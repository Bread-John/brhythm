require('isomorphic-fetch');

module.exports = {
    getCoverArt: function (album, artist) {
        return new Promise(function (resolve) {
            if (album && artist) {
                fetch(`http://ws.audioscrobbler.com/2.0/?method=album.getinfo&api_key=${process.env.LASTFM_API_KEY}&artist=${artist}&album=${album}&format=json`)
                    .then(function (response) {
                        return response.json();
                    })
                    .then(function (jsonResponse) {
                        const { album: { image } = {} } = jsonResponse;
                        if (image) {
                            resolve(image.at(-1)['#text']);
                        } else {
                            resolve(null);
                        }
                    })
                    .catch(function (error) {
                        console.error(
                            `[${new Date(Date.now()).toUTCString()}] - LastFM API Error: ${error.message}`
                        );
                        resolve(null);
                    });
            } else {
                resolve(null);
            }
        });
    },
    getAlbumDesc: function (album, artist) {
        return new Promise(function (resolve) {
            if (album && artist) {
                fetch(`http://ws.audioscrobbler.com/2.0/?method=album.getinfo&api_key=${process.env.LASTFM_API_KEY}&artist=${artist}&album=${album}&format=json`)
                    .then(function (response) {
                        return response.json();
                    })
                    .then(function (jsonResponse) {
                        const { album: { wiki } = {} } = jsonResponse;
                        if (wiki) {
                            resolve(wiki['summary']);
                        } else {
                            resolve(null);
                        }
                    })
                    .catch(function (error) {
                        console.error(
                            `[${new Date(Date.now()).toUTCString()}] - LastFM API Error: ${error.message}`
                        );
                        resolve(null);
                    });
            } else {
                resolve(null);
            }
        });
    },
    getArtistAvatar: function (artist) {
        return new Promise(function (resolve) {
            if (artist) {
                fetch(`http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&api_key=${process.env.LASTFM_API_KEY}&artist=${artist}&format=json`)
                    .then(function (response) {
                        return response.json();
                    })
                    .then(function (jsonResponse) {
                        const { artist: { image } = {} } = jsonResponse;
                        if (image) {
                            resolve(image.at(-1)['#text']);
                        } else {
                            resolve(null);
                        }
                    })
                    .catch(function (error) {
                        console.error(
                            `[${new Date(Date.now()).toUTCString()}] - LastFM API Error: ${error.message}`
                        );
                        resolve(null);
                    });
            } else {
                resolve(null);
            }
        });
    },
    getArtistIntro: function (artist) {
        return new Promise(function (resolve) {
            if (artist) {
                fetch(`http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&api_key=${process.env.LASTFM_API_KEY}&artist=${artist}&format=json`)
                    .then(function (response) {
                        return response.json();
                    })
                    .then(function (jsonResponse) {
                        const { artist: { bio } = {} } = jsonResponse;
                        if (bio) {
                            resolve(bio['summary']);
                        } else {
                            resolve(null);
                        }
                    })
                    .catch(function (error) {
                        console.error(
                            `[${new Date(Date.now()).toUTCString()}] - LastFM API Error: ${error.message}`
                        );
                        resolve(null);
                    });
            } else {
                resolve(null);
            }
        });
    }
};
