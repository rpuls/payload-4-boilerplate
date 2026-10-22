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

type Props = {
  clientName: string
  clientUri: null | string
  decisionAction: string
  /** Where the browser goes after the decision, shown so people can recognise the app */
  redirectHost: string
  requestToken: string
  siteHost: string
  switchAccountHref: string
  userEmail: string
  userName: null | string
}

/**
 * "<client> wants to act as <user> on <site>". A plain HTML form: the signed request token in
 * the hidden field is the only state, and the decision buttons post straight to Payload.
 */
export const ConsentCard: React.FC<Props> = ({
  clientName,
  clientUri,
  decisionAction,
  redirectHost,
  requestToken,
  siteHost,
  switchAccountHref,
  userEmail,
  userName,
}) => {
  return (
    <main className="container flex justify-center py-16 md:py-24">
      <Card className="w-full max-w-xl">
        <CardHeader className="gap-3">
          <CardDescription>Sign-in request</CardDescription>
          <CardTitle className="text-2xl leading-tight" data-testid="consent-title">
            <span className="text-primary">{clientName}</span> wants to act as{' '}
            <span>{userName || userEmail}</span> on {siteHost}
          </CardTitle>
          <CardDescription>
            You are signed in as {userEmail}.{' '}
            <a className="underline hover:text-foreground" href={switchAccountHref}>
              Not you?
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              It gets the same permissions as you: what you can read and change, it can read and
              change. Nothing more.
            </li>
            <li>Changes it makes are recorded under your name.</li>
            <li>
              You can revoke this access at any time under <strong>Connected apps</strong> on your
              account in the admin.
            </li>
          </ul>
          <p className="text-muted-foreground">
            After you decide, you will be sent back to{' '}
            <strong className="text-foreground">{redirectHost}</strong>.
            {clientUri ? (
              <>
                {' '}
                App website:{' '}
                <a
                  className="underline hover:text-foreground"
                  href={clientUri}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {clientUri}
                </a>
              </>
            ) : null}
          </p>
        </CardContent>
        <CardFooter>
          <form action={decisionAction} className="flex w-full justify-end gap-3" method="post">
            <input name="request" type="hidden" value={requestToken} />
            <Button name="decision" type="submit" value="deny" variant="outline">
              Deny
            </Button>
            <Button name="decision" type="submit" value="allow">
              Allow
            </Button>
          </form>
        </CardFooter>
      </Card>
    </main>
  )
}
