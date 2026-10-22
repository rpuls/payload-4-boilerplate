import type { Endpoint } from 'payload'

import { hasRole } from '@/access/roles'

import { isSameOriginRequest } from '../http'
import { relationId, revokeGrant, sameId } from '../tokens'

/**
 * Revocation from the admin's "Connected apps" views. Users may revoke their own grants, admins
 * anyone's. Cookie-authenticated, so only same-origin requests are accepted.
 */
export const revokeGrantEndpoint: Endpoint = {
  handler: async (req) => {
    if (!isSameOriginRequest(req)) {
      return Response.json({ error: 'Cross-site requests are not accepted' }, { status: 403 })
    }
    if (!req.user) return Response.json({ error: 'Not signed in' }, { status: 401 })

    const id = req.routeParams?.id
    if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(id)) {
      return Response.json({ error: 'Invalid grant id' }, { status: 400 })
    }

    const grant = await req.payload.findByID({
      id,
      collection: 'oauth-grants',
      depth: 0,
      disableErrors: true,
      overrideAccess: true,
    })
    if (!grant) return Response.json({ error: 'Not found' }, { status: 404 })

    const isOwner = sameId(relationId(grant.user), req.user.id)
    if (!isOwner && !hasRole(req.user, 'admin')) {
      return Response.json({ error: 'You can only revoke your own connected apps' }, { status: 403 })
    }

    await revokeGrant(req.payload, grant.id)
    req.payload.logger.info({
      grantId: grant.id,
      msg: 'OAuth: grant revoked from the admin',
      revokedBy: req.user.id,
    })

    return Response.json({ revoked: true }, { headers: { 'Cache-Control': 'no-store' } })
  },
  method: 'delete',
  path: '/oauth/grants/:id',
}
