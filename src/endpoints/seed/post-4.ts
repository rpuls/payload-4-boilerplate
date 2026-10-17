import type { Media } from '@/payload-types'

import type { PostContent } from './types'
import { a, BOLD, bullet, demoDisclaimer, h, p, root, t } from './lexical'

const feature = (label: string, text: string) => p(t(`${label}: `, BOLD), t(text))

export const post4 = ({ heroImage }: { heroImage: Media }): PostContent => ({
  slug: 'vendure-open-source-ecommerce',
  title: 'Vendure: A Powerful Open-Source E-commerce Solution',
  heroImage: heroImage.id,
  content: root([
    h(
      'h2',
      'Discover how Vendure can revolutionize your e-commerce development and deployment process.',
    ),
    demoDisclaimer(),
    p(
      t(
        "In the ever-evolving world of e-commerce, finding the right platform can be a game-changer for your business. Today, we're excited to introduce you to Vendure, an open-source e-commerce solution that's been gaining traction in the developer community. Let's explore what makes Vendure stand out and how you can easily deploy it on Railway.",
      ),
    ),

    h('h2', 'What is Vendure?'),
    p(
      t(
        'Vendure is a headless e-commerce framework built with TypeScript and Node.js. It provides a solid foundation for any commerce application, including inventory management, orders, customers, taxes, promotions, and more. What sets Vendure apart is its focus on developer experience and extensibility.',
      ),
    ),

    h('h2', 'Key Features of Vendure'),
    feature('Headless Architecture', 'Allows for flexible front-end implementations'),
    feature('GraphQL API', 'Powerful and efficient data querying'),
    feature('Admin UI', 'Intuitive interface for managing your store'),

    h('h2', 'Deploying Vendure on Railway'),
    p(
      t(
        "To make it easier for developers to get started with Vendure, we've created a one-click deploy template for Railway. This template sets up everything you need to run a Vendure store, including:",
      ),
    ),
    bullet('Complete Setup', 'Vendure backend, admin dashboard, and storefront'),
    bullet(
      'Built-in Features',
      'Asset storage and pre-installed plugins for Stripe payment and SendGrid email',
    ),
    p(
      t('Ready to get started? Check out our full tutorial on deploying Vendure on Railway: '),
      a('Vendure Deployment Tutorial', 'https://funkyton.com/vendure-tutorial/'),
    ),
    p(
      t('For those who want to explore the code, you can find our Vendure boilerplate on GitHub: '),
      a('Vendure Railway Boilerplate', 'https://github.com/rpuls/vendure-boilerplate'),
    ),

    h('h2', 'Conclusion'),
    p(
      t(
        "Vendure offers a powerful, flexible solution for businesses looking to build or upgrade their e-commerce platform. With its focus on developer experience and extensibility, it's an excellent choice for teams that want to create unique, tailored shopping experiences. By leveraging our Railway template, you can have a Vendure store up and running in no time, allowing you to focus on what matters most: growing your business.",
      ),
    ),
  ]),
  meta: {
    title: 'Vendure: A Powerful Open-Source E-commerce Solution',
    description:
      'Discover how Vendure can revolutionize your e-commerce development and deployment process.',
    image: heroImage.id,
  },
})
