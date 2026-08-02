import { getIdeas, getFieldOptions } from "@/lib/smartsheet";
import IdeasBoard from "./IdeasBoard";

export const dynamic = "force-dynamic";

export default async function IdeasPage() {
  const [ideas, fields] = await Promise.all([getIdeas(), getFieldOptions()]);
  const publicIdeas = ideas.filter((i) => i.status !== "Not Planned");
  return (
    <IdeasBoard
      initialIdeas={publicIdeas}
      categories={fields.category || []}
      products={fields.product || []}
    />
  );
}
