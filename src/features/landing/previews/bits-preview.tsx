import DecryptedText from '@/components/react-bits/DecryptedText'
import ShinyText from '@/components/react-bits/ShinyText'

/** Mini React Bits showcase: text effects only (no WebGL on the landing page). */
export default function BitsPreview() {
  return (
    <div className="flex size-full flex-col items-center justify-center gap-3 px-4 text-center">
      <ShinyText
        text="copy · paste · animate"
        className="text-lg font-semibold tracking-tight sm:text-xl"
        speed={2.5}
        color="var(--muted-foreground)"
        shineColor="var(--foreground)"
      />
      <DecryptedText
        text="npx shadcn add @react-bits"
        animateOn="view"
        sequential
        speed={40}
        className="font-mono text-xs text-foreground sm:text-sm"
        encryptedClassName="font-mono text-xs text-page-accent sm:text-sm"
      />
    </div>
  )
}
