import type { UIFieldServerProps } from 'payload'

import React from 'react'

import { hasRole } from '@/access/roles'
import { listConnectedApps } from '@/oauth/grants'

import { GrantsList } from './GrantsList'
import './index.css'

/**
 * "Connected apps" on a user's account: the AI assistants and other apps that may act as this
 * user over MCP. A UI field on the users collection, so it shows on /admin/account and, for
 * admins, on every user's edit view.
 */
export async function ConnectedAppsField({ data, payload, req }: UIFieldServerProps) {
  const viewer = req.user
  const targetId = data?.id as number | string | undefined
  if (!viewer || targetId === undefined || targetId === null) return null

  const isSelf = String(viewer.id) === String(targetId)
  if (!isSelf && !hasRole(viewer, 'admin')) return null

  const apps = await listConnectedApps({ payload, userId: targetId })

  return (
    <div className="connected-apps" id="connected-apps">
      <h3 className="connected-apps__title">Connected apps</h3>
      <p className="connected-apps__description">
        {isSelf
          ? 'Apps you have allowed to act as you over MCP, for example ChatGPT. They get exactly your permissions, and revoking stops them immediately.'
          : 'Apps this user has allowed to act as them over MCP.'}
      </p>
      <GrantsList
        apiRoute={payload.config.routes.api}
        apps={apps}
        emptyText={
          isSelf ? 'No apps are connected to your account.' : 'No apps are connected to this account.'
        }
      />
    </div>
  )
}
