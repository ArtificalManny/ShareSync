// backend/src/routes/uploads.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage }).single('file');

if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}

router.post('/', (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            res.status(500).json({ error: 'File upload failed' });
            return;
        }
        res.json(`http://localhost:3000/uploads/${req.file.filename}`);
    });
});

module.exports = router;