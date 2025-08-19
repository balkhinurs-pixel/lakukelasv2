

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function DummyLoginPage() {
  const router = useRouter();

  const handleEnter = () => {
    router.push('/dashboard');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 p-4">
      <div className="text-center bg-white/80 backdrop-blur-lg p-10 rounded-2xl shadow-xl">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Design Mode</h1>
        <p className="text-gray-600 mb-6">
          Halaman login dilewati untuk mempermudah proses desain.
        </p>
        <Button onClick={handleEnter} size="lg">
          Masuk ke Dasbor Guru
        </Button>
         <Button onClick={() => router.push('/admin')} size="lg" variant="outline" className="ml-4">
          Masuk ke Panel Admin
        </Button>
      </div>
    </div>
  );
}
