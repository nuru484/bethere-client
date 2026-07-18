// src/components/auth/TwoFactorStep.test.jsx
//
// Renders the 2FA login step with a mocked api module and drives the
// 6-digit code form: typing the code and submitting must POST it to
// /auth/login/2fa (via the mocked verify2fa), and a 401 with code
// "2FA_PENDING_EXPIRED" must bounce back to the password step.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import TwoFactorStep from "@/components/auth/TwoFactorStep";

vi.mock("@/api/auth", () => ({
  verify2fa: vi.fn(),
}));

vi.mock("react-hot-toast", () => ({
  default: { error: vi.fn(), success: vi.fn() },
}));

import { verify2fa } from "@/api/auth";

const renderStep = (props = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });

  const handlers = {
    onSuccess: vi.fn(),
    onExpired: vi.fn(),
    onBack: vi.fn(),
    ...props,
  };

  render(
    <QueryClientProvider client={queryClient}>
      <TwoFactorStep channel="EMAIL" {...handlers} />
    </QueryClientProvider>
  );

  return handlers;
};

const typeCode = async (user, code) => {
  const inputs = screen.getAllByRole("textbox");
  for (let i = 0; i < code.length; i++) {
    await user.type(inputs[i], code[i]);
  }
};

describe("TwoFactorStep", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submits the entered code to the 2FA endpoint and reports success", async () => {
    const response = {
      message: "Login successful",
      data: { user: { id: 1, role: "ADMIN" } },
    };
    verify2fa.mockResolvedValue(response);

    const user = userEvent.setup();
    const { onSuccess } = renderStep();

    await typeCode(user, "123456");
    await user.click(
      screen.getByRole("button", { name: /verify and sign in/i })
    );

    await waitFor(() => {
      expect(verify2fa).toHaveBeenCalledWith({ code: "123456" });
    });
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(response);
    });
  });

  it("keeps the submit button disabled until all six digits are entered", async () => {
    const user = userEvent.setup();
    renderStep();

    const submit = screen.getByRole("button", {
      name: /verify and sign in/i,
    });
    expect(submit).toBeDisabled();

    await typeCode(user, "123456");
    expect(submit).toBeEnabled();
  });

  it("returns to the password step when the pending session expired", async () => {
    verify2fa.mockRejectedValue({
      status: 401,
      data: {
        status: "error",
        message: "Your login expired. Please sign in again.",
        code: "2FA_PENDING_EXPIRED",
      },
    });

    const user = userEvent.setup();
    const { onExpired, onSuccess } = renderStep();

    await typeCode(user, "654321");
    await user.click(
      screen.getByRole("button", { name: /verify and sign in/i })
    );

    await waitFor(() => {
      expect(onExpired).toHaveBeenCalled();
    });
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
