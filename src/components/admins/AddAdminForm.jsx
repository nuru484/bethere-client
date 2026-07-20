// src/components/admins/AddAdminForm.jsx
//
// Administrator creation: name, email, optional phone and a password.
// Unlike attendants, admins sign in with email + password, so the password
// field is required here.
import PropTypes from "prop-types";
import PersonForm from "@/components/shared/PersonForm";

export default function AddAdminForm({ form, onSubmit, isLoading }) {
  return (
    <PersonForm
      form={form}
      onSubmit={onSubmit}
      isLoading={isLoading}
      cancelPath="/dashboard/admins"
      submitLabel="Create Admin"
      note="The administrator signs in with the email and password above."
      withPassword
    />
  );
}

AddAdminForm.propTypes = {
  form: PropTypes.shape({
    control: PropTypes.any.isRequired,
    handleSubmit: PropTypes.func.isRequired,
  }).isRequired,
  onSubmit: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};
