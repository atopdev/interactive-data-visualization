import { createFileRoute } from '@tanstack/react-router'
import { DemoPage } from '@/components/page/demo-page'

export const Route = createFileRoute('/gsap')({
  component: Page,
})

function Page() {
  return (
    <DemoPage pageId="gsap" lead="Coming up." toc={[]} credits={[]}>
      <div className="h-[150vh]" />
    </DemoPage>
  )
}
