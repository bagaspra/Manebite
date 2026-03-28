import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getVideoDetail } from "@/lib/api";
import ShadowingSession from "@/components/ShadowingSession";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `Session — Manebite` };
}

type Props = { params: Promise<{ id: string }> };

export default async function SessionPage({ params }: Props) {
  const { id } = await params;

  const session = await auth();

  // Inline auth check — redirect to login with callbackUrl
  if (!session) {
    redirect(`/login?callbackUrl=/tools/shadowing/session/${id}`);
  }

  const userId = (session?.user as { id?: string } | undefined)?.id;
  const video = await getVideoDetail(Number(id));

  return <ShadowingSession video={video} userId={userId} />;
}
