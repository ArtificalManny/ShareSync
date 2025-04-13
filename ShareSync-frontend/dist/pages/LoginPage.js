import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AuthForm } from '../components/AuthForm';
import { useAuth } from '../hooks/useAuth';
const LoginPage = () => {
    const { login } = useAuth();
    return (_jsxs("div", { children: [_jsx("h1", { children: "Login" }), _jsx(AuthForm, {})] }));
};
export default LoginPage;
