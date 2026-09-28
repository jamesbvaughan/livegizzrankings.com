import { Link } from "@/components/Link";

export default function ForbiddenPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-4xl">403 Forbidden</h2>

      <p className="text-xl">You&apos;re not allowed to view this page.</p>

      <p>
        <Link href="/">Go back home</Link>
      </p>
    </div>
  );
}
