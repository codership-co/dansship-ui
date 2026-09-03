const STUDIO_WHATSAPP_NUMBER = '+573161017878';
const STUDIO_WHATSAPP_PREFILL = 'Hola Dansship, tengo una pregunta';

export function buildWhatsAppLink(identifier: string): string {
  return `https://wa.me/${identifier.trim()}`;
}

export function buildStudioWhatsAppLink(text = STUDIO_WHATSAPP_PREFILL): string {
  return `${buildWhatsAppLink(STUDIO_WHATSAPP_NUMBER)}?text=${encodeURIComponent(text)}`;
}

export function buildRegisteredPhoneWhatsAppLink(
  countryCode: string | null | undefined,
  phoneNumber: string | null | undefined,
): string | null {
  if (!countryCode?.trim() || !phoneNumber?.trim()) {
    return null;
  }

  const digits = `${countryCode}${phoneNumber}`.replace(/\D/g, '');

  if (!digits) {
    return null;
  }

  return `https://wa.me/${digits}`;
}

export function buildInstagramLink(identifier: string): string {
  const handle = identifier.trim().replace(/^@+/, '');

  return `https://www.instagram.com/${handle}`;
}
