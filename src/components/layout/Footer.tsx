export default function Footer() {
  return (
    <footer className="bg-muted/50 border-t">
      <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Nakliyeci Dünyası. Tüm hakları saklıdır.</p>
      </div>
    </footer>
  );
}
