"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Loader2 } from "lucide-react";

export default function ConfirmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const token_hash = searchParams.get("token_hash");
    const type = searchParams.get("type") as "email" | "recovery" | "magiclink" | null;
    const next = searchParams.get("next") ?? "/";

    if (!token_hash || !type) {
      setStatus("error");
      setMessage("Lien de confirmation invalide ou incomplet.");
      return;
    }

    const supabase = createClientComponentClient();
    setStatus("loading");
    setMessage("Activation de votre profil en cours…");

    supabase.auth.verifyOtp({ token_hash, type })
      .then(({ data, error }) => {
        if (error) {
          setStatus("error");
          setMessage(error.message || "Erreur lors de l'activation du profil.");
          return;
        }
        if (!data?.user) {
          setStatus("error");
          setMessage("Impossible de valider votre profil. Veuillez réessayer.");
          return;
        }
        setStatus("success");
        setMessage("Votre profil a bien été activé ! Redirection en cours…");
        setTimeout(() => {
          router.replace(next);
        }, 2000);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err.message || "Erreur inattendue lors de l'activation.");
      });
  }, [searchParams, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      {status === "loading" && (
        <>
          <Loader2 className="animate-spin w-10 h-10 mx-auto mb-4 text-violet-600" />
          <p className="text-lg font-medium">{message}</p>
        </>
      )}
      {status === "success" && (
        <>
          <p className="text-lg font-medium text-green-600">{message}</p>
        </>
      )}
      {status === "error" && (
        <>
          <p className="text-lg font-medium text-red-600">{message}</p>
        </>
      )}
    </div>
  );
}
