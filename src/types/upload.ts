export interface LocalImageAsset {
  local_id: string;
  file: File;
  preview_url: string;
  size: number;
  width?: number;
  height?: number;
}

export interface UploadImageResponse {
  file_id: string;
  url: string;
  width?: number;
  height?: number;
  size?: number;
}
