import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-xl font-bold tracking-tight text-gray-900">
          Mews Hotel
        </Link>
        <nav className="flex gap-6 text-sm font-medium">
          <Link href="/" className="text-gray-600 hover:text-gray-900">
            Book
          </Link>
          <Link href="/reservations" className="text-gray-600 hover:text-gray-900">
            Reservations
          </Link>
          <Link href="/docs/mews" className="text-gray-600 hover:text-gray-900">
            Docs
          </Link>
        </nav>
      </div>
    </header>
  );
}
