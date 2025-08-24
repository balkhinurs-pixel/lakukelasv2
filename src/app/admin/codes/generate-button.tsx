
'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function GenerateCodeButton() {
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
