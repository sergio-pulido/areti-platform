import { describe, expect, it } from "vitest";
import {
  getActiveNavSectionForRole,
  getMobileNavigationContext,
  getNavSectionForPathname,
} from "./navigation";

describe("navigation section resolver", () => {
  it("maps nested academy routes to academy", () => {
    expect(getNavSectionForPathname("/academy/works/marcus-aurelius").id).toBe("academy");
  });

  it("maps chat aliases to companion section", () => {
    expect(getNavSectionForPathname("/chat/new").id).toBe("companion");
  });

  it("maps deep account pages to account section", () => {
    expect(getNavSectionForPathname("/account/password").id).toBe("account");
  });

  it("falls back to personal section for unknown authenticated routes", () => {
    expect(getNavSectionForPathname("/unmapped/private-area").id).toBe("personal");
  });

  it("falls back to personal when non-admin hits admin routes", () => {
    expect(getActiveNavSectionForRole("/admin/users", "user").id).toBe("personal");
  });
});

describe("mobile navigation context", () => {
  it("returns companion contextual items for chat routes", () => {
    const context = getMobileNavigationContext("/chat", "user");

    expect(context.activeSection.id).toBe("companion");
    expect(context.contextualPrimaryItems.map((item) => item.label)).toEqual(["Threads", "New chat"]);
    expect(context.activeContextualHref).toBe("/chat");
  });

  it("uses section fallback item highlight for deep account aliases", () => {
    const context = getMobileNavigationContext("/account/settings", "user");

    expect(context.activeSection.id).toBe("account");
    expect(context.activeContextualHref).toBe("/account/profile");
  });

  it("keeps admin context for admin users", () => {
    const context = getMobileNavigationContext("/admin/audit", "admin");

    expect(context.activeSection.id).toBe("admin");
    expect(context.contextualPrimaryItems.some((item) => item.href === "/admin/audit")).toBe(true);
  });
});
