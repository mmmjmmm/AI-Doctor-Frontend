/* eslint-disable @typescript-eslint/no-explicit-any */
import request from "@/utils/request";
import type { TaskType } from "@/types/chat";
import type { UploadImageResponse } from "@/types/upload";

export interface UploadImageRequest {
  file: File;
  biz: Exclude<TaskType, "chat">;
  signal?: AbortSignal;
}

export const uploadImage = async ({
  file,
  biz,
  signal,
}: UploadImageRequest) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("biz", biz);

  const response = await request.post<any, UploadImageResponse>(
    "/upload/image",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      signal,
    },
  );

  return response;
};
