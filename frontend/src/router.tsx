import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/homePage";
import ChatPage from "./pages/chatPage";
import MatchesPage from "./pages/matchesPage";
import ProfilePage from "./pages/profilePage";

const Router: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="chat" element={<ChatPage />} />
      <Route path="matches" element={<MatchesPage />} />
      <Route path="profile" element={<ProfilePage />} />
    </Routes>
  );
};

export default Router;
