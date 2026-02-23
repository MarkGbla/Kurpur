import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <h1 className="text-center text-2xl font-bold tracking-tight">Page not found</h1>
      <p className="mt-2 text-center text-muted">
        This route doesn’t exist or the app is still starting.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-2xl bg-accent px-6 py-3 text-sm font-medium text-background transition-transform active:scale-[0.97]"
      >
        Go to Kurpur
      </Link>
    </main>
  );
}
