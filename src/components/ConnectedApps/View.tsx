import type { AdminViewServerProps } from 'payload'

import { Gutter, PayloadLink } from '@payloadcms/ui'
import React from 'react'

import { hasRole } from '@/access/roles'
import { listConnectedApps } from '@/oauth/grants'

import { GrantsList } from './GrantsList'
import './index.css'

/**
 * /admin/connected-apps: every app that may act as any user over MCP, for admins. Payload wraps
 * custom views in the admin template and sends signed-out visitors to the login page.
 */
export async function ConnectedAppsView({ initPageResult }: AdminViewServerProps) {
  const { payload, user } = initPageResult.req
  const { admin: adminRoute, api: apiRoute } = payload.config.routes

  if (!user || !hasRole(user, 'admin')) {
    return (
      <Gutter className="connected-apps-view">
        <h1>Connected apps</h1>
        <p>
          Only admins can see every user&apos;s connected apps. Your own are listed on{' '}
          <PayloadLink href={`${adminRoute}/account`}>your account</PayloadLink>.
        </p>
      </Gutter>
    )
  }

  const apps = await listConnectedApps({ payload })

  return (
    <Gutter className="connected-apps-view">
      <h1>Connected apps</h1>
      <p className="connected-apps__description">
        Every AI assistant and app that is allowed to act as a user over MCP. Revoking removes its
        tokens immediately; the app has to ask the user again.
      </p>
      <GrantsList apiRoute={apiRoute} apps={apps} emptyText="No apps are connected." showUser />
    </Gutter>
  )
}
