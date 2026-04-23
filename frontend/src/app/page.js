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

  redirect(`/dashboards/${role.toLowerCase().replace('_', '-')}`);
}
