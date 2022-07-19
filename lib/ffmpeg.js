const ffmpeg = require('fluent-ffmpeg');

// Note: These 2 lines below are required for running on Windows systems
// Set the corresponding entry to the absolute path to the ffmpeg & ffprobe executable files
ffmpeg.setFfmpegPath('D:/Program\ Files/ffmpeg/bin/ffmpeg.exe');
ffmpeg.setFfprobePath('D:/Program\ Files/ffmpeg/bin/ffprobe.exe');

module.exports = {
    convertToHlsLossy: function (fileIdentifier, fileName) {
        return new Promise(function (resolve, reject) {
            const ffmpegCmd = ffmpeg();
            ffmpegCmd
                .input(`${process.env.TEMP_FILES_PATH}/${fileName}`)
                .noVideo()
                .format('hls')
                .audioCodec('libfdk_aac')
                .audioBitrate('256k')
                .outputOptions([
                    '-hls_time 10',
                    '-start_number 1',
                    `-hls_segment_filename ${process.env.TEMP_FILES_PATH}/brhythm_${fileIdentifier}_hq_aac_stream.mp4`,
                    '-hls_segment_type fmp4',
                    '-hls_flags single_file+independent_segments',
                    '-hls_playlist_type vod'
                ])
                .output(`${process.env.TEMP_FILES_PATH}/brhythm_${fileIdentifier}_hq_aac_index.m3u8`)
                .on('end', function () {
                    const fileArray = [
                        `${process.env.TEMP_FILES_PATH}/brhythm_${fileIdentifier}_hq_aac_index.m3u8`,
                        `${process.env.TEMP_FILES_PATH}/brhythm_${fileIdentifier}_hq_aac_stream.mp4`
                    ];
                    resolve(fileArray);
                })
                .on('error', function (err) { reject(err); })
                .run();
        });
    }
};
