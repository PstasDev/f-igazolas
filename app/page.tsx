"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "@/app/context/RoleContext";
import { Spinner } from "@/components/ui/spinner";

export default function Home() {
  const { isAuthenticated, isLoading } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    // If authenticated, go to dashboard. Otherwise to login.
    if (isAuthenticated) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  return null;
}
