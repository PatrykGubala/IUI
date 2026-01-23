import Router from "./router";
import { Provider } from "./components/ui/provider";
import { AuthProvider } from "./contexts/AuthContext";
import theme from "./components/ui/theme";
import Layout from "./components/ui/layout";
import {BrowserRouter} from "react-router-dom";  // Opcjonalnie – jeśli chcesz Layout wokół routera

const App = () => {
    return (
        <Provider theme={theme}>
            <AuthProvider>
                <BrowserRouter>  {/* Tylko jeden BrowserRouter tutaj */}
                    <Layout>
                        <Router />
                    </Layout>
                </BrowserRouter>
            </AuthProvider>
        </Provider>
    );
};

export default App;
