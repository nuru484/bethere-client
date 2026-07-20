// src/components/users/AddUserForm.jsx
//
// Minimal attendant creation: one card sheet with name, email and phone.
// No password - attendants sign in via the passwordless OTP flow.
import PropTypes from "prop-types";
import PersonForm from "@/components/shared/PersonForm";

export default function AddUserForm({ form, onSubmit, isLoading }) {
  return (
    <PersonForm
      form={form}
      onSubmit={onSubmit}
      isLoading={isLoading}
      cancelPath="/dashboard/users"
      submitLabel="Create Attendant Account"
      note="No password needed - the attendant signs in with a one-time code sent to their email or phone."
    />
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
