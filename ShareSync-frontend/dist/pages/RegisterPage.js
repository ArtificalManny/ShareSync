import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AuthForm } from '../components/AuthForm';
import { useAuth } from '../hooks/useAuth';
const RegisterPage = () => {
    const { register } = useAuth();
    return (_jsxs("div", { children: [_jsx("h1", { children: "Register" }), _jsx(AuthForm, {})] }));
};
export default RegisterPage;
