import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SignInButton } from "@clerk/nextjs";

export default async function Home() {
  const authObject = await auth();
  const { userId } = authObject;
  
  if (!userId) {
    return (
      <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <h1>Welcome to SkillBridge</h1>
        <p style={{ marginBottom: '2rem' }}>Please sign in to access your dashboard.</p>
        <SignInButton mode="modal" />
        <p style={{ marginTop: '1rem', fontSize: '0.8rem', opacity: 0.7 }}>
          Note: If using Incognito, ensure "Third-party cookies" are enabled.
        </p>
      </div>
    );
  }

  const user = await currentUser();
  const role = user?.publicMetadata?.role;

  if (!role) {
    redirect("/onboarding");
  }

  // Check if user exists in the database
  try {
    const token = (await (await auth()).getToken());
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store'
    });
    
    if (res.status === 403 || res.status === 404) {
      // User is in Clerk but not in DB
      redirect("/onboarding");
    }
  } catch (error) {
    console.error("Failed to verify user in DB:", error);
    // If backend is down, we might still want to redirect or show error, 
    // but for now let's assume if we can't check, we might as well try dashboard
  }

  redirect(`/dashboards/${role.toLowerCase().replace('_', '-')}`);
}
