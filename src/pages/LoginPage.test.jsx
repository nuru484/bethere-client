// src/pages/LoginPage.test.jsx
//
// Orchestration of the password + 2FA login steps with the auth hooks and
// the 2FA step component stubbed: a login response flagged twoFactorRequired
// must swap to the 2FA step, an expired pending session must bounce back to
// the credentials form, and a plain success must adopt the user and navigate
// to the dashboard.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import PropTypes from "prop-types";

const loginMutate = vi.fn();
const logUserIn = vi.fn();
const navigate = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => navigate };
});

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: null, login: logUserIn, isLoading: false }),
  useLogin: () => ({ mutate: loginMutate, isPending: false }),
  useOtpRequest: () => ({ mutate: vi.fn(), isPending: false }),
  useOtpVerify: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@/api/auth", () => ({
  demoLogin: vi.fn(),
}));

vi.mock("react-hot-toast", () => ({
  default: { error: vi.fn(), success: vi.fn() },
}));

// The theme toggle needs a ThemeProvider (and matchMedia); irrelevant here.
vi.mock("@/components/ThemeToggle", () => ({
  default: () => null,
}));

// Stub the 2FA step so the test can drive its callbacks without a real
// code form.
vi.mock("@/components/auth/TwoFactorStep", () => {
  const TwoFactorStepStub = ({ onSuccess, onExpired }) => (
    <div>
      <p>two-factor-step</p>
      <button
        type="button"
        onClick={() =>
          onSuccess({
            message: "Login successful",
            data: { user: { id: 1, role: "ADMIN" } },
          })
        }
      >
        stub 2fa success
      </button>
      <button
        type="button"
        onClick={() => onExpired("Your login session expired.")}
      >
        stub 2fa expired
      </button>
    </div>
  );
  TwoFactorStepStub.propTypes = {
    onSuccess: PropTypes.func.isRequired,
    onExpired: PropTypes.func.isRequired,
  };
  return { default: TwoFactorStepStub };
});

import LoginPage from "@/pages/LoginPage";

const renderLoginPage = () => {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/login"]}>
        <LoginPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

const submitCredentials = async (user) => {
  await user.type(
    screen.getByPlaceholderText("Enter your email"),
    "admin@example.com"
  );
  await user.type(screen.getByPlaceholderText("Enter your password"), "pw");
  await user.click(screen.getByRole("button", { name: /^sign in$/i }));
};

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the 2FA step when login comes back 2FA-pending", async () => {
    loginMutate.mockImplementation((data, { onSuccess }) =>
      onSuccess({
        message: "Enter the verification code we sent you.",
        data: { twoFactorRequired: true, channel: "EMAIL" },
      })
    );

    const user = userEvent.setup();
    renderLoginPage();

    await submitCredentials(user);

    expect(loginMutate).toHaveBeenCalledWith(
      { email: "admin@example.com", password: "pw" },
      expect.any(Object)
    );
    expect(screen.getByText("two-factor-step")).toBeInTheDocument();
    // Not signed in yet - the pending cookie only proves the password step.
    expect(logUserIn).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalledWith("/dashboard", { replace: true });
  });

  it("bounces back to the credentials form when the 2FA session expired", async () => {
    loginMutate.mockImplementation((data, { onSuccess }) =>
      onSuccess({ data: { twoFactorRequired: true, channel: "EMAIL" } })
    );

    const user = userEvent.setup();
    renderLoginPage();

    await submitCredentials(user);
    expect(screen.getByText("two-factor-step")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "stub 2fa expired" }));

    expect(screen.queryByText("two-factor-step")).not.toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Enter your password")
    ).toBeInTheDocument();
  });

  it("adopts the user and navigates on a plain successful login", async () => {
    const response = {
      message: "Login Successful",
      data: { user: { id: 9, role: "ADMIN" } },
    };
    loginMutate.mockImplementation((data, { onSuccess }) =>
      onSuccess(response)
    );

    const user = userEvent.setup();
    renderLoginPage();

    await submitCredentials(user);

    expect(logUserIn).toHaveBeenCalledWith(response.data.user);
    expect(navigate).toHaveBeenCalledWith("/dashboard", { replace: true });
  });

  it("completes the flow when the 2FA step succeeds", async () => {
    loginMutate.mockImplementation((data, { onSuccess }) =>
      onSuccess({ data: { twoFactorRequired: true, channel: "SMS" } })
    );

    const user = userEvent.setup();
    renderLoginPage();

    await submitCredentials(user);
    await user.click(screen.getByRole("button", { name: "stub 2fa success" }));

    expect(logUserIn).toHaveBeenCalledWith({ id: 1, role: "ADMIN" });
    expect(navigate).toHaveBeenCalledWith("/dashboard", { replace: true });
  });
});
