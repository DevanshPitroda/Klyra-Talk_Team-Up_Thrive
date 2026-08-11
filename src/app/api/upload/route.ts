import { NextResponse } from 'next/server';
import { auth } from '../../../lib/auth';
import { uploadFile } from '../../../lib/cloudinary';

export async function POST(req: Request) {
  // 1. Authorize session
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized session' } },
      { status: 401 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'No file uploaded' } },
        { status: 422 }
      );
    }

    // Limit file size to 15MB for development safety
    const MAX_SIZE = 15 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'File exceeds maximum size limits (15MB)' } },
        { status: 422 }
      );
    }

    const filename = file.name;
    const size = file.size;
    const mimeType = file.type;

    // Convert file to buffer for upload helper
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Call storage helper
    const uploadResult = await uploadFile(buffer, filename, mimeType);

    return NextResponse.json({
      success: true,
      data: {
        url: uploadResult.url,
        filename,
        size,
        mimeType,
      },
    });
  } catch (error: any) {
    console.error('File upload route error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to upload file' } },
      { status: 500 }
    );
  }
}
