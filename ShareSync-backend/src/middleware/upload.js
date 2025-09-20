const multer = require('multer');

const IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  if (!IMAGE_TYPES.has(file.mimetype)) {
    return cb(new Error('Invalid file type. Please upload an image.'));
  }
  cb(null, true);
}

const limits = {
  fileSize: 8 * 1024 * 1024, // 8MB
};

exports.uploadAvatar = multer({ storage, fileFilter, limits });
