import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the HTTP client so we can assert exactly which endpoints adminService hits.
const deleteMock = vi.fn();
const getMock = vi.fn();

vi.mock("@/services/api", () => ({
  apiClient: {
    delete: (...args: unknown[]) => deleteMock(...args),
    get: (...args: unknown[]) => getMock(...args),
  },
  API_BASE_URL: "",
}));

import adminService from "@/services/admin.service";

describe("adminService delete + cache freshness", () => {
  beforeEach(() => {
    deleteMock.mockReset();
    getMock.mockReset();
    adminService.invalidateAllCaches();
  });

  it("deleteUser hard-deletes by default-call from the UI (soft_delete=false)", async () => {
    deleteMock.mockResolvedValue({ success: true });

    await adminService.deleteUser("u1", false);

    expect(deleteMock).toHaveBeenCalledTimes(1);
    expect(deleteMock).toHaveBeenCalledWith("/auth/user/u1?soft_delete=false");
  });

  it("listAllUsers(force=true) bypasses the proxy admin cache", async () => {
    getMock.mockResolvedValue({ users: [], total: 0 });

    await adminService.listAllUsers(500, true);

    expect(getMock).toHaveBeenCalledTimes(1);
    expect(getMock.mock.calls[0][0]).toContain("bypass_cache=1");
  });

  it("listAllUsers without force does not request a cache bypass", async () => {
    getMock.mockResolvedValue({ users: [], total: 0 });

    await adminService.listAllUsers(500, false);

    expect(getMock).toHaveBeenCalledTimes(1);
    expect(getMock.mock.calls[0][0]).not.toContain("bypass_cache");
  });
});
