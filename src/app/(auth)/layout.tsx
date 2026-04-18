/**
 * @file layout.tsx
 * @description Layout for authentication routes (like login).
 * Removes sidebar and header, centers content on screen.
 */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/4 w-[1000px] h-[1000px] rounded-full bg-primary-50/50 blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/4 w-[800px] h-[800px] rounded-full bg-blue-50/50 blur-3xl" />
      </div>

      <div className="w-full max-w-md z-10">
        {children}
      </div>
    </div>
  );
}
