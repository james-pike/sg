import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { useAuthCheck } from "../layout";
import { portalBrand } from "../../portals";

// The ProductCatalog component is rendered by layout.tsx for the catalog view.
// This file just provides the route entry point and document head.
export default component$(() => {
  return <></>;
});

export const head: DocumentHead = ({ resolveValue }) => ({
  title: `Shop Apparel - ${portalBrand(resolveValue(useAuthCheck).loginType)}`,
});
