import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Center, Spinner } from "@chakra-ui/react";
import { useAuth } from "../contexts/AuthContext";

interface ProtectedRouteProps {
    children: React.ReactElement;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { isAuthenticated, token } = useAuth();
    const location = useLocation();

    // Gdy jeszcze nie wiemy, czy jest token (hydration)
    if (token === null && !isAuthenticated) {
        return (
            <Center height="100vh">
                <Spinner size="xl" color="pink.500" />
            </Center>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    return children;
}
