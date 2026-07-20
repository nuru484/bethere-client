// src/components/shared/PersonForm.jsx
//
// Shared person-creation sheet used by AddUserForm and AddAdminForm: name,
// email and optional phone on one card, with an optional password block for
// principals that sign in with one. The wrappers only differ in config
// (password, note copy, button labels, cancel path).
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

const MICRO_LABEL =
  "font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground";

export default function PersonForm({
  form,
  onSubmit,
  isLoading,
  cancelPath,
  submitLabel,
  note,
  withPassword = false,
}) {
  const navigate = useNavigate();

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
          className="space-y-4"
        >
          <div className="bg-card rounded-2xl border border-border p-4 md:p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* First Name */}
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={MICRO_LABEL}>First name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Last Name */}
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={MICRO_LABEL}>Last name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={MICRO_LABEL}>Email address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john.doe@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Phone */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={MICRO_LABEL}>
                      Phone{" "}
                      <span className="normal-case text-muted-foreground/70">
                        (optional)
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+233 54 648 8115"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Password (admins only - attendants use the OTP flow) */}
            {withPassword && (
              <div className="mt-6">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={MICRO_LABEL}>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Create a strong password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>

          <p className="font-body text-sm text-muted-foreground">{note}</p>

          {/* Form Actions */}
          <div className="flex flex-wrap gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(cancelPath)}
              disabled={isLoading}
              className="flex-1 h-11"
            >
              Cancel
            </Button>

            <Button type="submit" disabled={isLoading} className="flex-1 h-11">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitLabel}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

PersonForm.propTypes = {
  form: PropTypes.shape({
    control: PropTypes.any.isRequired,
    handleSubmit: PropTypes.func.isRequired,
  }).isRequired,
  onSubmit: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  cancelPath: PropTypes.string.isRequired,
  submitLabel: PropTypes.string.isRequired,
  note: PropTypes.string.isRequired,
  withPassword: PropTypes.bool,
};
