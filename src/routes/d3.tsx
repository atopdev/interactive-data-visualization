import { createFileRoute } from '@tanstack/react-router'
import { DemoPage } from '@/components/page/demo-page'

export const Route = createFileRoute('/d3')({
  component: Page,
})

function Page() {
  return (
    <DemoPage pageId="d3" lead="Coming up." toc={[]} credits={[]}>
      <div className="h-[150vh]" />
    </DemoPage>
  )
}
