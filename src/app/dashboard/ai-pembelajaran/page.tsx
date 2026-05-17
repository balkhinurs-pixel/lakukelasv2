import { redirect } from "next/navigation";

export default async function AiPembelajaranPage() {
    // Redirect otomatis ke sub-menu pertama (Bank Soal)
    redirect('/dashboard/ai-pembelajaran/bank-soal');
}
