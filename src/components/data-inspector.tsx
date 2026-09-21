import {
  columnFilteringFeature,
  createColumnHelper,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  tableFeatures,
  useTable,
  type RowData,
} from '@tanstack/react-table'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Table2,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

// Register only the features the inspector uses (v9 is opt-in per feature).
const features = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  rowSortingFeature,
  rowPaginationFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  filterFns: { includesString: filterFn_includesString },
  sortFns: { alphanumeric: sortFn_alphanumeric, basic: sortFn_basic },
})

type Primitive = string | number | boolean | null | undefined

export interface InspectorColumn<T> {
  id: string
  header: string
  value: (row: T) => Primitive
  format?: (value: Primitive) => string
  numeric?: boolean
}

interface DataInspectorProps<T> {
  title: string
  description: string
  rows: readonly T[]
  columns: readonly InspectorColumn<T>[]
  pageSize?: number
  triggerLabel?: string
}

const defaultFormat = (v: Primitive) =>
  v === null || v === undefined
    ? '—'
    : typeof v === 'number'
      ? v.toLocaleString('en', { maximumFractionDigits: 2 })
      : String(v)

function InspectorTable<T extends RowData>({
  rows,
  columns,
  pageSize = 12,
}: Pick<DataInspectorProps<T>, 'rows' | 'columns' | 'pageSize'>) {
  const [search, setSearch] = useState('')
  const data = useMemo(() => [...rows], [rows])
  const columnDefs = useMemo(() => {
    const helper = createColumnHelper<typeof features, T>()
    return helper.columns(
      columns.map((c) =>
        helper.accessor((row) => c.value(row), {
          id: c.id,
          header: c.header,
          sortFn: c.numeric ? 'basic' : 'alphanumeric',
          cell: (info) => (c.format ?? defaultFormat)(info.getValue()),
          meta: { numeric: c.numeric },
        }),
      ),
    )
  }, [columns])

  const table = useTable({
    features,
    data,
    columns: columnDefs,
    globalFilterFn: 'includesString',
    initialState: { pagination: { pageIndex: 0, pageSize } },
    state: { globalFilter: search },
    onGlobalFilterChange: (updater) =>
      setSearch((prev) =>
        String(typeof updater === 'function' ? updater(prev) : updater),
      ),
  })

  const { pageIndex } = table.state.pagination
  const total = table.getFilteredRowModel().rows.length

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            table.setPageIndex(0)
          }}
          placeholder={`Search ${rows.length.toLocaleString('en')} rows…`}
          className="pl-8"
          aria-label="Search rows"
        />
      </div>
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                {group.headers.map((header) => {
                  const sorted = header.column.getIsSorted()
                  const numeric = columns.find(
                    (c) => c.id === header.column.id,
                  )?.numeric
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(numeric && 'text-right')}
                    >
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className={cn(
                          'inline-flex items-center gap-1 hover:text-foreground',
                          numeric && 'flex-row-reverse',
                        )}
                      >
                        <table.FlexRender header={header} />
                        {sorted === 'asc' ? (
                          <ArrowUp className="size-3" />
                        ) : sorted === 'desc' ? (
                          <ArrowDown className="size-3" />
                        ) : (
                          <ArrowUpDown className="size-3 opacity-40" />
                        )}
                      </button>
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getAllCells().map((cell) => {
                    const numeric = columns.find(
                      (c) => c.id === cell.column.id,
                    )?.numeric
                    return (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          'max-w-56 truncate',
                          numeric && 'text-right font-mono tabular-nums',
                        )}
                      >
                        <table.FlexRender cell={cell} />
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No rows match “{search}”.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="tabular-nums">
          {total.toLocaleString('en')} rows · page {total ? pageIndex + 1 : 0}{' '}
          of {table.getPageCount()}
        </span>
        <div className="flex gap-1">
          <Button
            size="icon-sm"
            variant="outline"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label="Previous page"
          >
            <ChevronLeft />
          </Button>
          <Button
            size="icon-sm"
            variant="outline"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label="Next page"
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
    </div>
  )
}

/**
 * "Data inspector": a Sheet with a sortable, searchable, paginated
 * TanStack Table of the rows behind a chart.
 */
export function DataInspector<T extends RowData>({
  title,
  description,
  rows,
  columns,
  pageSize,
  triggerLabel = 'Inspect data',
}: DataInspectorProps<T>) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="sm" variant="outline">
          <Table2 /> {triggerLabel}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full gap-0 sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <div className="overflow-y-auto px-4 pb-6">
          <InspectorTable rows={rows} columns={columns} pageSize={pageSize} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
