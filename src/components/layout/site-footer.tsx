/** Site-wide footer with the copyright notice. */
export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-7xl items-center justify-center px-4 py-6 text-sm text-muted-foreground sm:px-6">
        <p>
          © {new Date().getFullYear()}{' '}
          <a
            href="https://github.com/atopdev"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-foreground hover:underline"
          >
            atopdev
          </a>
          . All rights reserved.
        </p>
      </div>
    </footer>
  )
}
