import type { Media } from '@/payload-types'

import type { PostContent } from './types'
import { a, BOLD, bullet, demoDisclaimer, h, p, root, t } from './lexical'

const feature = (label: string, text: string) => p(t(`${label}: `, BOLD), t(text))

export const post3 = ({ heroImage }: { heroImage: Media }): PostContent => ({
  slug: 'medusajs-2-0-game-changer',
  title: 'Medusa.js 2.0: A Game-Changer for E-commerce',
  heroImage: heroImage.id,
  content: root([
    h('h2', 'Discover the power of Medusa.js 2.0 and how it revolutionizes e-commerce development.'),
    demoDisclaimer(),
    p(
      t(
        "The e-commerce world is buzzing with excitement as Medusa.js 2.0 has officially been released! This major update brings a host of new features and improvements that are set to revolutionize how we build and manage online stores. In this post, we'll explore what's new in Medusa.js 2.0 and why it's a game-changer for developers and businesses alike.",
      ),
    ),

    h('h2', "What's New in Medusa.js 2.0?"),
    feature('Reworked Admin Dashboard', 'A more intuitive and visually appealing interface.'),
    feature('Enhanced Inventory Management', 'Support for multiple warehouses.'),
    feature('New Promotions Engine', 'More flexible and powerful discount configurations.'),
    feature('Improved Software Architecture', 'Easier customization and feature additions.'),

    h('h2', 'Why Choose Medusa.js 2.0?'),
    p(
      t(
        "Medusa.js 2.0 offers substantial improvements that benefit both business operations and development processes. Whether you're managing inventory or building custom features, this update provides tools that make your e-commerce journey smoother and more efficient.",
      ),
    ),

    h('h2', 'Deploy Medusa.js 2.0 on Railway'),
    p(
      t(
        "To make it even easier to get started with Medusa.js 2.0, we've created a one-click deploy template for Railway. This template includes:",
      ),
    ),
    bullet('Automatic setup', 'Storefront, Redis, and PostgreSQL database'),
    bullet('API key sharing', 'Automatic sharing between backend and storefront'),
    bullet(
      'Built-in features',
      'Internal media storage, health checks, and automatic admin user creation',
    ),
    p(
      t('Ready to get started? Check out our full guide on deploying Medusa.js 2.0 on Railway: '),
      a('Medusa.js 2.0 Deployment Guide', 'https://funkyton.com/medusajs-2-0-is-finally-here/'),
    ),
    p(
      t(
        'For those who want to dive deeper into the code, you can find our Medusa.js 2.0 boilerplate on GitHub: ',
      ),
      a(
        'Medusa.js 2.0 Railway Boilerplate',
        'https://github.com/rpuls/medusajs-2.0-for-railway-boilerplate',
      ),
    ),
  ]),
  meta: {
    title: 'Medusa.js 2.0: A Game-Changer for E-commerce',
    description:
      'Discover the power of Medusa.js 2.0 and how it revolutionizes e-commerce development.',
    image: heroImage.id,
  },
})
