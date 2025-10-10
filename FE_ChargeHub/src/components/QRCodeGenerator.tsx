import { useMemo } from "react";

interface QRCodeGeneratorProps {
  value: string;
  size?: number;
  className?: string;
}

export default function QRCodeGenerator({ value, size = 200, className = "" }: QRCodeGeneratorProps) {
  const qrCodeUrl = useMemo(() => {
    // Sử dụng QR Server API để tạo QR code
    const encodedValue = encodeURIComponent(value);
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedValue}&format=png&ecc=M`;
  }, [value, size]);

  return (
    <div className={`inline-block bg-white p-4 rounded-lg shadow-lg ${className}`}>
      <img 
        src={qrCodeUrl} 
        alt="QR Code" 
        className="block"
        width={size}
        height={size}
        style={{ imageRendering: 'crisp-edges' }}
        onError={(e) => {
          // Fallback if QR service fails
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          target.parentElement!.innerHTML = `
            <div class="w-[${size}px] h-[${size}px] bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300 rounded">
              <div class="text-center text-gray-500">
                <div class="text-2xl mb-2">📱</div>
                <div class="text-sm">QR Code</div>
              </div>
            </div>
          `;
        }}
      />
    </div>
  );
}