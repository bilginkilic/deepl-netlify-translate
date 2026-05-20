/**
 * Transactional email via Resend (Phase 1+).
 */

export async function sendGuestInvite(params: {
  to: string;
  guestName: string;
  weddingTitle: string;
  inviteUrl: string;
}): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.info("[email stub] invite", params);
    return false;
  }
  // Phase 1+: Resend API
  void params;
  return true;
}

export async function sendPhotosReadyNotification(params: {
  to: string;
  guestName: string;
  galleryUrl: string;
}): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.info("[email stub] photos ready", params);
    return false;
  }
  void params;
  return true;
}
