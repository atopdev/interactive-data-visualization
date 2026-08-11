import { createFileRoute } from '@tanstack/react-router'
import { DemoPage } from '@/components/page/demo-page'

export const Route = createFileRoute('/react-bits')({
  component: Page,
})

function Page() {
  return (
    <DemoPage pageId="react-bits" lead="Coming up." toc={[]} credits={[]}>
      <div className="h-[150vh]" />
    </DemoPage>
  )
}
