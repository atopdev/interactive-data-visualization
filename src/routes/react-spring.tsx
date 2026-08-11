import { createFileRoute } from '@tanstack/react-router'
import { DemoPage } from '@/components/page/demo-page'

export const Route = createFileRoute('/react-spring')({
  component: Page,
})

function Page() {
  return (
    <DemoPage pageId="react-spring" lead="Coming up." toc={[]} credits={[]}>
      <div className="h-[150vh]" />
    </DemoPage>
  )
}
