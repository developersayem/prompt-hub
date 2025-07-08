// components/GoogleLoginButton.tsx

import { Button } from "../ui/button";

export default function GoogleLoginButton() {
  const handleGoogleLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/google`;
  };

  return (
    <Button
      onClick={handleGoogleLogin}
      variant="outline"
      className="w-full"
      type="button"
    >
      Login with Google
    </Button>
  );
}
