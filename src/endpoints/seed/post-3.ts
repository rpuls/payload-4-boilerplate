import type { Media } from '@/payload-types'

import type { PostContent } from './types'
import { a, banner, BOLD, bullet, demoDisclaimer, h, p, root, t } from './lexical'

const articleURL = 'https://funkyton.com/medusajs-2-0-is-finally-here/'
const repoURL = 'https://github.com/rpuls/medusajs-2.0-for-railway-boilerplate'
const deployURL = 'https://railway.com/deploy/medusajs-2-0-storefront?referralCode=-Yg50p'

export const post3 = ({ heroImage }: { heroImage: Media }): PostContent => ({
  slug: 'medusa-2-railway-boilerplate',
  title: 'Medusa 2.0 on Railway: a one-click open-source webshop',
  heroImage: heroImage.id,
  content: root([
    h('h2', 'A complete Medusa 2.0 store, backend, admin and storefront, deployed and wired together in minutes.'),
    demoDisclaimer(),
    p(
      t(
        'Medusa is an open-source commerce platform: a headless backend with an admin dashboard, built to be customized instead of fought with. Version 2.0 reworked the admin, added multi-warehouse inventory and a new promotions engine, and rebuilt the architecture so custom features and data model changes are much easier to add.',
      ),
    ),
    p(
      t(
        'Getting a real store running still means a backend, a storefront, a database, Redis, search and file storage, all configured to talk to each other. The ',
      ),
      a('Medusa 2.0 Railway boilerplate', repoURL),
      t(' does all of that for you.'),
    ),

    h('h2', "What's in the template"),
    bullet('Storefront', 'a classic Next.js webshop, ready to customize'),
    bullet('Medusa 2 backend and admin', 'with an admin user created for you, using a strong random password'),
    bullet('PostgreSQL and Redis', 'provisioned and connected automatically'),
    bullet('MeiliSearch', 'fast product search, already wired into the storefront'),
    bullet('A Railway storage bucket', 'S3-compatible media storage, served through a small built-in proxy'),
    bullet('Optional integrations', 'Stripe payments and Resend or SendGrid email, switched on by adding an API key'),

    h('h2', 'No manual setup'),
    p(
      t(
        'Every service is configured and connected when it is created. The publishable API key is shared between backend and storefront automatically, the JWT and cookie secrets are generated for you, and health checks mean a green checkmark on Railway really does mean the store is ready.',
      ),
    ),

    h('h2', 'Deploy it'),
    p(
      t('You need a GitHub account and a Railway account connected to it. Click '),
      a('Deploy on Railway', deployURL, BOLD),
      t(
        ', wait for the health checks to turn green, then sign in to the admin with the generated credentials and start adding products.',
      ),
    ),
    p(
      t('Want to work on it locally first? Follow '),
      a('how to run the Medusa 2.0 boilerplate locally', 'https://funkyton.com/how-to-run-your-medusajs-2-0-boilerplate-locally/'),
      t('. There are also guides for '),
      a('adding Stripe', 'https://funkyton.com/add-stripe-payment-module-to-medusajs-2-0/'),
      t(' and '),
      a('adding MeiliSearch', 'https://funkyton.com/how-to-add-meilisearch-to-your-medusa-2-0-project-2/'),
      t('.'),
    ),

    banner(
      'success',
      [
        p(
          t('Get started: ', BOLD),
          a('Deploy on Railway', deployURL),
          t(' · '),
          a('Source on GitHub', repoURL),
          t(' · '),
          a('Full setup guide on FUNKYTON', articleURL),
        ),
      ],
      'Get started',
    ),
  ]),
  meta: {
    title: 'Medusa 2.0 on Railway: a one-click open-source webshop',
    description:
      'Deploy a complete Medusa 2.0 store on Railway with storefront, admin, Postgres, Redis, MeiliSearch and media storage, all configured for you.',
    image: heroImage.id,
  },
})
