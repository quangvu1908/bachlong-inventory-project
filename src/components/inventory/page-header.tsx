'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description?: string
  code?: string
  accent?: string
  actions?: React.ReactNode
}

export function PageHeader({
  icon: Icon,
  title,
  description,
  code,
  accent = 'from-primary/15 to-accent/10 text-primary',
  actions,
}: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-3 pb-6 sm:flex-row sm:items-end sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br ring-1 ring-border/40',
            accent
          )}
        >
          <Icon className="size-6" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {title}
            </h1>
            {code && (
              <Badge variant="secondary" className="font-mono text-[10px]">
                {code}
              </Badge>
            )}
          </div>
          {description && (
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </motion.div>
  )
}

/** Standard page container with consistent padding */
export function PageContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      {children}
    </div>
  )
}
