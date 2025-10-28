import Layout from "./components/ui/layout";
import Router from "./router";
import { BrowserRouter, Routes, Route } from "react-router-dom";

const App = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      <Layout>
        <Router />
      </Layout>
    </BrowserRouter>
  );
};

export default App;
