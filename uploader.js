/*
* Module: uploader.js
* Automatically upload audio files in batches without using any user interface
*
* DISCLAIMER: PLEASE MAKE USE OF FRONT-END CHANNEL TO UPLOAD CONTENTS IF POSSIBLE, AS THIS SCRIPT CANNOT HANDLE NETWORK-RELATED ERRORS PROPERLY!
*
* Instructions:
* 1. Provide a valid path to the target directory with audio files (see Line 25)
* 2. Provide a visibility parameter to limit the audience of these audio files (see Line 28)
* 3. Run this script by invoking "node ./uploader.js" and wait for completion messages
* 4. Enjoy music!
*
* Program Procedure:
* 1. Extract the metadata from embedded tags
* 2. Transcode the file into streaming container and apply encryption
* 3. Insert metadata into the database
* 4. Upload original and converted files to the cloud
* 5. Go Back To Step 1 if there are more files
*
* Note: Since this module is only for internal use, no file type or size validation will be conducted,
*       thus please make sure all files in the provided directory are valid audio files
* */

// ACTION REQUIRED: Define directory path here
const FILEPATH = 'D:/Folder';

// ACTION REQUIRED: Define whether uploaded media will be accessible by public users
const PUBLIC_VISIBLE = false;


/* ---- DO NOT modify anything below this line ---- */
const fs = require('fs');
const path = require('path');
const msal = require('@azure/msal-node');
require('dotenv').config();

const { getItemByPath, uploadFileToParent } = require('./lib/msgraph/File');
const id3tagParser = require('./util/id3tagParser');
const { generateKeyFiles } = require('./util/encryptor');
const { analyseMedia, convertToHlsLossy } = require('./util/ffmpeg');
const { getCoverArt, getAlbumDesc } = require('./util/musicMetadata');

const { syncModels, newTransaction } = require('./dao/main');
const { Artist, Album, Song } = require('./dao/config').models;

const msalConfig = {
    auth: {
        clientId: process.env.CLIENT_ID,
        authority: `https://login.microsoftonline.com/${process.env.TENANT_ID}`,
        clientSecret: process.env.CLIENT_SECRET
    },
    system: {
        loggerOptions: {
            loggerCallback(level, message, containsPii) {
                if (!containsPii) {
                    switch (level) {
                        case msal.LogLevel.Error:
                            console.error(message);
                            break;
                        case msal.LogLevel.Info:
                            console.info(message);
                            break;
                        case msal.LogLevel.Verbose:
                            console.debug(message);
                            break;
                        case msal.LogLevel.Warning:
                            console.warn(message);
                            break;
                    }
                }
            },
            piiLoggingEnabled: false
        }
    }
};

(() => {
    syncModels(false)
        .then(function () {
            console.log(`STATUS: Data Access Models successfully synced`);

            const msalClient = new msal.ConfidentialClientApplication(msalConfig);

            fs.readdir(FILEPATH, async (err, files) => {
                if (err) throw err;

                for (let i = 0; i < files.length; i++) {
                    if (await upload(files[i], msalClient)) {
                        console.log(`STATUS: ${i + 1} out of ${files.length} files have been successfully processed`);
                        console.log(`============================================================`);
                    }

                    if (i === files.length - 1) {
                        console.log(`COMPLETED: All files have been successfully processed`);
                        process.exit(0);
                    }
                }
            });
        })
        .catch(function (err) {
            console.error(`ERROR: DAO ${err.name}: ${err.message}`);
            process.exit(1);
        });
})();

const upload = async (file, msalClient) => {
    return new Promise((resolve, reject) => {
        const fileIdentifier = `${Date.now()}${Math.round(Math.random() * 1E5)}`;
        const _file = `${fileIdentifier}${path.extname(file)}`;
        fs.rename(`${FILEPATH}/${file}`, `${FILEPATH}/${_file}`, async err => {
            if (err) throw err;

            console.log(`STATUS: Processing file "${file}"`);
            const t = await newTransaction();
            try {
                console.log(`\t... Parsing metadata of file "${file}"`);
                const { duration } = await analyseMedia(`${FILEPATH}/${_file}`);
                const {
                    title,
                    artist,
                    album,
                    albumArtist,
                    genre,
                    trackNo,
                    totalTrackNo,
                    discNo,
                    totalDiscNo,
                    composer,
                    releaseYear
                } = await id3tagParser(`${FILEPATH}/${_file}`);

                console.log(`\t... Updating database entries`);
                const [_artist, ] = await Artist.findOrCreate({
                    where: { name: artist || 'Unnamed Artist' },
                    transaction: t
                });

                async function createAlbumArtist() {
                    if (albumArtist && albumArtist !== artist) {
                        return await Artist.findOrCreate({
                            where: { name: albumArtist },
                            transaction: t
                        });
                    } else {
                        return [_artist, false];
                    }
                }
                const [_albumArtist, ] = await createAlbumArtist();

                const description = await getAlbumDesc(album, albumArtist ? albumArtist : artist);
                const coverImg = await getCoverArt(album, albumArtist ? albumArtist : artist);
                const [_album, ] = await Album.findOrCreate({
                    where: {
                        title: album || 'Untitled',
                        artistId: _albumArtist.id
                    },
                    defaults: {
                        genre,
                        releaseYear,
                        releaseDate: null,
                        totalTrackNo,
                        totalDiscNo,
                        description,
                        coverImg
                    },
                    transaction: t
                });

                const [_song, ] = await Song.findOrCreate({
                    where: {
                        title: title || 'Untitled',
                        albumId: _album.id,
                        artistId: _artist.id,
                        ownerId: process.env.ADMIN_ACCOUNT_ID
                    },
                    defaults: {
                        composer,
                        trackNo,
                        discNo,
                        duration,
                        fileName: file,
                        fileIdentifier,
                        visibility: PUBLIC_VISIBLE ? 0 : 1
                    },
                    transaction: t
                });

                // Generate an encryption key info file as per ffmpeg requirements
                const { key, keyInfo } = await generateKeyFiles(FILEPATH, fileIdentifier);

                // Transcode the media item into HLS container, and upload to cloud
                console.log(`\t... Transcoding file "${file}"`);
                const outputFiles = await convertToHlsLossy(FILEPATH, fileIdentifier, _file, keyInfo);
                console.log(`\t... Uploading original and processed files`);
                for (const file of outputFiles) {
                    const { id: streamFolderId } = await getItemByPath(msalClient, 'stream');
                    await uploadFileToParent(msalClient, file, streamFolderId);
                }

                // Upload the encryption key to cloud
                const { id: keyFolderId } = await getItemByPath(msalClient, 'key');
                await uploadFileToParent(msalClient, key, keyFolderId);

                // Upload the source file to cloud as backup
                const { id: sourceFolderId } = await getItemByPath(msalClient, 'source');
                await uploadFileToParent(msalClient, `${FILEPATH}/${_file}`, sourceFolderId);

                await t.commit();

                console.log(`STATUS: Successfully processed file "${file}"`);
                resolve(true);
            } catch (error) {
                await t.rollback();

                reject(error);
            }
        });
    });
};
