import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold mb-4">Welcome to SOMA</h1>
      <Button asChild>
        <Link href="/plan-selection">Go to Plan Selection</Link>
      </Button>
    </div>
  );
}
