import Router from "./router";
import { Provider } from "./components/ui/provider";
import { AuthProvider } from "./contexts/AuthContext";
import theme from "./components/ui/theme";
import Layout from "./components/ui/layout";
import {BrowserRouter} from "react-router-dom";
import {Toaster} from "./components/ui/toaster.tsx";

const App = () => {
    return (
        <Provider theme={theme}>
            <AuthProvider>
                <BrowserRouter>
                    <Layout>
                        <Router />
                    </Layout>
                    <Toaster/>
                </BrowserRouter>
            </AuthProvider>
        </Provider>
    );
};

export default App;
