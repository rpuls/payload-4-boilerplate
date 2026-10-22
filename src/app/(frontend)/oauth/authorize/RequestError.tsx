import Link from 'next/link'
import React from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const KNOWN_REASONS: Record<string, { description: string; title: string }> = {
  expired: {
    title: 'This sign-in request has expired',
    description: 'Go back to the app that asked for access and connect again.',
  },
  unknown_client: {
    title: 'This app is no longer registered',
    description: 'Go back to the app that asked for access and connect again.',
  },
}

type Props = {
  description?: string
  error?: string
  reason?: string
}

/**
 * Shown when an authorization request cannot be trusted enough to send the visitor anywhere:
 * an unknown client or an unregistered redirect URI. Never redirects.
 */
export const RequestError: React.FC<Props> = ({ description, error, reason }) => {
  const known = reason ? KNOWN_REASONS[reason] : undefined
  const title = known?.title ?? 'This sign-in request is not valid'
  const text =
    known?.description ?? description ?? 'Go back to the app that asked for access and try again.'

  return (
    <main className="container flex justify-center py-16 md:py-24">
      <Card className="w-full max-w-xl">
        <CardHeader className="gap-3">
          <CardDescription>Sign-in request</CardDescription>
          <CardTitle className="text-2xl leading-tight">{title}</CardTitle>
          <CardDescription>{text}</CardDescription>
        </CardHeader>
        {error ? (
          <CardContent>
            <code className="text-muted-foreground text-xs">{error}</code>
          </CardContent>
        ) : null}
        <CardFooter>
          <Button asChild variant="outline">
            <Link href="/">Go to the website</Link>
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}
