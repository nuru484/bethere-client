// src/components/ui/FormSectionHeader.jsx
//
// Numbered mono eyebrow + title: the shared section voice for the larger
// multi-section forms (event form, add-attendant form).
import PropTypes from "prop-types";

const FormSectionHeader = ({ index, title }) => (
  <div className="mb-6">
    <p className="font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
      {index}
    </p>
    <h2 className="mt-1 text-lg font-semibold text-foreground">{title}</h2>
  </div>
);

FormSectionHeader.propTypes = {
  index: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
};

export default FormSectionHeader;
