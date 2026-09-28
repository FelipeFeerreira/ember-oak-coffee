// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LeadStatusEditor } from "@/components/admin/lead-status";

const mocks = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); mocks.refresh.mockReset(); });

describe("owner lead status editor", () => {
  it("sends a status change with the last known state and refreshes after saving", async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: "CONTACTED" }) });
    vi.stubGlobal("fetch", fetch); const user = userEvent.setup();
    render(<LeadStatusEditor id="lead-test" status="OPEN" />);
    await user.selectOptions(screen.getByLabelText("Request status"), "CONTACTED");
    await user.click(screen.getByRole("button", { name: "Save status" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Status saved.");
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ status: "CONTACTED", expectedStatus: "OPEN" });
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });
  it("announces conflicts without claiming the change was saved", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: "This request changed. Refresh before trying again." }) }));
    const user = userEvent.setup(); render(<LeadStatusEditor id="lead-test" status="OPEN" />);
    await user.selectOptions(screen.getByLabelText("Request status"), "CLOSED");
    await user.click(screen.getByRole("button", { name: "Save status" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Refresh");
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
});
