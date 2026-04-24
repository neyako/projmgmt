"use client";

import Image from "next/image";
import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { uploadAvatar } from "@/app/actions";
import { useToast } from "@/components/ui/Toast";

interface AvatarUploadFormProps {
  avatarUrl: string | null;
}

export default function AvatarUploadForm({ avatarUrl }: AvatarUploadFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { update } = useSession();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append("avatar", file);

    startTransition(async () => {
      const result = await uploadAvatar(formData);
      event.target.value = "";

      if (!result.success) {
        showToast(result.error, "error");
        return;
      }

      await update();
      router.refresh();
      showToast("Avatar uploaded.", "success");
    });
  }

  return (
    <div className="flex items-center gap-6">
      <div className="w-20 h-20 border border-border-visible bg-surface flex items-center justify-center overflow-hidden">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt="User avatar"
            width={80}
            height={80}
            className="w-20 h-20 object-cover"
            unoptimized
          />
        ) : (
          <span className="material-symbols-outlined text-[32px] text-text-secondary">
            person
          </span>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-mono text-text-secondary uppercase tracking-widest">
            USER AVATAR
          </span>
          <span className="text-xs font-mono text-text-primary">
            LOCAL FILE / PUBLIC AVATARS
          </span>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleChange}
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isPending}
          className="border border-border-visible text-text-display text-[10px] font-mono uppercase tracking-widest px-4 py-2 hover:bg-surface-raised transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "[ UPLOADING ]" : "[ UPLOAD AVATAR ]"}
        </button>
      </div>
    </div>
  );
}
