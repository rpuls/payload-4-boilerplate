import { postgresAdapter } from "@payloadcms/db-postgres";
import { sharpTransformer } from "@payloadcms/transformer-sharp";
import path from "path";
import { buildConfig, PayloadRequest } from "payload";
import { fileURLToPath } from "url";

import { Categories } from "./collections/Categories";
import { Comments } from "./collections/Comments";
import { Media, mediaSharpOptions } from "./collections/Media";
import {
  OAuthAuthorizationCodes,
  OAuthClients,
  OAuthGrants,
  OAuthTokens,
} from "./collections/OAuth";
import { Pages } from "./collections/Pages";
import { Posts } from "./collections/Posts";
import { Tags } from "./collections/Tags";
import { Users } from "./collections/Users";
import { Footer } from "./Footer/config";
import { Header } from "./Header/config";
import { plugins } from "./plugins";
import { email } from "./config/email";
import { storage } from "./config/storage";
import { defaultLexical } from "@/fields/defaultLexical";
import { oauthEndpoints } from "./oauth/endpoints";
import { getServerSideURL } from "./utilities/getURL";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    components: {
      // The `BeforeLogin` component renders a message that you see while logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below.
      beforeLogin: ["@/components/BeforeLogin"],
      // The `BeforeDashboard` component renders the welcome block with the "Seed your database" button.
      // Feel free to delete this at any time. Simply remove the line below.
      beforeDashboard: ["@/components/BeforeDashboard"],
      // Admins get a sidebar link to the site-wide list of apps that may act as users over MCP.
      // Every user sees their own under "Connected apps" on their account.
      afterNavLinks: ["@/components/ConnectedApps/NavLink#ConnectedAppsNavLink"],
      views: {
        connectedApps: {
          Component: "@/components/ConnectedApps/View#ConnectedAppsView",
          exact: true,
          path: "/connected-apps",
        },
      },
    },
    // Payload 4's modular dashboard: editors can add, move and resize these widgets themselves
    dashboard: {
      widgets: [
        {
          slug: "pending-comments",
          label: "Pending comments",
          Component: "@/components/Dashboard/PendingComments",
          minWidth: "x-small",
          maxWidth: "medium",
        },
      ],
      defaultLayout: [
        { widgetSlug: "pending-comments", width: "small" },
        { widgetSlug: "activity", width: "large" },
        { widgetSlug: "collections", width: "full" },
      ],
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: Users.slug,
    livePreview: {
      breakpoints: [
        {
          label: "Mobile",
          name: "mobile",
          width: 375,
          height: 667,
        },
        {
          label: "Tablet",
          name: "tablet",
          width: 768,
          height: 1024,
        },
        {
          label: "Desktop",
          name: "desktop",
          width: 1440,
          height: 900,
        },
      ],
    },
  },
  // This config helps us configure global or default features that the other editors can inherit
  editor: defaultLexical,
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || "",
    },
  }),
  collections: [
    {
      slug: "folders",
      folders: true,
      admin: {
        useAsTitle: "name",
      },
      fields: [
        {
          name: "name",
          type: "text",
          required: true,
          label: "Folder Name",
        },
      ],
    },
    Pages,
    Posts,
    Media,
    Categories,
    Tags,
    Comments,
    Users,
    // Bookkeeping for the OAuth sign-in to /api/mcp. Hidden from the admin and every API.
    OAuthClients,
    OAuthAuthorizationCodes,
    OAuthGrants,
    OAuthTokens,
  ],
  cors: [getServerSideURL()].filter(Boolean),
  email,
  endpoints: [
    {
      // Used by the Railway healthcheck (see railway.json)
      path: "/health",
      method: "get",
      handler: () => Response.json({ status: "ok" }),
    },
    // The OAuth authorization server that lets ChatGPT and other MCP clients sign in as a user
    ...oauthEndpoints,
  ],
  globals: [Header, Footer],
  plugins,
  secret: process.env.PAYLOAD_SECRET,
  storage,
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  upload: {
    transformers: [
      sharpTransformer({ collections: { media: mediaSharpOptions } }),
    ],
  },
  jobs: {
    access: {
      run: ({ req }: { req: PayloadRequest }): boolean => {
        // Allow logged in users to execute this endpoint (default)
        if (req.user) return true;

        const secret = process.env.CRON_SECRET;
        if (!secret) return false;

        // If there is no logged in user, then check
        // for the cron secret to be present as an
        // Authorization header:
        const authHeader = req.headers.get("authorization");
        return authHeader === `Bearer ${secret}`;
      },
    },
    // Railway runs the app as a long-lived server, so the job queue can run inside it.
    // This is what publishes posts and pages you schedule with "Schedule publish".
    autoRun: [{ cron: "* * * * *", queue: "default", limit: 20 }],
    shouldAutoRun: () => process.env.DISABLE_JOBS_AUTORUN !== "true",
    tasks: [],
  },
});
