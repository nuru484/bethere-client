// src/components/users/AddUserForm.jsx
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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, User, Mail, Shield } from "lucide-react";

export default function AddUserForm({ form, onSubmit, isLoading }) {
  const navigate = useNavigate();

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal Information Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <User className="w-4 h-4 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                Personal Information
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* First Name */}
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">
                      First Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="John"
                        {...field}
                        className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                      />
                    </FormControl>
                    <FormMessage className="text-red-600" />
                  </FormItem>
                )}
              />

              {/* Last Name */}
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">
                      Last Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Doe"
                        {...field}
                        className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                      />
                    </FormControl>
                    <FormMessage className="text-red-600" />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <Mail className="w-4 h-4 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                Contact Information
              </h2>
            </div>

            <div className="space-y-6">
              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">
                      Email Address
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john.doe@example.com"
                        {...field}
                        className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                      />
                    </FormControl>
                    <FormMessage className="text-red-600" />
                  </FormItem>
                )}
              />

              {/* Phone */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">
                      Phone Number{" "}
                      <span className="text-gray-400 font-normal">
                        (Optional)
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+233 54 648 8115"
                        {...field}
                        value={field.value || ""}
                        className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                      />
                    </FormControl>
                    <FormMessage className="text-red-600" />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Account Settings Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <Shield className="w-4 h-4 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                Account Settings
              </h2>
            </div>

            <div className="space-y-6">
              {/* Password */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">
                      Password
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Create a strong password"
                        {...field}
                        className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                      />
                    </FormControl>
                    <FormDescription className="text-gray-500 hidden lg:block">
                      Must be at least 8 characters with uppercase, lowercase,
                      number and special character
                    </FormDescription>
                    <FormMessage className="text-red-600" />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/dashboard/users")}
              disabled={isLoading}
              className="flex-1 h-11 border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 h-11 bg-green-600 hover:bg-green-700 text-white font-medium shadow-sm transition-colors"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Attendant Account
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

AddUserForm.propTypes = {
  form: PropTypes.shape({
    control: PropTypes.any.isRequired,
    handleSubmit: PropTypes.func.isRequired,
  }).isRequired,
  onSubmit: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};
