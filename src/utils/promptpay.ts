import QRCode from 'qrcode';

/**
 * CRC16-CCITT (False) checksum calculation for EMVCo standard
 * Polynomial: 0x1021, Initial: 0xFFFF
 */
function crc16(str: string): string {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    crc ^= code << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function formatTag(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

/**
 * Formats Thai phone number (e.g. 0812345678 -> 0066812345678)
 * or 13-digit National ID
 */
export function formatPromptPayTarget(target: string): { subTag: string; value: string } {
  const digits = target.replace(/[^0-9]/g, '');
  if (digits.length === 10 && digits.startsWith('0')) {
    // Mobile number: internationalize with 0066
    const mobile = `0066${digits.substring(1)}`;
    return { subTag: '01', value: mobile };
  } else if (digits.length === 13) {
    // National ID or Tax ID
    return { subTag: '02', value: digits };
  } else {
    // Default fallback: if 9 digits (without leading zero)
    const mobile = `0066${digits}`;
    return { subTag: '01', value: mobile };
  }
}

/**
 * Generates raw EMVCo PromptPay QR string (100% offline, zero network)
 */
export function generatePromptPayPayload(target: string, amount?: number): string {
  const { subTag, value: formattedTarget } = formatPromptPayTarget(target);

  // Sub-tags for Merchant Account Information (Tag 29)
  const aid = formatTag('00', 'A000000677010111');
  const targetTag = formatTag(subTag, formattedTarget);
  const tag29 = formatTag('29', `${aid}${targetTag}`);

  // Base EMVCo string
  let emv = '';
  emv += formatTag('00', '01'); // Version
  emv += formatTag('01', amount !== undefined && amount > 0 ? '12' : '11'); // 12 = Dynamic with amount, 11 = Static
  emv += tag29;
  emv += formatTag('53', '764'); // THB currency code
  
  if (amount !== undefined && amount > 0) {
    emv += formatTag('54', amount.toFixed(2));
  }

  emv += formatTag('58', 'TH'); // Country code Thailand
  emv += '6304'; // Checksum Tag with length 4

  const checksum = crc16(emv);
  return `${emv}${checksum}`;
}

/**
 * Generates QR Code Data URL offline via HTML5 canvas/SVG
 */
export async function generatePromptPayQRDataUrl(target: string, amount?: number): Promise<string> {
  const payload = generatePromptPayPayload(target, amount);
  return await QRCode.toDataURL(payload, {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff'
    },
    errorCorrectionLevel: 'M'
  });
}
