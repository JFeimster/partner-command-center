import { signOut } from "./actions";

export default function LogoutPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#0a1420] px-6 text-white">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-semibold">Sign out of Partner Command?</h1>
        <form action={signOut} className="mt-8">
          <button type="submit" className="rounded-lg bg-[#9fe0d3] px-6 py-3 font-semibold text-[#0a1420]">Sign out</button>
        </form>
      </div>
    </main>
  );
}
