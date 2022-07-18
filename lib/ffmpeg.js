const ffmpeg = require('fluent-ffmpeg');

// Note: These 2 lines below are required for running on Windows systems
// Set the corresponding entry to the absolute path to the ffmpeg & ffprobe executable files
ffmpeg.setFfmpegPath('D:/Program\ Files/ffmpeg/bin/ffmpeg.exe');
ffmpeg.setFfprobePath('D:/Program\ Files/ffmpeg/bin/ffprobe.exe');

module.exports = {
    convertToHlsLossy: function (filePath, fileName) {
        return new Promise(function (resolve, reject) {
            const ffmpegCmd = ffmpeg();
            ffmpegCmd
                .input(`${filePath}/${fileName}`)
                .format('hls')
                .noVideo()
                .audioCodec('libfdk_aac')
                .audioBitrate('160k')
                .outputOptions([
                    '-hls_time 10',
                    '-hls_segment_type fmp4',
                    `-hls_fmp4_init_filename ${filePath}/brhythm_adts_header.mp4`,
                    '-hls_flags independent_segments',
                    '-hls_playlist_type vod',
                    `-hls_segment_filename ${filePath}/brhythm_adts_segment_%04d.mp4`
                ])
                .output(`${filePath}/brhythm_index.m3u8`)
                .on('end', function () { resolve(); })
                .on('error', function (err) { reject(err); })
                .run();
        });
    }
};
