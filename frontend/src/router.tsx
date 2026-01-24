import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/homePage";
import ChatPage from "./pages/chatPage";
import MatchesPage from "./pages/matchesPage";
import ProfilePage from "./pages/profilePage";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import RegisterPage from "./pages/registerPage";

const Router = () => {
    return (
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="chat" element={
                    <ProtectedRoute>
                        <ChatPage />
                    </ProtectedRoute>
                }
            />
            <Route path="matches" element={
                    <ProtectedRoute>
                        <MatchesPage />
                    </ProtectedRoute>
                }
            />
            <Route path="profile" element={
                    <ProtectedRoute>
                        <ProfilePage />
                    </ProtectedRoute>
                }
            />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
        </Routes>
    );
};

export default Router;
