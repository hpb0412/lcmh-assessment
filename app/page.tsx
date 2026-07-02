import { products } from "@/lib/data";
import { EpdExplorer } from "@/components/EpdExplorer";

export default function Page() {
  // This is a React Server Component (RSC) that retrieves the static data
  // and passes it to the interactive client component.
  return <EpdExplorer initialProducts={products} />;
}
