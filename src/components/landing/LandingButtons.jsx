// src/components/landing/LandingButtons.jsx
//
// The landing's two button voices, with the wipe-fill / vertical text-swap
// hover mechanic defined in index.css (.lp-btn). Renders a router <Link>
// when `to` is given, otherwise an anchor.
import PropTypes from "prop-types";
import { Link } from "react-router-dom";

// Full literal class strings: Tailwind's content scanner must see them,
// or it purges the matching @layer components rules from index.css.
const VARIANT_CLASSES = {
  pill: "lp-btn lp-btn--pill",
  chip: "lp-btn lp-btn--chip",
};

function LandingButton({ variant, to, href, children, className = "" }) {
  const Tag = to ? Link : "a";
  const targetProps = to ? { to } : { href };

  return (
    <Tag
      {...targetProps}
      className={`${VARIANT_CLASSES[variant]} ${className}`.trim()}
    >
      <span aria-hidden="true" className="lp-btn__fill" />
      <span className="lp-btn__inner">
        <span>{children}</span>
      </span>
      <span aria-hidden="true" className="lp-btn__hover">
        <span>{children}</span>
      </span>
    </Tag>
  );
}

LandingButton.propTypes = {
  variant: PropTypes.oneOf(["pill", "chip"]).isRequired,
  to: PropTypes.string,
  href: PropTypes.string,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export function PillLink(props) {
  return <LandingButton {...props} variant="pill" />;
}

export function ChipLink(props) {
  return <LandingButton {...props} variant="chip" />;
}

PillLink.propTypes = ChipLink.propTypes = {
  to: PropTypes.string,
  href: PropTypes.string,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};
