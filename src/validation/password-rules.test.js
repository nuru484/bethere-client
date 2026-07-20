// src/validation/password-rules.test.js
import { describe, it, expect } from "vitest";
import { passwordRule } from "./password-rules";
import { resetPasswordSchema } from "./password-reset-validation";
import { addAdminSchema, addUserSchema } from "./user/addUserValidation";
import { passwordSchema } from "./user/profileValidation";

const firstMessage = (result) => result.error?.issues?.[0]?.message;

describe("passwordRule", () => {
  it("rejects passwords shorter than 8 characters", () => {
    const result = passwordRule.safeParse("Ab1");
    expect(result.success).toBe(false);
    expect(firstMessage(result)).toBe(
      "Password must be at least 8 characters long"
    );
  });

  it("rejects passwords without an uppercase letter", () => {
    const result = passwordRule.safeParse("alllowercase1");
    expect(result.success).toBe(false);
    expect(firstMessage(result)).toBe(
      "Password must contain at least one uppercase letter"
    );
  });

  it("rejects passwords without a lowercase letter", () => {
    const result = passwordRule.safeParse("ALLUPPERCASE1");
    expect(result.success).toBe(false);
    expect(firstMessage(result)).toBe(
      "Password must contain at least one lowercase letter"
    );
  });

  it("rejects passwords without a number", () => {
    const result = passwordRule.safeParse("NoDigitsHere");
    expect(result.success).toBe(false);
    expect(firstMessage(result)).toBe(
      "Password must contain at least one number"
    );
  });

  it("accepts a strong password without requiring special characters", () => {
    expect(passwordRule.safeParse("Str0ngPassword").success).toBe(true);
  });

  it("is applied wherever a password is set", () => {
    // Reset password
    expect(
      resetPasswordSchema.safeParse({
        newPassword: "weakpass",
        confirmPassword: "weakpass",
      }).success
    ).toBe(false);
    expect(
      resetPasswordSchema.safeParse({
        newPassword: "Str0ngPassword",
        confirmPassword: "Str0ngPassword",
      }).success
    ).toBe(true);

    // Admin creation (attendant creation is passwordless)
    const baseUser = {
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      role: "USER",
    };
    expect(
      addAdminSchema.safeParse({ ...baseUser, password: "weakpass" }).success
    ).toBe(false);
    expect(
      addAdminSchema.safeParse({ ...baseUser, password: "Str0ngPassword" })
        .success
    ).toBe(true);

    // Attendant creation requires no password at all
    expect(addUserSchema.safeParse(baseUser).success).toBe(true);

    // Change password
    expect(
      passwordSchema.safeParse({
        currentPassword: "OldPass1",
        newPassword: "nouppercase1",
        confirmPassword: "nouppercase1",
      }).success
    ).toBe(false);
    expect(
      passwordSchema.safeParse({
        currentPassword: "OldPass1",
        newPassword: "Str0ngPassword",
        confirmPassword: "Str0ngPassword",
      }).success
    ).toBe(true);
  });
});
