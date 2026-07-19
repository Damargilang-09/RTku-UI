export const MAX_UPLOAD_FILE_SIZE = 5 * 1024 * 1024;

export const UPLOAD_FILE_ACCEPT =
  ".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf";

const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const ALLOWED_FILE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".pdf"];

function getFileExtension(fileName: string) {
  const dotIndex = fileName.lastIndexOf(".");
  return dotIndex >= 0 ? fileName.slice(dotIndex).toLowerCase() : "";
}

export function validateUploadFile(file: File): string | null {
  const extension = getFileExtension(file.name);

  if (
    !ALLOWED_FILE_TYPES.includes(file.type) ||
    !ALLOWED_FILE_EXTENSIONS.includes(extension)
  ) {
    return "Format file harus JPG, JPEG, PNG, atau PDF.";
  }

  if (file.size > MAX_UPLOAD_FILE_SIZE) {
    return "Ukuran setiap file maksimal 5 MB.";
  }

  return null;
}

export function isPdfUrl(url: string) {
  const normalizedUrl = url.split("?")[0].toLowerCase();
  return normalizedUrl.endsWith(".pdf");
}
