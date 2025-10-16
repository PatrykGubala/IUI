import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/homePage";
import ChatPage from "./pages/chatPage";

const Router: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="chat" element={<ChatPage />} />
    </Routes>
  );
};

export default Router;
