import { redirect } from "next/navigation";

export default function Home() {
  // Instantly redirect anyone who visits the root URL to the dashboard 
  // (Your layout.tsx will naturally kick them to /login if they aren't authenticated!)
  redirect("/dashboard");
}