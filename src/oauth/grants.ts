import type { Payload } from 'payload'

import { getClientRedirectUris } from './clients'
import { redirectUriHost } from './redirectUris'

/** A grant as shown in the "Connected apps" views, with nothing secret in it */
export type ConnectedApp = {
  clientHost: null | string
  clientName: string
  clientUri: null | string
  createdAt: string
  id: string
  lastUsedAt: null | string
  user: null | { email: null | string; id: string; name: null | string }
}

/** Active grants, newest first. Without `userId` every user's grants are returned (admins only). */
export const listConnectedApps = async ({
  payload,
  userId,
}: {
  payload: Payload
  userId?: number | string
}): Promise<ConnectedApp[]> => {
  const { docs } = await payload.find({
    collection: 'oauth-grants',
    depth: 1,
    limit: 200,
    overrideAccess: true,
    sort: '-createdAt',
    where: {
      and: [
        { revokedAt: { exists: false } },
        ...(userId !== undefined ? [{ user: { equals: userId } }] : []),
      ],
    },
  })

  return docs.map((grant) => {
    const client = typeof grant.client === 'object' && grant.client ? grant.client : null
    const user = typeof grant.user === 'object' && grant.user ? grant.user : null
    const firstRedirect = client ? getClientRedirectUris(client)[0] : undefined

    return {
      id: String(grant.id),
      clientHost: firstRedirect ? redirectUriHost(firstRedirect) : null,
      clientName: client?.clientName ?? 'Unknown app',
      clientUri: client?.clientUri ?? null,
      createdAt: grant.createdAt,
      lastUsedAt: grant.lastUsedAt ?? null,
      user: user
        ? { id: String(user.id), email: user.email ?? null, name: user.name ?? null }
        : null,
    }
  })
}
