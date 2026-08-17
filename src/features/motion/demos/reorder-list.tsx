import { Reorder, useDragControls } from 'motion/react'
import { GripVertical, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { DemoSection } from '@/components/page/demo-section'
import { Button } from '@/components/ui/button'
import { fakeWith } from '@/lib/fake'
import { cn } from '@/lib/utils'

interface Task {
  id: string
  title: string
  owner: string
  priority: 'High' | 'Medium' | 'Low'
}

const TASKS: Task[] = fakeWith('motion-reorder', (f) =>
  Array.from({ length: 6 }, (_, i) => ({
    id: `task-${i}`,
    title: `${f.hacker.verb().replace(/^./, (c) => c.toUpperCase())} the ${f.hacker.adjective()} ${f.hacker.noun()}`,
    owner: f.person.firstName(),
    priority: f.helpers.arrayElement(['High', 'Medium', 'Low'] as const),
  })),
)

function Row({ task, rank }: { task: Task; rank: number }) {
  const controls = useDragControls()
  return (
    <Reorder.Item
      value={task}
      dragListener={false}
      dragControls={controls}
      className="relative flex items-center gap-3 rounded-xl border bg-card p-3 shadow-xs select-none"
      whileDrag={{ scale: 1.03, boxShadow: '0 16px 32px rgba(0,0,0,0.25)', zIndex: 10 }}
      transition={{ type: 'spring', stiffness: 600, damping: 40 }}
    >
      <button
        type="button"
        onPointerDown={(e) => controls.start(e)}
        className="cursor-grab touch-none rounded p-1 text-muted-foreground hover:bg-muted active:cursor-grabbing"
        aria-label={`Drag to reorder ${task.title}`}
      >
        <GripVertical className="size-4" />
      </button>
      <span className="w-5 font-mono text-xs text-muted-foreground tabular-nums">
        {rank}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{task.title}</p>
        <p className="text-xs text-muted-foreground">Owner: {task.owner}</p>
      </div>
      <span
        className={cn(
          'rounded-full px-2 py-0.5 text-xs font-medium',
          task.priority === 'High' && 'bg-red-500/15 text-red-600 dark:text-red-400',
          task.priority === 'Medium' &&
            'bg-amber-500/15 text-amber-700 dark:text-amber-400',
          task.priority === 'Low' &&
            'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
        )}
      >
        {task.priority}
      </span>
    </Reorder.Item>
  )
}

export function ReorderDemo() {
  const [tasks, setTasks] = useState(TASKS)
  return (
    <DemoSection
      id="reorder"
      index={4}
      title="Reorder.Group drag-to-reorder"
      description="Reorder.Group tracks item order while you drag; neighbors make room with layout animations. Dragging starts only from the grip handle via useDragControls, so the rest of the row stays scrollable and selectable on touch devices."
      source="generated"
      sourceLabel="Faker tasks"
      controls={
        <Button size="sm" variant="outline" onClick={() => setTasks(TASKS)}>
          <RotateCcw /> Reset order
        </Button>
      }
    >
      <div className="mx-auto max-w-xl rounded-xl bg-surface-2 p-3">
        <Reorder.Group
          axis="y"
          values={tasks}
          onReorder={setTasks}
          className="flex flex-col gap-2"
        >
          {tasks.map((t, i) => (
            <Row key={t.id} task={t} rank={i + 1} />
          ))}
        </Reorder.Group>
      </div>
    </DemoSection>
  )
}
