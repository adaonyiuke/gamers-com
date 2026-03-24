import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://e378e78d76dea8c19793ebce986bfd28@o4511101768433664.ingest.us.sentry.io/4511101769875456",

  // Capture 100% in dev, 10% in production
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  integrations: [
    Sentry.replayIntegration(),
  ],

  // Capture Replay for 10% of all sessions,
  // plus 100% of sessions with an error
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
