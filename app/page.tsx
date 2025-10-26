import Header from "./components/Header";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#FAFAFA] dark:bg-[#1a1d23] transition-colors">
      <Header subtitle="Igazoláskezelő" />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Introduction */}
        <section className="mb-16">
          <h2 className="text-2xl md:text-3xl font-semibold text-[#333C3E] dark:text-[#e4e6eb] mb-6 font-serif">
            Digitális Igazoláskezelő Rendszer
          </h2>
          <p className="text-[#333C3E]/80 dark:text-[#b8bcc5] text-lg leading-relaxed">
            A Szent László Gimnázium F tagozatának modern, digitális igazoláskezelő rendszere. 
            Az alkalmazás célja a hiányzások igazolásának folyamatának megkönnyítése az osztályfőnökök számára.
          </p>
        </section>

        {/* Features */}
        <section className="mb-16">
          <h2 className="text-2xl md:text-3xl font-semibold text-[#333C3E] dark:text-[#e4e6eb] mb-6 font-serif">
            Főbb funkciók
          </h2>
          
          <div className="space-y-6">
            {/* Verification Workflow */}
            <div className="bg-white dark:bg-[#242830] border border-[#333C3E]/10 dark:border-[#3a3f4b] rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold text-[#333C3E] dark:text-[#e4e6eb] mb-3 font-serif">
                ✅ Korrekciós és ellenőrzési folyamat
              </h3>
              <p className="text-[#333C3E]/80 dark:text-[#b8bcc5] leading-relaxed">
                Az osztályfőnökök áttekinthetik és jóváhagyhatják az igazolásokat. 
              </p>
            </div>

            {/* eKreta Integration */}
            <div className="bg-white dark:bg-[#242830] border border-[#333C3E]/10 dark:border-[#3a3f4b] rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold text-[#333C3E] dark:text-[#e4e6eb] mb-3 font-serif">
                📚 eKréta támogatás
              </h3>
              <p className="text-[#333C3E]/80 dark:text-[#b8bcc5] leading-relaxed">
                Az eKrétában rögzített tanórai mulasztások kivonatát importálhatja a tanuló a rendszerbe, hogy megtekinthetőek legyenek azok.
              </p>
            </div>

            {/* Certificate Management */}
            <div className="bg-white dark:bg-[#242830] border border-[#333C3E]/10 dark:border-[#3a3f4b] rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold text-[#333C3E] dark:text-[#e4e6eb] mb-3 font-serif">
                📝 Manuális és automatikus igazoláskezelés
              </h3>
              <p className="text-[#333C3E]/80 dark:text-[#b8bcc5] leading-relaxed">
                A diákok egyszerűen tölthetnek fel igazolásokat űrlap segítségével. 
                A rendszer automatikusan lekéri a TömKomos diákok hiányzásait az FTV - Forgatásszervező Platformról.
              </p>
            </div>

            
          </div>
        </section>

        {/* Workflow */}
        <section className="mb-16">
          <h2 className="text-2xl md:text-3xl font-semibold text-[#333C3E] dark:text-[#e4e6eb] mb-6 font-serif">
            Munkafolyamat
          </h2>
          <div className="bg-white dark:bg-[#242830] border border-[#333C3E]/10 dark:border-[#3a3f4b] rounded-lg p-8 shadow-sm">
            <ol className="space-y-4 text-[#333C3E]/80 dark:text-[#b8bcc5]">
              <li className="flex gap-3">
                <span className="font-bold text-[#333C3E] dark:text-[#e4e6eb] min-w-[2rem]">1.</span>
                <div>
                  <strong className="text-[#333C3E] dark:text-[#e4e6eb]">Bejelentkezés:</strong> Felhasználók belépnek az Igazoláskezelő rendszerén keresztül
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-[#333C3E] dark:text-[#e4e6eb] min-w-[2rem]">2.</span>
                <div>
                  <strong className="text-[#333C3E] dark:text-[#e4e6eb]">Hiányzások importálása (opcionális):</strong> A diák importálja saját hiányzásait az eKréta kivonatból, hogy azokat össze tudja hasonlítani a leadott igazolásaival.
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-[#333C3E] dark:text-[#e4e6eb] min-w-[2rem]">3.</span>
                <div>
                  <strong className="text-[#333C3E] dark:text-[#e4e6eb]">Igazolás benyújtása:</strong> A diákok igazolásokat nyújthatnak be stúdiós vagy egyéb jellegű hiányzások esetén, valamint a TömKomos diákok korrekciós űrlapokat is.
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-[#333C3E] dark:text-[#e4e6eb] min-w-[2rem]">4.</span>
                <div>
                  <strong className="text-[#333C3E] dark:text-[#e4e6eb]">Automatikus párosítás (amennyiben rendelkezésre áll):</strong> A rendszer hozzárendeli az igazolást a megfelelő hiányzáshoz, amennyiben azok korábban importálva lettek.
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-[#333C3E] dark:text-[#e4e6eb] min-w-[2rem]">5.</span>
                <div>
                  <strong className="text-[#333C3E] dark:text-[#e4e6eb]">Ellenőrzés:</strong> Osztályfőnökök átnézik és jóváhagyják az igazolásokat
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-[#333C3E] dark:text-[#e4e6eb] min-w-[2rem]">6.</span>
                <div>
                  <strong className="text-[#333C3E] dark:text-[#e4e6eb]">Rögzítés az eKrétában:</strong> Az osztályfőnökök által jóváhagyott igazolásokat manuálisan rögzítheti az eKréta Elektronikus naplóban, az Igazoláskezelőben rögzítheti mely hiányzásokkal tette már ezt meg.
                </div>
              </li>
            </ol>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="mb-16">
          <div className="bg-amber-50 dark:bg-[#2d2818] border border-amber-200 dark:border-[#4a3f1c] rounded-lg p-6 shadow-sm">
            <p className="text-amber-900 dark:text-[#f5d99d] leading-relaxed">
              <strong className="font-semibold">Megjegyzés:</strong> A projekt kísérleti jellegéből adódóan zárt körben, kizárólag az F tagozat számára elérhető.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <div className="bg-gradient-to-br from-[#333C3E] to-[#4a5658] dark:from-[#3d4451] dark:to-[#2a2f3a] text-white rounded-lg p-10 shadow-lg">
            <h2 className="text-2xl md:text-3xl font-semibold mb-4 font-serif">
              Kezdje el a használatát
            </h2>
            <p className="text-white/90 mb-6 max-w-2xl mx-auto">
              Jelentkezzen be és egyszerűsítse le az igazoláskezelést még ma!
            </p>
            <a
              href="/login"
              className="inline-block bg-white text-[#333C3E] dark:bg-[#c9a36f] dark:text-[#1a1d23] font-medium px-8 py-3 rounded-lg hover:bg-white/90 dark:hover:bg-[#d4b184] transition-colors shadow-md"
            >
              Bejelentkezés
            </a>
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}
