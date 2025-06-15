import dynamic from "next/dynamic";

const PlaylistGenerator = dynamic(
  () => import("@/features/playlist/components/PlaylistGenerator"),
  { ssr: false }
);

export default function DashboardPage() {
  return <PlaylistGenerator />;
} 