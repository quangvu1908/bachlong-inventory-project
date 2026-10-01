import { CupSoda, Heart, Github } from 'lucide-react'

export function AppFooter() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-card/50 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground">
              <CupSoda className="size-4" />
            </div>
            <div className="text-sm">
              <span className="font-semibold">Trà House</span>
              <span className="ml-2 text-muted-foreground">
                Hệ thống kiểm soát tồn kho
              </span>
            </div>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <a href="#tong-quan" className="transition-colors hover:text-foreground">Tổng quan</a>
            <a href="#nghiep-vu" className="transition-colors hover:text-foreground">Nghiệp vụ</a>
            <a href="#nguyen-vat-lieu" className="transition-colors hover:text-foreground">Nguyên vật liệu</a>
            <a href="#cai-dat" className="transition-colors hover:text-foreground">Cài đặt</a>
          </nav>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              Made with <Heart className="size-3 fill-destructive text-destructive" /> cho tiệm trà sữa
            </span>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="grid size-7 place-items-center rounded-md transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="GitHub"
            >
              <Github className="size-3.5" />
            </a>
          </div>
        </div>

        <div className="mt-6 border-t border-border/40 pt-4 text-center text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} Trà House · Vận hành số kho theo luồng nguyên vật liệu
        </div>
      </div>
    </footer>
  )
}
