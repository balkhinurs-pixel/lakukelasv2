'use server';
/**
 * @fileOverview Flow untuk membuat transaksi pembayaran dengan Duitku.
 *
 * - createPaymentTransaction - Fungsi untuk memulai transaksi pembayaran.
 * - CreatePaymentInput - Tipe input untuk fungsi createPaymentTransaction.
 * - CreatePaymentOutput - Tipe output dari fungsi createPaymentTransaction.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import crypto from 'crypto';

// Muat environment variables
// Di production, ini harus diatur di environment hosting Anda (e.g., Supabase, Vercel)
const merchantCode = process.env.DUITKU_MERCHANT_CODE;
const apiKey = process.env.DUITKU_API_KEY;
// Gunakan NEXT_PUBLIC_APP_URL agar URL dinamis sesuai environment (local, staging, prod)
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';


const CreatePaymentInputSchema = z.object({
  packageName: z.string().describe('Nama paket, e.g., "semester" atau "tahunan"'),
  productDetails: z.string().describe('Deskripsi produk yang dibeli.'),
  amount: z.number().int().positive().describe('Jumlah yang harus dibayar dalam Rupiah.'),
});
export type CreatePaymentInput = z.infer<typeof CreatePaymentInputSchema>;


const CreatePaymentOutputSchema = z.object({
    success: z.boolean().describe('Menunjukkan apakah permintaan berhasil.'),
    paymentUrl: z.string().optional().describe('URL untuk redirect ke halaman pembayaran Duitku.'),
    errorMessage: z.string().optional().describe('Pesan error jika terjadi kegagalan.'),
    reference: z.string().optional().describe('ID referensi unik dari transaksi.'),
});
export type CreatePaymentOutput = z.infer<typeof CreatePaymentOutputSchema>;

// Fungsi wrapper yang akan dipanggil dari client
export async function createPaymentTransaction(input: CreatePaymentInput): Promise<CreatePaymentOutput> {
  return paymentFlow(input);
}


const paymentFlow = ai.defineFlow(
  {
    name: 'paymentFlow',
    inputSchema: CreatePaymentInputSchema,
    outputSchema: CreatePaymentOutputSchema,
  },
  async (input): Promise<CreatePaymentOutput> => {
    if (!merchantCode || !apiKey) {
      console.error('Duitku merchant code or API key is not set in environment variables.');
      return { 
        success: false, 
        errorMessage: 'Konfigurasi pembayaran server tidak lengkap. Harap hubungi administrator.' 
      };
    }

    const merchantOrderId = `CZ-${Date.now()}`;
    const paymentAmount = input.amount;
    const signature = crypto.createHash('md5').update(`${merchantCode}${merchantOrderId}${paymentAmount}${apiKey}`).digest('hex');

    const params = {
        merchantCode: merchantCode,
        paymentAmount: paymentAmount,
        merchantOrderId: merchantOrderId,
        productDetails: input.productDetails,
        // Contoh data pelanggan, idealnya diambil dari data user yang login
        customerVaName: 'Guru Tangguh',
        email: 'guru@sekolah.id',
        phoneNumber: '08123456789',
        // ---
        returnUrl: `${appUrl}/dashboard/subscription?status=success`,
        callbackUrl: `${appUrl}/api/payment-callback`, // Endpoint untuk notifikasi dari Duitku
        signature: signature,
        expiryPeriod: 1440 // dalam menit (24 jam)
    };

    try {
      // Ini adalah simulasi/placeholder untuk panggilan API ke Duitku
      // Di aplikasi production, Anda akan menggunakan fetch untuk mengirim request ke endpoint Duitku
      console.log("Simulating API call to Duitku with params:", params);

      // Endpoint Duitku (ganti ke production URL saat live)
      const duitkuEndpoint = 'https://sandbox.duitku.com/webapi/api/merchant/v2/inquiry';
      
      // const response = await fetch(duitkuEndpoint, {
      //   method: 'POST',
      //   body: JSON.stringify(params),
      //   headers: {
      //     'Content-Type': 'application/json'
      //   }
      // });
      
      // const data = await response.json();

      // Placeholder response - asumsikan API call berhasil
      const placeholderResponse = {
        paymentUrl: `https://sandbox.duitku.com/topup?reference_code=DUMMY-${params.merchantOrderId}`,
        reference: `DUMMY-${params.merchantOrderId}`,
        statusCode: "00",
      };

      console.log("Placeholder Duitku response:", placeholderResponse);

      if (placeholderResponse.statusCode === "00" && placeholderResponse.paymentUrl) {
          return {
              success: true,
              paymentUrl: placeholderResponse.paymentUrl,
              reference: placeholderResponse.reference,
          };
      } else {
        // @ts-ignore
        const errorMessage = placeholderResponse.responseMessage || "Unknown error from Duitku.";
        return {
            success: false,
            errorMessage: `Gagal membuat transaksi: ${errorMessage}`,
        };
      }

    } catch (error) {
      console.error("Error calling Duitku API:", error);
      return {
        success: false,
        errorMessage: 'Gagal terhubung ke server pembayaran.',
      };
    }
  }
);
