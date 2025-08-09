
'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateActivationCode } from "@/lib/actions/admin";
import { useRouter } from 'next/navigation';

export function GenerateCodeButton() {
    const router = useRouter();
    const [loading, setLoading] = React.useState(false);
    const { toast } = useToast();

    const handleGenerate = async () => {
        setLoading(true);
        const result = await generateActivationCode();
        if (result.success && result.data) {
            toast({
                title: "Kode Berhasil Dibuat",
                description: `Kode baru: ${result.data.code}`,
            });
            router.refresh(); // Reload data on the page
        } else {
            toast({
                title: "Gagal Membuat Kode",
                description: result.error || "Terjadi kesalahan.",
                variant: "destructive",
            });
        }
        setLoading(false);
    }

    return (
        <Button onClick={handleGenerate} disabled={loading}>
            {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <PlusCircle className="mr-2 h-4 w-4" />
            )}
            Buat Kode Baru
        </Button>
    )
}
