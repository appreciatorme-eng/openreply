import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth", () => ({ default: vi.fn(() => ({})) }));
vi.mock("@auth/prisma-adapter", () => ({ PrismaAdapter: vi.fn(() => ({})) }));
vi.mock("@/lib/db/client", () => ({ prisma: {} }));
vi.mock("@/lib/workspace", () => ({
  ensureWorkspaceForUser: vi.fn(),
  getPrimaryWorkspace: vi.fn(),
}));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("email sign-in provider", () => {
  it("generates a verification message with Auth.js and Nodemailer", async () => {
    const server = "smtp://synthetic.invalid:2525";
    const from = "OpenReply <login@example.invalid>";
    vi.stubEnv("EMAIL_SERVER", server);
    vi.stubEnv("EMAIL_FROM", from);

    const { authConfig, EMAIL_PROVIDER_ID } = await import("@/lib/auth");
    const provider = authConfig.providers[0];
    const url = "https://openreply.example.invalid/login?token=synthetic";

    expect(EMAIL_PROVIDER_ID).toBe("nodemailer");
    expect(provider.id).toBe("nodemailer");
    expect(provider.options).toMatchObject({ server, from });
    // Nodemailer's JSON transport generates the message in memory.
    await expect(
      provider.sendVerificationRequest({
        identifier: "test@example.invalid",
        provider: { ...provider, server: { jsonTransport: true }, from },
        url,
        token: "synthetic",
        expires: new Date(),
        theme: {},
        request: new Request(url),
      }),
    ).resolves.toBeUndefined();
  });
});
