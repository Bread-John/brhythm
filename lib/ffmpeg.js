const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath('D:/Program\ Files/ffmpeg/bin/ffmpeg.exe');
ffmpeg.setFfprobePath('D:/Program\ Files/ffmpeg/bin/ffprobe.exe');
const ffmpegCmd = ffmpeg();

module.exports = {
    convertLossyToHls: function (streamIn, destPath) {
        return new Promise(function (resolve, reject) {
            ffmpegCmd
                .input(streamIn)
                .format('hls')
                .audioCodec('aac')
                .audioBitrate('256k')
                .outputOptions([
                    '-hls_time 5',
                    '-hls_list_size 0',
                    `-hls_segment_filename ${destPath}/brhythm_hls_segment_%04d.ts`
                ])
                .output(`${destPath}/brhythm_index.m3u8`)
                .on('end', () => resolve())
                .on('error', error => reject(error))
                .run();
        });
    }
};
