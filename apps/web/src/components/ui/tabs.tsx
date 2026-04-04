"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Tabs as TabsPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        "group/tabs flex gap-2 data-[orientation=horizontal]:flex-col",
        className
      )}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center justify-center rounded-lg p-[3px] text-muted-foreground group-data-[orientation=horizontal]/tabs:h-9 group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col data-[variant=line]:rounded-none",
  {
    variants: {
      variant: {
        default: "bg-muted",
        line: "gap-1 bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function TabsLineList({
  className,
  variant,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>) {
  const wrapperRef = React.useRef<HTMLDivElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)
  const [indicator, setIndicator] = React.useState({
    left: 0,
    width: 0,
    bottom: 0,
  })

  const updateIndicator = React.useCallback(() => {
    const wrap = wrapperRef.current
    const list = listRef.current
    if (!wrap || !list) return
    const active = list.querySelector(
      '[data-slot="tabs-trigger"][data-state="active"]',
    ) as HTMLElement | null
    if (!active) {
      setIndicator({ left: 0, width: 0, bottom: 0 })
      return
    }
    const wr = wrap.getBoundingClientRect()
    const lr = list.getBoundingClientRect()
    const ar = active.getBoundingClientRect()
    // Align the bar with the list’s bottom border (separator), not the wrapper’s
    // bottom — e.g. margin-bottom on the list sits outside the border box and
    // can make the wrapper extend below the border line.
    const bottom = Math.max(0, wr.bottom - lr.bottom)
    setIndicator({
      left: ar.left - wr.left,
      width: ar.width,
      bottom,
    })
  }, [])

  React.useLayoutEffect(() => {
    updateIndicator()
    const wrap = wrapperRef.current
    const list = listRef.current
    if (!wrap || !list) return

    const ro = new ResizeObserver(() => {
      updateIndicator()
    })
    ro.observe(wrap)
    ro.observe(list)

    const mo = new MutationObserver(() => {
      updateIndicator()
    })
    mo.observe(list, {
      subtree: true,
      attributes: true,
      attributeFilter: ["data-state"],
    })

    window.addEventListener("resize", updateIndicator)
    return () => {
      ro.disconnect()
      mo.disconnect()
      window.removeEventListener("resize", updateIndicator)
    }
  }, [updateIndicator])

  return (
    <div ref={wrapperRef} className="relative w-full">
      <TabsPrimitive.List
        ref={listRef}
        data-slot="tabs-list"
        data-variant={variant}
        className={cn(tabsListVariants({ variant }), className)}
        {...props}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-0 z-10 h-0.5 origin-left bg-foreground transition-[transform,width,bottom] duration-300 ease-out motion-reduce:transition-none"
        style={{
          bottom: indicator.bottom,
          transform: `translate3d(${indicator.left}px,0,0)`,
          width: indicator.width || undefined,
          opacity: indicator.width > 0 ? 1 : 0,
        }}
      />
    </div>
  )
}

function TabsList({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>) {
  if (variant === "line") {
    return (
      <TabsLineList className={className} variant={variant} {...props} />
    )
  }
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap text-foreground/60 transition-all group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 group-data-[variant=default]/tabs-list:data-[state=active]:shadow-sm group-data-[variant=line]/tabs-list:data-[state=active]:shadow-none dark:text-muted-foreground dark:hover:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-[state=active]:bg-transparent dark:group-data-[variant=line]/tabs-list:data-[state=active]:border-transparent dark:group-data-[variant=line]/tabs-list:data-[state=active]:bg-transparent",
        "data-[state=active]:bg-background data-[state=active]:text-foreground dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 dark:data-[state=active]:text-foreground",
        "after:absolute after:bg-foreground after:opacity-0 after:transition-opacity group-data-[orientation=horizontal]/tabs:after:inset-x-0 group-data-[orientation=horizontal]/tabs:after:bottom-[-5px] group-data-[orientation=horizontal]/tabs:after:h-0.5 group-data-[orientation=vertical]/tabs:after:inset-y-0 group-data-[orientation=vertical]/tabs:after:-right-1 group-data-[orientation=vertical]/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-[state=active]:after:opacity-100",
        "group-data-[variant=line]/tabs-list:group-data-[orientation=horizontal]/tabs:after:bottom-[-2.5px]",
        "group-data-[variant=line]/tabs-list:group-data-[orientation=horizontal]/tabs:after:hidden",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
