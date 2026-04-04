import { Link } from "@tanstack/react-router";

export function NotFoundPage() {
    return (
        <div className="flex flex-col items-center justify-center py-24 text-center">
            <h1 className="font-serif text-2xl font-normal text-foreground">
                Page not found
            </h1>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
                The page you are looking for does not exist or has been moved.
            </p>
            <Link
                to="/"
                className="mt-6 text-sm font-medium text-foreground underline underline-offset-4"
            >
                Back to home
            </Link>
        </div>
    );
}
