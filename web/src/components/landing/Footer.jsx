import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-black py-12 px-6 md:px-12">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Image src="/logo.png" alt="LiteEvent" width={28} height={28} className="rounded-lg bg-white object-contain" />
          <span className="text-white font-bold">LiteEvent</span>
        </Link>

        <nav className="flex gap-6 text-sm text-gray-500" aria-label="Footer navigation">
          <Link href="/#templates" className="hover:text-white transition-colors">Templates</Link>
          <Link href="/#features"  className="hover:text-white transition-colors">Features</Link>
          <Link href="/#pricing"   className="hover:text-white transition-colors">Pricing</Link>
          <Link href="/contact#contact-form" className="hover:text-white transition-colors">Contact</Link>
          <Link href="/login"  className="hover:text-white transition-colors">Sign In</Link>
        </nav>

        <p className="text-gray-600 text-xs">
          © {new Date().getFullYear()} LiteEvent. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
