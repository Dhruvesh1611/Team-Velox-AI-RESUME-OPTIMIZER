import { v2 as cloudinary } from "cloudinary";

type CloudinaryUploadResult = {
  secure_url?: string;
};

let isConfigured = false;

export function isCloudinaryConfigured(): boolean {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  return Boolean(cloudName && apiKey && apiSecret);
}

function configureCloudinary() {
  if (isConfigured) {
    return;
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Missing Cloudinary environment variables.");
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  isConfigured = true;
}

/** Uploads when Cloudinary env is set; returns null otherwise (pipeline still runs). */
export async function uploadResumeFileSafe(file: string): Promise<string | null> {
  if (!file.trim()) {
    return null;
  }

  if (!isCloudinaryConfigured()) {
    return null;
  }

  try {
    configureCloudinary();

    const result = (await cloudinary.uploader.upload(file, {
      folder: process.env.CLOUDINARY_UPLOAD_FOLDER ?? "resume-optimizer",
      resource_type: "auto",
    })) as CloudinaryUploadResult;

    if (!result.secure_url) {
      return null;
    }

    return result.secure_url;
  } catch {
    return null;
  }
}
