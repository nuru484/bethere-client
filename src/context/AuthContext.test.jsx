// src/context/AuthContext.test.jsx
//
// Logout has to clear the React Query cache SYNCHRONOUSLY. The axios timeout
// is 3 minutes, so a logout fired while the API is unreachable settles long
// after the user could have signed back in - and clearing from that
// continuation wiped the new session's cache.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import { useContext } from "react";
import PropTypes from "prop-types";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AuthContext, { AuthProvider } from "@/context/AuthContext";
import { AUTHED_FLAG } from "@/lib/auth-flag";

vi.mock("@/api/auth", () => ({
  getMe: vi.fn(),
  logoutApi: vi.fn(),
}));

import { getMe, logoutApi } from "@/api/auth";

const SESSION_KEY = ["users", {}];

const Consumer = () => {
  const { user, logout } = useContext(AuthContext);
  return (
    <>
      <span data-testid="user">{user ? user.id : "none"}</span>
      <button onClick={logout}>Log out</button>
    </>
  );
};

const renderAuth = (client) => {
  const wrapper = ({ children }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  wrapper.propTypes = { children: PropTypes.node };

  return render(
    <AuthProvider>
      <Consumer />
    </AuthProvider>,
    { wrapper }
  );
};

describe("AuthContext logout", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => localStorage.clear());

  it("cannot let a slow logout request clear a later session's cache", async () => {
    getMe.mockResolvedValue({ data: { user: { id: "outgoing" } } });

    // The unreachable API: this settles only when the 3-minute axios timeout
    // finally aborts, which the test triggers by hand below.
    let failSlowLogout;
    logoutApi.mockReturnValue(
      new Promise((_resolve, reject) => {
        failSlowLogout = reject;
      })
    );

    const client = new QueryClient();
    renderAuth(client);

    await waitFor(() =>
      expect(screen.getByTestId("user")).toHaveTextContent("outgoing")
    );

    client.setQueryData(SESSION_KEY, "outgoing principal data");

    await act(async () => {
      screen.getByRole("button", { name: "Log out" }).click();
    });

    // Cleared right there, not three minutes later.
    expect(client.getQueryData(SESSION_KEY)).toBeUndefined();
    expect(screen.getByTestId("user")).toHaveTextContent("none");
    expect(localStorage.getItem(AUTHED_FLAG)).toBeNull();

    // A new principal signs in and their data lands in the cache...
    client.setQueryData(SESSION_KEY, "incoming principal data");

    // ...and only now does the abandoned logout request give up.
    await act(async () => {
      failSlowLogout(new Error("timeout of 180000ms exceeded"));
      await Promise.resolve();
    });

    expect(client.getQueryData(SESSION_KEY)).toBe("incoming principal data");
  });
});
