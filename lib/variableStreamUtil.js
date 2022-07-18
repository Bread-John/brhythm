module.exports = {
    parseRange: function (range, fileSize) {
        let [, start, end] = range.match(/(\d*)-(\d*)/);
        start = start ? parseInt(start) : 0;
        end = end ? parseInt(end) : fileSize - 1;

        return [start, end];
    },
    validateRange: function (start, end, fileSize) {
        return (start < fileSize && end < fileSize);
    },
    extToMIME: function (extension) {
        const mimeDict = {
            '.m3u8': 'application/vnd.apple.mpegurl',
            '.mp4': 'audio/mp4',
            '.ts': 'video/mp2t'
        };

        if (mimeDict[extension.toLowerCase()]) {
            return mimeDict[extension.toLowerCase()];
        } else {
            return 'application/octet-stream';
        }
    }
};
