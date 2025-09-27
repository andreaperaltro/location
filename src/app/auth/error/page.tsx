import Link from 'next/link';

interface ErrorPageProps {
  searchParams: {
    error?: string;
  };
}

export default function AuthErrorPage({ searchParams }: ErrorPageProps) {
  const error = searchParams.error;

  const getErrorMessage = (error: string) => {
    switch (error) {
      case 'Configuration':
        return 'There is a problem with the server configuration.';
      case 'AccessDenied':
        return 'Access denied. You do not have permission to sign in.';
      case 'Verification':
        return 'The verification token has expired or has already been used.';
      default:
        return 'An error occurred during authentication.';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-foreground">
            Authentication Error
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {error ? getErrorMessage(error) : 'An unexpected error occurred.'}
          </p>
        </div>
        
        <div className="mt-8 space-y-4">
          <Link
            href="/signin"
            className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
          >
            Try Again
          </Link>
          
          <Link
            href="/"
            className="w-full flex justify-center py-2 px-4 border border-input text-sm font-medium rounded-md text-foreground bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
