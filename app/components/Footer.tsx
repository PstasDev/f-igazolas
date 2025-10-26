export default function Footer() {
  return (
    <footer className="mt-20 border-t border-[#333C3E]/10 dark:border-[#3a3f4b] bg-white dark:bg-[#242830] transition-colors">
      <div className="max-w-4xl mx-auto px-6 py-8 text-center text-[#333C3E]/60 dark:text-[#9198a1] text-sm">
        <p>© {new Date().getFullYear()} Szent László Gimnázium</p>
      </div>
    </footer>
  );
}
