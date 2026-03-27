import { auth } from "@/auth";
import { getVideoDetail } from "@/lib/api";
import ShadowingSession from "@/components/ShadowingSession";

type Props = { params: Promise<{ id: string }> };

export default async function SessionPage({ params }: Props) {
  const { id } = await params;
  const [video, session] = await Promise.all([
    getVideoDetail(Number(id)),
    auth(),
  ]);

  const userId = (session?.user as { id?: string } | undefined)?.id;

  return <ShadowingSession video={video} userId={userId} />;
}
