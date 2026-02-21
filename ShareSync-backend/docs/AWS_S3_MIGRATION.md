cat > docs/AWS_S3_MIGRATION.md << 'EOF'
# AWS S3 Migration Guide

When you're ready to move to production with AWS S3, follow these steps:

## 1. Install AWS SDK
```bash
npm install aws-sdk multer-s3
```

## 2. Set up AWS S3 Bucket

1. Go to AWS Console → S3
2. Create new bucket (e.g., `sharesync-uploads`)
3. Set permissions (public read for avatars)
4. Get Access Key ID and Secret Access Key

## 3. Update Environment Variables

Add to `.env`:
```
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=sharesync-uploads
```

## 4. Create S3 Upload Middleware

Create `middleware/s3Upload.js`:
```javascript
const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');

aws.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new aws.S3();

const uploadAvatar = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET,
    acl: 'public-read',
    key: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, `avatars/avatar-${req.user.id}-${uniqueSuffix}.${file.mimetype.split('/')[1]}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFilter,
});

module.exports = { uploadAvatar };
```

## 5. Update Controllers

Change `getFileUrl()` to return S3 URL:
```javascript
function getFileUrl(filename, type) {
  return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${type}/${filename}`;
}
```

## 6. Migrate Existing Files (Optional)

Script to upload existing local files to S3:
```javascript
const fs = require('fs');
const path = require('path');

async function migrateToS3() {
  const uploadDir = 'uploads/avatars';
  const files = fs.readdirSync(uploadDir);
  
  for (const file of files) {
    const filePath = path.join(uploadDir, file);
    const fileContent = fs.readFileSync(filePath);
    
    await s3.putObject({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: `avatars/${file}`,
      Body: fileContent,
      ACL: 'public-read',
    }).promise();
    
    console.log(`Migrated: ${file}`);
  }
}
```

## 7. Switch Upload Method

In `middleware/upload.js`, add environment check:
```javascript
const USE_S3 = process.env.USE_S3 === 'true';

const uploadAvatar = USE_S3 
  ? require('./s3Upload').uploadAvatar
  : multer({ storage: avatarStorage, ... });
```

## 8. Update URLs in Database

Run migration to update existing user avatar URLs from local to S3.

## Cost Estimate

- S3 Storage: ~$0.023 per GB/month
- S3 Requests: ~$0.005 per 1,000 requests
- Data Transfer: Free first 1GB, then ~$0.09 per GB

For 1,000 users with 1MB avatars = ~$0.05/month
EOF

mkdir -p docs
echo "✅ AWS S3 migration guide created!"