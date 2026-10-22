import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import React from 'react'

import {
  buildAuthorizeURL,
  createConsentToken,
  parseAuthorizationRequest,
  type SearchParams,
} from '@/oauth/authorize'
import { redirectUriHost } from '@/oauth/redirectUris'
import { getIssuer, oauthPaths } from '@/oauth/urls'

import { ConsentCard } from './ConsentCard'
import { RequestError } from './RequestError'
import { SameOriginBounce } from './SameOriginBounce'

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: 'Allow access',
}

type Args = {
  searchParams: Promise<SearchParams>
}

/**
 * The OAuth authorization endpoint. An MCP client such as ChatGPT sends the user here. After
 * signing in through the normal admin login, the user sees who is asking and allows or denies;
 * the decision is posted to /api/oauth/authorize, which redirects back to the client.
 */
export default async function AuthorizePage({ searchParams }: Args) {
  const params = await searchParams
  const payload = await getPayload({ config: configPromise })

  // The decision endpoint sends people back here when their request can no longer be used
  if (typeof params.reason === 'string' && !params.client_id) {
    return <RequestError reason={params.reason} />
  }

  const parsed = await parseAuthorizationRequest({ params, payload })
  if (parsed.kind === 'invalid') {
    return <RequestError description={parsed.description} error={parsed.error} />
  }
  if (parsed.kind === 'redirect') redirect(parsed.url)

  const headers = await getHeaders()
  const { user } = await payload.auth({ headers })
  const authorizeURL = buildAuthorizeURL(parsed.request)

  if (!user) {
    // When `serverURL` is configured, Payload ignores its login cookie on cross-site navigations,
    // and arriving from chatgpt.com is one. Hop once through this origin before concluding that
    // the visitor is signed out.
    if (payload.config.csrf.length > 0 && headers.get('sec-fetch-site') === 'cross-site') {
      return <SameOriginBounce href={authorizeURL} />
    }
    redirect(`${payload.config.routes.admin}/login?redirect=${encodeURIComponent(authorizeURL)}`)
  }

  const requestToken = createConsentToken({
    clientRecordId: parsed.client.id,
    request: parsed.request,
    secret: payload.secret,
    userId: user.id,
  })

  return (
    <ConsentCard
      clientName={parsed.client.clientName}
      clientUri={parsed.client.clientUri ?? null}
      decisionAction={oauthPaths.decision}
      redirectHost={redirectUriHost(parsed.request.redirectUri)}
      requestToken={requestToken}
      siteHost={new URL(getIssuer()).host}
      switchAccountHref={`${oauthPaths.switchAccount}?request=${encodeURIComponent(requestToken)}`}
      userEmail={user.email}
      userName={user.name ?? null}
    />
  )
}
