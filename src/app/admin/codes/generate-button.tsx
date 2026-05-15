'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateActivationToken } from '@/lib/actions/admin';
import { useRouter } from 'next/navigation';

export function GenerateCodeButton() {
    const { toast } = useToast();
    const router = useRouter();
    const [loading, setLoading] = React.useState(false);

    const handleGenerate = async () => {
        setLoading(true);
        const result = await generateActivationToken();
        
        if (result.success) {
            toast({
                title: "Token Berhasil Dibuat",
                description: `Token baru: ${result.token}. Bagikan kepada staf yang ingin mendaftar.`,
            });
            router.refresh();
        } else {
            toast({
                title: "Gagal",
                description: result.error,
                variant: "destructive"
            });
        }
        setLoading(false);
    }

    return (
        <Button onClick={handleGenerate} disabled={loading} className="rounded-xl shadow-lg">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
            Buat Token Baru
        </Button>
    )
}
