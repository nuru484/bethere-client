// src/pages/NotFoundPage.jsx
//
// Catch-all 404 route (path "*"), sharing the ErrorPanel language.
import { useNavigate } from "react-router-dom";
import { ErrorPanel } from "./ErrorPage";
import { usePageTitle } from "@/hooks/usePageTitle";

const NotFoundPage = () => {
  const navigate = useNavigate();
  usePageTitle("Page not found");

  return (
    <ErrorPanel
      glyph="404"
      eyebrow="Not found"
      title="This page does not exist"
      message="The address may be mistyped, or the page may have moved."
      onBack={() => navigate(-1)}
    />
  );
};

export default NotFoundPage;
