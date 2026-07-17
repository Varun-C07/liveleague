import { Redirect } from "expo-router";

// Catch-all: any unmatched route (including a stray launch/deep-link URL that the
// dev client resolves after first paint) bounces back to Home instead of showing
// the default "Unmatched Route" 404 screen.
export default function NotFound() {
  return <Redirect href="/" />;
}
