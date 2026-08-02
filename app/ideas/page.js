import { getIdeas } from "@/lib/smartsheet";
import IdeasBoard from "./IdeasBoard";

export const dynamic = "force-dynamic";

export default async function IdeasPage() {
  const ideas = await getIdeas();
  const publicIdeas = ideas.filter((i) => i.status !== "Not Planned");
  return <IdeasBoard initialIdeas={publicIdeas} />;
}
