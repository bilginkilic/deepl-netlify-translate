/**
 * BullMQ photo processing queue (Phase 2–3).
 * Set REDIS_URL to enable async face matching on bulk uploads.
 */

export function isQueueConfigured(): boolean {
  return Boolean(process.env.REDIS_URL);
}

export async function enqueuePhotoProcessing(photoId: string): Promise<void> {
  void photoId;
  if (!isQueueConfigured()) return;
  // Phase 3: BullMQ worker calls rekognition.searchFacesInPhoto
}
