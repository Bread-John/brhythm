const ffmpeg = require('fluent-ffmpeg');
const ffmpegPackage = require('@ffmpeg-installer/ffmpeg');

ffmpeg.setFfmpegPath(ffmpegPackage.path);

const ffmpegCmd = ffmpeg();

module.exports = {
    convertToHls: function (streamIn, destPath) {
        return new Promise(function (resolve, reject) {
            ffmpegCmd
                .input(streamIn)
                .format('hls')
                .audioCodec('libfdk_aac')
                .audioBitrate('192k')
                .outputOptions([
                    '-hls_list_size 0',
                    '-hls_time 5'
                ])
                .output(destPath)
                .on('end', () => resolve(destPath))
                .on('error', error => reject(error))
                .run();
        });
    }
};