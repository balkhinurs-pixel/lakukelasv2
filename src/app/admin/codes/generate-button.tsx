

'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateActivationCode } from "@/lib/actions/admin";
import { useRouter } from 'next/navigation';

// This component is now obsolete since the activation system is removed.
// It can be deleted or kept for future reference. For now, it will simply be disabled.

export function GenerateCodeButton() {
    const [loading, setLoading] = React.useState(false);
    const { toast } = useToast();

    const handleGenerate = async () => {
        toast({
            title: "Fitur Dinonaktifkan",
            description: "Sistem kode aktivasi tidak lagi digunakan.",
        });
    }

    return (
        <Button onClick={handleGenerate} disabled>
            <PlusCircle className="mr-2 h-4 w-4" />
            Buat Kode Baru
        </Button>
    )
}
