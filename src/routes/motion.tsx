import { createFileRoute } from '@tanstack/react-router'
import { DemoPage } from '@/components/page/demo-page'

export const Route = createFileRoute('/motion')({
  component: Page,
})

function Page() {
  return (
    <DemoPage pageId="motion" lead="Coming up." toc={[]} credits={[]}>
      <div className="h-[150vh]" />
    </DemoPage>
  )
}
