import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-black py-12 px-6 md:px-12">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-linear-to-br from-amber-400 to-yellow-500 flex items-center justify-center">
            <span className="text-white text-xs font-black">W</span>
          </div>
          <span className="text-white font-bold">WedSite</span>
        </div>

        <nav className="flex gap-6 text-sm text-gray-500" aria-label="Footer navigation">
          <a href="#templates" className="hover:text-white transition-colors">Templates</a>
          <a href="#features"  className="hover:text-white transition-colors">Features</a>
          <a href="#pricing"   className="hover:text-white transition-colors">Pricing</a>
          <Link href="/login"  className="hover:text-white transition-colors">Sign In</Link>
        </nav>

        <p className="text-gray-600 text-xs">
          © {new Date().getFullYear()} WedSite. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
