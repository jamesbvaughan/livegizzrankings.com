import { Link } from "@/components/Link";

export default function UnauthorizedPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-4xl">401 Unauthorized</h2>

      <p className="text-xl">
        You need to log in to view this page. No invisible faces allowed!
      </p>

      <p>
        <Link href="/">Go back home</Link>
      </p>
    </div>
  );
}
