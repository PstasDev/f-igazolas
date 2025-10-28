import Header from "../components/Header";
import Footer from "../components/Footer";

export default function ArchivedHome() {
  return (
    <main className="min-h-screen bg-[#FAFAFA] dark:bg-[#1a1d23] transition-colors">
      <Header subtitle="Igazoláskezelő (ARCHIVED)" />

      {/* Main Content - archived copy of the original homepage (2025-10-28) */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <section className="mb-16">
          <h2 className="text-2xl md:text-3xl font-semibold text-[#333C3E] dark:text-[#e4e6eb] mb-6 font-serif">
            Archivált kezdőlap
          </h2>
          <p className="text-[#333C3E]/80 dark:text-[#b8bcc5] text-lg leading-relaxed">
            Ez a fájl egy archivált példány a korábbi kezdőlapból. Az éles kezdőlap automatikusan átirányít a megfelelő felületre (bejelentkezés vagy irányítópult) — ne szerkessze ezt a fájlt napi használatra.
          </p>
        </section>

        <section className="mb-16">
          <h2 className="text-lg font-semibold mb-2">Miért van archiválva?</h2>
          <p className="text-muted-foreground">A projekt struktúrájának egyszerűsítése érdekében a kezdőlapot eltávolítottuk és átirányításra állítottuk. Ha szükséges, innen visszaállítható a tartalom.</p>
        </section>

        <section className="text-center">
          <a href="/login" className="inline-block bg-white text-[#333C3E] dark:bg-[#c9a36f] dark:text-[#1a1d23] font-medium px-8 py-3 rounded-lg hover:bg-white/90 dark:hover:bg-[#d4b184] transition-colors shadow-md">
            Bejelentkezés
          </a>
        </section>
      </div>

      <Footer />
    </main>
  );
}
