import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dn6epq8zx",
  api_key: process.env.CLOUDINARY_API_KEY || "621226999226439",
  api_secret:
    process.env.CLOUDINARY_API_SECRET || "7QeVn0nA50QsUa3kdzOt7MTbboo",
});

// Define CloudinaryUploadResult interface
interface CloudinaryUploadResult {
  url: string;
  public_id: string;
  resource_type: string;
  format: string;
  original_filename: string;
}

// Resource type
type ResourceType = "image" | "video" | "raw" | "auto";

// Function to determine resource type based on file extension
const getResourceType = (filePath: string): ResourceType => {
  const ext = path.extname(filePath).toLowerCase();
  const imageExts = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
  const videoExts = [".mp4", ".mov", ".avi", ".webm"];
  const documentExts = [
    ".pdf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".csv",
    ".txt",
  ];

  if (imageExts.includes(ext)) return "image";
  if (videoExts.includes(ext)) return "video";
  if (documentExts.includes(ext)) return "raw";
  return "auto";
};

// Function to upload file to Cloudinary
const uploadToCloudinary = async (
  filePath: string,
  folderName: string
): Promise<CloudinaryUploadResult> => {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error("File does not exist: " + filePath);
    }

    // Get resource type
    const resourceType = getResourceType(filePath);

    // Configure upload options
    const uploadOptions = {
      folder: folderName,
      resource_type: resourceType,
      use_filename: true,
      unique_filename: true,
    };

    console.log(`Uploading file: ${filePath}`);
    console.log(`Resource type: ${resourceType}`);
    console.log(`Upload options:`, uploadOptions);

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(filePath, uploadOptions);

    console.log(`Upload successful. URL: ${result.secure_url}`);

    // Delete the file after successful upload
    try {
      fs.unlinkSync(filePath);
      console.log(`Local file deleted: ${filePath}`);
    } catch (deleteError: any) {
      console.warn(
        `Warning: Could not delete local file: ${deleteError.message}`
      );
    }

    // Return simplified result object
    return {
      url: result.secure_url,
      public_id: result.public_id,
      resource_type: result.resource_type,
      format: result.format,
      original_filename: result.original_filename,
    };
  } catch (error: any) {
    console.error("Error uploading to Cloudinary:", {
      message: error.message,
      filePath,
      folderName,
    });

    // Try to clean up the file even if upload failed
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Cleaned up local file after error: ${filePath}`);
      }
    } catch (cleanupError: any) {
      console.warn(
        `Warning: Could not clean up local file: ${cleanupError.message}`
      );
    }

    throw error;
  }
};

export { uploadToCloudinary, CloudinaryUploadResult };
