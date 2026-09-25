import { Navigate, useLocation } from "react-router-dom";
import { useGetMeQuery } from "@/redux/fetures/users.api";
import { Skeleton } from "@/components/ui/skeleton";
import type { ReactNode } from "react";

interface PrivateRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

const PrivateRoute = ({ children, allowedRoles }: PrivateRouteProps) => {
  const location = useLocation();
  const { data: userData, isLoading, isError } = useGetMeQuery();

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-background p-4 sm:p-6" aria-label="Loading account">
        <Skeleton className="h-16 w-full" />
        <div className="mx-auto mt-8 max-w-6xl space-y-5">
          <Skeleton className="h-9 w-64 max-w-full" />
          <Skeleton className="h-36 w-full" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-44" />
            <Skeleton className="h-44" />
            <Skeleton className="h-44" />
          </div>
        </div>
      </div>
    );
  }

  const user = userData?.data;

  if (isError || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const ownDashboard = user.role === "SELLER" ? "/seller/dashboard" : user.role === "USER" ? "/user/dashboard" : "/";
    return <Navigate to={ownDashboard} replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
