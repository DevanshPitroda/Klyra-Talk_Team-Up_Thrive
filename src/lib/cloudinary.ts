import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

const isCloudinaryConfigured =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_CLOUD_NAME !== 'your-cloudinary-cloud-name' &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_KEY !== 'your-cloudinary-api-key' &&
  process.env.CLOUDINARY_API_SECRET &&
  process.env.CLOUDINARY_API_SECRET !== 'your-cloudinary-api-secret';

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('☁️ [Upload Service] Cloudinary is configured and active.');
} else {
  console.log('💾 [Upload Service] Cloudinary credentials missing. Using local filesystem storage fallback.');
}

interface IUploadResult {
  url: string;
  publicId?: string;
}

export async function uploadFile(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<IUploadResult> {
  if (isCloudinaryConfigured) {
    // 1. Upload to Cloudinary via buffer stream
    return new Promise((resolve, reject) => {
      let resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto';
      
      if (mimeType.startsWith('image/')) {
        resourceType = 'image';
      } else if (mimeType.startsWith('video/')) {
        resourceType = 'video';
      } else if (mimeType === 'application/pdf') {
        resourceType = 'auto';
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'chatapp',
          resource_type: resourceType,
          public_id: path.parse(filename).name.replace(/[^a-zA-Z0-9_]/g, '_') + '_' + Date.now(),
        },
        (error, result) => {
          if (error) {
            console.error('[Cloudinary Upload Error]:', error);
            reject(error);
          } else if (result) {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
            });
          } else {
            reject(new Error('Empty upload result from Cloudinary'));
          }
        }
      );

      uploadStream.end(buffer);
    });
  } else {
    // 2. Fallback: Save file to local public/uploads directory
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    
    // Ensure upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const uniqueFilename = `${Date.now()}_${filename.replace(/[^a-zA-Z0-9_.-]/g, '_')}`;
    const filePath = path.join(uploadDir, uniqueFilename);

    await fs.promises.writeFile(filePath, buffer);

    const fileUrl = `/api/files/${uniqueFilename}`;
    console.log(`💾 [Upload Service] File saved locally to ${filePath} -> Served at ${fileUrl}`);

    return {
      url: fileUrl,
    };
  }
}
