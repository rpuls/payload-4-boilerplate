import type { ServerProps } from 'payload'

import { PayloadLink } from '@payloadcms/ui'
import React from 'react'

import { hasRole } from '@/access/roles'

/** Sidebar link to the admin-wide "Connected apps" overview. Admins only. */
export const ConnectedAppsNavLink: React.FC<ServerProps> = ({ payload, user }) => {
  if (!hasRole(user, 'admin')) return null

  return (
    <PayloadLink
      className="nav__link"
      href={`${payload.config.routes.admin}/connected-apps`}
      id="nav-connected-apps"
    >
      <span className="nav__link-label">Connected apps</span>
    </PayloadLink>
  )
}
