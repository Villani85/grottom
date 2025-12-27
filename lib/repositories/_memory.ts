import "server-only";

type Store = {
  users: Record<string, any>;
  adminSettings: any;
  newsletterCampaigns: Record<string, any>;
  newsletterSends: Record<string, any>;
  pointsTx: Record<string, any>;
  comments: Record<string, any>;
};

declare global {
  // eslint-disable-next-line no-var
  var __DEMO_STORE__: Store | undefined;
}

export function getDemoStore(): Store {
  if (!globalThis.__DEMO_STORE__) {
    globalThis.__DEMO_STORE__ = {
      users: {},
      adminSettings: null,
      newsletterCampaigns: {},
      newsletterSends: {},
      pointsTx: {},
      comments: {},
    };
  }
  return globalThis.__DEMO_STORE__;
}
