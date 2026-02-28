import { redirect } from "next/navigation";

// Auth0 handles signup via Universal Login.
// Passing screen_hint=signup shows the registration form directly.
export default function SignupPage() {
    redirect("/auth/login?screen_hint=signup");
}
