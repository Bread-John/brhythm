const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
const ffmpeg = require('fluent-ffmpeg');

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

module.exports = {
    analyseMedia: function (filePath) {
        return new Promise(function (resolve, reject) {
            ffmpeg.ffprobe(filePath, function(err, metadata) {
                if (err) {
                    reject(err);
                } else {
                    resolve(metadata['format']);
                }
            });
        });
    },
    convertToHlsLossy: function (filePath, fileIdentifier, sourceFileName, keyFileName) {
        return new Promise(function (resolve, reject) {
            const ffmpegCmd = ffmpeg();
            ffmpegCmd
                .input(`${filePath}/${sourceFileName}`)
                .noVideo()
                .format('hls')
                .audioCodec('aac')
                .audioBitrate('256k')
                .outputOptions([
                    '-hls_time 10',
                    '-start_number 1',
                    `-hls_segment_filename ${filePath}/brhythm_${fileIdentifier}_hq_aac_stream.ts`,
                    `-hls_key_info_file ${filePath}/${keyFileName}`,
                    '-hls_segment_type mpegts',
                    '-hls_flags single_file+independent_segments',
                    '-hls_playlist_type vod'
                ])
                .output(`${filePath}/brhythm_${fileIdentifier}_hq_aac_index.m3u8`)
                .on('end', function () {
                    const fileArray = [
                        `${filePath}/brhythm_${fileIdentifier}_hq_aac_index.m3u8`,
                        `${filePath}/brhythm_${fileIdentifier}_hq_aac_stream.ts`
                    ];
                    resolve(fileArray);
                })
                .on('error', function (err) { reject(err); })
                .run();
        });
    },
    convertToHlsLossless: function (filePath, fileIdentifier, sourceFileName, keyFileName) {
        return new Promise(function (resolve, reject) {
            const ffmpegCmd = ffmpeg();
            ffmpegCmd
                .input(`${filePath}/${sourceFileName}`)
                .noVideo()
                .format('hls')
                .audioCodec('flac')
                .outputOptions([
                    '-hls_time 10',
                    '-start_number 1',
                    `-hls_segment_filename ${filePath}/brhythm_${fileIdentifier}_hq_aac_stream.mp4`,
                    `-hls_key_info_file ${filePath}/${keyFileName}`,
                    '-hls_segment_type fmp4',
                    '-hls_flags single_file+independent_segments',
                    '-hls_playlist_type vod'
                ])
                .output(`${filePath}/brhythm_${fileIdentifier}_hq_aac_index.m3u8`)
                .on('end', function () {
                    const fileArray = [
                        `${filePath}/brhythm_${fileIdentifier}_hq_aac_index.m3u8`,
                        `${filePath}/brhythm_${fileIdentifier}_hq_aac_stream.mp4`
                    ];
                    resolve(fileArray);
                })
                .on('error', function (err) { reject(err); })
                .run();
        });
    }
};
