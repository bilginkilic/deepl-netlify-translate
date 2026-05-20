/**
 * AWS Rekognition integration (Phase 3).
 * Requires AWS_REGION (prefer eu-west-2), credentials, and S3 bucket.
 */

export function isRekognitionConfigured(): boolean {
  return Boolean(
    process.env.AWS_REGION &&
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      process.env.AWS_S3_BUCKET
  );
}

export async function indexGuestFace(params: {
  s3Key: string;
  guestId: string;
}): Promise<{ faceId: string } | null> {
  void params;
  if (!isRekognitionConfigured()) {
    return null;
  }
  // Phase 3: @aws-sdk/client-rekognition IndexFaces
  throw new Error("Rekognition not implemented — configure AWS in Phase 3");
}

export async function searchFacesInPhoto(params: {
  photoS3Key: string;
  weddingCollectionId: string;
}): Promise<Array<{ guestId: string; confidence: number }>> {
  void params;
  if (!isRekognitionConfigured()) return [];
  throw new Error("Rekognition search not implemented — Phase 3");
}

export async function deleteGuestFaceData(guestId: string): Promise<void> {
  if (!isRekognitionConfigured()) return;
  // Phase 3: delete faces + S3 reference objects for GDPR
  void guestId;
}
