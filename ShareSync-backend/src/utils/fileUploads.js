// backend/src/utils/fileUpload.js
const path = require('path');
const fs = require('fs');

module.exports = {
    ensureUploadDir: () => {
        if (!fs.existsSync('./uploads')) {
            fs.mkdirSync('./uploads');
        }
    }
};